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
⚠️ ЗАПРЕЩЕНО описывать что ты "собираешься создать" без action блока! Если пользователь просит создать сайт/бот/форму — СРАЗУ создавай через \`\`\`action, не спрашивая разрешения.
⚠️ Если пользователь прислал фото сайта и написал "создай такой же" — НЕ описывай что видишь, СРАЗУ создавай через CREATE_WEBSITE action блок!

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
{"type":"CREATE_WEBSITE","data":{"name":"","description":"","blocks":[...]}}
\`\`\`

## ❺a СОЗДАНИЕ САЙТОВ — ДЕТАЛЬНЫЕ ИНСТРУКЦИИ

### Доступные блоки сайта и их content:
- **navbar** — навигация. {logo:"Логотип",links:[{label:"О нас",href:"#about"}],ctaText:"Кнопка",ctaHref:"#",bgColor:"#ffffff",textColor:"#1a1a2e"}
- **hero** — главный баннер. {title:"Заголовок",subtitle:"Подзаголовок",ctaText:"Кнопка",ctaHref:"#",bgColor:"#1e293b",textColor:"#ffffff",align:"center"|"left"}
- **text** — текстовый блок. {title:"Заголовок секции",body:"Текст абзаца...",align:"left"|"center"}
- **image** — изображение. {src:"https://images.unsplash.com/...",caption:"Подпись"}
- **features** — карточки преимуществ. {title:"Почему мы",items:[{icon:"⚡",title:"Быстро",desc:"Описание"}]}
- **gallery** — галерея. {title:"Галерея",images:[{url:"https://...",caption:""}]}
- **pricing** — тарифы. {title:"Цены",plans:[{name:"Базовый",price:"990₽/мес",features:["Фича 1"],highlighted:false}]}
- **testimonials** — отзывы. {title:"Отзывы",items:[{name:"Имя",text:"Текст отзыва",rating:5}]}
- **team** — команда. {title:"Наша команда",members:[{avatar:"👨‍💼",name:"Имя",role:"Должность"}]}
- **faq** — вопрос-ответ. {title:"FAQ",items:[{q:"Вопрос?",a:"Ответ"}]}
- **contact** — контакты. {title:"Контакты",email:"...",phone:"...",address:"...",social:[{name:"Telegram",url:"#"}]}
- **countdown** — таймер. {title:"До события",targetDate:"2026-12-31T23:59:59Z"}
- **video** — видео. {url:"https://youtube.com/watch?v=...",title:"Видео"}
- **button** — кнопка. {text:"Текст кнопки",href:"#",bgColor:"#4f46e5",align:"center"}
- **footer** — подвал. {text:"© 2026 Компания",links:[{label:"Политика",href:"#"}]}
- **divider** — разделитель. {}
- **html** — произвольный HTML. {code:"<div>...</div>"}

### ПРАВИЛА СОЗДАНИЯ САЙТОВ:
1. Всегда начинай с блока **navbar** (навигация) — это меню сайта
2. Затем **hero** секция — главный баннер с заголовком
3. Далее контентные секции по порядку
4. Заканчивай блоком **footer**
5. Минимум 5-7 блоков для полноценного сайта
6. Используй цвета: bgColor и textColor для визуального стиля
7. Давай реалистичный контент на языке запроса

### 🖼️ КОГДА ПОЛЬЗОВАТЕЛЬ ПРИСЛАЛ ФОТО САЙТА:
1. Внимательно проанализируй все элементы на изображении
2. Определи структуру: навигация → герой → секции → подвал
3. Извлеки: цвета (фон, текст, акценты), шрифтовой стиль, расположение
4. Воссоздай КАЖДУЮ видимую секцию отдельным блоком
5. Скопируй текст с фото максимально точно (или адаптируй если нечитаемо)
6. Навигацию скопируй точно: лого + все пункты меню + CTA кнопку
7. Подбери цвета bgColor/textColor максимально близко к оригиналу
8. Если на фото есть изображения — используй image блок с placeholder Unsplash URL подходящей тематики
9. Опиши что увидел на фото, потом создай сайт через \`\`\`action блок
10. После создания предложи улучшения

### Пример полного сайта:
\`\`\`action
{"type":"CREATE_WEBSITE","data":{"name":"Grace Community Church","blocks":[
  {"id":"b1","type":"navbar","content":{"logo":"Grace Community Church","links":[{"label":"About","href":"#about"},{"label":"Ministries","href":"#ministries"},{"label":"Sermons","href":"#sermons"},{"label":"Events","href":"#events"},{"label":"Give","href":"#give"}],"bgColor":"#ffffff","textColor":"#333333"}},
  {"id":"b2","type":"hero","content":{"title":"Sunday at Grace","subtitle":"9 & 11 am\\nJoin us this Sunday for worship services and fellowship groups.","ctaText":"Service info","ctaHref":"#services","bgColor":"#f5f5f0","textColor":"#1a1a1a","align":"left"}},
  {"id":"b3","type":"image","content":{"src":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e","caption":""}},
  {"id":"b4","type":"features","content":{"title":"Featured","items":[{"icon":"🙏","title":"Prayer","desc":"Join our prayer groups"},{"icon":"📖","title":"Bible Study","desc":"Deepen your faith"},{"icon":"🤝","title":"Community","desc":"Connect with others"}]}},
  {"id":"b5","type":"contact","content":{"title":"Visit Us","email":"info@grace.org","address":"123 Church St"}},
  {"id":"b6","type":"footer","content":{"text":"© 2026 Grace Community Church"}}
]}}
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
3. ВСЕГДА оборачивай команды в \`\`\`action блок — без него кнопки НЕ появятся в чате!
4. Сначала 1-2 предложения описания, потом СРАЗУ \`\`\`action блок с полным JSON
5. condition → всегда два выхода yes+no
6. ⚡ edges НИКОГДА не пустой! Для N узлов минимум N-1 edges
7. start → первый узел ОБЯЗАТЕЛЬНО связан edge
8. Если нет подходящего узла — ИЗОБРЕТИ кастомный тип
9. После создания бота — ПРЕДЛОЖИ улучшения ("Могу добавить...")
10. Если пользователь прислал картинку сайта — воссоздай дизайн через CREATE_WEBSITE (см. ❺a)
11. Если пользователь прислал ССЫЛКУ на сайт — система автоматически считает HTML и добавит структуру в контекст. Используй эти данные для CREATE_WEBSITE!

## ТИПЫ ПОЛЕЙ ФОРМЫ: text,textarea,number,email,phone,select,radio,checkbox,image,payment
## ТИПЫ БЛОКОВ САЙТА (полный список content свойств — см. секцию ❺a выше): navbar,hero,features,text,image,gallery,pricing,testimonials,faq,team,contact,countdown,video,button,footer,divider,html`;


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
        name: "groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        key: Deno.env.get("GROQ_API_KEY"),
      },
      {
        name: "gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemini-2.0-flash",
        key: Deno.env.get("GEMINI_API_KEY"),
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
        model: "openai/gpt-oss-120b:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-qwen",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-gemma",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "mistralai/mistral-small-3.1-24b-instruct:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-gemma3",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemma-3-27b-it:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-hermes",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
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
    ];

    // --- Helper: convert messages for different providers ---
    // Vision-capable providers that accept OpenAI image_url format
    const VISION_PROVIDERS = new Set(["github-gpt4o-mini", "gemini"]);

    /** Strip images from multimodal messages, add text note */
    function stripImages(msgs: any[]): any[] {
      return msgs.map(m => {
        if (Array.isArray(m.content)) {
          const hasImages = m.content.some((c: any) => c.type === "image_url");
          const textParts = m.content.filter((c: any) => c.type === "text").map((c: any) => c.text);
          if (hasImages) {
            textParts.push("[Пользователь отправил изображение. Опиши что можешь помочь на основе текста.]");
          }
          return { role: m.role, content: textParts.join("\n") || m.content };
        }
        return m;
      });
    }

    /** Convert OpenAI image_url format → Anthropic image format */
    function toAnthropicMessages(msgs: any[]): any[] {
      return msgs.filter((m: any) => m.role !== "system").map(m => {
        if (Array.isArray(m.content)) {
          const converted = m.content.map((c: any) => {
            if (c.type === "image_url" && c.image_url?.url) {
              const url: string = c.image_url.url;
              const match = url.match(/^data:(image\/[^;]+);base64,(.+)$/);
              if (match) {
                return {
                  type: "image",
                  source: { type: "base64", media_type: match[1], data: match[2] },
                };
              }
            }
            return c;
          });
          return { role: m.role, content: converted };
        }
        return m;
      });
    }

    // --- URL detection & website scraping ---
    // Find URLs in the last user message and fetch their HTML content
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let scrapedSiteContent = "";
    if (lastUserMsg) {
      const msgText = typeof lastUserMsg.content === "string"
        ? lastUserMsg.content
        : Array.isArray(lastUserMsg.content)
          ? lastUserMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
          : "";
      const urlMatch = msgText.match(/https?:\/\/[^\s"'<>]+/i);
      if (urlMatch) {
        try {
          console.log(`Fetching website: ${urlMatch[0]}`);
          const siteResp = await fetch(urlMatch[0], {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; FormBotStudio/1.0)",
              "Accept": "text/html,application/xhtml+xml",
              "Accept-Language": "ru,en;q=0.9",
            },
            redirect: "follow",
          });
          if (siteResp.ok) {
            const html = await siteResp.text();
            // Extract meaningful content: title, meta, headings, nav, text, structure
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : "";
            // Extract meta description
            const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
            const metaDesc = metaDescMatch ? metaDescMatch[1] : "";
            // Extract nav links
            const navLinksRaw = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
            const navText = navLinksRaw.map(n => n.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" | ");
            // Extract headings
            const headings: string[] = [];
            const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
            let hm;
            while ((hm = hRegex.exec(html)) !== null) {
              const txt = hm[1].replace(/<[^>]+>/g, "").trim();
              if (txt) headings.push(txt);
            }
            // Extract visible text from body (strip scripts, styles, tags)
            let bodyHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
            const bodyMatch = bodyHtml.match(/<body[\s\S]*?<\/body>/i);
            let bodyText = (bodyMatch ? bodyMatch[0] : bodyHtml)
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 3000); // limit to 3000 chars
            // Extract background colors from inline styles/CSS
            const colorMatches = html.match(/(?:background-color|background|color)\s*:\s*[#\w(),.%\s]+/gi) || [];
            const colors = [...new Set(colorMatches.slice(0, 10))].join("; ");
            // Extract images  
            const imgMatches: string[] = [];
            const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*/gi;
            let im;
            while ((im = imgRegex.exec(html)) !== null && imgMatches.length < 5) {
              imgMatches.push(im[1]);
            }

            scrapedSiteContent = `

---
## 🌐 СЧИТАН САЙТ ПО ССЫЛКЕ: ${urlMatch[0]}

**Заголовок:** ${title}
**Описание:** ${metaDesc}
**Навигация:** ${navText || "не определена"}
**Заголовки:** ${headings.slice(0, 15).join(" | ")}
**Основные цвета CSS:** ${colors || "не определены"}
**Изображения:** ${imgMatches.slice(0, 5).join(", ") || "нет"}
**Текстовое содержимое (первые 3000 символов):**
${bodyText}

---
### ЗАДАЧА: Воссоздай этот сайт через CREATE_WEBSITE action блок.
- Используй РЕАЛЬНУЮ структуру и тексты с сайта
- Скопируй навигацию (navbar links) точно
- Подбери цвета (bgColor/textColor) на основе CSS цветов
- Каждую секцию сайта → отдельный блок
- Начни с navbar → hero → контент → footer
- СРАЗУ создавай через action блок, не описывай!`;
          } else {
            console.error(`Failed to fetch site: ${siteResp.status}`);
            scrapedSiteContent = `\n\n[Не удалось загрузить сайт ${urlMatch[0]}: HTTP ${siteResp.status}. Попроси пользователя прислать скриншот.]`;
          }
        } catch (fetchErr) {
          console.error(`Site fetch error:`, fetchErr);
          scrapedSiteContent = `\n\n[Ошибка при загрузке сайта ${urlMatch[0]}. Попроси пользователя прислать скриншот.]`;
        }
      }
    }

    const baseMessages = [{ role: "system", content: systemContent + scrapedSiteContent }, ...messages];

    // If user selected a specific provider, move it to front but keep fallback chain
    let orderedProviders = [...providers];
    if (preferredProvider && preferredProvider !== "auto") {
      const idx = orderedProviders.findIndex(p => p.name === preferredProvider);
      if (idx > 0) {
        const [preferred] = orderedProviders.splice(idx, 1);
        orderedProviders = [preferred, ...orderedProviders];
      }
    }

    // Check if any message contains images
    const hasImages = messages.some((m: any) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));

    // If images present, prefer vision-capable providers first (after user's choice)
    if (hasImages) {
      const userChoice = (preferredProvider && preferredProvider !== "auto")
        ? orderedProviders.find(p => p.name === preferredProvider) : null;
      const visionFirst: Provider[] = [];
      const rest: Provider[] = [];
      for (const p of orderedProviders) {
        if (p === userChoice) continue; // will be prepended
        if (p.isAnthropic || VISION_PROVIDERS.has(p.name)) visionFirst.push(p);
        else rest.push(p);
      }
      orderedProviders = [...(userChoice ? [userChoice] : []), ...visionFirst, ...rest];
    }

    let lastError = "Нет доступных AI провайдеров. Настройте хотя бы один API ключ.";
    const errors: string[] = [];
    for (const provider of orderedProviders) {
      if (!provider.key) { errors.push(`${provider.name}: no key`); continue; }

      console.log(`Trying provider: ${provider.name}`);
      try {
        // ── Anthropic API (different format) ────────────────────────
        if (provider.isAnthropic) {
          const anthropicMessages = toAnthropicMessages(messages);
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
        // For providers without vision support, strip images from messages
        const supportsVision = VISION_PROVIDERS.has(provider.name);
        const providerMessages = hasImages && !supportsVision
          ? [{ role: "system", content: systemContent }, ...stripImages(messages)]
          : baseMessages;

        const response = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
            ...(provider.extraHeaders ?? {}),
          },
          body: JSON.stringify({
            model: provider.model,
            messages: providerMessages,
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
        console.error(`Provider ${provider.name} failed: ${response.status} ${txt.substring(0, 200)}`);

        if (response.status === 429 || response.status === 503) {
          lastError = `Лимит запросов у ${provider.name}`;
          errors.push(`${provider.name}: ${response.status} rate limit`);
          continue;
        }
        if (response.status === 401 || response.status === 403) {
          lastError = `Ключ API недействителен (${provider.name})`;
          errors.push(`${provider.name}: ${response.status} auth error`);
          continue;
        }
        lastError = `Ошибка ${provider.name}: ${response.status}`;
        errors.push(`${provider.name}: ${response.status} ${txt.substring(0, 100)}`);
        continue;
      } catch (fetchErr) {
        console.error(`Provider ${provider.name} fetch error:`, fetchErr);
        lastError = `Сетевая ошибка (${provider.name})`;
        errors.push(`${provider.name}: fetch error`);
        continue;
      }
    }

    console.error(`All providers failed:`, errors);
    return new Response(JSON.stringify({ error: lastError, details: errors }), {
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