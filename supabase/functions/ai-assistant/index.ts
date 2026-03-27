import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


const SYSTEM_PROMPT = `Ты — AI-ассистент платформы FormBot Studio. Ты НЕ ограничен только платформой.

## ❶ ЧТО ТЫ УМЕЕШЬ
- Отвечать на ЛЮБЫЕ вопросы: код, математика, тексты, переводы, анализ, советы
- Создавать Telegram-ботов, формы, сайты через \`\`\`action блоки
- АНАЛИЗИРОВАТЬ существующих ботов: находить ошибки, предлагать улучшения
- ИСПРАВЛЯТЬ проблемы в ботах: заменять узлы, менять логику, добавлять связи
- Если пользователь присылает изображение — анализируй его и предлагай как реализовать подобное
- ДАВАТЬ СОВЕТЫ: что лучше сделать, какую архитектуру выбрать, как улучшить

## ❷ КРИТИЧЕСКОЕ ПРАВИЛО
Когда нужно создать/изменить объект — ВСЕГДА используй \`\`\`action блок. НИКОГДА не показывай JSON в обычном тексте.

## ❸ ПРОАКТИВНОСТЬ
- Всегда предлагай улучшения к тому что создал
- Если видишь проблему в боте — сообщи и предложи исправление
- Если в конструкторе нет нужного узла для задачи — ИЗОБРЕТИ кастомный тип и зарегистрируй его
- Если пользователь отправил картинку — опиши что на ней, и если это UI/бот — предложи как собрать подобное

## ❹ АЛГОРИТМ СОЗДАНИЯ БОТА
1. Проанализируй запрос пользователя
2. Посмотри какие типы узлов доступны в конструкторе (список ниже)
3. Если нужного узла НЕТ — создай кастомный тип через newNodeTypes
4. Собери бота: узлы + связи + логика
5. Проверь: все узлы связаны? condition имеет yes/no? edges >= nodes-1?
6. Предложи улучшения после создания

## ❺ КОМАНДЫ (всегда в \`\`\`action блоке):

### CREATE_BOT — создать нового бота:
\`\`\`action
{"type":"CREATE_BOT","data":{"name":"Название","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### ADD_BOT_NODES — добавить узлы в существующий бот:
\`\`\`action
{"type":"ADD_BOT_NODES","data":{"botId":"ID","description":"что добавляю","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### REPLACE_BOT — полностью перестроить бота (улучшение/исправление):
\`\`\`action
{"type":"REPLACE_BOT","data":{"botId":"ID","name":"Название","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### EDIT_BOT_NODE — изменить данные одного узла:
\`\`\`action
{"type":"EDIT_BOT_NODE","data":{"botId":"ID","nodeId":"ID_УЗЛА","newData":{"text":"Новый текст"}}}
\`\`\`

### REMOVE_BOT_NODES — удалить узлы:
\`\`\`action
{"type":"REMOVE_BOT_NODES","data":{"botId":"ID","nodeIds":["id1","id2"]}}
\`\`\`

### CREATE_FORM:
\`\`\`action
{"type":"CREATE_FORM","data":{"title":"","description":"","fields":[{"id":"f1","type":"text","label":"Имя","required":true}],"completionMessage":"Спасибо!"}}
\`\`\`

### CREATE_WEBSITE:
\`\`\`action
{"type":"CREATE_WEBSITE","data":{"name":"","blocks":[{"id":"b1","type":"hero","content":{"title":"","subtitle":"","buttonText":"Начать","buttonLink":"#"}}]}}
\`\`\`

### NAVIGATE_TO:
\`\`\`action
{"type":"NAVIGATE_TO","data":{"path":"/bot/new"}}
\`\`\`

## ❻ ТИПЫ УЗЛОВ КОНСТРУКТОРА (встроенные инструменты):
- **start** — начало бота. {data:{}}
- **message** — отправка сообщения. {data:{text:"",buttons:[{id,label,callbackData}],parseMode:"Markdown"}}
- **userInput** — запрос ввода от юзера. {data:{text:"",inputType:"text"|"number"|"email"|"phone"|"date"|"choice",variableName:"",choices:[]}}
- **condition** — ветвление по условию. {data:{variable:"",operator:"equals"|"notEquals"|"contains"|"greater"|"less"|"isEmpty"|"isNotEmpty",value:""}} → edges с sourceHandle:"yes" и "no"
- **action** — внешнее действие (webhook, email). {data:{actionType:"webhook"|"sendMessage"|"email"|"saveToSheet",webhookUrl?,webhookMethod?,webhookBody?,message?,emailTo?}}
- **aiChat** — AI-ответ прямо в боте. {data:{aiPrompt:"",aiModel:"google/gemini-3-flash-preview",aiResponseVar:"ai_response",aiTemperature:0.7}}
- **delay** — пауза перед ответом. {data:{delaySeconds:3,delayMessage:""}}
- **variable** — работа с переменными. {data:{varOperation:"set"|"increment"|"decrement"|"append"|"clear",varName:"",varValue:""}}
- **media** — отправка медиа. {data:{mediaType:"photo"|"video"|"audio"|"document",mediaUrl:"",caption:""}}
- **randomizer** — случайный выбор ветки. {data:{randWeights:[1,1]}} → edges с sourceHandle:"0","1",...
- **jump** — переход к другому узлу. {data:{jumpTarget:"node_id"}}
- **translate** — перевод текста. {data:{translateSourceVar:"",translateTargetLang:"ru"|"en"|"de"|"fr"|"es",translateMode:"fixed"|"userLang",translateResultVar:""}}
- **langDetect** — определение языка. {data:{langDetectVar:"",langResultVar:"",langSetAsDefault:true}}
- **userLangPref** — выбор языка пользователем. {data:{ulpQuestion:"",ulpSaveVar:"user_lang",ulpLanguages:["ru","en"]}}
- **instagramMonitor** — мониторинг Instagram. {data:{igAccountUrl:"",igCheckInterval:30,igNotifyPosts:true,igNotifyReels:true}}
- **facebookMonitor** — мониторинг Facebook. {data:{fbPageUrl:"",fbCheckInterval:30,fbNotifyPosts:true}}
- **youtubeMonitor** — мониторинг YouTube. {data:{ytChannelUrl:"",ytCheckInterval:30,ytNotifyVideos:true,ytNotifyStreams:true}}
- **socialShare** — кнопки соцсетей. {data:{shareLinks:[{id,platform,label,url}],shareText:"",shareLayout:"buttons"}}

## ❼ КАСТОМНЫЕ ТИПЫ УЗЛОВ (авторегистрация)
Если для задачи НЕ хватает встроенных узлов — **ИЗОБРЕТИ кастомный тип**!
Примеры: paymentNode, ratingNode, subscriptionNode, calendarNode, notificationNode, qrCodeNode, pollNode, bookingNode, reviewNode.
- Придумай уникальное camelCase имя для type
- Добавь в data: {label:"Название",icon:"💳",description:"Описание",...}
- Объяви в newNodeTypes: [{"nodeType":"paymentNode","label":"Оплата","icon":"💳","color":"bg-green-500/10 text-green-400 border-green-500/30","description":"Приём платежа"}]
- Узел автоматически появится в панели инструментов!

## ❽ ПЕРЕМЕННЫЕ: {{user_name}}, {{user_id}}, {{user_message}} + любые кастомные

## ❾ СТРУКТУРА
- nodes: [{id:"unique_id",type:"nodeType",position:{x,y},data:{...}}]
- edges: [{id:"e1",source:"id1",target:"id2",sourceHandle?:"yes"|"no"|"0"|"1"}]
- Отступ: ~180px по Y, ~300px по X для ветвлений
- condition → ОБЯЗАТЕЛЬНО 2 связи: yes + no
- message с кнопками → sourceHandle = "0","1",... (индекс кнопки)
- randomizer → sourceHandle = "0","1",...

## ❿ ПРАВИЛА
1. Отвечай на русском
2. Минимум 6-8 узлов для бота с реальной логикой
3. ВСЕГДА оборачивай команды в \`\`\`action блок
4. Сначала 2-3 предложения описания + совет что можно улучшить, потом \`\`\`action блок
5. condition → всегда два выхода yes+no
6. ⚡ edges НИКОГДА не пустой! Для N узлов минимум N-1 edges
7. start → первый узел ОБЯЗАТЕЛЬНО связан edge
8. Если нет подходящего узла — ИЗОБРЕТИ кастомный тип
9. После создания бота — ПРЕДЛОЖИ улучшения ("Могу добавить...")
10. Если пользователь прислал картинку — опиши что на ней и как это реализовать

## ТИПЫ ПОЛЕЙ ФОРМЫ: text,textarea,number,email,phone,select,radio,checkbox,image,payment
## ТИПЫ БЛОКОВ САЙТА: navbar,hero,features,text,image,gallery,pricing,testimonials,faq,team,contact,countdown,video,cta,footer,divider,html,button,map`;


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, context, preferredProvider } = body;

    // Build system prompt with injected context
    let systemContent = SYSTEM_PROMPT;
    // context.type can be "bot" (from bot editor page) or "bot_editor" (legacy)
    if (context?.type === "bot" || context?.type === "bot_editor") {
      const existingTypes = (context.nodeTypes || []).join(", ") || "только start";
      const customTypes = context.customNodeTypes || "нет";
      const nodesJson = context.nodes && context.nodes.length > 0 ? JSON.stringify(context.nodes) : null;
      const edgesJson = context.edges && context.edges.length > 0 ? JSON.stringify(context.edges) : null;
      systemContent += `

---
## 🔴 АКТИВНЫЙ КОНТЕКСТ: РЕДАКТОР БОТА

- **botId:** ${context.botId}
- **Название бота:** "${context.botName}"
- **Узлов:** ${context.nodeCount}
- **Типы узлов:** ${existingTypes}
- **Кастомные узлы в тулбаре:** ${customTypes}
${nodesJson ? `\n### ТЕКУЩИЕ УЗЛЫ БОТА:\n\`\`\`json\n${nodesJson}\n\`\`\`\n` : ''}${edgesJson ? `\n### ТЕКУЩИЕ СВЯЗИ:\n\`\`\`json\n${edgesJson}\n\`\`\`\n` : ''}
### ЧТО ДЕЛАТЬ В ЭТОМ РЕЖИМЕ:

**Анализ:** Просмотри текущие узлы и связи. Если видишь проблемы (отсутствующие связи, пустые тексты, нелогичная структура) — сообщи пользователю и ПРЕДЛОЖИ исправление.

**Создание:** Если пользователь просит создать/добавить функционал:
1. Проверь какие типы узлов УЖЕ есть в конструкторе (см. список выше ❻)
2. Если нужного узла НЕТ — СОЗДАЙ кастомный тип через newNodeTypes
3. Собери полноценную структуру со всеми связями

**Исправление:** Если что-то не работает:
- Используй EDIT_BOT_NODE чтобы поправить данные конкретного узла
- Используй REMOVE_BOT_NODES чтобы удалить сломанные узлы
- Используй REPLACE_BOT чтобы полностью пересобрать бота с нуля (при "улучши"/"переделай")
- Предложи АЛЬТЕРНАТИВНЫЙ вариант если прямое исправление невозможно

### ПРАВИЛА:
1. **botId = "${context.botId}"** — всегда используй это значение
2. Оборачивай команды в \`\`\`action блок
3. "Улучши бота" → REPLACE_BOT с полностью новой улучшенной версией
4. "Добавь ..." → ADD_BOT_NODES
5. "Измени текст/кнопку..." → EDIT_BOT_NODE
6. НЕ используй CREATE_BOT когда есть botId
7. После ЛЮБОГО действия — предложи что ещё можно улучшить`;
    }

    // --- Multi-provider fallback chain ---
    type Provider = { name: string; url: string; model: string; key: string | undefined; isAnthropic?: boolean; extraHeaders?: Record<string, string> };
    const providers: Provider[] = [
      {
        name: "claude-haiku",
        url: "https://api.anthropic.com/v1/messages",
        model: "claude-3-5-haiku-20241022",
        key: Deno.env.get("ANTHROPIC_API_KEY"),
        isAnthropic: true,
      },
      {
        name: "claude-sonnet",
        url: "https://api.anthropic.com/v1/messages",
        model: "claude-3-5-sonnet-20241022",
        key: Deno.env.get("ANTHROPIC_API_KEY"),
        isAnthropic: true,
      },
      {
        name: "groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        key: Deno.env.get("GROQ_API_KEY"),
      },
      {
        name: "github-gpt4o-mini",
        url: "https://models.inference.ai.azure.com/chat/completions",
        model: "gpt-4o-mini",
        key: Deno.env.get("GITHUB_TOKEN"),
      },
      {
        name: "github-llama",
        url: "https://models.inference.ai.azure.com/chat/completions",
        model: "meta-llama-3.3-70b-instruct",
        key: Deno.env.get("GITHUB_TOKEN"),
      },
      {
        name: "openrouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "meta-llama/llama-3.3-70b-instruct:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-deepseek",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "deepseek/deepseek-r1:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "together",
        url: "https://api.together.xyz/v1/chat/completions",
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        key: Deno.env.get("TOGETHER_API_KEY"),
      },
      {
        name: "gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemini-2.0-flash",
        key: Deno.env.get("GEMINI_API_KEY"),
      },
    ];

    const baseMessages = [{ role: "system", content: systemContent }, ...messages];

    // If user selected a specific provider, move it to front
    let orderedProviders = [...providers];
    if (preferredProvider && preferredProvider !== "auto") {
      const idx = orderedProviders.findIndex(p => p.name === preferredProvider);
      if (idx > 0) {
        const [preferred] = orderedProviders.splice(idx, 1);
        orderedProviders = [preferred, ...orderedProviders];
      }
    }

    let lastError = "Нет доступных AI провайдеров. Настройте хотя бы один API ключ.";
    for (const provider of orderedProviders) {
      if (!provider.key) continue; // skip providers without key

      console.log(`Trying provider: ${provider.name}`);
      try {
        // ── Anthropic API (different format) ────────────────────────
        if (provider.isAnthropic) {
          // Anthropic requires system separate from messages
          const anthropicMessages = messages.filter((m: any) => m.role !== "system");
          const response = await fetch(provider.url, {
            method: "POST",
            headers: {
              "x-api-key": provider.key,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: provider.model,
              max_tokens: 6000,
              stream: true,
              system: systemContent,
              messages: anthropicMessages,
            }),
          });

          if (response.ok && response.body) {
            console.log(`Success with provider: ${provider.name}`);
            // Transform Anthropic SSE → OpenAI SSE format
            const transformedStream = new ReadableStream({
              async start(controller) {
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();
                const encoder = new TextEncoder();
                let buf = "";
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    let nl: number;
                    while ((nl = buf.indexOf("\n")) !== -1) {
                      const line = buf.slice(0, nl).trim();
                      buf = buf.slice(nl + 1);
                      if (!line.startsWith("data: ")) continue;
                      try {
                        const d = JSON.parse(line.slice(6));
                        if (d.type === "content_block_delta" && d.delta?.type === "text_delta") {
                          const chunk = JSON.stringify({ choices: [{ delta: { content: d.delta.text } }] });
                          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                        } else if (d.type === "message_stop") {
                          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                        }
                      } catch { /* skip malformed */ }
                    }
                  }
                } finally {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                }
              },
            });
            return new Response(transformedStream, {
              headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
            });
          }

          const txt = await response.text().catch(() => "");
          console.error(`Provider ${provider.name} failed: ${response.status} ${txt}`);
          lastError = `Ошибка ${provider.name}: ${response.status}`;
          continue;
        }

        // ── OpenAI-compatible API ────────────────────────────────────
        const response = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
            ...(provider.extraHeaders ?? {}),
          },
          body: JSON.stringify({
            model: provider.model,
            messages: baseMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 6000,
          }),
        });

        if (response.ok) {
          console.log(`Success with provider: ${provider.name}`);
          return new Response(response.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }

        const txt = await response.text();
        console.error(`Provider ${provider.name} failed: ${response.status} ${txt}`);

        if (response.status === 429 || response.status === 503) {
          lastError = `Лимит запросов у ${provider.name}`;
          continue; // try next provider
        }
        if (response.status === 401 || response.status === 403) {
          lastError = `Ключ API недействителен (${provider.name})`;
          continue;
        }
        // other errors — try next
        lastError = `Ошибка ${provider.name}: ${response.status}`;
        continue;
      } catch (fetchErr) {
        console.error(`Provider ${provider.name} fetch error:`, fetchErr);
        lastError = `Сетевая ошибка (${provider.name})`;
        continue;
      }
    }

    return new Response(JSON.stringify({ error: lastError }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});