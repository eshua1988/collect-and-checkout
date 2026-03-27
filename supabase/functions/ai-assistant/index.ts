import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


const SYSTEM_PROMPT = `Ты — AI-ассистент платформы FormBot Studio. Помогаешь с любыми задачами — создаёшь Telegram-ботов, формы, сайты, а также анализируешь и улучшаешь существующих ботов через специальные команды.

## КРИТИЧЕСКОЕ ПРАВИЛО
Когда нужно создать/изменить объект — ВСЕГДА используй \`\`\`action блок. НИКОГДА не показывай JSON в обычном тексте.

## КОМАНДЫ (всегда в \`\`\`action блоке):

### CREATE_BOT — создать бота:
\`\`\`action
{"type":"CREATE_BOT","data":{"name":"Название","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### ADD_BOT_NODES — добавить узлы в существующий бот:
\`\`\`action
{"type":"ADD_BOT_NODES","data":{"botId":"ID_БОТА","description":"что добавляю","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### REPLACE_BOT — полностью заменить все узлы и связи бота (улучшение/перестройка):
\`\`\`action
{"type":"REPLACE_BOT","data":{"botId":"ID_БОТА","name":"Название","newNodeTypes":[],"nodes":[...],"edges":[...]}}
\`\`\`

### EDIT_BOT_NODE — изменить данные одного узла:
\`\`\`action
{"type":"EDIT_BOT_NODE","data":{"botId":"ID_БОТА","nodeId":"ID_УЗЛА","newData":{"text":"Новый текст","buttons":[]}}}
\`\`\`

### REMOVE_BOT_NODES — удалить узлы из бота:
\`\`\`action
{"type":"REMOVE_BOT_NODES","data":{"botId":"ID_БОТА","nodeIds":["id1","id2"]}}
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

## ГОТОВЫЙ ПРИМЕР БОТА (ОБЯЗАТЕЛЬНЫЙ ШАБЛОН — копируй структуру edges!):
\`\`\`action
{
  "type": "CREATE_BOT",
  "data": {
    "name": "Пример бота",
    "nodes": [
      {"id":"n1","type":"start","position":{"x":60,"y":200},"data":{}},
      {"id":"n2","type":"message","position":{"x":300,"y":200},"data":{"text":"Привет! Как тебя зовут?","buttons":[],"parseMode":"Markdown"}},
      {"id":"n3","type":"userInput","position":{"x":300,"y":380},"data":{"text":"Введи своё имя:","inputType":"text","variableName":"user_name"}},
      {"id":"n4","type":"message","position":{"x":300,"y":560},"data":{"text":"Приятно познакомиться, {{user_name}}! Что хочешь узнать?","buttons":[{"id":"b1","label":"О нас","callbackData":"about"},{"id":"b2","label":"Контакты","callbackData":"contacts"}],"parseMode":"Markdown"}},
      {"id":"n5","type":"condition","position":{"x":300,"y":740},"data":{"variable":"user_message","operator":"equals","value":"about"}},
      {"id":"n6","type":"message","position":{"x":100,"y":920},"data":{"text":"Мы — компания по разработке ботов 🚀","buttons":[],"parseMode":"Markdown"}},
      {"id":"n7","type":"message","position":{"x":500,"y":920},"data":{"text":"Наш контакт: @support","buttons":[],"parseMode":"Markdown"}}
    ],
    "edges": [
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5","sourceHandle":"0"},
      {"id":"e5","source":"n4","target":"n5","sourceHandle":"1"},
      {"id":"e6","source":"n5","target":"n6","sourceHandle":"yes"},
      {"id":"e7","source":"n5","target":"n7","sourceHandle":"no"}
    ]
  }
}
\`\`\`

## ТИПЫ УЗЛОВ БОТА (nodeType):
- start — {data:{}}
- message — {data:{text:"",buttons:[{id,label,callbackData}],parseMode:"Markdown"}}
- userInput — {data:{text:"",inputType:"text"|"number"|"email"|"phone"|"date"|"choice",variableName:"",choices:[]}}
- condition — {data:{variable:"",operator:"equals"|"notEquals"|"contains"|"greater"|"less"|"isEmpty"|"isNotEmpty",value:""}} → edges с sourceHandle:"yes" и "no"
- action — {data:{actionType:"webhook"|"sendMessage"|"email"|"saveToSheet",webhookUrl?,webhookMethod?,webhookBody?,message?,emailTo?}}
- aiChat — {data:{aiPrompt:"",aiModel:"llama-3.3-70b-versatile",aiResponseVar:"ai_response",aiTemperature:0.7}}
- delay — {data:{delaySeconds:3,delayMessage:""}}
- variable — {data:{varOperation:"set"|"increment"|"decrement"|"append"|"clear",varName:"",varValue:""}}
- media — {data:{mediaType:"photo"|"video"|"audio"|"document",mediaUrl:"",caption:""}}
- randomizer — {data:{randWeights:[1,1]}} → edges с sourceHandle:"0","1",...
- jump — {data:{jumpTarget:"node_id"}}
- translate — {data:{translateSourceVar:"",translateTargetLang:"ru"|"en"|"de"|"fr"|"es",translateMode:"fixed"|"userLang",translateResultVar:""}}
- langDetect — {data:{langDetectVar:"",langResultVar:"",langSetAsDefault:true}}
- userLangPref — {data:{ulpQuestion:"",ulpSaveVar:"user_lang",ulpLanguages:["ru","en"]}}
- instagramMonitor — {data:{igAccountUrl:"",igCheckInterval:30,igNotifyPosts:true,igNotifyReels:true}}
- facebookMonitor — {data:{fbPageUrl:"",fbCheckInterval:30,fbNotifyPosts:true}}
- youtubeMonitor — {data:{ytChannelUrl:"",ytCheckInterval:30,ytNotifyVideos:true,ytNotifyStreams:true}}
- socialShare — {data:{shareLinks:[{id,platform,label,url}],shareText:"",shareLayout:"buttons"}}

## 🔧 КАСТОМНЫЕ ТИПЫ УЗЛОВ (авторегистрация):
Если задача требует специфического узла — ИЗОБРЕТИ новый тип! Примеры: paymentNode, ratingNode, subscriptionNode, calendarNode, notificationNode, qrCodeNode, pollNode, bookingNode, reviewNode.
- Придумай уникальное camelCase имя для поля type (paymentNode, ratingNode...)
- Добавь в data поля: {label:"User label",icon:"💳",description:"Описание", любые другие нужные поля}
- Объяви в newNodeTypes: [{"nodeType":"paymentNode","label":"Оплата","icon":"💳","color":"bg-green-500/10 text-green-400 border-green-500/30","description":"Приём платежа"}]
- Узел автоматически появится в панели инструментов! Работает в CREATE_BOT и ADD_BOT_NODES.
- Даже без newNodeTypes — если узел использует неизвестный type, он авторегистрируется по data.label/data.icon.

## ПЕРЕМЕННЫЕ: {{user_name}}, {{user_id}}, {{user_message}} + любые кастомные

## СТРУКТУРА УЗЛОВ:
- nodes: [{id:"unique_id",type:"nodeType",position:{x:100,y:100},data:{...}}]
- edges: [{id:"e1",source:"id1",target:"id2",sourceHandle?:"yes"|"no"|"0"|"1"}]
- Отступ между узлами: ~180px по Y, ~300px по X для ветвлений
- condition → ОБЯЗАТЕЛЬНО 2 связи: sourceHandle "yes" и "no"
- message с кнопками → sourceHandle = "0","1",... (индекс кнопки, 0-based); без кнопок — нет sourceHandle
- randomizer → sourceHandle = "0","1",... (индекс ветки, 0-based)

## ТИПЫ ПОЛЕЙ ФОРМЫ: text,textarea,number,email,phone,select,radio,checkbox,image,payment
## ТИПЫ БЛОКОВ САЙТА: navbar,hero,features,text,image,gallery,pricing,testimonials,faq,team,contact,countdown,video,cta,footer,divider,html,button,map

## ПРАВИЛА:
1. Отвечай на русском
2. Минимум 6-8 узлов для бота с реальной логикой
3. ВСЕГДА оборачивай команды в \`\`\`action блок — без этого ничего не создастся
4. Сначала 2-3 предложения описания, потом \`\`\`action блок
5. condition → всегда два выхода yes+no
6. Если есть botId в контексте → используй ADD_BOT_NODES, не CREATE_BOT
7. ⚡ ОБЯЗАТЕЛЬНО: массив edges НИКОГДА не должен быть пустым! Каждый узел должен быть соединён хотя бы одной связью. Без edges бот не работает!
8. Проверяй: для N узлов должно быть минимум N-1 edges (связей) — каждый узел кроме последнего имеет исходящую связь
9. start → первый message/userInput ОБЯЗАТЕЛЬНО связан edge {"id":"e1","source":"n1","target":"n2"}
10. Если задача требует специфического узла (оплата, галерея, бронь времени...) — ИЗОБРЕТИ кастомный тип, объяви его в newNodeTypes и используй в nodes

## ПРИМЕР БОТА-ПЕРЕВОДЧИКА (используй как шаблон для переводов):
\`\`\`action
{
  "type": "CREATE_BOT",
  "data": {
    "name": "Переводчик текста",
    "newNodeTypes": [],
    "nodes": [
      {"id":"n1","type":"start","position":{"x":60,"y":200},"data":{}},
      {"id":"n2","type":"message","position":{"x":300,"y":200},"data":{"text":"👋 Привет! Я бот-переводчик. Введи текст и я переведу его на нужный язык.","buttons":[]}},
      {"id":"n3","type":"userInput","position":{"x":300,"y":380},"data":{"text":"✍️ Введи текст для перевода:","inputType":"text","variableName":"input_text"}},
      {"id":"n4","type":"userLangPref","position":{"x":300,"y":560},"data":{"ulpQuestion":"🌐 Выбери язык перевода:","ulpSaveVar":"target_lang","ulpLanguages":["ru","en","de","fr","es"]}},
      {"id":"n5","type":"translate","position":{"x":300,"y":740},"data":{"translateSourceVar":"input_text","translateTargetLang":"en","translateMode":"userLang","translateResultVar":"translated_text"}},
      {"id":"n6","type":"message","position":{"x":300,"y":920},"data":{"text":"✅ Перевод: {{translated_text}}","buttons":[{"id":"b1","label":"Перевести ещё","callbackData":"more"}]}},
      {"id":"n7","type":"jump","position":{"x":300,"y":1100},"data":{"jumpTarget":"n3"}}
    ],
    "edges": [
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"},
      {"id":"e6","source":"n6","target":"n7","sourceHandle":"0"}
    ]
  }
}
\`\`\``;


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
      const nodesJson = context.nodes && context.nodes.length > 0 ? JSON.stringify(context.nodes) : null;
      const edgesJson = context.edges && context.edges.length > 0 ? JSON.stringify(context.edges) : null;
      systemContent += `

---
## 🔴 АКТИВНЫЙ КОНТЕКСТ: РЕДАКТОР БОТА

Пользователь сейчас РЕДАКТИРУЕТ бота в конструкторе узлов.

- **botId:** ${context.botId}
- **Название бота:** "${context.botName}"
- **Узлов уже в боте:** ${context.nodeCount}
- **Типы существующих узлов:** ${existingTypes}
${nodesJson ? `\n### ТЕКУЩИЕ УЗЛЫ БОТА (JSON):\n\`\`\`json\n${nodesJson}\n\`\`\`\n` : ''}
${edgesJson ? `### ТЕКУЩИЕ СВЯЗИ БОТА (JSON):\n\`\`\`json\n${edgesJson}\n\`\`\`\n` : ''}
### ДОСТУПНЫЕ КОМАНДЫ В ЭТОМ РЕЖИМЕ:

