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
- Фото сайта → СРАЗУ CREATE_WEBSITE. Ссылка/URL → сервер уже скачал страницу — используй секцию "СТРАНИЦА ДЛЯ КЛОНИРОВАНИЯ" и СРАЗУ создай CREATE_WEBSITE воспроизводя ВСЕ секции оригинала.
- Если нет нужного типа — ИЗОБРЕТИ кастомный через newNodeTypes/newBlockTypes/newFieldTypes. Добавляй полный функционал!
- Если стандартный тип не покрывает нужный функционал — расширяй его доп. свойствами или создай улучшенную кастомную версию.
- После создания — ВСЕГДА предлагай улучшения.
- Изображение от пользователя → анализируй и предлагай реализацию.

## КОМАНДЫ (всегда в \`\`\`action блоке):
**Боты:** CREATE_BOT {name,newNodeTypes[],nodes[],edges[]}, ADD_BOT_NODES {botId,description,newNodeTypes[],nodes[],edges[]}, REPLACE_BOT {botId,name,newNodeTypes[],nodes[],edges[]}, EDIT_BOT_NODE {botId,nodeId,newData{}}, REMOVE_BOT_NODES {botId,nodeIds[]}
**Формы:** CREATE_FORM {title,newFieldTypes[],theme{},fields[],completionMessage}, REPLACE_FORM {formId,title,newFieldTypes[],fields[]}, EDIT_FORM_FIELD {formId,fieldId,newData{}}, REMOVE_FORM_FIELDS {formId,fieldIds[]}
**Сайты:** CREATE_WEBSITE {name,newBlockTypes[],globalStyles{},pages:[{slug,title,blocks[]}]}, ADD_WEBSITE_BLOCKS {websiteId?,pageSlug?,newBlockTypes[],blocks[]} (многостраничный: pages:[{slug,blocks[]}]), REPLACE_WEBSITE {websiteId,name,newBlockTypes[],pages[]}, EDIT_WEBSITE_BLOCK {websiteId,blockId,newContent{},pageSlug}, REMOVE_WEBSITE_BLOCKS {websiteId,blockIds[]}
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
1. Отвечай на русском 2. Min 12-15 узлов для бота, min 10-15 блоков для сайта, min 8-12 полей для формы
3. ВСЕГДА \`\`\`action блок 4. 1-2 предложения → action
5. ВСЕГДА стили: globalStyles+bgColor/textColor, theme, parseMode:"Markdown"
6. Одностраничный: blocks:[]. Многостраничный: pages:[{slug,title,blocks}]. Главная slug="home".
7. ADD_WEBSITE_BLOCKS: для многостраничного сайта используй pages:[{slug:"home",blocks:[...]}] ИЛИ параметр pageSlug:"home". Никогда не используй просто blocks:[] если сайт многостраничный.`;

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

## БЛОКИ САЙТА (ТОЧНЫЕ имена свойств — используй ТОЛЬКО эти!):
- **navbar**: {logo,links:[{label,href,mode?:"navigate"|"megamenu",sections?:[{title,links:[{label,href}]}],description?}],ctaText,ctaHref,bgColor,textColor,sticky?:boolean}
- **hero**: {title,subtitle,ctaText,ctaHref,bgColor,textColor,align:"center"|"left",heroImage?,overlay?:0-1,searchFields?:[{label,placeholder,type}],searchButtonText?}
- **text**: {title,body,align}
- **image**: {src,caption}
- **video**: {url,title}
- **features**: {title,columns?:2|3|4,items:[{icon?,image?,title,desc}]}
- **gallery**: {title,images:[{url,caption}]}
- **pricing**: {title,plans:[{name,price,features[],highlighted}]}
- **testimonials**: {title,items:[{name,text,rating,avatar?,role?}]}
- **team**: {title,members:[{avatar,name,role}]}
- **faq**: {title,items:[{q,a}]}
- **contact**: {title,subtitle?,email,phone,address,hours?,buttonText?,buttonHref?,image?}
- **countdown**: {title,targetDate}
- **button**: {text,href,bgColor,align}
- **footer**: {companyName?,description?,copyright,links:[{label,href}],socialLinks?:[{platform,url,icon}],paymentIcons?:[{name,image?}]}
- **divider**: {}
- **html**: {code}
- **stats**: {title,items:[{value,label}],bgColor,textColor}
- **logos**: {title,items:[{name,logo}],grayscale}
- **cta**: {title,subtitle,ctaText,ctaHref,bgColor,textColor}
- **timeline**: {title,items:[{icon,title,desc}]}
- **social**: {title,links:[{platform,url,icon}]}
- **newsletter**: {title,subtitle,buttonText,bgColor}
- **banner**: {text,bgColor,textColor,closable}
- **tabs**: {tabs:[{title,content}]}
- **accordion**: {title,items:[{title,content}]}
- **progress**: {title,items:[{label,value,color}]}
- **comparison**: {title,columns[],rows:[{feature,values[]}]}
- **marquee**: {text,speed,bgColor,textColor}
- **quote**: {text,author,bgColor}
- **map**: {address,embedUrl,height}
- **columns**: {columns:[{title,text}]}
- **spacer**: {height}
- **form**: {title,fields:[{label,type}],buttonText,bgColor}
- **cards**: {title,subtitle?,columns?:3,items:[{image?,title,desc,link?,badge?}]}
- **carousel**: {title,subtitle?,iconImage?,linkText?,linkHref?,items:[{image?,title,desc,link?}]}
- **product**: {title,price,priceNote?,badge?,images:[url],specs?:[{label,value}],ctaText,ctaHref}
- **linkList**: {title,columns?:3,groups:[{heading,links:[{label,href}]}]}
- **searchBar**: {title?,bgColor?,fields:[{label,placeholder,type}],buttonText}
- **imageText**: {title,body,image,ctaText?,ctaHref?,imagePosition?:"left"|"right",bgColor?}
- **steps**: {title,subtitle?,items:[{number,title,desc,icon?}],layout?:"horizontal"|"vertical"}
- **checklist**: {title,subtitle?,items:[{text,checked}],columns?:1,bgColor?}
- **iconGrid**: {title,subtitle?,columns?:3,items:[{icon,title,desc}]}
- **blogGrid**: {title,subtitle?,columns?:3,posts:[{image?,category,title,excerpt,date,link,author?,readTime?}]}
- **rating**: {title,score,maxScore,totalReviews,platform?,showStars,breakdown?:[{stars,count}],bgColor?}
- **embed**: {title?,url,type?:"youtube"|"vimeo"|"iframe",height?,autoplay?}
- **table**: {title?,headers:[str],rows:[[cell]],striped?,bordered?}
- **beforeAfter**: {title?,beforeImage,afterImage,beforeLabel?,afterLabel?,position?:50}
- **cookieBanner**: {text,acceptText,declineText,linkText?,linkHref?,bgColor?,textColor?,position?:"top"|"bottom"}
- **popup**: {title,subtitle?,buttonText,buttonHref?,closeText?,image?,bgColor?,textColor?,delay?:3,showOnce?}
-- ── VOUS-INSPIRED BLOCKS (dark/cinematic/church style) ─────────────────────────
- **parallax**: {title,subtitle?,eyebrow?,ctaText?,ctaHref?,cta2Text?,cta2Href?,bgImage?,bgColor?,overlay?:0-1,minHeight?:"70vh",uppercase?:bool,align?:"center"|"left"}  ← Full-screen parallax bg section
- **videoBg**: {title,subtitle?,eyebrow?,ctaText?,ctaHref?,cta2Text?,cta2Href?,videoUrl?(YouTube),bgImage?,bgColor?,overlay?:0-1,minHeight?:"100vh",uppercase?:bool}  ← Full-screen YouTube video background hero
- **eventCards**: {title,subtitle?,linkText?,linkHref?,columns?:3,bgColor?,textColor?,items:[{category,title,desc?,image?,href?,linkText?}]}  ← Dark event grid with category badges (EVENT/COLLECTION/COMMUNITY)
- **locations**: {title,subtitle?,bgColor?,textColor?,locations:[{name,times,address,href?,mapHref?,image?}]}  ← Multi-location cards with service times and map links
- **values**: {title,subtitle?,bgColor?,textColor?,divider?:"▽",showDragHint?:bool,items:[{title,desc}]}  ← Horizontal drag carousel of numbered values (01, 02...) with optional ▽ divider in title
- **splitHero**: {title,body?,eyebrow?,ctaText?,ctaHref?,cta2Text?,cta2Href?,image?,bgColor?,contentBg?,textColor?,minHeight?,uppercase?,imageFlex?,contentFlex?}  ← Split screen: image left/right + content
- **bigQuote**: {text,author?,role?,eyebrow?,ctaText?,ctaHref?,bgColor?,textColor?,fontSize?,fontWeight?,italic?,tight?,align?,openQuote?}  ← Large oversized quote / mission statement
- **announcement**: {text,subtext?,emoji?,ctaText?,ctaHref?,bgColor?,textColor?,closable?:bool}  ← Slim promotional announcement bar (top/bottom banner)

