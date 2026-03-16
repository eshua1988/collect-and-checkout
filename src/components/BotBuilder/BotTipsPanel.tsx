import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Lightbulb, BookOpen, Rocket, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BotTipsPanelProps {
  onClose: () => void;
}

const tips = [
  {
    category: '🚀 Начало работы',
    icon: <Rocket className="w-4 h-4" />,
    items: [
      {
        title: 'Как создать бота в Telegram',
        content: `1. Откройте @BotFather в Telegram\n2. Отправьте команду /newbot\n3. Придумайте название (например: "Мой Магазин")\n4. Придумайте username (должен заканчиваться на "bot", например: myshop_bot)\n5. Скопируйте полученный токен (формат: 1234567890:AAF...)\n6. Вставьте токен в настройки бота здесь`,
      },
      {
        title: 'Как работает конструктор',
        content: `Конструктор работает по принципу блок-схемы:\n• Узлы — это шаги сценария\n• Стрелки — переходы между шагами\n• Старт (▶) — точка входа, отрабатывает при /start\n\nДобавляйте узлы кнопками сверху → перетаскивайте → соединяйте точки на узлах`,
      },
      {
        title: 'Сохранение и запуск',
        content: `После построения потока нажмите кнопку "Сохранить" вверху справа.\n\nСимулятор (кнопка "Симулятор") позволяет проверить сценарий прямо в браузере без настоящего Telegram.\n\nДля реальной работы бота нужно настроить Webhook — подключить сервер к Telegram API.`,
      },
    ],
  },
  {
    category: '💬 Узел: Сообщение',
    icon: <span className="text-sm">💬</span>,
    items: [
      {
        title: 'Что умеет узел Сообщение',
        content: `Отправляет текст пользователю. Поддерживает:\n• **Жирный** и _курсив_ (Markdown)\n• <b>HTML</b> форматирование\n• Эмодзи 🎉\n• Многострочный текст\n\nМожно добавлять инлайн-кнопки для навигации или перехода по ссылкам.`,
      },
      {
        title: 'Переменные в тексте',
        content: `Используйте {{имя_переменной}} для вставки данных:\n• {{user_name}} — имя пользователя\n• {{user_lang}} — язык пользователя\n• {{ai_response}} — ответ ИИ\n\nПример: "Привет, {{user_name}}! Ваш заказ принят."`,
      },
    ],
  },
  {
    category: '❓ Узел: Ввод пользователя',
    icon: <span className="text-sm">❓</span>,
    items: [
      {
        title: 'Типы ввода',
        content: `• Текст — любой текст\n• Число — только цифры\n• Email — проверка формата email\n• Телефон — номер телефона\n• Дата — дата в формате ДД.ММ.ГГГГ\n• Выбор — кнопки с вариантами ответа\n\nОтвет сохраняется в переменную для дальнейшего использования.`,
      },
      {
        title: 'Валидация через Regex',
        content: `Поле "Валидация" принимает регулярные выражения:\n• ^[a-zA-Zа-яА-Я]+$ — только буквы\n• ^\\d{4,10}$ — от 4 до 10 цифр\n• ^[^@]+@[^@]+\\.[^@]+$ — email\n\nЕсли ввод не совпадает — бот попросит ввести заново.`,
      },
    ],
  },
  {
    category: '⚡ Узел: Условие (IF)',
    icon: <span className="text-sm">⚡</span>,
    items: [
      {
        title: 'Как работает ветвление',
        content: `Узел проверяет значение переменной:\n• Верхняя точка (зелёная) → ДА (условие истинно)\n• Нижняя точка (красная) → НЕТ (условие ложно)\n\nПример: если user_lang = "ru" → показать русское меню, иначе → английское.`,
      },
      {
        title: 'Операторы сравнения',
        content: `= равно | ≠ не равно\nсодержит | не содержит\n> больше | < меньше\nпусто | не пусто\n\nПримеры:\n• user_lang = "en" → ветка для англоязычных\n• user_score > 100 → поздравление за достижение\n• email пусто → попросить email`,
      },
    ],
  },
  {
    category: '🤖 Узел: ИИ Ответ',
    icon: <span className="text-sm">🤖</span>,
    items: [
      {
        title: 'Настройка ИИ ответа',
        content: `ИИ генерирует ответ на основе:\n• Системного промпта (роль ИИ)\n• Контекста разговора\n• Сообщения пользователя\n\nМодели: Gemini Flash (быстрее/дешевле), GPT-4 (умнее).\nОтвет сохраняется в переменную для дальнейшей отправки.`,
      },
      {
        title: 'Примеры промптов',
        content: `Консультант магазина:\n"Ты — помощник интернет-магазина. Отвечай вежливо на вопросы о товарах, ценах и доставке."\n\nЧатбот поддержки:\n"Ты — специалист техподдержки. Помогай пользователям решить их проблему. Если не знаешь — предложи написать на email."`,
      },
    ],
  },
  {
    category: '🌐 Узлы: Перевод и язык',
    icon: <span className="text-sm">🌐</span>,
    items: [
      {
        title: 'Авто-перевод контента',
        content: `Схема мультиязычного бота:\n1. Узел "Выбор языка" (userLangPref) — спрашивает пользователя\n2. Сохраняет в переменную user_lang (например: "en", "de")\n3. Узел "Перевод" — переводит текст, пост или видео на язык пользователя\n4. Отправляет переведённый результат`,
      },
      {
        title: 'Определить язык автоматически',
        content: `Узел "Авто-язык" анализирует текст пользователя и определяет язык.\n\n1. Пользователь пишет сообщение\n2. Узел langDetect анализирует → сохраняет в {{user_lang}}\n3. Дальше все ответы автоматически переводятся под этот язык\n\nОпция "Установить как язык бота" сохраняет язык на весь сеанс.`,
      },
    ],
  },
  {
    category: '📸 Узлы: Соц. сети',
    icon: <span className="text-sm">📱</span>,
    items: [
      {
        title: 'YouTube Monitor — отслеживание канала',
        content: `Настройка:\n1. Укажите Channel ID (из URL YouTube: youtube.com/channel/UC...)\n2. Или вставьте URL канала\n3. Выберите что отслеживать: видео / стримы / премьеры\n4. Настройте шаблон уведомления\n\nДоступные переменные в шаблоне:\n{{title}} — название, {{url}} — ссылка, {{author}} — автор, {{thumbnail}} — превью`,
      },
      {
        title: 'Instagram Monitor',
        content: `Требует Meta Graph API токен.\n\nПолучить токен:\n1. Создайте приложение на developers.facebook.com\n2. Подключите Instagram Basic Display\n3. Получите Access Token\n\nМожно отслеживать: посты, Reels, Stories, Live.\nВключите "Переводить контент" — подписи переведутся автоматически на язык пользователя.`,
      },
      {
        title: 'Facebook Monitor',
        content: `Требует Page Access Token.\n\nПолучить токен:\n1. Перейдите на developers.facebook.com\n2. Создайте приложение типа "Business"\n3. Добавьте продукт "Pages API"\n4. Получите Page Access Token для вашей страницы\n\nОтслеживает: посты, видео, прямые эфиры. Автоперевод на язык пользователя.`,
      },
      {
        title: 'Social Share — ссылки на ресурсы',
        content: `Создаёт красивое меню ссылок:\n• Кнопки — инлайн-кнопки в Telegram\n• Текст — список со ссылками\n• Смешанный — текст + кнопки\n\nПоддерживает: Telegram, YouTube, Instagram, TikTok, Twitter/X, ВКонтакте, Facebook, Discord, Twitch, Сайт`,
      },
    ],
  },
  {
    category: '🔗 Узел: Действие (Webhook)',
    icon: <span className="text-sm">🔗</span>,
    items: [
      {
        title: 'Webhook — интеграция с API',
        content: `Отправляет HTTP запрос на ваш сервер или сторонний API.\n\nПример — сохранить данные в базу:\nURL: https://mysite.com/api/save-user\nМетод: POST\nТело: {"name": "{{user_name}}", "email": "{{user_email}}"}\n\nПример — запрос к n8n или Make.com:\nURL: https://hook.make.com/your-webhook-id`,
      },
      {
        title: 'Отправить форму пользователю',
        content: `Действие "Отправить форму" — бот пришлёт пользователю ссылку на форму, созданную в Form Builder.\n\nПример использования:\n1. Бот знакомится с пользователем\n2. Спрашивает, хочет ли он оставить заявку\n3. Если Да → Action "sendForm" → отправляет ссылку`,
      },
    ],
  },
  {
    category: '📦 Узлы: Переменные и логика',
    icon: <span className="text-sm">📦</span>,
    items: [
      {
        title: 'Работа с переменными',
        content: `Операции:\n• set — установить значение: score = 0\n• increment — прибавить: score += 10\n• decrement — отнять: score -= 5\n• append — добавить к строке: log += "событие"\n• clear — очистить переменную\n\nИспользуйте {{имя}} для подстановки в тексте.`,
      },
      {
        title: 'Рандомайзер — случайные ветки',
        content: `Делит поток на несколько случайных веток.\nМожно задать веса (вероятности):\n• Ветка 1: вес 3 = 60%\n• Ветка 2: вес 2 = 40%\n\nПрименение:\n• A/B тестирование сообщений\n• Разнообразие ответов бота\n• Случайные бонусы/акции`,
      },
      {
        title: 'Пауза (Delay)',
        content: `Добавляет задержку перед следующим шагом.\nМожно указать "Сообщение во время ожидания" — например: "⏳ Обрабатываю запрос..."\n\nПолезно:\n• Перед ответом ИИ (имитация "печатает")\n• Между шагами опроса\n• Перед отправкой результата`,
      },
    ],
  },
];

