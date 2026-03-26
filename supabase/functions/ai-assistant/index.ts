import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


const SYSTEM_PROMPT = `Ты — AI-конструктор платформы FormBot Studio. Создаёшь Telegram-ботов, формы и сайты через специальные команды.

## КРИТИЧЕСКОЕ ПРАВИЛО
Когда нужно создать/изменить объект — ВСЕГДА используй \`\`\`action блок. НИКОГДА не показывай JSON в обычном тексте.

## КОМАНДЫ (всегда в \`\`\`action блоке):

### CREATE_BOT — создать бота:
\`\`\`action
{"type":"CREATE_BOT","data":{"name":"Название","nodes":[...],"edges":[...]}}
\`\`\`

### ADD_BOT_NODES — добавить узлы в существующий бот:
\`\`\`action
{"type":"ADD_BOT_NODES","data":{"botId":"ID_БОТА","description":"что добавляю","newNodeTypes":[],"nodes":[...],"edges":[...]}}
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

## ТИПЫ УЗЛОВ БОТА (nodeType):
- start — {data:{}}
- message — {data:{text:"",buttons:[{id,label,callbackData}],parseMode:"Markdown"}}
- userInput — {data:{text:"",inputType:"text"|"number"|"email"|"phone"|"date"|"choice",variableName:"",choices:[]}}
- condition — {data:{variable:"",operator:"equals"|"notEquals"|"contains"|"greater"|"less"|"isEmpty"|"isNotEmpty",value:""}} → edges с sourceHandle:"yes" и "no"
- action — {data:{actionType:"webhook"|"sendMessage"|"email"|"saveToSheet",webhookUrl?,webhookMethod?,webhookBody?,message?,emailTo?}}
- aiChat — {data:{aiPrompt:"",aiModel:"google/gemini-2.5-flash",aiResponseVar:"ai_response",aiTemperature:0.7}}
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

Новый тип: добавь в newNodeTypes: [{nodeType:"myType",label:"",icon:"🎯",color:"bg-purple-500/10 text-purple-400 border-purple-500/30",description:""}]

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
6. Если есть botId в контексте → используй ADD_BOT_NODES, не CREATE_BOT`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, context } = body;

    // Build system prompt with injected context
    let systemContent = SYSTEM_PROMPT;
    // context.type can be "bot" (from bot editor page) or "bot_editor" (legacy)
    if (context?.type === "bot" || context?.type === "bot_editor") {
      const existingTypes = (context.nodeTypes || []).join(", ") || "только start";
      systemContent += `

---
## 🔴 АКТИВНЫЙ КОНТЕКСТ: РЕДАКТОР БОТА

Пользователь сейчас РЕДАКТИРУЕТ бота в конструкторе узлов.

- **botId:** ${context.botId}
- **Название бота:** "${context.botName}"
- **Узлов уже в боте:** ${context.nodeCount}
- **Типы существующих узлов:** ${existingTypes}

### КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ДЛЯ ЭТОГО РЕЖИМА:

1. **ВСЕГДА используй ADD_BOT_NODES** — НЕ CREATE_BOT
2. **botId в команде = "${context.botId}"** — строго это значение
3. **ОБЯЗАТЕЛЬНО оборачивай логику в \`\`\`action блок** — иначе узлы НЕ появятся на canvas
4. Генерируй минимум 5-8 узлов с реальной логикой
5. Каждый condition-узел → ДВЕ связи (yes + no)
6. Первым узлом обычно ставь message с приветствием и кнопками

### ФОРМАТ ОТВЕТА ДЛЯ ДОБАВЛЕНИЯ УЗЛОВ:

Сначала 2-3 предложения что ты добавляешь, затем:

\`\`\`action
{
  "type": "ADD_BOT_NODES",
  "data": {
    "botId": "${context.botId}",
    "description": "Краткое описание",
    "newNodeTypes": [],
    "nodes": [ ...твои узлы... ],
    "edges": [ ...твои связи... ]
  }
}
\`\`\``;
    }

    // --- Multi-provider fallback chain ---
    // Priority: Groq (14400/day) → GitHub Models (GPT-4o-mini, 150/day) → OpenRouter → Together → Gemini
    type Provider = { name: string; url: string; model: string; key: string | undefined; extraHeaders?: Record<string, string> };
    const providers: Provider[] = [
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

    let lastError = "Нет доступных AI провайдеров. Настройте хотя бы один API ключ.";
    for (const provider of providers) {
      if (!provider.key) continue; // skip providers without key

      console.log(`Trying provider: ${provider.name}`);
      try {
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