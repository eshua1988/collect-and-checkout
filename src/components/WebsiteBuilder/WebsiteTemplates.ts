export const WEBSITE_TEMPLATES = [
  {
    id: 'landing-business',
    name: 'Бизнес Лендинг',
    nameEn: 'Business Landing',
    description: 'Профессиональный лендинг для бизнеса с разделами преимуществ и контактов',
    category: 'business',
    preview: '🏢',
    blocks: [
      {
        id: 'nb1', type: 'navbar',
        content: { logo: 'МойСайт', links: [{ label: 'О нас', href: '#about' }, { label: 'Услуги', href: '#services' }, { label: 'Контакты', href: '#contact' }], ctaText: 'Связаться', ctaHref: '#contact', bgColor: '#1e293b', textColor: '#ffffff' }
      },
      {
        id: 'h1', type: 'hero',
        content: { title: 'Профессиональные решения для вашего бизнеса', subtitle: 'Мы помогаем компаниям расти и развиваться с помощью инновационных технологий', ctaText: 'Начать сейчас', ctaHref: '#contact', bgColor: '#1e293b', textColor: '#ffffff', align: 'center' }
      },
      {
        id: 'f1', type: 'features',
        content: { title: 'Наши преимущества', items: [{ icon: '⚡', title: 'Быстро', desc: 'Запуск за 24 часа' }, { icon: '🎯', title: 'Точно', desc: 'Целевые решения' }, { icon: '💡', title: 'Умно', desc: 'ИИ технологии' }, { icon: '🔒', title: 'Надёжно', desc: 'Гарантия качества' }] }
      },
      {
        id: 'pr1', type: 'pricing',
        content: { title: 'Тарифы', plans: [{ name: 'Базовый', price: '990₽/мес', features: ['5 проектов', 'Поддержка 24/7', 'Базовая аналитика'] }, { name: 'Профи', price: '2490₽/мес', features: ['Неограниченно', 'Приоритетная поддержка', 'Расширенная аналитика', 'API доступ'], highlighted: true }, { name: 'Корпоратив', price: 'По запросу', features: ['Всё включено', 'Персональный менеджер', 'Кастомизация'] }] }
      },
      {
        id: 'c1', type: 'contact',
        content: { title: 'Свяжитесь с нами', subtitle: 'Оставьте заявку и мы перезвоним в течение 15 минут', email: 'info@company.ru', phone: '+7 (800) 000-00-00' }
      },
      {
        id: 'ft1', type: 'footer',
        content: { companyName: 'МойСайт', copyright: '© 2024 МойСайт. Все права защищены.', links: [{ label: 'Политика', href: '#' }, { label: 'Условия', href: '#' }] }
      }
    ]
  },
  {
    id: 'portfolio',
    name: 'Портфолио',
    nameEn: 'Portfolio',
    description: 'Личное портфолио для дизайнеров, разработчиков и творческих специалистов',
    category: 'personal',
    preview: '🎨',
    blocks: [
      {
        id: 'nb2', type: 'navbar',
        content: { logo: 'Иван Иванов', links: [{ label: 'Обо мне', href: '#about' }, { label: 'Работы', href: '#works' }, { label: 'Контакт', href: '#contact' }], bgColor: '#ffffff', textColor: '#1e293b' }
      },
      {
        id: 'h2', type: 'hero',
        content: { title: 'Привет, я Иван 👋', subtitle: 'Full-stack разработчик & UI/UX дизайнер. Создаю красивые и функциональные продукты', ctaText: 'Посмотреть работы', ctaHref: '#works', bgColor: '#f8fafc', textColor: '#1e293b', align: 'left' }
      },
      {
        id: 'g1', type: 'gallery',
        content: { title: 'Мои работы', images: [{ url: 'https://placehold.co/400x300/6366f1/white?text=Проект+1', caption: 'Веб-приложение' }, { url: 'https://placehold.co/400x300/8b5cf6/white?text=Проект+2', caption: 'Мобильное приложение' }, { url: 'https://placehold.co/400x300/06b6d4/white?text=Проект+3', caption: 'Лендинг' }] }
      },
      {
        id: 'tm1', type: 'testimonials',
        content: { title: 'Отзывы клиентов', items: [{ name: 'Алексей К.', text: 'Отличная работа! Сайт готов точно в срок.', rating: 5 }, { name: 'Мария С.', text: 'Профессионал своего дела, рекомендую!', rating: 5 }] }
      },
      {
        id: 'c2', type: 'contact',
        content: { title: 'Напишите мне', email: 'ivan@example.com', social: [{ name: 'Telegram', url: '#' }, { name: 'GitHub', url: '#' }] }
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'Интернет-магазин',
    nameEn: 'E-commerce',
    description: 'Шаблон интернет-магазина с каталогом и оформлением заказа',
    category: 'store',
    preview: '🛒',
    blocks: [
      {
        id: 'nb3', type: 'navbar',
        content: { logo: '🛒 Магазин', links: [{ label: 'Каталог', href: '#catalog' }, { label: 'Акции', href: '#sale' }, { label: 'Доставка', href: '#delivery' }], ctaText: 'Корзина 🛒', bgColor: '#dc2626', textColor: '#ffffff' }
      },
      {
        id: 'h3', type: 'hero',
        content: { title: 'Лучшие товары по лучшим ценам', subtitle: 'Скидки до 70% на популярные категории. Доставка по всей России', ctaText: 'Смотреть акции', ctaHref: '#sale', bgColor: '#dc2626', textColor: '#ffffff', align: 'center' }
      },
      {
        id: 'f3', type: 'features',
        content: { title: 'Почему выбирают нас', items: [{ icon: '🚚', title: 'Быстрая доставка', desc: 'От 1 дня по России' }, { icon: '💳', title: 'Удобная оплата', desc: 'Карта, наличные, рассрочка' }, { icon: '↩️', title: 'Возврат 30 дней', desc: 'Без вопросов' }, { icon: '⭐', title: '4.9 рейтинг', desc: '100 000+ отзывов' }] }
      },
      {
        id: 'ct1', type: 'contact',
        content: { title: 'Есть вопросы?', subtitle: 'Мы на связи ежедневно с 8:00 до 22:00', phone: '8-800-555-00-00', email: 'support@shop.ru' }
      }
    ]
  },
  {
    id: 'restaurant',
    name: 'Ресторан / Кафе',
    nameEn: 'Restaurant',
    description: 'Сайт для ресторана или кафе с меню и бронированием',
    category: 'food',
    preview: '🍽️',
    blocks: [
      {
        id: 'nb4', type: 'navbar',
        content: { logo: '🍽️ La Bella', links: [{ label: 'Меню', href: '#menu' }, { label: 'О нас', href: '#about' }, { label: 'Бронь', href: '#book' }], bgColor: '#1c1917', textColor: '#f5f5f4' }
      },
      {
        id: 'h4', type: 'hero',
        content: { title: 'Итальянская кухня в сердце города', subtitle: 'Настоящий вкус Италии. Живая музыка по пятницам', ctaText: 'Забронировать стол', ctaHref: '#book', bgColor: '#1c1917', textColor: '#f5f5f4', align: 'center' }
      },
      {
        id: 'txt1', type: 'text',
        content: { title: 'Наше меню', body: 'Пицца, паста, ризотто и многое другое. Все блюда готовятся из свежих итальянских ингредиентов. Мы предлагаем обеденное меню, банкеты и доставку.' }
      },
      {
        id: 'f4', type: 'features',
        content: { title: 'Особенности', items: [{ icon: '🍕', title: 'Дровяная печь', desc: 'Настоящая пицца' }, { icon: '🍷', title: 'Винная карта', desc: 'Итальянские вина' }, { icon: '🎵', title: 'Живая музыка', desc: 'По пятницам и субботам' }, { icon: '🎂', title: 'Банкеты', desc: 'До 100 человек' }] }
      },
      {
        id: 'c4', type: 'contact',
        content: { title: 'Забронировать стол', phone: '+7 (495) 000-00-00', address: 'ул. Тверская, 1, Москва', hours: 'Ежедневно 11:00–23:00' }
      }
    ]
  },
  {
    id: 'blog',
    name: 'Блог / Медиа',
    nameEn: 'Blog',
    description: 'Персональный блог или медиа-портал',
    category: 'content',
    preview: '📝',
    blocks: [
      {
        id: 'nb5', type: 'navbar',
        content: { logo: '✍️ Мой Блог', links: [{ label: 'Статьи', href: '#articles' }, { label: 'Обо мне', href: '#about' }, { label: 'Подписка', href: '#subscribe' }], bgColor: '#ffffff', textColor: '#1e293b' }
      },
      {
        id: 'h5', type: 'hero',
        content: { title: 'Идеи. Мысли. Вдохновение.', subtitle: 'Пишу о технологиях, жизни и всём интересном. Подпишитесь чтобы не пропустить', ctaText: 'Читать блог', align: 'left', bgColor: '#f8fafc', textColor: '#1e293b' }
      },
      {
        id: 'txt5', type: 'text',
        content: { title: 'Последние статьи', body: 'Здесь будут отображаться последние публикации блога. Регулярно обновляемый контент по технологиям, дизайну и продуктивности.' }
      },
      {
        id: 'c5', type: 'contact',
        content: { title: 'Подписаться на рассылку', subtitle: 'Новые статьи каждую неделю', email: 'blog@example.com' }
      }
    ]
  },
  {
    id: 'event',
    name: 'Мероприятие / Ивент',
    nameEn: 'Event',
    description: 'Промо-сайт для конференций, вебинаров и мероприятий',
    category: 'event',
    preview: '🎪',
    blocks: [
      {
        id: 'nb6', type: 'navbar',
        content: { logo: '🎪 Ивент', links: [{ label: 'Программа', href: '#program' }, { label: 'Спикеры', href: '#speakers' }, { label: 'Регистрация', href: '#reg' }], bgColor: '#4f46e5', textColor: '#ffffff' }
      },
      {
        id: 'h6', type: 'hero',
        content: { title: 'TechConf 2024', subtitle: 'Главная IT конференция года. 50+ спикеров, 2000+ участников', ctaText: 'Зарегистрироваться', ctaHref: '#reg', bgColor: '#4f46e5', textColor: '#ffffff', align: 'center' }
      },
      {
        id: 'cd1', type: 'countdown',
        content: { title: 'До начала осталось', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
      },
      {
        id: 'tm2', type: 'team',
        content: { title: 'Спикеры', members: [{ name: 'Александр Иванов', role: 'CEO TechCorp', avatar: '👨‍💼' }, { name: 'Мария Смирнова', role: 'CTO StartupX', avatar: '👩‍💻' }, { name: 'Дмитрий Козлов', role: 'Design Lead', avatar: '🎨' }] }
      },
      {
        id: 'c6', type: 'contact',
        content: { title: 'Зарегистрироваться', subtitle: 'Осталось 50 мест!', email: 'reg@techconf.ru' }
      }
    ]
  },
  {
    id: 'startup',
    name: 'Стартап / SaaS',
    nameEn: 'Startup / SaaS',
    description: 'Современный лендинг для стартапа или SaaS-продукта',
    category: 'business',
    preview: '🚀',
    blocks: [
      {
        id: 'nb7', type: 'navbar',
        content: { logo: '🚀 LaunchKit', links: [{ label: 'Продукт', href: '#product' }, { label: 'Тарифы', href: '#pricing' }, { label: 'Войти', href: '#login' }], ctaText: 'Попробовать бесплатно', bgColor: '#0f172a', textColor: '#ffffff' }
      },
      {
        id: 'h7', type: 'hero',
        content: { title: 'Запустите продукт за 24 часа', subtitle: 'Платформа для быстрого создания и монетизации SaaS-продуктов. Без кода.', ctaText: 'Начать бесплатно', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }
      },
      {
        id: 'f7', type: 'features',
        content: { title: 'Всё что нужно для старта', items: [{ icon: '⚡', title: 'No-code', desc: 'Без программирования' }, { icon: '💳', title: 'Оплаты', desc: 'Встроенные платежи' }, { icon: '📊', title: 'Аналитика', desc: 'Дашборд в реальном времени' }, { icon: '🌍', title: 'Мультиязычность', desc: '20+ языков' }] }
      },
      {
        id: 'pr7', type: 'pricing',
        content: { title: 'Простые цены', plans: [{ name: 'Free', price: '0₽', features: ['1 продукт', '100 пользователей', 'Базовый аналитикс'] }, { name: 'Growth', price: '2900₽/мес', features: ['10 продуктов', '10 000 пользователей', 'Расширенная аналитика', 'API'], highlighted: true }, { name: 'Scale', price: '9900₽/мес', features: ['Неограниченно', 'Белая метка', 'Выделенная поддержка'] }] }
      },
      {
        id: 'faq1', type: 'faq',
        content: { title: 'Часто задаваемые вопросы', items: [{ q: 'Нужны ли технические знания?', a: 'Нет, наша платформа полностью No-code.' }, { q: 'Есть ли бесплатный период?', a: 'Да, 14 дней бесплатно без карты.' }, { q: 'Как отменить подписку?', a: 'В любой момент в личном кабинете.' }] }
      }
    ]
  },
  {
    id: 'medical',
    name: 'Медицина / Клиника',
    nameEn: 'Medical Clinic',
    description: 'Сайт медицинской клиники или частного врача',
    category: 'healthcare',
    preview: '🏥',
    blocks: [
      {
        id: 'nb8', type: 'navbar',
        content: { logo: '🏥 МедЦентр', links: [{ label: 'Услуги', href: '#services' }, { label: 'Врачи', href: '#doctors' }, { label: 'Запись', href: '#book' }], bgColor: '#0ea5e9', textColor: '#ffffff' }
      },
      {
        id: 'h8', type: 'hero',
        content: { title: 'Ваше здоровье — наша забота', subtitle: 'Современная диагностика и лечение. Запись онлайн без ожидания', ctaText: 'Записаться онлайн', bgColor: '#0ea5e9', textColor: '#ffffff', align: 'center' }
      },
      {
        id: 'f8', type: 'features',
        content: { title: 'Наши услуги', items: [{ icon: '🔬', title: 'Диагностика', desc: 'МРТ, КТ, УЗИ' }, { icon: '💊', title: 'Терапия', desc: 'Все виды лечения' }, { icon: '🦷', title: 'Стоматология', desc: 'Безболезненно' }, { icon: '👁️', title: 'Офтальмология', desc: 'Коррекция зрения' }] }
      },
      {
        id: 'tm8', type: 'team',
        content: { title: 'Наши врачи', members: [{ name: 'д-р Иванова А.В.', role: 'Терапевт, 15 лет опыта', avatar: '👩‍⚕️' }, { name: 'д-р Петров К.М.', role: 'Хирург, 20 лет опыта', avatar: '👨‍⚕️' }] }
      },
      {
        id: 'c8', type: 'contact',
        content: { title: 'Запись на приём', phone: '+7 (495) 000-00-00', address: 'ул. Садовая, 5', hours: 'Пн–Пт 8:00–20:00' }
      }
    ]
  }
];

export type TemplateCategory = 'all' | 'business' | 'personal' | 'store' | 'food' | 'content' | 'event' | 'healthcare';

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'Все шаблоны', emoji: '📦' },
  { id: 'business', label: 'Бизнес', emoji: '🏢' },
  { id: 'personal', label: 'Личное', emoji: '👤' },
  { id: 'store', label: 'Магазин', emoji: '🛒' },
  { id: 'food', label: 'Еда', emoji: '🍽️' },
  { id: 'event', label: 'Мероприятия', emoji: '🎪' },
  { id: 'healthcare', label: 'Медицина', emoji: '🏥' },
  { id: 'content', label: 'Контент', emoji: '📝' },
];
