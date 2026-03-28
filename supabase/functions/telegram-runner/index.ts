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

// ── Execution step types for custom nodes ----------------------------------------
interface ExecStep {
  action: string;
  // sendMessage
  text?: string;
  buttons?: { id: string; label: string; url?: string }[];
  parseMode?: string;
  // setVariable
  variable?: string;
  value?: string;
  operation?: string;
  // fetchUrl
  url?: string;
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  resultVar?: string;
  resultPath?: string;
  // callFunction (Supabase edge function)
  function?: string;
  functionBody?: Record<string, unknown>;
  // condition
  operator?: string;
  thenSteps?: ExecStep[];
  elseSteps?: ExecStep[];
  // waitInput
  prompt?: string;
  variableName?: string;
  inputType?: string;
  choices?: string[];
}

// ── Custom node execution engine (backend) ----------------------------------------
async function runExecSteps(
  steps: ExecStep[],
  token: string,
  chatId: number,
  vars: Record<string, string>,
): Promise<{ vars: Record<string, string>; waitInput?: { prompt: string; variableName: string; inputType?: string; choices?: string[] }; waitButtons?: boolean }> {
  for (const step of steps) {
    switch (step.action) {
      case "sendMessage": {
        const text = interp(step.text || "", vars);
        if (!text) break;
        const buttons = step.buttons || [];
        if (buttons.length > 0) {
          const rows: unknown[][] = [];
          let row: unknown[] = [];
          buttons.forEach((b, i) => {
            const item: Record<string, string> = { text: interp(b.label, vars) };
            if (b.url) item.url = interp(b.url, vars);
            else item.callback_data = String(i);
            row.push(item);
            if (row.length >= 2) { rows.push(row); row = []; }
          });
          if (row.length) rows.push(row);
          await tg(token, "sendMessage", {
            chat_id: chatId,
            text,
            parse_mode: step.parseMode !== "plain" ? (step.parseMode || "Markdown") : undefined,
            reply_markup: { inline_keyboard: rows },
          });
          return { vars, waitButtons: true };
        }
        await tg(token, "sendMessage", {
          chat_id: chatId,
          text,
          parse_mode: step.parseMode !== "plain" ? (step.parseMode || "Markdown") : undefined,
        });
        break;
      }

      case "setVariable": {
        const name = step.variable || step.variableName || "";
        if (!name) break;
        const val = interp(step.value || "", vars);
        const op = step.operation || "set";
        const cur = vars[name] ?? "";
        switch (op) {
          case "set": vars = { ...vars, [name]: val }; break;
          case "increment": vars = { ...vars, [name]: String((parseFloat(cur) || 0) + (parseFloat(val) || 1)) }; break;
          case "decrement": vars = { ...vars, [name]: String((parseFloat(cur) || 0) - (parseFloat(val) || 1)) }; break;
          case "append": vars = { ...vars, [name]: cur + val }; break;
          case "clear": { const v = { ...vars }; delete v[name]; vars = v; break; }
          default: vars = { ...vars, [name]: val }; break;
        }
        break;
      }

      case "fetchUrl": {
        const url = interp(step.url || "", vars);
        if (!url) break;
        try {
          const method = (step.method || "GET").toUpperCase();
          const opts: RequestInit = { method };
          if (method !== "GET" && step.body) {
            opts.body = interp(step.body, vars);
            opts.headers = { "Content-Type": "application/json", ...(step.headers || {}) };
          } else if (step.headers) {
            opts.headers = step.headers;
          }
          // Interpolate header values
          if (opts.headers) {
            const h: Record<string, string> = {};
            for (const [k, v] of Object.entries(opts.headers as Record<string, string>)) {
              h[k] = interp(v, vars);
            }
            opts.headers = h;
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          const resp = await fetch(url, { ...opts, signal: controller.signal });
          clearTimeout(timeout);
          const txt = await resp.text();
          const resultVar = step.resultVar || "fetch_response";
          vars = { ...vars, [resultVar]: txt };
          // Try to extract specific JSON path
          try {
            const json = JSON.parse(txt);
            if (step.resultPath) {
              const parts = step.resultPath.split(".");
              let val: unknown = json;
              for (const p of parts) { val = (val as Record<string, unknown>)?.[p]; }
              if (val !== undefined) vars = { ...vars, [resultVar]: String(val) };
            }
            // Also save common fields
            if (json.translation) vars = { ...vars, [`${resultVar}_translation`]: String(json.translation) };
            if (json.translatedText) vars = { ...vars, [`${resultVar}_translatedText`]: String(json.translatedText) };
            if (json.result) vars = { ...vars, [`${resultVar}_result`]: String(json.result) };
            if (json.reply) vars = { ...vars, [`${resultVar}_reply`]: String(json.reply) };
          } catch { /* not JSON */ }
        } catch (e) {
          console.error("ExecStep fetchUrl error:", e);
          vars = { ...vars, [step.resultVar || "fetch_response"]: `error: ${e}` };
        }
        break;
      }

      case "callFunction": {
        const funcName = step.function || "";
        if (!funcName) break;
        try {
          // Interpolate all body values
          const rawBody = step.functionBody || {};
          const body: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(rawBody)) {
            body[k] = typeof v === "string" ? interp(v, vars) : v;
          }
          const resp = await fetch(`${SUPABASE_URL}/functions/v1/${funcName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
            body: JSON.stringify(body),
          });
          const data = await resp.json();
          const resultVar = step.resultVar || "function_response";
          vars = { ...vars, [resultVar]: JSON.stringify(data) };
          // Extract common result fields
          if (data.translatedText) vars = { ...vars, [resultVar]: String(data.translatedText) };
          else if (data.reply) vars = { ...vars, [resultVar]: String(data.reply) };
          else if (data.result) vars = { ...vars, [resultVar]: String(data.result) };
          else if (data.lang) vars = { ...vars, [resultVar]: String(data.lang) };
          else if (data.text) vars = { ...vars, [resultVar]: String(data.text) };
        } catch (e) {
          console.error("ExecStep callFunction error:", e);
        }
        break;
      }

      case "condition": {
        const actual = vars[step.variable || ""] ?? "";
        const val = interp(step.value || "", vars);
        const ok = evalCond(step.variable || "", step.operator || "equals", val, vars);
        const branch = ok ? (step.thenSteps || []) : (step.elseSteps || []);
        if (branch.length > 0) {
          const result = await runExecSteps(branch, token, chatId, vars);
          vars = result.vars;
          if (result.waitInput || result.waitButtons) return result;
        }
        break;
      }

      case "waitInput": {
        const prompt = interp(step.prompt || step.text || "Введите значение:", vars);
        const body: Record<string, unknown> = { chat_id: chatId, text: prompt };
        if (step.inputType === "choice" && step.choices?.length) {
          body.reply_markup = {
            keyboard: step.choices.map(c => [{ text: interp(c, vars) }]),
            one_time_keyboard: true,
            resize_keyboard: true,
          };
        }
        await tg(token, "sendMessage", body);
        return {
          vars,
          waitInput: {
            prompt,
            variableName: step.variableName || "user_input",
            inputType: step.inputType,
            choices: step.choices,
          },
        };
      }

      default:
        console.log(`Unknown exec step action: ${step.action}`);
        break;
    }
  }
  return { vars };
}

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
  const edge     = (src: string, h?: string) => {
    if (h !== undefined) return edges.find(e => e.source === src && e.sourceHandle === h);
    // Default: prefer edges without sourceHandle, fallback to any edge
    return edges.find(e => e.source === src && (!e.sourceHandle || e.sourceHandle === "" || e.sourceHandle === null))
        || edges.find(e => e.source === src);
  };

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
          vars = { ...vars, _lastUserInput: textInput };
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

      // ── yandexTranslate ───────────────────────────────────────────────────
      case "yandexTranslate": {
        const src = vars[node.data.yandexSourceVar as string || ""] || "";
        if (src) {
          try {
            const folderId = node.data.yandexFolderId || Deno.env.get("YANDEX_FOLDER_ID") || "";
            const apiKey = node.data.yandexApiKey || Deno.env.get("YANDEX_API_KEY") || "";
            const r = await fetch(`${SUPABASE_URL}/functions/v1/bot-yandex-translate`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
              body: JSON.stringify({
                text: src,
                targetLang: node.data.yandexTargetLang || "ru",
                sourceLang: node.data.yandexSourceLang || "",
                folderId,
                apiKey,
              }),
            });
            const d = await r.json();
            const tResult = d.translatedText || "";
            if (tResult) vars = { ...vars, [node.data.yandexResultVar as string || "translated_text"]: tResult };
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
        const systemPrompt = interp(node.data.aiPrompt as string || "Ты — полезный ассистент. Отвечай кратко.", vars);
        const aiContext = node.data.aiContext ? interp(node.data.aiContext as string, vars) : "";
        const userMsg = vars._lastUserInput || interp(node.data.aiUserMessage as string || "", vars) || "Привет";
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/bot-ai-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: SERVICE_KEY },
            body: JSON.stringify({
              systemPrompt: aiContext ? `${systemPrompt}\n\nКонтекст: ${aiContext}` : systemPrompt,
              userMessage: userMsg,
              model: node.data.aiModel || "google/gemini-3-flash-preview",
              temperature: node.data.aiTemperature ?? 0.7,
            }),
          });
          const d = await r.json();
          const aiResult = d.reply || d.response || "";
          if (aiResult) vars = { ...vars, [node.data.aiResponseVar as string || "ai_response"]: aiResult };
        } catch (e) { console.error("aiChat error:", e); }
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

      // ── default: execute custom node via executionSteps ─────────────────────
      default: {
        const steps = node.data.executionSteps as ExecStep[] | undefined;
        if (steps && steps.length > 0) {
          try {
            // Inject node.data properties into vars so executionSteps can reference them via {{key}}
            const dataVars = { ...vars };
            for (const [k, v] of Object.entries(node.data)) {
              if (k === 'executionSteps' || k === 'label' || k === 'icon' || k === 'description' || k === 'buttons' || k === 'color') continue;
              if (typeof v === 'string' && v) dataVars[k] = v;
              else if (typeof v === 'number') dataVars[k] = String(v);
              else if (typeof v === 'boolean') dataVars[k] = String(v);
            }
            const result = await runExecSteps(steps, token, chatId, dataVars);
            vars = result.vars;
            // If step requested waitInput — save as wait node
            if (result.waitInput) {
              // Store the variableName in node data context so we can consume input later
              vars = { ...vars, __customWaitVar: result.waitInput.variableName };
              return { waitNodeId: id, variables: vars };
            }
            // If step sent buttons — wait for callback
            if (result.waitButtons) {
              return { waitNodeId: id, variables: vars };
            }
          } catch (e) {
            console.error(`ExecSteps error on node ${id} (${node.type}):`, e);
          }
        } else {
          // Legacy: custom node without executionSteps — try text/message
          const text = interp((node.data.text as string) || (node.data.message as string) || "", vars);
          if (text) {
            const buttons = (node.data.buttons as { id: string; label: string; url?: string }[]) || [];
            if (buttons.length > 0) {
              const rows: unknown[][] = [];
              let row: unknown[] = [];
              buttons.forEach((b, i) => {
                const item: Record<string, string> = { text: b.label };
                if (b.url) item.url = b.url;
                else item.callback_data = String(i);
                row.push(item);
                if (row.length >= 2) { rows.push(row); row = []; }
              });
              if (row.length) rows.push(row);
              await tg(token, "sendMessage", {
                chat_id: chatId,
                text,
                parse_mode: node.data.parseMode !== "plain" ? ((node.data.parseMode as string) || "Markdown") : undefined,
                reply_markup: { inline_keyboard: rows },
              });
              return { waitNodeId: id, variables: vars };
            }
            await tg(token, "sendMessage", {
              chat_id: chatId,
              text,
              parse_mode: node.data.parseMode !== "plain" ? ((node.data.parseMode as string) || "Markdown") : undefined,
            });
          }
        }
        cur = edge(id)?.target ?? null;
        break;
      }
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
      // Text input — check if current node accepts text
      const currentNode = nodes.find(n => n.id === session.current_node_id);
      if (currentNode?.type === "userInput") {
        // Standard: user responding to an input prompt
        startId = session.current_node_id;
      } else if (vars.__customWaitVar) {
        // Custom node was waiting for input via executionSteps waitInput
        const varName = vars.__customWaitVar;
        const newVars = { ...vars, [varName]: textInput };
        delete newVars.__customWaitVar;
        // Continue from next node after the custom wait node
        const nextEdge = edges.find(e => e.source === session.current_node_id);
        startId = nextEdge?.target ?? null;
        if (startId) {
          try {
            const result = await runFlow(bot.token, chatId, nodes, edges, startId, newVars, null);
            await supabase.from("bot_sessions").upsert(
              { bot_id: botId, chat_id: chatId, current_node_id: result.waitNodeId, variables: result.variables, updated_at: new Date().toISOString() },
              { onConflict: "bot_id,chat_id" },
            );
          } catch (e) { console.error("Flow error:", e); }
        }
        return new Response("OK");
      } else {
        // User typed text while bot waited for a button click (message, userLangPref, etc.)
        // Search forward in flow for the nearest userInput node
        let found: string | null = null;
        const visited = new Set<string>();
        let searchId: string | null = session.current_node_id;
        while (searchId && !visited.has(searchId)) {
          visited.add(searchId);
          const outEdge = edges.find(e => e.source === searchId);
          if (!outEdge) break;
          searchId = outEdge.target;
          const n = nodes.find(nd => nd.id === searchId);
          if (!n) break;
          if (n.type === "userInput") { found = searchId; break; }
        }
        if (found) {
          startId = found;
        } else {
          // No userInput downstream — restart from start
          const startNode = nodes.find(n => n.type === "start");
          startId = startNode?.id ?? null;
        }
      }
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
