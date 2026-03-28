import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


// === CORE PROMPT (всегда включён — команды, правила, структура) ===
const PROMPT_CORE = `Ты — AI-ассистент платформы FormBot Studio. Ты НЕ ограничен только платформой.
Умеешь: отвечать на ЛЮБЫЕ вопросы (код, математика, тексты, переводы), создавать Telegram-ботов/формы/сайты через \`\`\`action блоки, анализировать и исправлять объекты.

## КРИТИЧЕСКИЕ ПРАВИЛА
- Для создания/изменения — ВСЕГДА \`\`\`action блок. НИКОГДА JSON в обычном тексте.
- СРАЗУ создавай, не спрашивая. Перед action — МАКСИМУМ 1-2 предложения.
- JSON КОМПАКТНЫЙ без пробелов/отступов, весь action блок в ОДНОМ сообщении.
- Фото сайта → СРАЗУ CREATE_WEBSITE. Ссылка → используй просканированные страницы.
- Если нет нужного типа — ИЗОБРЕТИ кастомный через newNodeTypes/newBlockTypes/newFieldTypes.
- После создания — ВСЕГДА предлагай улучшения.
- Изображение от пользователя → анализируй и предлагай реализацию.

## КОМАНДЫ (всегда в \`\`\`action блоке):
**Боты:** CREATE_BOT {name,newNodeTypes[],nodes[],edges[]}, ADD_BOT_NODES {botId,description,newNodeTypes[],nodes[],edges[]}, REPLACE_BOT {botId,name,newNodeTypes[],nodes[],edges[]}, EDIT_BOT_NODE {botId,nodeId,newData{}}, REMOVE_BOT_NODES {botId,nodeIds[]}
**Формы:** CREATE_FORM {title,newFieldTypes[],theme{},fields[],completionMessage}, REPLACE_FORM {formId,title,newFieldTypes[],fields[]}, EDIT_FORM_FIELD {formId,fieldId,newData{}}, REMOVE_FORM_FIELDS {formId,fieldIds[]}
**Сайты:** CREATE_WEBSITE {name,newBlockTypes[],globalStyles{},pages:[{slug,title,blocks[]}]}, ADD_WEBSITE_BLOCKS {name,newBlockTypes[],blocks[]}, REPLACE_WEBSITE {websiteId,name,newBlockTypes[],pages[]}, EDIT_WEBSITE_BLOCK {websiteId,blockId,newContent{},pageSlug}, REMOVE_WEBSITE_BLOCKS {websiteId,blockIds[]}
NAVIGATE_TO: {path:"/bot/new"}

Формат:
\`\`\`action
{"type":"COMMAND","data":{...}}
\`\`\`

## СТРУКТУРА
- nodes: [{id,type,position:{x,y},data:{...}}] — отступ ~180px Y, ~300px X
- edges: [{id,source,target,sourceHandle?:"yes"|"no"|"0"|"1"}]
- condition → ОБЯЗАТЕЛЬНО yes+no. buttons → sourceHandle "0","1",...
- edges >= nodes-1. start ОБЯЗАТЕЛЬНО связан. randomizer → sourceHandle "0","1",...
- Переменные: {{user_name}}, {{user_id}}, {{user_message}} + кастомные

## ПРАВИЛА
1. Отвечай на русском 2. Min 6-8 узлов для бота, min 5-7 блоков для сайта
3. ВСЕГДА \`\`\`action блок 4. 1-2 предложения → action
5. ВСЕГДА стили: globalStyles+bgColor/textColor, theme, parseMode:"Markdown"
6. Одностраничный: blocks:[]. Многостраничный: pages:[{slug,title,blocks}]. Главная slug="home".`;