КРИТИЧНО: footer использует "copyright" (НЕ "text"), "companyName", "socialLinks" (НЕ "social"). contact использует "buttonText" (НЕ кнопку action).

### globalStyles: {primaryColor,secondaryColor,accentColor,fontFamily("Inter"|"Roboto"|"Open Sans"|"Lato"|"Montserrat"|"Poppins"|"Nunito"|"Raleway"|"Ubuntu"|"PT Sans"|"Manrope"|"DM Sans"|"Plus Jakarta Sans"|"Outfit"|"Space Grotesk"|"Barlow"|"IBM Plex Sans"|"Nunito Sans"|"Figtree"|"Lexend"|"Josefin Sans"|"Karla"|"Quicksand"|"Playfair Display"|"Merriweather"|"PT Serif"|"Lora"|"EB Garamond"|"Cormorant"|"Spectral"|"Libre Baskerville"|"Crimson Pro"|"Bitter"|"Bodoni Moda"|"Oswald"|"Russo One"|"Bebas Neue"|"Comfortaa"|"Anton"|"Teko"|"League Spartan"|"Roboto Flex"|"Fraunces"|"Literata"|"Dancing Script"|"Caveat"|"Great Vibes"|"Sacramento"|"Source Code Pro"|"JetBrains Mono"|"Fira Code"|"IBM Plex Mono"),headingFont,backgroundColor,textColor,borderRadius,maxWidth}
### block.styles: {padding,margin,fontSize,fontWeight("100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900"),fontFamily,boxShadow,border,opacity,backgroundImage,backgroundSize,maxWidth,minHeight,textTransform,letterSpacing,lineHeight,wordSpacing,fontVariant("small-caps"|"normal"),borderRadius,textShadow,WebkitTextStroke("1px #000"|"2px #fff"|...),animateIn("fadeUp"|"fadeIn"|"fadeLeft"|"fadeRight"|"zoomIn"|"flipIn"),animateDelay("100"|"200"|"300"|"400"|"500")}

