import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase     = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Telegram API ------------------------------------------------------------------
async function tg(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Variable interpolation -------------------------------------------------------
function interp(text: string, vars: Record<string, string>): string {
  return (text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

// ── Condition evaluator ----------------------------------------------------------
function evalCond(
  variable: string,
  operator: string,
  value: string,
  vars: Record<string, string>,
): boolean {
  const actual = vars[variable] ?? "";
  switch (operator) {
    case "equals":      return actual === value;
    case "notEquals":   return actual !== value;
    case "contains":    return actual.includes(value);
    case "notContains": return !actual.includes(value);
    case "greater":     return parseFloat(actual) > parseFloat(value);
    case "less":        return parseFloat(actual) < parseFloat(value);
    case "isEmpty":     return !actual;
    case "isNotEmpty":  return !!actual;
    default:            return false;
  }
}

// ── Node / Edge types -------------------------------------------------------------
interface BotNode { id: string; type: string; data: Record<string, unknown> }
interface BotEdge { source: string; target: string; sourceHandle?: string }

// ── Flow executor ----------------------------------------------------------------
async function runFlow(
  token: string,
  chatId: number,
  nodes: BotNode[],
  edges: BotEdge[],
  startId: string,
  vars: Record<string, string>,
  textInput: string | null,
): Promise<{ waitNodeId: string | null; variables: Record<string, string> }> {

  const nodeMap  = new Map(nodes.map(n => [n.id, n]));
  const edge     = (src: string, h?: string) =>
    edges.find(e => e.source === src && (h === undefined || e.sourceHandle === h));

  let cur: string | null = startId;
  let steps = 0;
  let consumed = false;

  while (cur && steps++ < 60) {
    const node = nodeMap.get(cur);
    if (!node) break;
    const id = node.id;
    cur = null; // each case must re-assign

    switch (node.type) {

      // ── start ──────────────────────────────────────────────────────────────
      case "start":
        cur = edge(id)?.target ?? null;
        break;

      // ── message ─────────────────────────────────────────────────────────────
      case "message": {
        const text    = interp(node.data.text as string, vars);
        const buttons = (node.data.buttons as { id: string; label: string; url?: string }[]) || [];

        if (buttons.length > 0) {
          // Inline keyboard — one row per 2 buttons
          const rows: unknown[][] = [];
          let row: unknown[] = [];
          buttons.forEach((b, i) => {
            const item: Record<string, string> = { text: b.label };
            if (b.url) item.url = b.url;
            else       item.callback_data = String(i);
            row.push(item);
            if (row.length >= 2) { rows.push(row); row = []; }
          });
          if (row.length) rows.push(row);

          await tg(token, "sendMessage", {
            chat_id:      chatId,
            text:         text || "...",
            parse_mode:   node.data.parseMode !== "plain" ? (node.data.parseMode || "Markdown") : undefined,
            reply_markup: { inline_keyboard: rows },
          });
          return { waitNodeId: id, variables: vars }; // wait for button
        }

        await tg(token, "sendMessage", {
          chat_id:                  chatId,
          text:                     text || "...",
          parse_mode:               node.data.parseMode !== "plain" ? (node.data.parseMode || "Markdown") : undefined,
          disable_web_page_preview: node.data.disablePreview || undefined,
        });
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── userInput ────────────────────────────────────────────────────────────
      case "userInput": {
        if (!consumed && textInput !== null) {
          const vn = node.data.variableName as string;
          if (vn) vars = { ...vars, [vn]: textInput };
          consumed   = true;
          textInput  = null;
          cur = edge(id)?.target ?? null;
        } else {
          const prompt = interp(node.data.text as string || "Введите значение:", vars);
          const body: Record<string, unknown> = { chat_id: chatId, text: prompt };
          const choices = node.data.choices as string[] | undefined;
          if (node.data.inputType === "choice" && choices?.length) {
            body.reply_markup = {
              keyboard:         choices.map(c => [{ text: c }]),
              one_time_keyboard: true,
              resize_keyboard:  true,
            };
          }
          await tg(token, "sendMessage", body);
          return { waitNodeId: id, variables: vars }; // wait for input
        }
        break;
      }

      // ── condition ─────────────────────────────────────────────────────────────
      case "condition": {
        const ok = evalCond(
          node.data.variable as string || "",
          node.data.operator as string || "equals",
          node.data.value    as string || "",
          vars,
        );
        cur = edge(id, ok ? "yes" : "no")?.target ?? null;
        break;
      }

      // ── variable ──────────────────────────────────────────────────────────────
      case "variable": {
        const op  = node.data.varOperation as string;
        const vn  = node.data.varName      as string;
        const vv  = interp(node.data.varValue as string || "", vars);
        if (vn) {
          const cur2 = vars[vn] ?? "";
          switch (op) {
            case "set":       vars = { ...vars, [vn]: vv }; break;
            case "increment": vars = { ...vars, [vn]: String((parseFloat(cur2) || 0) + (parseFloat(vv) || 1)) }; break;
            case "decrement": vars = { ...vars, [vn]: String((parseFloat(cur2) || 0) - (parseFloat(vv) || 1)) }; break;
            case "append":    vars = { ...vars, [vn]: cur2 + vv }; break;
            case "clear":     { const v = { ...vars }; delete v[vn]; vars = v; break; }
          }
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── delay ─────────────────────────────────────────────────────────────────
      case "delay": {
        const ms = Math.min(((node.data.delaySeconds as number) || 1) * 1000, 10000);
        await new Promise(r => setTimeout(r, ms));
        const msg = node.data.delayMessage as string;
        if (msg) await tg(token, "sendMessage", { chat_id: chatId, text: interp(msg, vars) });
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── action ───────────────────────────────────────────────────────────────
      case "action": {
        const at = node.data.actionType as string;
        if (at === "sendMessage" && node.data.message) {
          await tg(token, "sendMessage", {
            chat_id: chatId,
            text:    interp(node.data.message as string, vars),
            parse_mode: "Markdown",
          });
        } else if (at === "webhook" && node.data.webhookUrl) {
          try {
            const url    = interp(node.data.webhookUrl as string, vars);
            const method = (node.data.webhookMethod as string) || "POST";
            const body   = interp((node.data.webhookBody as string) || "{}", vars);
            const opts: RequestInit = { method };
            if (method !== "GET") {
              opts.body    = body;
              opts.headers = { "Content-Type": "application/json" };
            }
            const resp  = await fetch(url, opts);
            const txt   = await resp.text();
            try {
              const json = JSON.parse(txt);
              vars = { ...vars, webhook_response: txt };
              // Try common result fields
              if (json.translation)        vars = { ...vars, translation_result: String(json.translation) };
              if (json.translatedText)     vars = { ...vars, translation_result: String(json.translatedText) };
              if (json.result)             vars = { ...vars, webhook_result:      String(json.result) };
            } catch { vars = { ...vars, webhook_response: txt }; }
          } catch (e) { console.error("Webhook error:", e); }
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── jump ──────────────────────────────────────────────────────────────────
      case "jump":
        cur = (node.data.jumpTarget as string) || null;
        break;

      // ── randomizer ────────────────────────────────────────────────────────────
      case "randomizer": {
        const weights = (node.data.randWeights as number[]) || [1, 1];
        const total   = weights.reduce((a, b) => a + b, 0);
        let   rand    = Math.random() * total;
        let   chosen  = 0;
        for (let i = 0; i < weights.length; i++) {
          rand -= weights[i];
          if (rand <= 0) { chosen = i; break; }
        }
        cur = edge(id, String(chosen))?.target ?? null;
        break;
      }

      // ── translate ─────────────────────────────────────────────────────────────
      case "translate": {
        const src = vars[node.data.translateSourceVar as string || ""] || "";
        if (src) {
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/bot-translate`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
              body: JSON.stringify({ text: src, targetLang: node.data.translateTargetLang || "en" }),
            });
            const d = await r.json();
            const tResult = d.translatedText || d.translated || "";
            if (tResult) vars = { ...vars, [node.data.translateResultVar as string || "translated_text"]: tResult };
          } catch { /* ignore */ }
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── langDetect ────────────────────────────────────────────────────────────
      case "langDetect": {
        const src = vars[node.data.langDetectVar as string || ""] || "";
        if (src) {
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/bot-lang-detect`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
              body: JSON.stringify({ text: src }),
            });
            const d = await r.json();
            if (d.lang) vars = { ...vars, [node.data.langResultVar as string || "user_lang"]: d.lang };
          } catch { /* ignore */ }
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── aiChat ───────────────────────────────────────────────────────────────
      case "aiChat": {
        const prompt = interp(node.data.aiPrompt as string || "", vars);
        if (prompt) {
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/bot-ai-chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
              body: JSON.stringify({ prompt, model: node.data.aiModel, temperature: node.data.aiTemperature }),
            });
            const d = await r.json();
            const aiResult = d.reply || d.response || "";
            if (aiResult) vars = { ...vars, [node.data.aiResponseVar as string || "ai_response"]: aiResult };
          } catch { /* ignore */ }
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── media ─────────────────────────────────────────────────────────────────
      case "media": {
        const url = interp(node.data.mediaUrl as string || "", vars);
        if (url) {
          const methods: Record<string, string> = {
            photo: "sendPhoto", video: "sendVideo",
            audio: "sendAudio", document: "sendDocument", sticker: "sendSticker",
          };
          const mt     = (node.data.mediaType as string) || "document";
          const method = methods[mt] || "sendDocument";
          const cap    = interp(node.data.caption as string || "", vars);
          await tg(token, method, { chat_id: chatId, [mt]: url, ...(cap ? { caption: cap } : {}) });
        }
        cur = edge(id)?.target ?? null;
        break;
      }

      // ── userLangPref ─────────────────────────────────────────────────────────
      case "userLangPref": {
        const langs   = (node.data.ulpLanguages as string[]) || ["ru", "en"];
        const flags: Record<string, string> = { ru:"🇷🇺", en:"🇬🇧", de:"🇩🇪", fr:"🇫🇷", es:"🇪🇸", uk:"🇺🇦", zh:"🇨🇳", ar:"🇸🇦", pt:"🇵🇹", it:"🇮🇹", tr:"🇹🇷", pl:"🇵🇱", nl:"🇳🇱", ja:"🇯🇵", ko:"🇰🇷" };
        const showFlags = node.data.ulpShowFlags !== false;

        const rows: unknown[][] = [];
        let row: unknown[] = [];
        langs.forEach((l, i) => {
          row.push({ text: showFlags ? `${flags[l] || ""}${l.toUpperCase()}` : l.toUpperCase(), callback_data: `ulp:${l}` });
          if (row.length >= 2) { rows.push(row); row = []; }
        });
        if (row.length) rows.push(row);

        await tg(token, "sendMessage", {
          chat_id:      chatId,
          text:         interp(node.data.ulpQuestion as string || "Выберите язык:", vars),
          reply_markup: { inline_keyboard: rows },
        });
        return { waitNodeId: id, variables: vars };
      }

      // ── default: skip unknown nodes ──────────────────────────────────────────
      default:
        cur = edge(id)?.target ?? null;
        break;
    }
  }

  return { waitNodeId: null, variables: vars };
}

// ── Main handler -----------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url    = new URL(req.url);
  const action = url.searchParams.get("action");
  const botId  = url.searchParams.get("b");

  // ── Setup: save bot + register webhook ──────────────────────────────────────
  if (action === "setup" && req.method === "POST") {
    try {
      const { id, name, token, nodes, edges, userId } = await req.json();

      // Validate token with Telegram
      const getMeRes  = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const getMeData = await getMeRes.json();
      if (!getMeData.ok) {
        return new Response(JSON.stringify({ ok: false, error: "Неверный токен бота. Проверьте его у @BotFather." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save/update bot in DB
      const { error: dbErr } = await supabase.from("bots").upsert(
        { id, user_id: userId, name, token, nodes, edges, is_active: true, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
      if (dbErr) {
        console.error("DB error:", dbErr);
        return new Response(JSON.stringify({ ok: false, error: `Ошибка БД: ${dbErr.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Register Telegram webhook
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-runner?b=${id}`;
      const wRes       = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "callback_query"] }),
      });
      const wData = await wRes.json();
      if (!wData.ok) {
        return new Response(JSON.stringify({ ok: false, error: wData.description }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        ok:         true,
        botName:    getMeData.result.username ? `@${getMeData.result.username}` : getMeData.result.first_name,
        webhookUrl,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Update: re-save flow without re-registering webhook ─────────────────────
  if (action === "update" && req.method === "POST") {
    try {
      const { id, name, nodes, edges } = await req.json();
      const { error } = await supabase.from("bots")
        .update({ name, nodes, edges, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Stop: remove webhook + deactivate ────────────────────────────────────────
  if (action === "stop" && req.method === "POST") {
    try {
      const { id, token } = await req.json();
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
      await supabase.from("bots").update({ is_active: false }).eq("id", id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Telegram webhook update ──────────────────────────────────────────────────
  if (botId && req.method === "POST") {
    let update: Record<string, unknown>;
    try { update = await req.json(); }
    catch { return new Response("OK"); }

    // Load bot config from DB
    const { data: bot, error: botErr } = await supabase
      .from("bots").select("id, token, nodes, edges").eq("id", botId).single();
    if (botErr || !bot) { console.error("Bot not found:", botId); return new Response("OK"); }

    // Parse update
    let chatId: number | null = null;
    let textInput: string | null = null;
    let callbackData: string | null = null;
    let callbackQueryId: string | null = null;

    const msg = update.message as Record<string, unknown> | undefined;
    const cbq = update.callback_query as Record<string, unknown> | undefined;

    if (msg) {
      chatId    = (msg.chat as Record<string, unknown>)?.id as number;
      textInput = (msg.text as string) || null;
    } else if (cbq) {
      const cbMsg = cbq.message as Record<string, unknown> | undefined;
      chatId          = (cbMsg?.chat as Record<string, unknown>)?.id as number || (cbq.from as Record<string, unknown>)?.id as number;
      callbackData    = cbq.data as string;
      callbackQueryId = cbq.id   as string;
      // Answer immediately to stop the spinner
      await tg(bot.token, "answerCallbackQuery", { callback_query_id: callbackQueryId });
    }

    if (!chatId) return new Response("OK");

    // /start → reset session
    if (textInput === "/start" || textInput?.startsWith("/start ")) {
      await supabase.from("bot_sessions").delete().eq("bot_id", botId).eq("chat_id", chatId);
      textInput = null;
    }

    // Load session
    const { data: session } = await supabase
      .from("bot_sessions").select("current_node_id, variables")
      .eq("bot_id", botId).eq("chat_id", chatId).single();

    const vars  = (session?.variables as Record<string, string>) || {};
    const nodes = (bot.nodes as BotNode[]) || [];
    const edges = (bot.edges as BotEdge[]) || [];

    // Determine where to start execution
    let startId: string | null = null;

    if (!session || !session.current_node_id) {
      // Fresh: start from the `start` node
      const startNode = nodes.find(n => n.type === "start");
      if (!startNode) {
        await tg(bot.token, "sendMessage", { chat_id: chatId, text: "⚠️ Бот не настроен. Добавьте узел *Старт* в конструкторе." });
        return new Response("OK");
      }
      startId = startNode.id;
    } else if (callbackData !== null) {
      // Button clicked — jump to the edge target for this button index
      const srcId  = session.current_node_id;
      const btnEdge = edges.find(e => e.source === srcId && e.sourceHandle === callbackData);
      // Also handle userLangPref callbacks (format "ulp:<lang>")
      if (!btnEdge && callbackData.startsWith("ulp:")) {
        const lang = callbackData.split(":")[1];
        const currentNode = nodes.find(n => n.id === srcId);
        if (currentNode?.type === "userLangPref") {
          const ulpVar = (currentNode.data.ulpSaveVar as string) || "user_lang";
          const newVars = { ...vars, [ulpVar]: lang };
          const nextEdge = edges.find(e => e.source === srcId);
          startId = nextEdge?.target ?? null;
          if (startId) {
            try {
              const result = await runFlow(bot.token, chatId, nodes, edges, startId, newVars, null);
              await supabase.from("bot_sessions").upsert(
                { bot_id: botId, chat_id: chatId, current_node_id: result.waitNodeId, variables: result.variables, updated_at: new Date().toISOString() },
                { onConflict: "bot_id,chat_id" },
              );
            } catch (e) { console.error("Flow error:", e); }
          } else {
            await supabase.from("bot_sessions").update({ variables: newVars }).eq("bot_id", botId).eq("chat_id", chatId);
          }
          return new Response("OK");
        }
      }
      startId = btnEdge?.target ?? (edges.find(e => e.source === srcId)?.target ?? null);
      textInput = null; // button click, not text
    } else if (textInput !== null) {
      // Text input — continue from current node (should be a userInput node)
      startId = session.current_node_id;
    } else {
      return new Response("OK");
    }

    if (!startId) return new Response("OK");

    // Execute the flow
    try {
      const result = await runFlow(bot.token, chatId, nodes, edges, startId, { ...vars }, textInput);
      await supabase.from("bot_sessions").upsert(
        {
          bot_id:          botId,
          chat_id:         chatId,
          current_node_id: result.waitNodeId,
          variables:       result.variables,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "bot_id,chat_id" },
      );
    } catch (e) { console.error("Flow execution error:", e); }

    return new Response("OK");
  }

  return new Response(JSON.stringify({ ok: false, error: "Invalid request" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