// === BOT-SPECIFIC ===
const PROMPT_BOT = `

## ТИПЫ УЗЛОВ БОТА:
- **start** — начало. {data:{}}
- **message** — сообщение. {data:{text,buttons:[{id,label,callbackData}],parseMode:"Markdown"}}
- **userInput** — запрос ввода. {data:{text,inputType:"text"|"number"|"email"|"phone"|"date"|"choice",variableName,choices:[]}}
- **condition** — ветвление. {data:{variable,operator:"equals"|"notEquals"|"contains"|"greater"|"less"|"isEmpty"|"isNotEmpty",value}} → sourceHandle:"yes"/"no"
- **action** — webhook/email. {data:{actionType:"webhook"|"sendMessage"|"email"|"saveToSheet",webhookUrl?,webhookMethod?,webhookBody?,message?,emailTo?}}
- **aiChat** — AI-ответ. {data:{aiPrompt,aiModel:"google/gemini-3-flash-preview",aiResponseVar:"ai_response",aiTemperature:0.7}}
- **delay** — пауза. {data:{delaySeconds:3,delayMessage:""}}
- **variable** — переменные. {data:{varOperation:"set"|"increment"|"decrement"|"append"|"clear",varName,varValue}}
- **media** — медиа. {data:{mediaType:"photo"|"video"|"audio"|"document",mediaUrl,caption}}
- **randomizer** — случайный выбор. {data:{randWeights:[1,1]}} → sourceHandle:"0","1",...
- **jump** — переход. {data:{jumpTarget:"node_id"}}
- **translate** — перевод. {data:{translateSourceVar,translateTargetLang,translateMode:"fixed"|"userLang",translateResultVar}}
- **langDetect** — определение языка. {data:{langDetectVar,langResultVar,langSetAsDefault:true}}
- **userLangPref** — выбор языка. {data:{ulpQuestion,ulpSaveVar:"user_lang",ulpLanguages:["ru","en"]}}
- **instagramMonitor**, **facebookMonitor**, **youtubeMonitor** — мониторинг
- **socialShare** — кнопки. {data:{shareLinks:[{id,platform,label,url}],shareText,shareLayout:"buttons"}}

Стилизация: parseMode:"Markdown", buttons→sourceHandle:"0","1",..., aiChat: ОБЯЗАТЕЛЕН userInput перед ним!

Алгоритм: 1.Анализ → 2.Типы узлов → 3.Кастомный? → 4.Узлы+связи → 5.Проверка → 6.Улучшения

## КАСТОМНЫЕ УЗЛЫ
Нет нужного → ИЗОБРЕТИ! camelCase имя.
newNodeTypes:[{nodeType,label,icon,color:"bg-green-500/10 text-green-400 border-green-500/30",description}]
КРИТИЧНО: настройки → ОТДЕЛЬНЫЕ свойства data! НЕ прятать внутри executionSteps!

### executionSteps — бекенд-логика:
- sendMessage: {action:"sendMessage",text:"{{var}}",buttons:[{id,label}]}
- setVariable: {action:"setVariable",variable:"x",value:"{{y}}",operation:"set|increment|decrement|append|clear"}
- fetchUrl: {action:"fetchUrl",url:"...",method:"POST",body:"...",resultVar:"res",resultPath:"data.field"}
- callFunction: {action:"callFunction",function:"bot-yandex-translate",functionBody:{},resultVar:"r"}
- condition: {action:"condition",variable:"x",operator:"equals",value:"y",thenSteps:[],elseSteps:[]}
- waitInput: {action:"waitInput",prompt:"...",variableName:"v",inputType:"text|choice",choices:[]}
Кастомный узел ВСЕГДА с executionSteps!`;