ПРАВИЛА: navbar→hero→контент→footer, min 10-15 блоков (как на реальном сайте — длинная страница!), ВСЕГДА globalStyles+styles(padding,градиенты,тени), контент на языке запроса.
ADD_WEBSITE_BLOCKS к существующему сайту: если сайт МНОГОСТРАНИЧНЫЙ — ОБЯЗАТЕЛЬНО используй pages:[{slug:"home",blocks:[...]}] вместо blocks:[]. Это гарантирует попадание блоков на нужную страницу.
ПАЛИТРЫ: Корпоративный(#2563eb/#f8fafc), Минимализм(#18181b/#fff), Фиолетовый(#7c3aed/#faf5ff), Тёмный(#a855f7/#0f0f23), Зелёный(#16a34a/#f0fdf4), Оранжевый(#ea580c/#fff7ed), Океан(#0891b2/#ecfeff), Цинематик(#0a0a0a/#f59e0b)
ШРИФТЫ: Playfair Display+Inter, Montserrat+Open Sans, Poppins+Roboto, Merriweather+Lato, DM Sans+Lora, Outfit+Spectral, League Spartan+Libre Baskerville, Space Grotesk+EB Garamond, Josefin Sans+Crimson Pro, Fraunces+Manrope, Bebas Neue+Lato, Oswald+Open Sans
ЦЕРКОВЬ/СООБЩЕСТВО: используй videoBg(или parallax)+announcement+bigQuote+locations+values+eventCards+splitHero для сайтов церквей/организаций
АНИМАЦИИ: добавляй animateIn("fadeUp") к блокам контента для эффекта скролла, используй animateDelay для каскадных задержек
МНОГОСТРАНИЧНЫЙ: pages:[{slug,title,blocks}], Navbar одинаковый на всех: href="/slug", Главная slug="home"
ФОТО: структура→цвета→воссоздай КАЖДУЮ секцию отдельным блоком→bgColor/textColor близко к оригиналу
КАСТОМНЫЕ БЛОКИ: newBlockTypes:[{blockType,label,icon,description}]

-- ── КЛОНИРОВАНИЕ ИЗВЕСТНЫХ САЙТОВ ────────────────────────────────────────────
Если пользователь прислал ссылку на SPA/React-сайт (fetch вернул пустой HTML), используй свои знания:

**vouschurch.com** — мегацерковь Майами, Рич и ДawnCheré Уилкерсон. Тёмный стиль (#0a0a0a + золото #f59e0b).
Секции: Navbar(Worship/Visit/Crews/Sermons/Give) → Announcement bar → Video hero (YouTube) → "A Church For All People" bigQuote → EventCards(Easter/Baptism/YoungAdults) → Locations(Brickell/Downtown/Coral Gables/Online) → Values(6 штук с ▽) → SplitHero(Community) → Features(Crews/GrowthTrack/VOUS Kids) → SplitHero(Пасторы Rich & DawnCheré) → CTA(Give) → Footer(3 columns)

**vouschurch.com/worship** — VOUS Worship страница (Christian music ministry). Секции: Navbar → Announcement(NEW SINGLE) → hero bigQuote("JESUS IS HIS NAME") → Latest Singles(карточки альбомов, используй blogGrid с category:"SINGLE") → Albums grid(blogGrid с category:"ALBUM") → Music Videos(embed или cards) → More from VOUS(links: Resources/Merch/Auditions/MultiTracks) → Lyric Videos(blogGrid с category:"LYRIC VIDEO") → Social links(social block) → Footer. Палитра: тёмная (#0a0a0a + #ffffff + акцент #f59e0b). Соцсети: instagram/apple-music/youtube/spotify.
Для WORSHIP/MUSIC страниц: используй blogGrid для сеток альбомов/синглов/видео, embed для YouTube плееров, eventCards для концертов/туров.

Для **любого** известного сайта — воспроизводи РЕАЛЬНУЮ структуру и РЕАЛЬНЫЕ тексты/секции.

-- ── ЭТАЛОННЫЙ ШАБЛОН: VOUS CHURCH STYLE (церковь/сообщество) ────────────────
ШАБЛОН "vous-church" (id) — 12 блоков, тёмная цинематичная палитра (#0a0a0a + #f5c842 + #fff):
1. announcement: пасхальная акция/событие, bgColor:#f5c842, textColor:#0a0a0a, closable:true
2. navbar: logo="GRACE CHURCH", bgColor:#0a0a0a, textColor:#fff, sticky:true, fontFamily:Bebas Neue
3. videoBg: YouTube видео + overlay:0.55, minHeight:"100vh", uppercase:true; eyebrow+title+2 CTA кнопки
4. bigQuote: миссионерская цитата, eyebrow:"НАША МИССИЯ", fontSize:"3.5rem", bgColor:#0a0a0a, textColor:#fff
5. eventCards: 3 события (categories: СОБЫТИЕ/КОНФЕРЕНЦИЯ/СБОР), bgColor:#0f0f0f с плейсхолдер-фото
6. locations: 3 локации с временами служений, адресами, mapHref, bgColor:#111111
7. values: 7 ценностей-карточек со скроллом, divider:"▽", showDragHint:true, bgColor:#0a0a0a, fontFamily:Bebas Neue
8. splitHero: "КАК МЫ СТРОИМ СООБЩЕСТВО" — фото+текст+2 CTA, contentBg:#0f172a
9. features: 4 направления (Служения/Группы/Команда/Дети), bgColor:#0f172a, textColor:#fff
10. splitHero: ПАСТОРЫ — фото+биография, contentBg:#1a1a2e
11. cta: призыв к пожертвованию, bgColor:#f5c842, textColor:#0a0a0a, fontFamily:Bebas Neue
12. footer: 3 колонки (СВЯЗЬ/СЛУЖЕНИЯ/РЕСУРСЫ), socialLinks:[telegram,youtube,instagram], bgColor:#0a0a0a
globalStyles: {fontFamily:"Lato", headingFont:"Bebas Neue", backgroundColor:"#0a0a0a", textColor:"#ffffff", primaryColor:"#f5c842"}
-- ── ПРАВИЛА СОЗДАНИЯ ЦЕРКОВНОГО САЙТА ────────────────────────────────────────
При запросе "церковь"/"church"/"сообщество"/"mosque"/"synagogue"/"ministry":
- Используй ЦИНЕМАТИК палитру (#0a0a0a/#f59e0b) или ТЁМНУЮ (#a855f7/#0f0f23)
- ОБЯЗАТЕЛЬНО: announcement(вверху) + videoBg/parallax(герой) + bigQuote(миссия) + locations(расписание) + values(ценности) + eventCards(события)
- РЕКОМЕНДУЕМО: splitHero(пасторы/командe) + features(направления) + cta(пожертвования) + footer(многоколоночный)
- fontFamily: "Bebas Neue" + "Lato" для заголовков/текста
- animateIn: "fadeUp" или "fadeLeft" на каждый блок с animateDelay:100-300
- Ценности: нумерация 01, 02... с разделителем ▽ в заголовке
- Локации: всегда указывать service times в поле "times" (напр. "10:00 + 12:00 + 14:00")
- События: категории ЗАГЛАВНЫМИ: СОБЫТИЕ / КОНФЕРЕНЦИЯ / СБОР / КРЕЩЕНИЕ
- Не используй типы блоков hero/text/features без customization под церковный стиль — предпочитай parallax/videoBg/bigQuote/values/eventCards/locations

-- ── ПОЛНЫЙ ПРИМЕР CREATE_WEBSITE (церковь, VOUS-стиль, 12 блоков) ────────────
При запросе "создай сайт церкви/сообщества" — ГЕНЕРИРУЙ ТОЧНО ТАК ЖЕ, адаптируя название/контент/цвета:
\`\`\`action
{"type":"CREATE_WEBSITE","data":{"name":"Grace Church","globalStyles":{"fontFamily":"Lato","headingFont":"Bebas Neue","backgroundColor":"#0a0a0a","textColor":"#ffffff","primaryColor":"#f5c842"},"blocks":[
{"id":"ann1","type":"announcement","content":{"emoji":"✝️","text":"ПАСХАЛЬНОЕ СЛУЖЕНИЕ — Христос Воскресе!","subtext":"Воскресенье, 12 апреля • 10:00 и 12:00","ctaText":"Зарегистрироваться","ctaHref":"#visit","bgColor":"#f5c842","textColor":"#0a0a0a","closable":true},"styles":{"fontFamily":"Lato","fontWeight":"600","fontSize":"13px"}},
{"id":"nav1","type":"navbar","content":{"logo":"GRACE CHURCH","links":[{"label":"ПОСЕТИТЬ","href":"#visit"},{"label":"ПРОПОВЕДИ","href":"#sermons"},{"label":"СООБЩЕСТВО","href":"#community"},{"label":"СЛУЖЕНИЕ","href":"#ministry"}],"ctaText":"ПЛАН ВИЗИТА","ctaHref":"#plan","bgColor":"#0a0a0a","textColor":"#ffffff","sticky":true},"styles":{"fontFamily":"Bebas Neue","letterSpacing":"0.1em"}},
{"id":"vbg1","type":"videoBg","content":{"eyebrow":"GRACE CHURCH","title":"Добро пожаловать домой","subtitle":"Каждое воскресенье. Для всех. Место, где вам всегда рады.","ctaText":"ПОСЕТИТЬ СЛУЖЕНИЕ","ctaHref":"#visit","cta2Text":"СМОТРЕТЬ ОНЛАЙН","cta2Href":"#online","videoUrl":"https://www.youtube.com/watch?v=bajjG6TX33o","bgImage":"https://placehold.co/1920x1080/0a0a0a/ffffff?text=Grace+Church","overlay":0.55,"minHeight":"100vh","uppercase":true},"styles":{"fontFamily":"Bebas Neue","animateIn":"fadeIn"}},
{"id":"bq1","type":"bigQuote","content":{"eyebrow":"НАША МИССИЯ","text":"Привести тех, кто далеко от Бога, — близко к Нему.","bgColor":"#0a0a0a","textColor":"#ffffff","fontSize":"3.5rem","fontWeight":"700","italic":false,"tight":true,"align":"center","openQuote":false,"ctaText":"Узнать больше о нас","ctaHref":"#about"},"styles":{"animateIn":"fadeUp","fontFamily":"Bebas Neue","padding":"100px 40px"}},
{"id":"ev1","type":"eventCards","content":{"title":"АКТУАЛЬНОЕ","subtitle":"Ближайшие события и программы","bgColor":"#0f0f0f","textColor":"#ffffff","columns":3,"linkText":"Все события →","linkHref":"#events","items":[{"category":"СОБЫТИЕ","title":"Пасхальное служение","desc":"Торжественное богослужение в честь Воскресения Христова. Приходите всей семьёй.","href":"#easter","linkText":"Подробнее"},{"category":"СОБЫТИЕ","title":"Водное крещение","desc":"Следующий шаг в вашей вере. Становитесь частью семьи церкви.","href":"#baptism","linkText":"Записаться"},{"category":"КОНФЕРЕНЦИЯ","title":"ChurchCon 2026","desc":"Ежегодная конференция для лидеров, служителей и всех желающих расти.","href":"#conf","linkText":"Получить билет"}]},"styles":{"animateIn":"fadeUp","animateDelay":"100"}},
{"id":"loc1","type":"locations","content":{"title":"ПОСЕТИТЬ ЦЕРКОВЬ","subtitle":"Приходите каждое воскресенье в одном из наших мест","bgColor":"#111111","textColor":"#ffffff","locations":[{"name":"ЦЕНТРАЛЬНЫЙ КАМПУС","times":"9:00 + 11:00 + 13:00","address":"ул. Центральная, 12, Москва","mapHref":"https://maps.google.com","image":"https://placehold.co/600x400/1a1a1a/ffffff?text=Центр"},{"name":"СЕВЕРНЫЙ КАМПУС","times":"10:00 + 12:00","address":"пр. Северный, 45, Москва","mapHref":"https://maps.google.com","image":"https://placehold.co/600x400/1a1a1a/ffffff?text=Север"},{"name":"ОНЛАЙН","times":"YouTube: 10:00 + 12:00","address":"youtube.com/@gracechurch","mapHref":"#online","image":"https://placehold.co/600x400/0a0a0a/f5c842?text=Online"}]},"styles":{"animateIn":"fadeUp"}},
{"id":"val1","type":"values","content":{"title":"НАШИ ЦЕННОСТИ","subtitle":"Наши основные ценности — это то, кто мы есть. Не просто то, что мы делаем — это наша ДНК.","bgColor":"#0a0a0a","textColor":"#ffffff","divider":"▽","showDragHint":true,"items":[{"title":"ИИСУС ▽ НАШЕ ПОСЛАНИЕ","desc":"Цель нашей церкви — нести надежду Иисуса. Методы приходят и уходят, наше послание неизменно."},{"title":"ЛЮДИ ▽ НАШЕ СЕРДЦЕ","desc":"Наше сердце для ВСЕХ людей. Мы нацелены на тех, кто далёк от Бога."},{"title":"ЩЕДРОСТЬ ▽ НАШ ПРИВИЛЕГИЙ","desc":"Щедрость — это давать больше требуемого. Мы щедры временем, талантами и средствами."},{"title":"СОВЕРШЕНСТВО ▽ НАШ ДУХ","desc":"Делаем наилучшее из того, что имеем. Приходим вовремя, вовлечены и подготовлены."},{"title":"СЛУЖЕНИЕ ▽ НАША ИДЕНТИЧНОСТЬ","desc":"Если ты слишком велик для служения — ты слишком мал для лидерства."},{"title":"ЧЕСТЬ ▽ НАШЕ ПРИЗВАНИЕ","desc":"Мы открыто выражаем честь. Подчиняемся лидерству и благодарны за духовный авторитет."},{"title":"СТРАСТЬ ▽ НАШЕ СТРЕМЛЕНИЕ","desc":"Всё что мы делаем — со страстью. К Иисусу. К людям. К Его церкви."}]},"styles":{"animateIn":"fadeLeft","fontFamily":"Bebas Neue","letterSpacing":"0.05em"}},
{"id":"sh1","type":"splitHero","content":{"eyebrow":"СООБЩЕСТВО","title":"Как мы СТРОИМ сообщество","body":"Воскресные служения, малые группы и команды служения — три столпа нашей общины. Найдите своё место в семье церкви.","image":"https://placehold.co/800x600/1a1a2e/ffffff?text=Community","contentBg":"#0f172a","textColor":"#ffffff","ctaText":"Найти группу","ctaHref":"#community","cta2Text":"Войти в команду","cta2Href":"#team"},"styles":{"animateIn":"fadeRight"}},
{"id":"fe1","type":"features","content":{"title":"Способы участвовать","items":[{"icon":"🙏","title":"Воскресные служения","desc":"Главное собрание каждое воскресенье. Поклонение Богу и общение с людьми."},{"icon":"👥","title":"Малые группы","desc":"Группы 10–15 человек для общения, молитвы и изучения Слова Божьего."},{"icon":"🎯","title":"Команды служения","desc":"Начните делать разницу. Найдите призвание и служите другим."},{"icon":"👦","title":"Детская церковь","desc":"Для детей от 6 месяцев до 6 класса. Параллельно с каждым служением."}],"bgColor":"#0f172a","textColor":"#ffffff"},"styles":{"animateIn":"fadeUp","animateDelay":"100","padding":"80px 32px"}},
{"id":"sh2","type":"splitHero","content":{"eyebrow":"НАШИ ПАСТОРЫ","title":"Виктор и Светлана Ивановы","body":"Наша церковь началась с небольшого собрания верующих в 2010 году. Сегодня мы — большая семья, объединённая любовью к Богу и людям. Мы верим в следующее поколение и ценим наставничество старших.","image":"https://placehold.co/800x600/1a1a1a/f5c842?text=Pastors","contentBg":"#1a1a2e","textColor":"#ffffff","ctaText":"О нашей команде","ctaHref":"#team"},"styles":{"animateIn":"fadeLeft"}},
{"id":"cta1","type":"cta","content":{"title":"ЩЕДРОСТЬ — НАШ ПРИВИЛЕГИЙ","subtitle":"Бог щедро дал нам — наша честь отдавать в ответ. Присоединитесь к культуре щедрости.","ctaText":"ПОЖЕРТВОВАТЬ","ctaHref":"#give","bgColor":"#f5c842","textColor":"#0a0a0a","align":"center"},"styles":{"animateIn":"zoomIn","fontFamily":"Bebas Neue","padding":"80px 40px"}},
{"id":"ftr1","type":"footer","content":{"companyName":"GRACE CHURCH","description":"Церковь для всех. Приходите такими, какие вы есть.","copyright":"© 2026 Grace Church. Все права защищены.","columns":[{"title":"СВЯЗЬ","links":[{"label":"Воскресные служения","href":"#visit"},{"label":"Малые группы","href":"#groups"},{"label":"Growth Track","href":"#track"}]},{"title":"СЛУЖЕНИЯ","links":[{"label":"Детская церковь","href":"#kids"},{"label":"Молодёжь","href":"#youth"},{"label":"Забота","href":"#care"}]},{"title":"РЕСУРСЫ","links":[{"label":"Пожертвовать","href":"#give"},{"label":"Проповеди","href":"#sermons"},{"label":"Контакт","href":"#contact"}]}],"socialLinks":[{"platform":"telegram","url":"#"},{"platform":"youtube","url":"#"},{"platform":"instagram","url":"#"}],"bgColor":"#0a0a0a","textColor":"#888888","linkColor":"#ffffff"},"styles":{"fontFamily":"Lato"}}
]}}
\`\`\`
-- ── ИНСТРУКЦИЯ: АДАПТИРУЙ ЭТОТ ПРИМЕР ──────────────────────────────────────
При запросе церковного/сообщественного сайта:
1. Скопируй структуру выше (12 блоков, тот же порядок)
2. Замени: name, logo, title/subtitle/body/text/desc на контент тематики запроса
3. Замени: bgColor/textColor/primaryColor (сохраняй тёмную/кинематичную эстетику)
4. Добавляй нужные локации, ценности, события
5. НЕ сокращай — создавай МИНИМУМ 12 блоков с богатым контентом`;

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

    // --- URL page fetching: если пользователь прислал ссылку — скачиваем страницу ---
    const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
    const urlsInMessage = (lastMsgText.match(urlRegex) || [])
      .filter((u: string) => !u.includes('placehold.co') && !u.includes('youtube.com') && !u.includes('youtu.be'));
    if (urlsInMessage.length > 0) {
      const fetchPageText = async (url: string): Promise<{text: string; isSpa: boolean; domain: string}> => {
        const domain = (() => { try { return new URL(url).hostname.replace('www.',''); } catch { return url; } })();
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 9000);
          const resp = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
          });
          clearTimeout(tid);
          if (!resp.ok) return { text: '', isSpa: false, domain };
          const html = await resp.text();
          // Extract title
          const titleMatch = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : '';
          // Extract meta description
          const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i);
          const desc = descMatch ? descMatch[1].trim() : '';
          // Extract OG tags
          const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i) || [])[1] || '';
          const ogDesc = (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,400})["']/i) || [])[1] || '';
          // Strip scripts/styles/svg, then tags
          const clean = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/\s{2,}/g, ' ').trim();
          const isSpa = clean.length < 400 && html.includes('<div id=');
          const snippet = clean.slice(0, 9000);
          const textContent = `TITLE: ${ogTitle || title}\nDESCRIPTION: ${ogDesc || desc}\n\nCONTENT:\n${snippet}`;
          return { text: textContent, isSpa, domain };
        } catch {
          return { text: '', isSpa: false, domain };
        }
      };
      const fetchResults = await Promise.all(urlsInMessage.slice(0, 2).map(fetchPageText));
      const goodResults = fetchResults.filter(r => r.text.length > 200 && !r.isSpa);
      const spaResults = fetchResults.filter(r => r.isSpa || (r.text.length <= 200 && urlsInMessage.length > 0));
      if (goodResults.length > 0) {
        systemContent += `

---
## 🌐 СТРАНИЦА ДЛЯ КЛОНИРОВАНИЯ (FETCH РЕЗУЛЬТАТ)

Пользователь хочет создать сайт-клон. Ниже — извлечённый текст страницы.
**ЗАДАЧА:** CREATE_WEBSITE МИНИМУМ 12-15 блоков, точно воспроизводя:
- Все секции, заголовки, тексты, кнопки с оригинала
- Цветовую схему по тексту/бренду
- Структуру навигации (все пункты меню)
- Все блоки: navbar, hero, about, services/features, team, testimonials, pricing, FAQ, contact, footer
- Тип сайта (церковь → VOUS-стиль | бизнес → корпоративный | магазин → яркий)
ИСПОЛЬЗУЙ контент из секции ниже — НЕ выдумывай.

${goodResults.map((r, i) => `### 📄 [${r.domain}] СТРАНИЦА ${i + 1}:\n\`\`\`\n${r.text}\n\`\`\``).join('\n\n')}`;
      } else if (spaResults.length > 0) {
        const domains = spaResults.map(r => r.domain).join(', ');
        systemContent += `

---
## 🌐 КЛОНИРОВАНИЕ САЙТА: ${domains}

Страница использует JavaScript-рендеринг (React/Vue SPA) — сервер получил пустой HTML. Используй свои знания об этом сайте.

**ЗАДАЧА:** CREATE_WEBSITE МИНИМУМ 12-15 блоков на основе:
1. Своих знаний об этом домене/бренде (${domains})
2. Типа сайта (определи по домену: церковь/бизнес/музыка/новости/магазин/...)
3. Типичной структуры таких сайтов

Воспроизведи: навигацию, герой, все основные секции, footer — с реальными текстами/ценностями/контентом этого бренда.
Если это vouschurch.com — применяй VOUS-стиль (dark cinematic, Bebas Neue, #0a0a0a + #f5c842).`;
      }
    }

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
            // Build short nav labels: prefer navItems from original site, fallback to capitalized slug
            // Group pages by nav category for mega-menu sections
            const navbarLinks = allPages.map((p, i) => {
              if (p.slug === 'home') return `{label:"Home",href:"/",mode:"navigate"}`;
              const slugWords = p.slug.toLowerCase().split(/[-_]/);
              const matched = navItems.find((n: string) => slugWords.some((w: string) => w.length > 2 && n.toLowerCase().includes(w)));
              const label = (matched || p.slug.replace(/[-_]/g, ' ')).replace(/"/g, '').replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 15);
              // Build megamenu sections from page headings
              const pageHeadings = p.headings?.slice(0, 8) || [];
              if (pageHeadings.length >= 3) {
                // Split headings into 2-3 columns for mega-menu
                const perCol = Math.ceil(pageHeadings.length / 2);
                const col1 = pageHeadings.slice(0, perCol);
                const col2 = pageHeadings.slice(perCol);
                const secs = [
                  `{title:"${col1[0]?.replace(/"/g, '').slice(0, 30) || label}",links:[${col1.map(h => `{label:"${h.replace(/"/g, '').slice(0, 30)}",href:"/${p.slug}"}`).join(",")}]}`,
                  col2.length > 0 ? `{title:"${col2[0]?.replace(/"/g, '').slice(0, 30) || ''}",links:[${col2.map(h => `{label:"${h.replace(/"/g, '').slice(0, 30)}",href:"/${p.slug}"}`).join(",")}]}` : ''
                ].filter(Boolean).join(",");
                return `{label:"${label}",href:"/${p.slug}",mode:"megamenu",sections:[${secs}]}`;
              }
              return `{label:"${label}",href:"/${p.slug}",mode:"navigate"}`;
            }).join(",");
            const navbarJson = `{type:"navbar",id:"nav1",content:{logo:"${siteTitle.replace(/"/g, '')}",links:[${navbarLinks}],bgColor:"${siteColors[0]?.replace(/.*:\s*/, '') || '#1e293b'}",textColor:"#fff"},styles:{padding:"12px 24px"}}`;

            // Build per-page specs
            const pageDataList = allPages.map(page => {
              const headingsStr = page.headings.slice(0, 12).join(" | ");
              const bodySnippet = page.bodyText.slice(0, 1200).replace(/\n/g, " ");
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

    // ── MULTI-STEP WEBSITE GENERATION (analysis → parallel groups → assemble) ──
    if (scrapedSiteContent === `__MULTISTEP_WEBSITE__`) {
      const msData = (req as any).__multiStepSite;
      console.log(`Multi-step generation: ${msData.rootUrl}, ${msData.pageDataList.length} pages`);

      // ── STEP 0: Deep Content Analysis ────────────────────────────────
      // Always run — even if scraping returned data, AI enriches with own knowledge
      const scrapedBodyText = msData.pageDataList.map((p: any) => p.body ? `[${p.slug}] ${p.body.slice(0, 600)}` : '').filter(Boolean).join('\n');
      const analysisPrompt = `You are an expert website analyst. Site: ${msData.rootUrl}
${scrapedBodyText ? `\nSCRAPED TEXT (may be incomplete if SPA):\n${scrapedBodyText}\n` : ''}
Using your knowledge of this domain (and the scraped text above if available), return ONLY a JSON object. No markdown, no explanation.

{
  "siteType": "church|business|music|restaurant|portfolio|ecommerce|blog|...",
  "siteName": "exact brand name",
  "brand": "2-3 sentence brand description",
  "tagline": "main site slogan",
  "palette": {"bg": "#0a0a0a", "text": "#ffffff", "primary": "#f5c842", "accent": "#f59e0b", "surface": "#111111"},
  "fonts": {"heading": "Bebas Neue", "body": "Lato"},
  "navLinks": ["Link1", "Link2", "Link3", "Link4", "Link5"],
  "keyMessages": ["message 1", "message 2", "message 3", "message 4", "message 5"],
  "ctaPrimary": {"text": "CTA button text", "href": "#"},
  "ctaSecondary": {"text": "secondary CTA", "href": "#"},
  "socialLinks": [{"platform": "instagram", "url": "https://..."}, {"platform": "youtube", "url": "https://..."}],
  "copyright": "© 2026 Brand Name",
  "sections": [
    {"id": "s1", "name": "announcement", "blockType": "announcement", "content": "EXACT announcement bar text — event name, date, CTA"},
    {"id": "s2", "name": "hero", "blockType": "videoBg", "content": "hero h1 title | subtitle | CTA text | YouTube URL if known"},
    {"id": "s3", "name": "mission", "blockType": "bigQuote", "content": "EXACT mission statement quote — word for word"},
    {"id": "s4", "name": "events", "blockType": "eventCards", "content": "Event1: title|date|desc. Event2: title|date|desc. Event3: title|date|desc"},
    {"id": "s5", "name": "locations", "blockType": "locations", "content": "Location1: name|address|times. Location2: name|address|times. Online: URL|times"},
    {"id": "s6", "name": "values", "blockType": "values", "content": "Value1: TITLE ▽ full description. Value2: TITLE ▽ desc. Value3..."},
    {"id": "s7", "name": "community", "blockType": "splitHero", "content": "eyebrow | title | body text | ctaText | cta2Text"},
    {"id": "s8", "name": "ministry", "blockType": "features", "content": "Item1: icon|title|desc. Item2: icon|title|desc. Item3: icon|title|desc. Item4: icon|title|desc"},
    {"id": "s9", "name": "pastors", "blockType": "splitHero", "content": "eyebrow | pastor names | bio text | CTA text"},
    {"id": "s10", "name": "give", "blockType": "cta", "content": "CTA title | subtitle | button text"}
  ]
}

CRITICAL: Fill EVERY field with REAL content from this specific site. 
- For vouschurch.com: Rich & DawnCheré Wilkerson, Miami FL, "A Church For All People", dark gold theme
- For vouschurch.com/worship: VOUS Worship music ministry, singles/albums/music videos
- For ANY site: use your training knowledge to fill real content, names, addresses, quotes`;

      const analysisRaw = await callAI(analysisPrompt, availableProviders);
      console.log(`Analysis: ${analysisRaw?.length || 0} chars`);

      let analysis: any = {};
      if (analysisRaw) {
        try {
          const c = analysisRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const s = c.indexOf('{'); const e = c.lastIndexOf('}');
          if (s >= 0 && e > s) analysis = JSON.parse(c.slice(s, e + 1));
        } catch (err) { console.error('Analysis parse fail:', analysisRaw?.slice(0, 150)); }
      }

      // Extract palette & typography
      const pal = analysis.palette || {};
      const bgColor   = pal.bg       || '#0a0a0a';
      const textColor = pal.text     || '#ffffff';
      const primary   = pal.primary  || '#f5c842';
      const surface   = pal.surface  || '#111111';
      const headFont  = analysis.fonts?.heading || 'Inter';
      const bodyFont  = analysis.fonts?.body    || 'Inter';
      const siteType  = analysis.siteType  || 'website';
      const siteName  = analysis.siteName  || msData.siteTitle;
      const tagline   = analysis.tagline   || '';
      const keyMsgs   = (analysis.keyMessages || []).join(' | ');
      const ctaPrimary    = analysis.ctaPrimary    || { text: 'Get Started', href: '#' };
      const ctaSecondary  = analysis.ctaSecondary  || { text: 'Learn More',  href: '#' };
      const navLinks  = analysis.navLinks || msData.navLinksStr?.split(' | ') || ['Home'];
      const copyright = analysis.copyright || `© 2026 ${siteName}`;
      const socialLinks = analysis.socialLinks || [];

      // Build prefilled navbar & footer blocks
      const navItems = navLinks.slice(0, 7).map((lbl: string) => {
        const slug = lbl.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return `{"label":"${lbl.replace(/"/g,'')}","href":"/${slug}","mode":"navigate"}`;
      }).join(',');
      const socialJson = socialLinks.map((s: any) => `{"platform":"${s.platform}","url":"${s.url || '#'}"}`).join(',');

      const navbarBlock = {
        id: 'nav1', type: 'navbar',
        content: {
          logo: siteName, links: navLinks.slice(0,7).map((lbl: string) => ({
            label: lbl, href: `/${lbl.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`, mode: 'navigate'
          })),
          ctaText: ctaPrimary.text, ctaHref: ctaPrimary.href,
          bgColor, textColor, sticky: true,
        },
        styles: { fontFamily: headFont, letterSpacing: '0.08em', padding: '14px 24px' },
      };
      const footerBlock = {
        id: 'ftr1', type: 'footer',
        content: {
          companyName: siteName,
          description: (analysis.brand || '').slice(0,120),
          copyright,
          columns: [
            { title: 'LINKS', links: navLinks.slice(0,4).map((l: string) => ({ label: l, href: `/${l.toLowerCase().replace(/\s+/g,'-')}` })) },
            { title: 'CONNECT', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
          ],
          socialLinks,
          bgColor, textColor: '#666666', linkColor: textColor,
        },
        styles: { fontFamily: bodyFont, padding: '60px 32px' },
      };

      // ── Build section list from analysis ─────────────────────────────
      const analysisSections: any[] = analysis.sections || [];

      // If analysis gave no sections, build defaults by type
      const defaultSections: any[] = siteType === 'church' ? [
        { id:'s1', name:'announcement', blockType:'announcement', content:'Easter Service — Come celebrate with us! Sunday 10am & 12pm' },
        { id:'s2', name:'hero',         blockType:'videoBg',      content: `${siteName} | ${tagline || 'A Church For All People'} | Visit Us | Watch Online` },
        { id:'s3', name:'mission',      blockType:'bigQuote',     content: keyMsgs.split('|')[0] || 'Bringing those far from God close to Him.' },
        { id:'s4', name:'events',       blockType:'eventCards',   content:'Easter Service: April 20|Join us for Easter. Baptism: May 4|Next step in your faith. Conference: June 1|Annual leadership conference.' },
        { id:'s5', name:'locations',    blockType:'locations',    content:'Main Campus: 9:00+11:00+13:00|123 Main St. North Campus: 10:00+12:00|456 North Ave. Online: 10:00+12:00|youtube.com/live' },
        { id:'s6', name:'values',       blockType:'values',       content:'JESUS ▽ OUR MESSAGE — Jesus is the center of all we do. PEOPLE ▽ OUR HEART — Our heart is for ALL people. GENEROSITY ▽ OUR PRIVILEGE — We give generously.' },
        { id:'s7', name:'community',    blockType:'splitHero',    content:'COMMUNITY|How We BUILD Community|Small groups, serve teams, and Sunday services.|Join a Group|Serve' },
        { id:'s8', name:'ministry',     blockType:'features',     content:'🙏 Sunday Services|Weekly worship gatherings. 👥 Small Groups|Community of 10-15. 🎯 Serve Teams|Find your calling. 👦 Kids Church|For ages 0-12.' },
        { id:'s9', name:'pastors',      blockType:'splitHero',    content:`LEADERSHIP|${siteName} Pastors|Our church started with a small gathering. Today we are a large family united by love.|Meet the Team` },
        { id:'s10',name:'give',         blockType:'cta',          content:'GENEROSITY IS OUR PRIVILEGE|God gave generously to us — our honor is to give back.|Give Now' },
      ] : siteType === 'music' ? [
        { id:'s1', name:'hero',         blockType:'parallax',  content:`${siteName} | ${tagline} | Listen Now | Watch Videos` },
        { id:'s2', name:'newSingle',    blockType:'bigQuote',  content:keyMsgs.split('|')[0] || 'New Single Out Now' },
        { id:'s3', name:'singles',      blockType:'blogGrid',  content:'Latest Singles: 3 items with cover art and stream links' },
        { id:'s4', name:'albums',       blockType:'blogGrid',  content:'Albums: 4-6 albums with cover art, year, link' },
        { id:'s5', name:'musicVideos',  blockType:'embed',     content:'Featured Music Video YouTube embed' },
        { id:'s6', name:'moreLinks',    blockType:'features',  content:'🎵 Resources|Chords & lyrics. 👕 Merch|Official store. 🎤 Auditions|Join the team. 🎼 MultiTracks|For worship leaders.' },
        { id:'s7', name:'lyricVideos',  blockType:'blogGrid',  content:'Lyric Videos: 4-6 items with thumbnails' },
        { id:'s8', name:'social',       blockType:'social',    content:'Instagram | Apple Music | YouTube | Spotify' },
      ] : [
        { id:'s1', name:'hero',         blockType:'hero',      content:`${siteName} | ${tagline} | Get Started | Learn More` },
        { id:'s2', name:'features',     blockType:'features',  content:'Feature 1|desc. Feature 2|desc. Feature 3|desc.' },
        { id:'s3', name:'about',        blockType:'splitHero', content:`About | ${siteName} | ${analysis.brand || ''} | Contact` },
        { id:'s4', name:'testimonials', blockType:'testimonials', content:'3 testimonials with name, role, text' },
        { id:'s5', name:'cta',          blockType:'cta',       content:`${ctaPrimary.text} | ${tagline} | ${ctaPrimary.text}` },
      ];

      const sections = analysisSections.length >= 4 ? analysisSections : defaultSections;

      // ── STEP 1: Divide sections into 4 parallel groups ───────────────
      const groupCount = Math.min(4, sections.length);
      const groupSize  = Math.ceil(sections.length / groupCount);
      const groups: any[][] = [];
      for (let i = 0; i < groupCount; i++) {
        const slice = sections.slice(i * groupSize, (i + 1) * groupSize);
        if (slice.length > 0) groups.push(slice);
      }

      // Shared analysis context injected into every group prompt
      const ctx = `SITE: "${siteName}" (${msData.rootUrl})
TYPE: ${siteType}
TAGLINE: "${tagline}"
BRAND: ${(analysis.brand || '').slice(0, 200)}
KEY MESSAGES: ${keyMsgs}
COLORS — bg:${bgColor} text:${textColor} primary:${primary} surface:${surface}
FONTS — heading:"${headFont}" body:"${bodyFont}"
PRIMARY CTA: "${ctaPrimary.text}" → ${ctaPrimary.href}
SECONDARY CTA: "${ctaSecondary.text}" → ${ctaSecondary.href}`;

      const styleGuide = siteType === 'church'
        ? `BLOCK STYLE RULES:
- announcement: bgColor:"${primary}",textColor:"${bgColor}",emoji:"✝️",closable:true — use REAL event text
- videoBg: overlay:0.55,minHeight:"100vh",uppercase:true — use REAL h1 title from site
- bigQuote: fontSize:"3.5rem",fontWeight:"700",bgColor:"${bgColor}",textColor:"${textColor}",openQuote:false,align:"center"
- eventCards: bgColor:"${surface}",textColor:"${textColor}",columns:3 — categories: СОБЫТИЕ/КОНФЕРЕНЦИЯ/КРЕЩЕНИЕ
- locations: bgColor:"#111111" — include real times like "9:00 + 11:00 + 13:00"
- values: divider:"▽",showDragHint:true,bgColor:"${bgColor}",fontFamily:"${headFont}" — format: "TITLE ▽ SUBTITLE"
- splitHero: contentBg:"#0f172a",eyebrow in caps,body 2-3 sentences
- features: bgColor:"#0f172a",textColor:"${textColor}",4 items with emoji icon
- cta: bgColor:"${primary}",textColor:"${bgColor}",align:"center",fontFamily:"${headFont}"
- ALL blocks: add styles.animateIn ("fadeUp"|"fadeLeft"|"fadeRight") and animateDelay:100-300`
        : siteType === 'music'
        ? `BLOCK STYLE RULES:
- parallax/hero: dark background, full-bleed, bold text
- blogGrid posts: {image:"url",category:"SINGLE"|"ALBUM"|"VIDEO",title,excerpt,date,link}
- embed: type:"youtube", height:500
- social: include instagram/apple-music/youtube/spotify platforms
- ALL blocks: bgColor:"${bgColor}",textColor:"${textColor}"`
        : `Use colors bg:${bgColor} text:${textColor} primary:${primary}. Add animateIn to all blocks.`;

      const shuffled = [...availableProviders].sort(() => Math.random() - 0.5);

      // ── STEP 2: Generate each group in parallel ──────────────────────
      const groupPromises = groups.map((group, idx) => {
        const rotated = [...shuffled.slice(idx % shuffled.length), ...shuffled.slice(0, idx % shuffled.length)];
        const sectionList = group.map((s, i) =>
          `${i+1}. id:"${s.id}" name:"${s.name}" blockType:"${s.blockType}"\n   CONTENT TO USE: "${s.content || 'generate from site knowledge'}"`
        ).join('\n');

        const groupPrompt = `You are a JSON block generator for a website builder. Return ONLY a valid JSON array of blocks. NO markdown, NO explanation, NO text.

${ctx}

${styleGuide}

GENERATE THESE ${group.length} BLOCKS:
${sectionList}

AVAILABLE STANDARD BLOCK TYPES: navbar, hero, text, features, gallery, pricing, testimonials, team, faq, contact, stats, logos, cta, timeline, social, newsletter, quote, map, columns, form, cards, blogGrid, embed, parallax, videoBg, bigQuote, eventCards, locations, values, splitHero, announcement, marquee, divider, tabs, accordion, imageText, steps, iconGrid, embed, social

RULES:
1. Use the EXACT blockType specified for each section
2. Fill content with REAL DATA from the CONTENT field above — NO placeholders like "..." or "Title here"
3. Each block: {"id":"...","type":"blockType","content":{...full content...},"styles":{"padding":"...","bgColor":"...","textColor":"...","animateIn":"fadeUp"}}
4. CONTENT field format hints:
   - videoBg/parallax: {eyebrow,title,subtitle,ctaText,ctaHref,cta2Text?,cta2Href?,videoUrl?,bgImage?,overlay:0.55,minHeight:"100vh",uppercase:true}
   - bigQuote: {text:"EXACT QUOTE",eyebrow,bgColor,textColor,fontSize:"3.5rem",fontWeight:"700",align:"center",openQuote:false,ctaText?,ctaHref?}
   - announcement: {text:"EXACT TEXT",subtext?,emoji,ctaText,ctaHref,bgColor,textColor,closable:true}
   - eventCards: {title,subtitle,bgColor,textColor,columns:3,items:[{category:"СОБЫТИЕ",title,desc,href,linkText:"Подробнее"}]}
   - locations: {title,subtitle,bgColor,textColor,locations:[{name,times:"9:00 + 11:00",address,mapHref}]}
   - values: {title,subtitle,bgColor,textColor,divider:"▽",showDragHint:true,items:[{title:"NAME ▽ SUBTITLE",desc:"full description"}]}
   - splitHero: {eyebrow,title,body,ctaText,ctaHref,cta2Text?,cta2Href?,image:"https://placehold.co/800x600/111/fff?text=Photo",contentBg,textColor}
   - features: {title,items:[{icon:"🎯",title,desc}],bgColor,textColor}
   - cta: {title,subtitle,ctaText,ctaHref,bgColor,textColor,align:"center"}
   - blogGrid: {title,subtitle,columns:3,bgColor,textColor,posts:[{image:"https://placehold.co/400x300/111/fff?text=Item",category,title,excerpt,date,link}]}
   - embed: {url:"youtube URL",type:"youtube",height:500}
   - social: {title,links:[{platform:"instagram",url:"..."},{platform:"youtube",url:"..."}]}
   - testimonials: {title,items:[{name,role,text,rating:5}]}
   - features items: min 4 items with real content
   - eventCards items: min 3 events
   - values items: min 5 values with full descriptions
5. Use ACTUAL content from the site — real names, quotes, descriptions, location addresses
6. placehold.co image format: https://placehold.co/WxH/BGHEX/TEXTHEX?text=Label (no # in hex!)

Return ONLY: [{"id":"...","type":"...","content":{...},"styles":{...}}, ...]`;

        return callAI(groupPrompt, rotated).then(result => ({ groupIdx: idx, result, secs: group }));
      });

      const groupResults = await Promise.all(groupPromises);
      console.log(`Groups OK: ${groupResults.filter(r => r.result).length}/${groups.length}`);

      // ── STEP 3: Parse & assemble all blocks in order ─────────────────
      const allBlocks: any[] = [navbarBlock]; // navbar always first

      for (const gr of groupResults.sort((a, b) => a.groupIdx - b.groupIdx)) {
        if (!gr.result) {
          // Fallback: minimal text blocks
          for (const sec of gr.secs) {
            allBlocks.push({ id: sec.id, type: 'text',
              content: { title: sec.name, body: sec.content || '' },
              styles: { padding: '40px 24px', bgColor, textColor } });
          }
          continue;
        }
        try {
          let js = gr.result.trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          // Find array or object
          const ai = js.indexOf('[');
          const oi = js.indexOf('{');
          let blocks: any[] = [];
          if (ai >= 0 && (oi < 0 || ai <= oi)) {
            const az = js.lastIndexOf(']');
            blocks = JSON.parse(az > ai ? js.slice(ai, az + 1) : js);
          } else if (oi >= 0) {
            const oz = js.lastIndexOf('}');
            const parsed = JSON.parse(js.slice(oi, oz + 1));
            blocks = Array.isArray(parsed) ? parsed : (parsed.blocks || []);
          }
          blocks.forEach((b: any, i: number) => {
            allBlocks.push({ ...b, id: b.id || `g${gr.groupIdx}_b${i}` });
          });
        } catch (err) {
          console.error(`Parse fail group ${gr.groupIdx}:`, String(err), gr.result?.slice(0, 120));
          for (const sec of gr.secs) {
            allBlocks.push({ id: sec.id, type: 'text',
              content: { title: sec.name, body: sec.content || '' },
              styles: { padding: '40px 24px', bgColor, textColor } });
          }
        }
      }

      allBlocks.push(footerBlock); // footer always last

      // Deduplicate ids
      const seenIds = new Set<string>();
      const finalBlocks = allBlocks.filter(b => {
        if (!b || seenIds.has(b.id)) return false;
        seenIds.add(b.id);
        return true;
      });

      const globalStyles = {
        fontFamily: bodyFont,
        headingFont: headFont,
        backgroundColor: bgColor,
        textColor,
        primaryColor: primary,
        secondaryColor: surface,
        borderRadius: '8px',
      };

      const actionJson = JSON.stringify({
        type: 'CREATE_WEBSITE',
        data: { name: siteName, globalStyles, blocks: finalBlocks },
      });

      const responseText = `Анализирую ${msData.rootUrl}...\n\n✅ Готово: **${finalBlocks.length} блоков** (${groups.length} параллельных потока, анализ + генерация).\n\`\`\`action\n${actionJson}\n\`\`\``;
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
- Минимум 12-18 узлов, разбитых на 3-5 сегментов по 3-5 узлов
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
- Минимум 8-14 полей, разбитых на 2-4 группы
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
