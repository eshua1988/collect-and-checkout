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
- Если нет нужного типа — ИЗОБРЕТИ кастомный через newNodeTypes/newBlockTypes/newFieldTypes. Добавляй полный функционал!
- Если стандартный тип не покрывает нужный функционал — расширяй его доп. свойствами или создай улучшенную кастомную версию.
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
        async function scrapePage(pageUrl: string, prefetchedHtml?: string): Promise<{url: string; slug: string; title: string; metaDesc: string; nav: string; headings: string[]; colors: string; images: string[]; bodyText: string; ogData: string; sections: string[]} | null> {
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

            // --- Title ---
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 200) : "";

            // --- Meta description ---
            const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i)
              || html.match(/<meta[^>]*content=["']([^"']*?)["'][^>]*name=["']description["']/i);
            const metaDesc = metaDescMatch ? metaDescMatch[1].trim().slice(0, 300) : "";

            // --- Open Graph data ---
            const ogParts: string[] = [];
            const ogRegex = /<meta[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']*?)["']/gi;
            let ogM;
            while ((ogM = ogRegex.exec(html)) !== null && ogParts.length < 6) {
              ogParts.push(`${ogM[1]}=${ogM[2]}`);
            }
            const ogData = ogParts.join("; ");

            // --- Navigation ---
            const navLinksRaw = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
            const nav = navLinksRaw.map(n => n.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" | ").slice(0, 500);

            // --- Headings ---
            const headings: string[] = [];
            const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
            let hm;
            while ((hm = hRegex.exec(html)) !== null && headings.length < 20) {
              const txt = hm[1].replace(/<[^>]+>/g, "").trim();
              if (txt && txt.length > 1) headings.push(txt.slice(0, 150));
            }

            // --- Sections: extract text from semantic blocks ---
            const sections: string[] = [];
            const sectionRegex = /<(main|article|section|header|footer|aside)[^>]*>([\s\S]*?)<\/\1>/gi;
            let sm;
            while ((sm = sectionRegex.exec(html)) !== null && sections.length < 12) {
              const sectionHtml = sm[2]
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "");
              const sectionText = sectionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              if (sectionText.length > 30) {
                sections.push(`[${sm[1]}] ${sectionText.slice(0, 400)}`);
              }
            }

            // --- Body text extraction (improved for SPAs) ---
            let cleanHtml = html
              .replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<svg[\s\S]*?<\/svg>/gi, "")
              .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
              .replace(/<!--[\s\S]*?-->/g, "");

            // Try semantic containers first: main > article > body
            let contentHtml = "";
            const mainMatch = cleanHtml.match(/<main[\s\S]*?<\/main>/i);
            const articleMatch = cleanHtml.match(/<article[\s\S]*?<\/article>/i);
            if (mainMatch) {
              contentHtml = mainMatch[0];
            } else if (articleMatch) {
              contentHtml = articleMatch[0];
            } else {
              const bodyMatch = cleanHtml.match(/<body[\s\S]*?<\/body>/i);
              contentHtml = bodyMatch ? bodyMatch[0] : cleanHtml;
            }
            let bodyText = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

            // If body text is too short (likely SPA), try fallback sources
            if (bodyText.length < 100) {
              // Try __NEXT_DATA__ (Next.js SSR)
              const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
              if (nextDataMatch) {
                try {
                  const nd = JSON.parse(nextDataMatch[1]);
                  const ndText = JSON.stringify(nd.props?.pageProps || nd).replace(/[{}\[\]"]/g, " ").replace(/\s+/g, " ").trim();
                  if (ndText.length > bodyText.length) bodyText = ndText;
                } catch { /* skip */ }
              }
              // Try JSON-LD structured data
              const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
              for (const jm of jsonLdMatches) {
                const inner = jm.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
                try {
                  const ld = JSON.parse(inner);
                  const ldText = JSON.stringify(ld).replace(/[{}\[\]"]/g, " ").replace(/\s+/g, " ").trim();
                  bodyText += " " + ldText;
                } catch { /* skip */ }
              }
              // Try noscript content
              const noscriptMatches = html.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi) || [];
              for (const ns of noscriptMatches) {
                const nsText = ns.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                if (nsText.length > 20) bodyText += " " + nsText;
              }
            }

            // Remove common garbage patterns from SPA shells
            bodyText = bodyText
              .replace(/\b(webpack|__webpack|__NEXT|_next|chunk|module|exports|require|import)\b[^\s]*/gi, "")
              .replace(/[{}();=><\[\]]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 2500);

            // --- Colors ---
            const colorMatches = html.match(/(?:background-color|background|color)\s*:\s*#[0-9a-fA-F]{3,8}/gi) || [];
            const cssVarColors = html.match(/--[\w-]+:\s*#[0-9a-fA-F]{3,8}/gi) || [];
            const allColors = [...colorMatches, ...cssVarColors];
            const colors = [...new Set(allColors.slice(0, 10))].join("; ");

            // --- Images ---
            const imgMatches: string[] = [];
            const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*/gi;
            let im;
            while ((im = imgRegex.exec(html)) !== null && imgMatches.length < 5) {
              const src = im[1];
              if (!src.startsWith("data:") && !src.includes("pixel") && !src.includes("tracking")) {
                imgMatches.push(src);
              }
            }

            // Derive slug from URL path
            try {
              const u = new URL(pageUrl);
              const path = u.pathname.replace(/^\/|\/$/g, "").replace(/\.[a-z]+$/, "");
              return { url: pageUrl, slug: path || "home", title, metaDesc, nav, headings, colors, images: imgMatches, bodyText, ogData, sections };
            } catch {
              return { url: pageUrl, slug: "home", title, metaDesc, nav, headings, colors, images: imgMatches, bodyText, ogData, sections };
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

            // Step 3: Fetch up to 5 key internal pages
            const MAX_PAGES = 5;
            // Prioritize important-looking pages: about, sermons, contact, ministries
            const priorityWords = ["about", "contact", "sermons", "ministr", "services", "connect", "give", "news"];
            const scored = internalLinks.map(link => {
              const lc = link.toLowerCase();
              const score = priorityWords.reduce((s, w) => s + (lc.includes(w) ? 1 : 0), 0);
              return { link, score };
            });
            scored.sort((a, b) => b.score - a.score);
            const linksToFetch = scored.slice(0, MAX_PAGES).map(s => s.link);
            const subPages = await Promise.all(linksToFetch.map(link => scrapePage(link)));
            const validPages = subPages.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof scrapePage>>>[];

            // Step 4: Build compact context for AI
            const allPages = [mainData, ...validPages].filter(Boolean) as NonNullable<typeof mainData>[];
            const home = allPages[0];

            // Extract nav items from homepage
            const navItems = home?.nav?.split(/\s*\|\s*/).filter((s: string) => s.length > 1 && s.length < 40).slice(0, 7) || [];

            // Collect unique colors
            const allColorsSet = new Set<string>();
            for (const p of allPages) {
              if (p.colors) p.colors.split(";").map(c => c.trim()).filter(Boolean).forEach(c => allColorsSet.add(c));
            }
            const siteColors = [...allColorsSet].slice(0, 5);

            // ── MULTI-STEP PARALLEL GENERATION ─────────────────────
            // Instead of asking one model to generate all pages (too many tokens),
            // we generate each page in parallel using different providers, then assemble.
            const siteTitle = home?.title || "Website";
            const navLinksStr = navItems.slice(0, 6).join(" | ") || "Home | About | Contact";
            const colorsStr = siteColors.join("; ") || "#1e293b, #fff";
            const siteLang = /[а-яА-Я]/.test(home?.bodyText || "") ? "ru" : "en";
            const globalStylesHint = `globalStyles:{primaryColor:"${siteColors[0]?.replace(/.*:\s*/, '') || '#1e293b'}",backgroundColor:"#ffffff",textColor:"#1e293b",fontFamily:"Inter"}`;
            const navbarJson = `{type:"navbar",id:"nav1",content:{logo:"${siteTitle.replace(/"/g, '')}",links:[${allPages.map(p => `{label:"${(p.title || p.slug).replace(/"/g, '').slice(0, 25)}",href:"/${p.slug === 'home' ? '' : p.slug}"}`).join(",")}],bgColor:"${siteColors[0]?.replace(/.*:\s*/, '') || '#1e293b'}",textColor:"#fff"},styles:{padding:"12px 24px"}}`;

            // Build per-page specs
            const pageDataList = allPages.map(page => {
              const headingsStr = page.headings.slice(0, 5).join(" | ");
              const bodySnippet = page.bodyText.slice(0, 500).replace(/\n/g, " ");
              return { slug: page.slug, title: page.title, metaDesc: page.metaDesc || "", headings: headingsStr, body: bodySnippet };
            });

            // Mark that we're doing multi-step generation (will bypass normal flow)
            scrapedSiteContent = `__MULTISTEP_WEBSITE__`;

            // Store data for the multi-step handler below
            (req as any).__multiStepSite = {
              rootUrl,
              siteTitle,
              navLinksStr,
              colorsStr,
              siteLang,
              globalStylesHint,
              navbarJson,
              pageDataList,
              allPageSlugs: allPages.map(p => p.slug),
            };
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

    // ── SHARED: non-streaming callAI helper ──────────────────────────
    async function callAI(prompt: string, providerList: Provider[]): Promise<string | null> {
      for (const provider of providerList) {
        if (!provider.key) continue;
        try {
          if (provider.isAnthropic) {
            const resp = await fetch(provider.url, {
              method: "POST",
              headers: { "x-api-key": provider.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
              body: JSON.stringify({ model: provider.model, max_tokens: 8000, system: prompt, messages: [{ role: "user", content: "Generate" }] }),
            });
            if (!resp.ok) { console.error(`callAI ${provider.name}: ${resp.status}`); continue; }
            const data = await resp.json();
            return data.content?.[0]?.text || null;
          } else {
            const resp = await fetch(provider.url, {
              method: "POST",
              headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json", ...(provider.extraHeaders ?? {}) },
              body: JSON.stringify({ model: provider.model, messages: [{ role: "system", content: prompt }, { role: "user", content: "Generate" }], temperature: 0.7, max_tokens: 8000 }),
            });
            if (!resp.ok) { console.error(`callAI ${provider.name}: ${resp.status}`); continue; }
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || null;
          }
        } catch (e) { console.error(`callAI ${provider.name} error:`, e); continue; }
      }
      return null;
    }
    const availableProviders = providers.filter(p => p.key);

    // Helper: create SSE response from text
    function makeSSE(text: string): Response {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunkSize = 200;
          for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = JSON.stringify({ choices: [{ delta: { content: text.slice(i, i + chunkSize) } }] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Helper: extract JSON from AI response (strips markdown wrappers)
    function extractJSON(raw: string): string {
      let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const a = s.indexOf("["), o = s.indexOf("{");
      if (a >= 0 && (o < 0 || a < o)) { const e = s.lastIndexOf("]"); if (e > a) s = s.slice(a, e + 1); }
      else if (o >= 0) { const e = s.lastIndexOf("}"); if (e > o) s = s.slice(o, e + 1); }
      return s;
    }

    // ── MULTI-STEP WEBSITE GENERATION (parallel page-by-page) ─────────
    if (scrapedSiteContent === `__MULTISTEP_WEBSITE__`) {
      const msData = (req as any).__multiStepSite;
      console.log(`Multi-step website generation for ${msData.rootUrl}, ${msData.pageDataList.length} pages`);

      const shuffled = [...availableProviders].sort(() => Math.random() - 0.5);

      // Generate each page in parallel, each using a different sub-set of providers
      const pagePromises = msData.pageDataList.map((pd: any, idx: number) => {
        // Rotate providers: each page starts from a different position
        const rotated = [...shuffled.slice(idx % shuffled.length), ...shuffled.slice(0, idx % shuffled.length)];
        const isHome = pd.slug === "home";
        const pagePrompt = `Ты генератор JSON-блоков для конструктора сайтов. Верни ТОЛЬКО чистый JSON (без \`\`\` и без текста).
Сайт: "${msData.siteTitle}" (${msData.rootUrl})
Язык: ${msData.siteLang}
Цвета: ${msData.colorsStr}

Страница: "${pd.slug}" — ${pd.title}
${pd.metaDesc ? `Описание: ${pd.metaDesc}` : ""}
${pd.headings ? `Заголовки: ${pd.headings}` : ""}
${pd.body ? `Текст: ${pd.body}` : ""}

Стандартные типы блоков: navbar, hero, text, image, video, features, gallery, pricing, testimonials, team, faq, contact, countdown, button, footer, divider, html, stats, logos, cta, timeline, social, newsletter, banner, tabs, accordion, progress, comparison, marquee, quote, map, columns, spacer, form

## ВАЖНО: КАСТОМНЫЕ БЛОКИ
Если на странице есть элемент которого НЕТ в стандартных типах (поиск, слайдер, каталог, фильтр, калькулятор, чат-виджет, карусель, лента новостей, корзина, бронирование и т.д.) — СОЗДАЙ кастомный блок!
Также: если стандартный блок не покрывает весь функционал (напр. навбар с поиском, кнопка с таймером, форма с автозаполнением) — создай расширенную версию как кастомный тип.

Верни JSON объект:
{"blocks":[...массив блоков...], "newBlockTypes":[{"blockType":"searchBar","label":"Поиск","icon":"Search","description":"Полнотекстовый поиск по сайту"}]}

Генерируй 5-7 блоков:
1. navbar: ${msData.navbarJson}
${isHome ? `2. hero: {type:"hero",id:"...",content:{title:"(из H1)",subtitle:"(из описания)",ctaText:"...",ctaHref:"/about",bgColor:"...",textColor:"#fff",align:"center"},styles:{padding:"80px 24px"}}` : `2. hero с title="${pd.title}" и subtitle из описания`}
3-5. Контентные блоки — используй РЕАЛЬНЫЙ текст! Если функционал нестандартный → кастомный блок + newBlockTypes.
6. footer: {type:"footer",id:"...",content:{companyName:"${msData.siteTitle.replace(/"/g, '')}",copyright:"© 2026",links:[]},styles:{padding:"24px",bgColor:"#1e293b",textColor:"#94a3b8"}}

Кастомный блок: {type:"searchBar",id:"search1",content:{placeholder:"Поиск...",buttonText:"Найти",bgColor:"#f1f5f9"},styles:{padding:"16px 24px"}}
КАЖДЫЙ блок: {type,id(уникальный),content:{...все нужные свойства...},styles:{padding,bgColor,textColor}}
newBlockTypes — ТОЛЬКО для типов не из стандартного списка. Если все стандартные — пустой [].
Верни ТОЛЬКО: {"blocks":[...],"newBlockTypes":[...]}!`;

        return callAI(pagePrompt, rotated).then(result => ({ slug: pd.slug, title: pd.title, result }));
      });

      const pageResults = await Promise.all(pagePromises);
      console.log(`Pages generated: ${pageResults.filter(r => r.result).length}/${pageResults.length}`);

      // Parse results and assemble
      const assembledPages: any[] = [];
      const allNewBlockTypes: any[] = [];
      for (const pr of pageResults) {
        if (!pr.result) {
          // Fallback: create minimal page
          assembledPages.push({ slug: pr.slug, title: pr.title, blocks: [
            JSON.parse(msData.navbarJson.replace(/(\w+):/g, '"$1":').replace(/'/g, '"')),
            { type: "hero", id: `hero_${pr.slug}`, content: { title: pr.title, subtitle: "", bgColor: "#1e293b", textColor: "#fff", align: "center" }, styles: { padding: "60px 24px" } },
            { type: "footer", id: `footer_${pr.slug}`, content: { companyName: msData.siteTitle, copyright: "© 2026", links: [] }, styles: { padding: "24px", bgColor: "#1e293b", textColor: "#94a3b8" } },
          ]});
          continue;
        }

        try {
          // Extract JSON from response — supports {blocks:[], newBlockTypes:[]} or plain array
          let jsonStr = pr.result.trim();
          // Remove ```json ... ``` wrappers
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          // Try to find the JSON object or array
          const objStart = jsonStr.indexOf("{");
          const arrStart = jsonStr.indexOf("[");
          // Prefer object format {blocks:[], newBlockTypes:[]}
          if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
            const objEnd = jsonStr.lastIndexOf("}");
            if (objEnd > objStart) jsonStr = jsonStr.slice(objStart, objEnd + 1);
          } else if (arrStart >= 0) {
            const arrEnd = jsonStr.lastIndexOf("]");
            if (arrEnd > arrStart) jsonStr = jsonStr.slice(arrStart, arrEnd + 1);
          }
          const parsed = JSON.parse(jsonStr);
          // Support both {blocks:[], newBlockTypes:[]} and plain array
          const blocks = Array.isArray(parsed) ? parsed : (parsed.blocks || []);
          const pageCustomTypes = Array.isArray(parsed) ? [] : (parsed.newBlockTypes || []);
          if (Array.isArray(blocks) && blocks.length > 0) {
            const withIds = blocks.map((b: any, i: number) => ({ ...b, id: b.id || `${pr.slug}_b${i}` }));
            assembledPages.push({ slug: pr.slug, title: pr.title, blocks: withIds });
            // Collect custom block types
            for (const ct of pageCustomTypes) {
              if (ct.blockType && !allNewBlockTypes.find((t: any) => t.blockType === ct.blockType)) {
                allNewBlockTypes.push(ct);
              }
            }
          } else {
            throw new Error("Not an array");
          }
        } catch (parseErr) {
          console.error(`Failed to parse page ${pr.slug}:`, parseErr);
          assembledPages.push({ slug: pr.slug, title: pr.title, blocks: [
            { type: "hero", id: `hero_${pr.slug}`, content: { title: pr.title, subtitle: "", bgColor: "#1e293b", textColor: "#fff", align: "center" }, styles: { padding: "60px 24px" } },
            { type: "footer", id: `footer_${pr.slug}`, content: { companyName: msData.siteTitle, copyright: "© 2026", links: [] }, styles: { padding: "24px", bgColor: "#1e293b", textColor: "#94a3b8" } },
          ]});
        }
      }

      // Build final CREATE_WEBSITE action
      const totalBlocks = assembledPages.reduce((s, p) => s + p.blocks.length, 0);
      const actionJson = JSON.stringify({
        type: "CREATE_WEBSITE",
        data: {
          name: msData.siteTitle,
          ...(allNewBlockTypes.length > 0 ? { newBlockTypes: allNewBlockTypes } : {}),
          globalStyles: { primaryColor: msData.colorsStr?.split(";")[0]?.replace(/.*:\s*/, '').trim() || "#1e293b", backgroundColor: "#ffffff", textColor: "#1e293b", fontFamily: "Inter", borderRadius: "8px" },
          pages: assembledPages,
        }
      });

      // Stream the assembled result as SSE
      const customNote = allNewBlockTypes.length > 0 ? `\n🧩 Создано ${allNewBlockTypes.length} кастомных блоков: ${allNewBlockTypes.map((t: any) => t.label || t.blockType).join(", ")}` : "";
      const responseText = `Создаю сайт "${msData.siteTitle}" по образцу ${msData.rootUrl}...\n\n✅ Сгенерировано ${assembledPages.length} страниц, ${totalBlocks} блоков (параллельная генерация).${customNote}\n\n\`\`\`action\n${actionJson}\n\`\`\``;
      return makeSSE(responseText);
    }

    // ── DETECT BOT/FORM CREATION INTENT ───────────────────────────────
    const isBotCreation = !context?.botId && !context?.formId && !context?.websiteId
      && /созда|сделай|построй|разработай|генерир|напиши|придумай/i.test(lastMsgText)
      && /бот[аеу]?\b|telegram|телеграм/i.test(lastMsgText)
      && lastMsgText.length > 30;
    const isFormCreation = !context?.botId && !context?.formId && !context?.websiteId
      && /созда|сделай|построй|разработай|генерир|напиши|придумай/i.test(lastMsgText)
      && /форм[аеу]?\b|анкет|опрос|регистрац/i.test(lastMsgText)
      && lastMsgText.length > 30;

    // ── MULTI-STEP BOT GENERATION (plan → parallel nodes → assemble) ──
    if (isBotCreation) {
      console.log(`Multi-step bot generation, msg length: ${lastMsgText.length}`);

      // Step 1: Plan — get bot structure (node list + edges)
      const planPrompt = `Ты архитектор Telegram-ботов. Пользователь просит: "${lastMsgText.slice(0, 600)}"

Верни ТОЛЬКО JSON (без \`\`\` и текста):
{
  "name": "Название бота",
  "segments": [
    {"id": "seg1", "label": "Описание сегмента", "nodeSpecs": [
      {"id": "start_1", "type": "start", "briefData": "начало"},
      {"id": "msg_1", "type": "message", "briefData": "приветствие с кнопками Меню/Помощь"}
    ]},
    {"id": "seg2", "label": "Описание сегмента 2", "nodeSpecs": [
      {"id": "input_1", "type": "userInput", "briefData": "запрос имени"},
      {"id": "cond_1", "type": "condition", "briefData": "проверка email"}
    ]}
  ],
  "edges": [{"source":"start_1","target":"msg_1"},{"source":"msg_1","target":"input_1","sourceHandle":"0"}]
}

Стандартные типы: start, message, userInput, condition, action, aiChat, delay, variable, media, randomizer, jump, translate, langDetect, userLangPref, socialShare

## ВАЖНО: КАСТОМНЫЕ УЗЛЫ
Если пользователь просит функционал, которого НЕТ в стандартных типах (расписание, платежи, каталог, рассылка, quiz, голосование, корзина, бронирование, CRM, напоминания, аналитика, опрос, генератор, парсер, модерация и т.д.) — ОБЯЗАТЕЛЬНО создай кастомный узел!
Также: если стандартный узел не покрывает нужный функционал (напр. message без inline URL-кнопок, condition без regex) — создай расширенный как кастомный.

ПРАВИЛА:
- Минимум 8-12 узлов, разбитых на 2-4 сегмента по 2-4 узла
- condition → ОБЯЗАТЕЛЬНО 2 ребра (yes/no). message+buttons → sourceHandle "0","1",...
- edges >= nodes-1. start ОБЯЗАТЕЛЬНО связан
- aiChat: ОБЯЗАТЕЛЕН userInput перед ним
- Кастомный: {id, type:"camelCaseName", briefData:"описание", isCustom:true, customDef:{nodeType:"camelCaseName",label:"Название",icon:"IconName",color:"bg-green-500/10 text-green-400 border-green-500/30",description:"Что делает"}}
- ID формат: type_N (start_1, msg_1, input_1, cond_1, action_1...)
- МИНИМУМ 1-2 кастомных узла для специфичного функционала!
Верни ТОЛЬКО JSON!`;

      const shuffled = [...availableProviders].sort(() => Math.random() - 0.5);
      const planResult = await callAI(planPrompt, shuffled);

      if (planResult) {
        try {
          const plan = JSON.parse(extractJSON(planResult));
          console.log(`Bot plan: ${plan.name}, ${plan.segments?.length} segments, ${plan.edges?.length} edges`);

          // Step 2: Generate each segment's node data in parallel
          const segPromises = (plan.segments || []).map((seg: any, idx: number) => {
            const rotated = [...shuffled.slice((idx + 1) % shuffled.length), ...shuffled.slice(0, (idx + 1) % shuffled.length)];
            const customDefs = seg.nodeSpecs?.filter((n: any) => n.isCustom).map((n: any) => n.customDef) || [];

            const segPrompt = `Ты генератор данных для узлов Telegram-бота "${plan.name}". Верни ТОЛЬКО JSON массив узлов (без \`\`\`).

Бот: "${plan.name}". Запрос пользователя: "${lastMsgText.slice(0, 300)}"

Сгенерируй полные данные для этих узлов:
${seg.nodeSpecs.map((n: any) => `- ${n.id} (${n.type}${n.isCustom ? ' КАСТОМНЫЙ' : ''}): ${n.briefData}`).join("\n")}

Формат КАЖДОГО узла:
{"id":"${seg.nodeSpecs[0]?.id}","type":"тип","position":{"x":0,"y":0},"data":{...полные данные...}}

Типы данных:
- start: data:{}
- message: data:{text:"текст (Markdown)",buttons:[{id:"b1",label:"Кнопка",callbackData:"cb"}],parseMode:"Markdown"}
- userInput: data:{text:"вопрос",inputType:"text|number|email|phone|date|choice",variableName:"var_name",choices:[]}
- condition: data:{variable:"var",operator:"equals|notEquals|contains|greater|less|isEmpty",value:"значение"}
- action: data:{actionType:"webhook|sendMessage|email",webhookUrl:"",message:"{{var}}"}
- aiChat: data:{aiPrompt:"Инструкция для ИИ",aiModel:"google/gemini-3-flash-preview",aiResponseVar:"ai_response",aiTemperature:0.7}
- delay: data:{delaySeconds:3,delayMessage:"Подождите..."}
- variable: data:{varOperation:"set|increment|append",varName:"var",varValue:"value"}
- media: data:{mediaType:"photo|video",mediaUrl:"url",caption:"текст"}
- randomizer: data:{randWeights:[1,1]}

## КАСТОМНЫЕ УЗЛЫ (executionSteps ОБЯЗАТЕЛЬНЫ!):
Если узел помечен КАСТОМНЫЙ — создай ПОЛНУЮ бизнес-логику через executionSteps:
[{action:"sendMessage",text:"..."}, {action:"setVariable",variable:"x",value:"y"}, {action:"fetchUrl",url:"...",method:"POST",body:"...",resultVar:"r",resultPath:"data.id"}, {action:"condition",variable:"x",operator:"equals",value:"y",thenSteps:[...],elseSteps:[...]}, {action:"waitInput",prompt:"...",variableName:"v"}]
Каждый кастомный узел: data с КОНКРЕТНЫМИ настройками + executionSteps с ПОЛНОЙ логикой (не заглушки!).
Расширение стандартных: добавляй доп. свойства (напр. message → urlButtons, condition → regex).
${customDefs.length > 0 ? `Кастомные узлы в этом сегменте: ${customDefs.map((d: any) => d.nodeType).join(", ")}` : ""}

Используй parseMode:"Markdown" для message. Текст на русском. Кнопки с callbackData.
Верни ТОЛЬКО JSON массив: [{...},{...}]`;

            return callAI(segPrompt, rotated).then(result => ({ segId: seg.id, result, specs: seg.nodeSpecs }));
          });

          const segResults = await Promise.all(segPromises);
          console.log(`Bot segments generated: ${segResults.filter(r => r.result).length}/${segResults.length}`);

          // Step 3: Assemble
          const allNodes: any[] = [];
          const newNodeTypes: any[] = [];
          let yOffset = 0;

          for (const sr of segResults) {
            let segNodes: any[] = [];
            if (sr.result) {
              try {
                segNodes = JSON.parse(extractJSON(sr.result));
                if (!Array.isArray(segNodes)) segNodes = [];
              } catch { segNodes = []; }
            }

            // Fallback: create minimal nodes from specs
            if (segNodes.length === 0 && sr.specs) {
              for (const spec of sr.specs) {
                segNodes.push({
                  id: spec.id, type: spec.type,
                  position: { x: 0, y: 0 },
                  data: spec.type === "start" ? {} :
                    spec.type === "message" ? { text: spec.briefData || "Сообщение", parseMode: "Markdown" } :
                    spec.type === "userInput" ? { text: spec.briefData || "Введите:", inputType: "text", variableName: `var_${spec.id}` } :
                    spec.type === "condition" ? { variable: "user_message", operator: "contains", value: "" } :
                    { text: spec.briefData || "" }
                });
              }
            }

            // Assign positions
            for (let i = 0; i < segNodes.length; i++) {
              segNodes[i].position = { x: (i % 2) * 300, y: yOffset + Math.floor(i / 2) * 180 };
              // Collect custom node types
              const spec = sr.specs?.find((s: any) => s.id === segNodes[i].id);
              if (spec?.isCustom && spec.customDef) {
                if (!newNodeTypes.find((t: any) => t.nodeType === spec.customDef.nodeType)) {
                  newNodeTypes.push(spec.customDef);
                }
              }
            }
            yOffset += Math.ceil(segNodes.length / 2) * 180 + 100;
            allNodes.push(...segNodes);
          }

          // Build action
          const actionJson = JSON.stringify({
            type: "CREATE_BOT",
            data: {
              name: plan.name || "Новый бот",
              ...(newNodeTypes.length > 0 ? { newNodeTypes } : {}),
              nodes: allNodes,
              edges: (plan.edges || []).map((e: any, i: number) => ({
                id: `e${i + 1}`, source: e.source, target: e.target,
                ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
              })),
            }
          });

          const totalNodes = allNodes.length;
          const totalEdges = plan.edges?.length || 0;
          const customBotNote = newNodeTypes.length > 0 ? `\n🧩 Создано ${newNodeTypes.length} кастомных узлов: ${newNodeTypes.map((t: any) => t.label || t.nodeType).join(", ")}` : "";
          return makeSSE(`Создаю бота "${plan.name}"...\n\n✅ Сгенерировано ${totalNodes} узлов, ${totalEdges} связей (параллельная генерация, ${segResults.length} сегментов).${customBotNote}\n\n\`\`\`action\n${actionJson}\n\`\`\``);
        } catch (planErr) {
          console.error("Bot plan parse error:", planErr);
          // Fall through to normal generation
        }
      }
    }

    // ── MULTI-STEP FORM GENERATION (plan → parallel fields → assemble) ──
    if (isFormCreation) {
      console.log(`Multi-step form generation, msg length: ${lastMsgText.length}`);

      const planPrompt = `Ты архитектор форм. Пользователь просит: "${lastMsgText.slice(0, 600)}"

Верни ТОЛЬКО JSON (без \`\`\` и текста):
{
  "title": "Название формы",
  "completionMessage": "Спасибо! Ваша заявка принята.",
  "theme": {"primaryColor":"#2563eb","backgroundColor":"#f8fafc","textColor":"#1e293b","headerColor":"#2563eb","headerTextColor":"#ffffff","accentColor":"#3b82f6","fontFamily":"Inter","borderRadius":"12px","buttonColor":"#2563eb","buttonTextColor":"#ffffff","fieldBackground":"#ffffff","fieldBorder":"#e2e8f0","layout":"card"},
  "fieldGroups": [
    {"label": "Группа 1", "fieldSpecs": [
      {"type": "text", "label": "Имя", "brief": "текстовое поле ФИО"},
      {"type": "email", "label": "Email", "brief": "email обязательный"}
    ]},
    {"label": "Группа 2", "fieldSpecs": [
      {"type": "select", "label": "Категория", "brief": "выбор из 4+ вариантов"},
      {"type": "textarea", "label": "Комментарий", "brief": "многострочный текст"}
    ]}
  ]
}

Стандартные типы: text, textarea, number, email, phone, select, radio, checkbox, image, dynamicNumber, payment

## ВАЖНО: КАСТОМНЫЕ ПОЛЯ
Если нужен функционал которого НЕТ в стандартных (рейтинг/звёзды, слайдер, загрузка файлов, подпись, цвет, дата+время, адрес с картой, диапазон цен, автозаполнение, таблица, матрица и т.д.) — СОЗДАЙ кастомное поле!
Также: если стандартное поле не покрывает всё (напр. select с поиском, phone с маской, number с ползунком) — расширь как кастомный тип.

ПРАВИЛА:
- Минимум 6-10 полей, разбитых на 2-3 группы
- theme с красивыми цветами, подходящими под тему формы
- Кастомный: {"type":"camelCaseName","label":"...","brief":"...",isCustom:true,"customDef":{"fieldType":"camelCaseName","label":"Название","icon":"IconName","description":"Что делает"}}
- МИНИМУМ 1-2 кастомных поля для специфичного функционала!
Верни ТОЛЬКО JSON!`;

      const shuffled = [...availableProviders].sort(() => Math.random() - 0.5);
      const planResult = await callAI(planPrompt, shuffled);

      if (planResult) {
        try {
          const plan = JSON.parse(extractJSON(planResult));
          console.log(`Form plan: ${plan.title}, ${plan.fieldGroups?.length} groups`);

          // Step 2: Generate each group's field data in parallel
          const groupPromises = (plan.fieldGroups || []).map((grp: any, idx: number) => {
            const rotated = [...shuffled.slice((idx + 1) % shuffled.length), ...shuffled.slice(0, (idx + 1) % shuffled.length)];
            const customDefs = grp.fieldSpecs?.filter((f: any) => f.isCustom).map((f: any) => f.customDef) || [];

            const grpPrompt = `Ты генератор полей для формы "${plan.title}". Верни ТОЛЬКО JSON массив полей (без \`\`\`).

Форма: "${plan.title}". Запрос: "${lastMsgText.slice(0, 300)}"

Сгенерируй полные данные для этих полей:
${grp.fieldSpecs.map((f: any) => `- ${f.type}${f.isCustom ? ' КАСТОМНЫЙ' : ''}: ${f.label} (${f.brief})`).join("\n")}

Формат КАЖДОГО поля:
{"id":"field_N","type":"тип","label":"Метка","placeholder":"Подсказка","required":true/false}

Для select/radio ОБЯЗАТЕЛЬНО: "options":[{"id":"opt1","label":"Вариант 1","value":"val1"},...]
Для payment: "paymentFields":[{"id":"p1","type":"select","label":"Тариф","options":[...],"multiplier":1}],"baseAmount":1000
Для dynamicNumber: "dynamicFieldsCount":3

## КАСТОМНЫЕ ПОЛЯ:
Если поле помечено КАСТОМНЫЙ — создай ПОЛНЫЕ свойства:
- rating/stars: {min,max,step,icon:"star",allowHalf:true,defaultValue}
- slider/range: {min,max,step,unit:"₽",showValue:true,rangeMode:false}
- fileUpload: {accept:".pdf,.doc",maxSize:"10MB",multiple:true,dropzone:true}
- signature: {width:400,height:200,penColor:"#000",bgColor:"#fff"}
- colorPicker: {format:"hex",defaultValue:"#000",showInput:true}
- dateTime: {minDate,maxDate,showTime:true,format:"DD.MM.YYYY HH:mm"}
- address: {showMap:true,autocomplete:true,components:["street","city","zip"]}
Расширение стандартных: select→{searchable:true,maxItems}, phone→{mask:"+7(999)999-99-99",countryCode:"RU"}, number→{slider:true,min,max,step}
${customDefs.length ? `Кастомные в этой группе: ${customDefs.map((d: any) => d.fieldType).join(", ")}` : ""}

Текст на русском. Placeholder понятные. required:true для важных полей.
Верни ТОЛЬКО JSON массив: [{...},{...}]`;

            return callAI(grpPrompt, rotated).then(result => ({ grpId: grp.label, result, specs: grp.fieldSpecs }));
          });

          const grpResults = await Promise.all(groupPromises);
          console.log(`Form groups generated: ${grpResults.filter(r => r.result).length}/${grpResults.length}`);

          // Step 3: Assemble
          const allFields: any[] = [];
          const newFieldTypes: any[] = [];
          let fieldIdx = 1;

          for (const gr of grpResults) {
            let grpFields: any[] = [];
            if (gr.result) {
              try {
                grpFields = JSON.parse(extractJSON(gr.result));
                if (!Array.isArray(grpFields)) grpFields = [];
              } catch { grpFields = []; }
            }

            // Fallback: minimal fields from specs
            if (grpFields.length === 0 && gr.specs) {
              for (const spec of gr.specs) {
                grpFields.push({
                  id: `field_${fieldIdx}`, type: spec.type, label: spec.label,
                  placeholder: `Введите ${spec.label.toLowerCase()}`, required: true,
                  ...(["select", "radio"].includes(spec.type) ? { options: [{ id: "opt1", label: "Вариант 1", value: "1" }, { id: "opt2", label: "Вариант 2", value: "2" }] } : {}),
                });
                fieldIdx++;
              }
            }

            // Ensure unique IDs
            for (const f of grpFields) {
              f.id = f.id || `field_${fieldIdx}`;
              fieldIdx++;
              // Collect custom field types
              const spec = gr.specs?.find((s: any) => s.label === f.label);
              if (spec?.isCustom && spec.customDef) {
                if (!newFieldTypes.find((t: any) => t.fieldType === spec.customDef.fieldType)) {
                  newFieldTypes.push(spec.customDef);
                }
              }
            }
            allFields.push(...grpFields);
          }

          const actionJson = JSON.stringify({
            type: "CREATE_FORM",
            data: {
              title: plan.title || "Новая форма",
              ...(newFieldTypes.length > 0 ? { newFieldTypes } : {}),
              theme: plan.theme || { primaryColor: "#2563eb", backgroundColor: "#f8fafc", textColor: "#1e293b" },
              fields: allFields,
              completionMessage: plan.completionMessage || "Спасибо! Форма отправлена.",
            }
          });

          const customFormNote = newFieldTypes.length > 0 ? `\n🧩 Создано ${newFieldTypes.length} кастомных полей: ${newFieldTypes.map((t: any) => t.label || t.fieldType).join(", ")}` : "";
          return makeSSE(`Создаю форму "${plan.title}"...\n\n✅ Сгенерировано ${allFields.length} полей (параллельная генерация, ${grpResults.length} групп).${customFormNote}\n\n\`\`\`action\n${actionJson}\n\`\`\``);
        } catch (planErr) {
          console.error("Form plan parse error:", planErr);
          // Fall through to normal generation
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

    // For website creation (scraping), prefer providers with high output limits
    const isWebsiteGen = scrapedSiteContent.length > 100;
    if (isWebsiteGen) {
      const HIGH_OUTPUT_PROVIDERS = new Set(["gemini", "claude-haiku", "claude-sonnet", "openrouter-qwen", "openrouter-nemotron"]);
      const userChoice = (preferredProvider && preferredProvider !== "auto")
        ? orderedProviders.find(p => p.name === preferredProvider) : null;
      const highOutput: Provider[] = [];
      const rest: Provider[] = [];
      for (const p of orderedProviders) {
        if (p === userChoice) continue;
        if (HIGH_OUTPUT_PROVIDERS.has(p.name)) highOutput.push(p);
        else rest.push(p);
      }
      orderedProviders = [...(userChoice ? [userChoice] : []), ...highOutput, ...rest];
    }

    // Determine max_tokens based on task complexity
    const defaultMaxTokens = isWebsiteGen ? 32000 : 16000;

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
              max_tokens: provider.maxTokens ?? defaultMaxTokens,
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
            max_tokens: provider.maxTokens ?? defaultMaxTokens,
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