// === WEBSITE-SPECIFIC ===
const PROMPT_WEBSITE = `

## БЛОКИ САЙТА:
- **navbar**: {logo,links:[{label,href}],ctaText,ctaHref,bgColor,textColor}
- **hero**: {title,subtitle,ctaText,ctaHref,bgColor,textColor,align:"center"|"left"}
- **text**: {title,body,align} | **image**: {src,caption} | **video**: {url,title}
- **features**: {title,items:[{icon,title,desc}]}
- **gallery**: {title,images:[{url,caption}]}
- **pricing**: {title,plans:[{name,price,features[],highlighted}]}
- **testimonials**: {title,items:[{name,text,rating}]}
- **team**: {title,members:[{avatar,name,role}]}
- **faq**: {title,items:[{q,a}]} | **contact**: {title,email,phone,address,social:[{name,url}]}
- **countdown**: {title,targetDate} | **button**: {text,href,bgColor,align}
- **footer**: {text,links:[{label,href}]} | **divider**: {} | **html**: {code}
- **stats**: {title,items:[{value,label}],bgColor,textColor}
- **logos**: {title,items:[{name,logo}],grayscale}
- **cta**: {title,subtitle,ctaText,ctaHref,bgColor,textColor}
- **timeline**: {title,items:[{icon,title,desc}]}
- **social**: {title,links:[{platform,url,icon}]}
- **newsletter**: {title,subtitle,buttonText,bgColor}
- **banner**: {text,bgColor,textColor,closable}
- **tabs**: {tabs:[{title,content}]} | **accordion**: {title,items:[{title,content}]}
- **progress**: {title,items:[{label,value,color}]}
- **comparison**: {title,columns[],rows:[{feature,values[]}]}
- **marquee**: {text,speed,bgColor,textColor} | **quote**: {text,author,bgColor}
- **map**: {address,embedUrl,height} | **columns**: {columns:[{title,text}]}
- **spacer**: {height} | **form**: {title,fields:[{label,type}],buttonText,bgColor}

### globalStyles: {primaryColor,secondaryColor,accentColor,fontFamily("Inter"|"Roboto"|"Playfair Display"|"Montserrat"|"Poppins"|"Merriweather"),headingFont,backgroundColor,textColor,borderRadius,maxWidth}
### block.styles: {padding,margin,fontSize,fontWeight,fontFamily,boxShadow,border,opacity,backgroundImage,backgroundSize,maxWidth,minHeight,textTransform,letterSpacing,lineHeight,borderRadius}

ПРАВИЛА: navbar→hero→контент→footer, min 5-7 блоков, ВСЕГДА globalStyles+styles(padding,градиенты,тени), контент на языке запроса.
ПАЛИТРЫ: Корпоративный(#2563eb/#f8fafc), Минимализм(#18181b/#fff), Фиолетовый(#7c3aed/#faf5ff), Тёмный(#a855f7/#0f0f23), Зелёный(#16a34a/#f0fdf4), Оранжевый(#ea580c/#fff7ed), Океан(#0891b2/#ecfeff)
ШРИФТЫ: Playfair+Inter, Montserrat+OpenSans, Poppins+Roboto, Merriweather+Lato
МНОГОСТРАНИЧНЫЙ: pages:[{slug,title,blocks}], Navbar одинаковый на всех: href="/slug", Главная slug="home"
ФОТО: структура→цвета→воссоздай КАЖДУЮ секцию отдельным блоком→bgColor/textColor близко к оригиналу
КАСТОМНЫЕ БЛОКИ: newBlockTypes:[{blockType,label,icon,description}]`;