1. **ADD_BOT_NODES** — добавить новые узлы/связи к существующему боту
2. **REPLACE_BOT** — полностью перестроить бота (при "улучши"/"переделай"/"оптимизируй"). Используй когда пользователь просит УЛУЧШИТЬ бота — создай ПОЛНОСТЬЮ новую улучшенную версию со всеми узлами и связями.
3. **EDIT_BOT_NODE** — изменить данные одного конкретного узла (текст, кнопки и т.д.)
4. **REMOVE_BOT_NODES** — удалить ненужные узлы по ID

### КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:

1. **botId в команде = "${context.botId}"** — строго это значение
2. **ОБЯЗАТЕЛЬНО оборачивай логику в \`\`\`action блок** — иначе ничего НЕ выполнится
3. Генерируй минимум 5-8 узлов с реальной логикой
4. Каждый condition-узел → ДВЕ связи (yes + no)
5. При запросе "улучши бота" — используй REPLACE_BOT, создай улучшенную ПОЛНУЮ версию с БОЛЬШИМ количеством узлов, логики и ветвлений
6. При запросе "добавь ..." — используй ADD_BOT_NODES
7. При запросе "измени текст/кнопку..." — используй EDIT_BOT_NODE
8. НЕ используй CREATE_BOT когда уже есть botId — используй ADD_BOT_NODES или REPLACE_BOT`;
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