export function BotTipsPanel({ onClose }: BotTipsPanelProps) {
  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="w-96 border-l bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Подсказки и инструкции</span>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Quick start banner */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Как читать эти подсказки</span>
            </div>
            <p className="text-xs text-muted-foreground">Нажимайте на категорию, затем на вопрос — получите подробные инструкции. Все советы написаны для новичков.</p>
          </div>

          {/* Capabilities overview */}
          <div className="rounded-xl bg-muted/50 border p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Что можно построить:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>✅ Приветственный бот</span>
              <span>✅ Бот-опросник</span>
              <span>✅ ИИ-консультант</span>
              <span>✅ Мультиязычный бот</span>
              <span>✅ YouTube уведомления</span>
              <span>✅ Instagram мониторинг</span>
              <span>✅ Facebook мониторинг</span>
              <span>✅ Менеджер лидов</span>
              <span>✅ Поддержка клиентов</span>
              <span>✅ Рекламный рассылатель</span>
              <span>✅ Викторина/квиз</span>
              <span>✅ Реферальная система</span>
            </div>
          </div>

          {/* Tips accordion */}
          {tips.map((cat, catIdx) => (
            <div key={catIdx} className="rounded-xl border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenCategory(openCategory === catIdx ? null : catIdx)}
              >
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span className="text-xs font-semibold">{cat.category}</span>
                </div>
                {openCategory === catIdx
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                }
              </button>

              {openCategory === catIdx && (
                <div className="border-t divide-y">
                  {cat.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = openItem === key;
                    return (
                      <div key={itemIdx}>
                        <button
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                          onClick={() => setOpenItem(isOpen ? null : key)}
                        >
                          <span className="text-xs text-foreground">{item.title}</span>
                          {isOpen
                            ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          }
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 bg-muted/20">
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