// === FORM-SPECIFIC ===
const PROMPT_FORM = `

## ПОЛЯ ФОРМЫ:
text/textarea/number/email/phone: {label,placeholder,required}
select/radio: {label,required,options:[{id,label,value}]}
checkbox: {label,required} | image: {label,imageUrl}
dynamicNumber: {label,dynamicFieldsCount}
payment: {label,paymentFields:[{id,type,label,options,multiplier}],baseAmount}

### theme: {primaryColor,backgroundColor,textColor,headerColor,headerTextColor,accentColor,fontFamily,borderRadius,buttonColor,buttonTextColor,fieldBackground,fieldBorder,layout:"card"|"flat"|"minimal"|"modern"}
### Стилизация: headerImage(URL шапки), placeholder на полях, completionMessage(после отправки)
### Кастомные поля: newFieldTypes:[{fieldType,label,icon,description}]`;


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, context, preferredProvider } = body;

    // Build modular system prompt based on context type
    const ctxType = context?.type;
    let systemContent = PROMPT_CORE;
    if (ctxType === 'bot' || ctxType === 'bot_editor') systemContent += PROMPT_BOT;
    else if (ctxType === 'website_editor') systemContent += PROMPT_WEBSITE;
    else if (ctxType === 'form_editor') systemContent += PROMPT_FORM;
    else systemContent += PROMPT_BOT + PROMPT_WEBSITE + PROMPT_FORM;

    // Detect if user is asking for diagnostics (to include extended instructions)
    const lastMsg = messages.filter((m: any) => m.role === "user").pop();
    const lastMsgText = lastMsg ? (typeof lastMsg.content === "string" ? lastMsg.content : Array.isArray(lastMsg.content) ? lastMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ") : "") : "";
    const wantsDiag = /проверь|диагност|не работа|ошибк|почему|debug|fix|broken|issue/i.test(lastMsgText);

    // context.type can be "bot" (from bot editor page) or "bot_editor" (legacy)
    if (context?.type === "bot" || context?.type === "bot_editor") {
      const existingTypes = (context.nodeTypes || []).join(", ") || "только start";
      const customTypes = context.customNodeTypes || "нет";
      // Truncate large JSON to prevent 413 errors (max ~6000 chars each)
      const MAX_JSON = 6000;
      let nodesJson = context.nodes && context.nodes.length > 0 ? JSON.stringify(context.nodes) : null;
      let edgesJson = context.edges && context.edges.length > 0 ? JSON.stringify(context.edges) : null;
      if (nodesJson && nodesJson.length > MAX_JSON) {
        // Strip position data first to save space
        const slim = context.nodes.map((n: any) => ({ id: n.id, type: n.type, data: n.data }));
        nodesJson = JSON.stringify(slim);
        if (nodesJson.length > MAX_JSON) nodesJson = nodesJson.slice(0, MAX_JSON) + '...(обрезано)';
      }
      if (edgesJson && edgesJson.length > MAX_JSON) edgesJson = edgesJson.slice(0, MAX_JSON) + '...(обрезано)';
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
**Анализ:** Просмотри узлы/связи → сообщи о проблемах → ПРЕДЛОЖИ исправление.
**Создание:** Проверь типы узлов (❻), если нет нужного → создай кастомный через newNodeTypes.
**Исправление:** EDIT_BOT_NODE / REMOVE_BOT_NODES / REPLACE_BOT.
${wantsDiag ? `
### 🔍 ДИАГНОСТИКА: КОНСТРУКТОР vs ТЕЛЕГРАМ-БОТ
**Проверь ВСЕ пункты:**
А. СВЯЗИ: каждый узел→исходящее ребро; condition→yes+no; message+buttons→sourceHandle="0","1"...; userLangPref→ребро; randomizer→"0","1"...; нет циклов без userInput
Б. ДАННЫЕ: message.text не пуст; userInput.variableName уникален; condition.variable существует; translate/yandex sourceVar установлена; aiChat: перед ним ОБЯЗАТЕЛЕН userInput (иначе _lastUserInput="Привет"); кастомные→executionSteps; variable→varName+varValue
В. ТИПИЧНЫЕ БАГИ: 1)aiChat без userInput→"Привет! Чем помочь?" 2)текст при ожидании кнопки→restart 3)цикл без userInput→зацикливание 4)translateSourceVar не установлена 5)кастомный без executionSteps→молчит 6)sourceHandle≠индексу кнопки 7)userLangPref без ребра 8){{var}} не установлена
Г. АЛГОРИТМ: start→проследи ВСЕ пути→проверь рёбра+переменные+aiChat+condition+buttons
Д. ФОРМАТ: 📋 нумерованный список, ⚠️ 🔴/🟡/🟢, 🔧 action блок для каждой проблемы` : `
При "не работает в Telegram"/"проверь"/"диагностика" — проверь связи, данные узлов, переменные.`}

### ПРАВИЛА:
1. **botId = "${context.botId}"**
2. Оборачивай команды в \`\`\`action блок
3. "Улучши бота" → REPLACE_BOT
4. "Добавь ..." → ADD_BOT_NODES
5. "Измени..." → EDIT_BOT_NODE
6. НЕ используй CREATE_BOT когда есть botId
7. После действия — предложи улучшения`;
    }

    // Form editor context
    if (context?.type === "form_editor") {
      const fieldsJson = context.fields && context.fields.length > 0 ? JSON.stringify(context.fields) : null;
      systemContent += `

---
## 🔵 АКТИВНЫЙ КОНТЕКСТ: РЕДАКТОР ФОРМЫ

- **formId:** ${context.formId}
- **Название формы:** "${context.formTitle}"
- **Полей:** ${context.fieldCount}
${fieldsJson ? `\n### ТЕКУЩИЕ ПОЛЯ ФОРМЫ:\n\`\`\`json\n${fieldsJson}\n\`\`\`\n` : ''}
### ЧТО ДЕЛАТЬ: ADD_FORM_FIELDS / EDIT_FORM_FIELD / REPLACE_FORM / REMOVE_FORM_FIELDS / newFieldTypes для кастомных.
${wantsDiag ? `
### 🔍 ДИАГНОСТИКА ФОРМЫ
Проверь: пустые label, дубликаты id, select/radio без options, нет required:true, payment без baseAmount, плохой контраст theme, нет completionMessage, >15 полей.
Формат: 📋 нумерованный список, 🔴/🟡/🟢, 🔧 action блок.` : ''}

### ПРАВИЛА: formId="${context.formId}", "улучши"→REPLACE_FORM, "добавь"→ADD_FORM_FIELDS, "измени"→EDIT_FORM_FIELD, "удали"→REMOVE_FORM_FIELDS, НЕ используй CREATE_FORM когда есть formId.`;
    }

    // Website editor context
    if (context?.type === "website_editor") {
      const blocksJson = context.blocks && context.blocks.length > 0 ? JSON.stringify(context.blocks) : null;
      const pagesJson = context.pages && context.pages.length > 0 ? JSON.stringify(context.pages) : null;
      systemContent += `

---
## 🟢 АКТИВНЫЙ КОНТЕКСТ: РЕДАКТОР САЙТА

- **websiteId:** ${context.websiteId}
- **Название сайта:** "${context.websiteName}"
- **Блоков:** ${context.blockCount}
- **Страниц:** ${context.pageCount}
${pagesJson ? `\n### ТЕКУЩИЕ СТРАНИЦЫ САЙТА:\n\`\`\`json\n${pagesJson}\n\`\`\`\n` : blocksJson ? `\n### ТЕКУЩИЕ БЛОКИ САЙТА:\n\`\`\`json\n${blocksJson}\n\`\`\`\n` : ''}
### ЧТО ДЕЛАТЬ: ADD_WEBSITE_BLOCKS / EDIT_WEBSITE_BLOCK / REPLACE_WEBSITE / REMOVE_WEBSITE_BLOCKS / newBlockTypes для кастомных.
${wantsDiag ? `
### 🔍 ДИАГНОСТИКА САЙТА
Структура: нет navbar/footer/hero, <3 блоков, нет CTA. Контент: пустые title, features/pricing/testimonials без items. Навигация: href≠slug, страницы без navbar. Стили: нет globalStyles, плохой контраст, нет padding.
Формат: 📋 нумерованный список, 🔴/🟡/🟢, 🔧 action блок.` : ''}

### ПРАВИЛА: websiteId="${context.websiteId}", "улучши"→REPLACE_WEBSITE, "добавь"→ADD_WEBSITE_BLOCKS, "измени"→EDIT_WEBSITE_BLOCK, "удали"→REMOVE_WEBSITE_BLOCKS, НЕ создавай CREATE_WEBSITE когда есть websiteId.`;
    }

    // --- Multi-provider fallback chain ---
    type Provider = { name: string; url: string; model: string; key: string | undefined; isAnthropic?: boolean; extraHeaders?: Record<string, string>; maxTokens?: number };
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
        name: "openrouter-qwen",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "qwen/qwen3-next-80b-a3b-instruct:free",
        key: Deno.env.get("OPENROUTER_API_KEY"),
        extraHeaders: { "HTTP-Referer": "https://ejsoplwnkzropadjvoco.supabase.co", "X-Title": "FormBot Studio" },
      },
      {
        name: "openrouter-nemotron",
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
        name: "openrouter-stepfun",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "stepfun/step-3.5-flash:free",
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

    // --- URL detection & multi-page website scraping ---
    // Find URLs in the last user message, crawl main page + internal links
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
        const rootUrl = urlMatch[0].replace(/\/$/, "");
        let rootOrigin: string;
        try { rootOrigin = new URL(rootUrl).origin; } catch { rootOrigin = ""; }

        /** Fetch and parse one page, return structured data */
        async function scrapePage(pageUrl: string, prefetchedHtml?: string): Promise<{url: string; slug: string; title: string; nav: string; headings: string[]; colors: string; images: string[]; bodyText: string} | null> {
          try {
            let html: string;
            if (prefetchedHtml) {
              html = prefetchedHtml;
            } else {
              console.log(`Fetching page: ${pageUrl}`);
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000);
              try {
                const resp = await fetch(pageUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ru,en;q=0.9",
                  },
                  redirect: "follow",
                  signal: controller.signal,
                });
                clearTimeout(timeout);
                if (!resp.ok) return null;
                const contentType = resp.headers.get("content-type") || "";
                if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;
                html = await resp.text();
              } catch (fetchErr) {
                clearTimeout(timeout);
                console.error(`Timeout/fetch error for ${pageUrl}:`, fetchErr);
                return null;
              }
            }

            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : "";
            const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
            const navLinksRaw = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
            const nav = navLinksRaw.map(n => n.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" | ");
            const headings: string[] = [];
            const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
            let hm;
            while ((hm = hRegex.exec(html)) !== null) {
              const txt = hm[1].replace(/<[^>]+>/g, "").trim();
              if (txt) headings.push(txt);
            }
            let bodyHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
            const bodyMatch = bodyHtml.match(/<body[\s\S]*?<\/body>/i);
            const bodyText = (bodyMatch ? bodyMatch[0] : bodyHtml)
              .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
            const colorMatches = html.match(/(?:background-color|background|color)\s*:\s*[#\w(),.%\s]+/gi) || [];
            const colors = [...new Set(colorMatches.slice(0, 8))].join("; ");
            const imgMatches: string[] = [];
            const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*/gi;
            let im;
            while ((im = imgRegex.exec(html)) !== null && imgMatches.length < 3) {
              imgMatches.push(im[1]);
            }

            // Derive slug from URL path
            try {
              const u = new URL(pageUrl);
              const path = u.pathname.replace(/^\/|\/$/g, "").replace(/\.[a-z]+$/, "");
              return { url: pageUrl, slug: path || "home", title, nav, headings, colors, images: imgMatches, bodyText };
            } catch {
              return { url: pageUrl, slug: "home", title, nav, headings, colors, images: imgMatches, bodyText };
            }
          } catch (e) {
            console.error(`Failed to scrape ${pageUrl}:`, e);
            return null;
          }
        }

        /** Extract internal links from HTML */
        function extractInternalLinks(html: string, origin: string, baseUrl: string): string[] {
          const links: Set<string> = new Set();
          const linkRegex = /<a[^>]*href=["']([^"'#][^"']*?)["'][^>]*>/gi;
          let lm;
          while ((lm = linkRegex.exec(html)) !== null) {
            let href = lm[1].trim();
            // Skip non-page links
            if (/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp3|mp4|css|js|xml|json)$/i.test(href)) continue;
            if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
            // Resolve relative URLs
            try {
              const resolved = new URL(href, baseUrl).href.replace(/\/$/, "").split("#")[0].split("?")[0];
              if (resolved.startsWith(origin) && resolved !== baseUrl.replace(/\/$/, "")) {
                links.add(resolved);
              }
            } catch { /* skip invalid */ }
          }
          return [...links];
        }

        try {
          // Step 1: Fetch main page
          console.log(`Crawling website: ${rootUrl}`);
          const controller = new AbortController();
          const mainTimeout = setTimeout(() => controller.abort(), 10000);
          let mainResp: Response;
          try {
            mainResp = await fetch(rootUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ru,en;q=0.9",
              },
              redirect: "follow",
              signal: controller.signal,
            });
            clearTimeout(mainTimeout);
          } catch (fetchErr) {
            clearTimeout(mainTimeout);
            throw fetchErr;
          }

          if (mainResp.ok) {
            const mainHtml = await mainResp.text();
            const mainData = await scrapePage(rootUrl, mainHtml);

            // Step 2: Extract internal links from main page
            const internalLinks = extractInternalLinks(mainHtml, rootOrigin, rootUrl);
            console.log(`Found ${internalLinks.length} internal links`);

            // Step 3: Fetch up to 5 internal pages in parallel
            const MAX_PAGES = 5;
            const linksToFetch = internalLinks.slice(0, MAX_PAGES);
            const subPages = await Promise.all(linksToFetch.map(link => scrapePage(link)));
            const validPages = subPages.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof scrapePage>>>[];

            // Step 4: Build context for AI
            const allPages = [mainData, ...validPages].filter(Boolean) as NonNullable<typeof mainData>[];

            scrapedSiteContent = `

---
## 🌐 ПОЛНЫЙ ОБХОД САЙТА: ${rootUrl}
### Найдено страниц: ${allPages.length}
`;

            for (const page of allPages) {
              scrapedSiteContent += `
📄 **${page.slug}** — ${page.title}
Навигация: ${page.nav || "-"}
H1-H3: ${page.headings.slice(0, 5).join(" | ")}
Цвета: ${page.colors || "-"}
Текст: ${page.bodyText.slice(0, 800)}
`;
            }

            scrapedSiteContent += `
---
### ЗАДАЧА: СРАЗУ создай \`\`\`action CREATE_WEBSITE с pages массивом! НЕ описывай и НЕ объясняй — ТОЛЬКО action блок!
- Одна page на каждую страницу. Navbar одинаковый на всех (href="/slug").
- Каждая page: минимум 3-5 блоков (navbar + контент + footer). Бери тексты из контента выше.
- Для экономии: НЕ дублируй одинаковый navbar/footer — копируй id-шаблон.
- ВАЖНО: Весь JSON в ОДНОМ \`\`\`action блоке! Не разбивай на части!`;
          } else {
            console.error(`Failed to fetch main site: ${mainResp.status}`);
            scrapedSiteContent = `\n\n[Не удалось загрузить сайт ${rootUrl}: HTTP ${mainResp.status}. Попроси пользователя прислать скриншот.]`;
          }
        } catch (fetchErr) {
          console.error(`Site crawl error:`, fetchErr);
          scrapedSiteContent = `\n\n[Ошибка при загрузке сайта ${rootUrl}. Попроси пользователя прислать скриншот.]`;
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
          const anthropicSystem = systemContent + scrapedSiteContent;
          const response = await fetch(provider.url, {
            method: "POST",
            headers: {
              "x-api-key": provider.key,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: provider.model,
              max_tokens: provider.maxTokens ?? 16000,
              stream: true,
              system: anthropicSystem,
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
        const fullSystemContent = systemContent + scrapedSiteContent;
        const providerMessages = hasImages && !supportsVision
          ? [{ role: "system", content: fullSystemContent }, ...stripImages(messages)]
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
            max_tokens: provider.maxTokens ?? 16000,
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

        if (response.status === 413) {
          lastError = `Запрос слишком большой для ${provider.name}`;
          errors.push(`${provider.name}: 413 too large`);
          continue;
        }
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