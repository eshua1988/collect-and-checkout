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
  ,
  // ── VOUS-CHURCH style: dark/cinematic church & community ──────────
  {
    id: 'vous-church',
    name: 'Церковь / Сообщество',
    nameEn: 'Church / Community (VOUS style)',
    description: 'Тёмный кинематичный сайт для церкви или сообщества в стиле VOUS Church Miami. Полный набор: видеогерой, миссия, события, локации, ценности, пасторы, призыв к даянию.',
    category: 'church',
    preview: '⛪',
    blocks: [
      {
        id: 'ch_ann', type: 'announcement',
        content: { emoji: '✝️', text: 'Пасхальное служение — Христос Воскресе!', subtext: 'Воскресенье, 12 апреля • 10:00 и 12:00', ctaText: 'Зарегистрироваться', ctaHref: '#visit', bgColor: '#f5c842', textColor: '#0a0a0a', closable: true },
        styles: { fontFamily: 'Lato', fontSize: '13px', fontWeight: '600' }
      },
      {
        id: 'ch_nav', type: 'navbar',
        content: { logo: 'GRACE CHURCH', links: [{ label: 'ПОСЕТИТЬ', href: '#visit' }, { label: 'ПРОПОВЕДИ', href: '#sermons' }, { label: 'СООБЩЕСТВО', href: '#community' }, { label: 'СЛУЖЕНИЕ', href: '#ministry' }], ctaText: 'ПЛАН ВИЗИТА', ctaHref: '#visit', bgColor: '#0a0a0a', textColor: '#ffffff', sticky: true },
        styles: { fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }
      },
      {
        id: 'ch_vbg', type: 'videoBg',
        content: { eyebrow: 'GRACE CHURCH', title: 'Добро пожаловать домой', subtitle: 'Каждое воскресенье. Для всех. Место, где вам всегда рады.', ctaText: 'ПОСЕТИТЬ СЛУЖЕНИЕ', ctaHref: '#visit', cta2Text: 'СМОТРЕТЬ ОНЛАЙН', cta2Href: '#online', videoUrl: 'https://www.youtube.com/watch?v=bajjG6TX33o', bgImage: 'https://placehold.co/1920x1080/0a0a0a/ffffff?text=Grace+Church', overlay: 0.55, minHeight: '100vh', uppercase: true },
        styles: { fontFamily: 'Bebas Neue', animateIn: 'fadeIn' }
      },
      {
        id: 'ch_bq', type: 'bigQuote',
        content: { eyebrow: 'НАША МИССИЯ', text: 'Привести тех, кто далеко от Бога, — близко к Нему.', bgColor: '#0a0a0a', textColor: '#ffffff', fontSize: '3.5rem', fontWeight: '700', italic: false, tight: true, align: 'center', openQuote: false, ctaText: 'Узнать больше о нас', ctaHref: '#about' },
        styles: { animateIn: 'fadeUp', fontFamily: 'Bebas Neue', padding: '100px 40px' }
      },
      {
        id: 'ch_ev', type: 'eventCards',
        content: {
          title: 'АКТУАЛЬНОЕ',
          subtitle: 'Ближайшие события и программы',
          bgColor: '#0f0f0f',
          textColor: '#ffffff',
          columns: 3,
          linkText: 'Все события →',
          linkHref: '#events',
          items: [
            { category: 'СОБЫТИЕ', title: 'Пасхальное служение', desc: 'Торжественное служение в честь Воскресения Христова. Приходите всей семьёй.', image: 'https://placehold.co/600x400/1a1a1a/f5c842?text=Пасха', href: '#easter', linkText: 'Подробнее' },
            { category: 'СОБЫТИЕ', title: 'Водное крещение', desc: 'Сделайте следующий шаг в вашей вере и станьте официальной частью семьи церкви.', image: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Крещение', href: '#baptism', linkText: 'Зарегистрироваться' },
            { category: 'КОНФЕРЕНЦИЯ', title: 'ChurchCon 2026', desc: 'Ежегодная конференция для лидеров, служителей и всех желающих расти.', image: 'https://placehold.co/600x400/111111/f5c842?text=ChurchCon', href: '#conference', linkText: 'Получить билет' }
          ]
        },
        styles: { animateIn: 'fadeUp', animateDelay: '100' }
      },
      {
        id: 'ch_loc', type: 'locations',
        content: {
          title: 'ПОСЕТИТЬ ЦЕРКОВЬ',
          subtitle: 'Приходите каждое воскресенье в одном из наших мест',
          bgColor: '#111111',
          textColor: '#ffffff',
          locations: [
            { name: 'GRACE — ЦЕНТР', times: '9:00 + 11:00 + 13:00', address: 'ул. Центральная, 12, Москва', href: '#loc1', mapHref: 'https://maps.google.com', image: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Центр' },
            { name: 'GRACE — СЕВЕР', times: '10:00 + 12:00', address: 'пр. Северный, 45, Москва', href: '#loc2', mapHref: 'https://maps.google.com', image: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Север' },
            { name: 'ОНЛАЙН', times: 'YouTube: 10:00 + 12:00', address: 'youtube.com/@gracechurch', href: '#online', mapHref: '#online', image: 'https://placehold.co/600x400/0a0a0a/f5c842?text=Online' }
          ]
        },
        styles: { animateIn: 'fadeUp' }
      },
      {
        id: 'ch_val', type: 'values',
        content: {
          title: 'НАШИ ЦЕННОСТИ',
          subtitle: 'Наши основные ценности — это то, кто мы есть. Не просто то, что мы делаем — это наша ДНК.',
          bgColor: '#0a0a0a',
          textColor: '#ffffff',
          divider: '▽',
          showDragHint: true,
          items: [
            { title: 'ИИСУС ▽ НАШЕ ПОСЛАНИЕ', desc: 'Цель нашей церкви — нести надежду Иисуса. Методы приходят и уходят, но наше послание остаётся неизменным.' },
            { title: 'ЛЮДИ ▽ НАШЕ СЕРДЦЕ', desc: 'Наше сердце для ВСЕХ людей. Мы не извиняемся за то, что специально нацелены на тех, кто далёк от Бога.' },
            { title: 'ЩЕДРОСТЬ ▽ НАШ ПРИВИЛЕГИЙ', desc: 'Щедрость — это давать больше, чем требуется. Мы щедры временем, талантами и средствами.' },
            { title: 'СОВЕРШЕНСТВО ▽ НАШ ДУХ', desc: 'Мы всегда делаем наилучшее из того, что имеем. Приходим вовремя, вовлечены и подготовлены.' },
            { title: 'СЛУЖЕНИЕ ▽ НАША ИДЕНТИЧНОСТЬ', desc: 'Если ты слишком велик для служения — ты слишком мал для лидерства. Каждый лидер прежде всего слуга.' },
            { title: 'ЧЕСТЬ ▽ НАШЕ ПРИЗВАНИЕ', desc: 'Мы открыто выражаем честь и не скупимся на слова. Подчиняемся лидерству и благодарны за духовный авторитет.' },
            { title: 'СТРАСТЬ ▽ НАШЕ СТРЕМЛЕНИЕ', desc: 'Всё, что мы делаем — со страстью. К Иисусу. К людям. К Его церкви.' }
          ]
        },
        styles: { animateIn: 'fadeLeft', fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }
      },
      {
        id: 'ch_sh1', type: 'splitHero',
        content: {
          eyebrow: 'СООБЩЕСТВО',
          title: 'Как мы СТРОИМ сообщество',
          body: 'Воскресные служения, малые группы и команды — три столпа нашего сообщества. Найдите своё место в семье церкви.',
          image: 'https://placehold.co/800x600/1a1a2e/ffffff?text=Community',
          contentBg: '#0f172a',
          textColor: '#ffffff',
          ctaText: 'Найти группу',
          ctaHref: '#community',
          cta2Text: 'Войти в команду',
          cta2Href: '#team'
        },
        styles: { animateIn: 'fadeRight' }
      },
      {
        id: 'ch_feat', type: 'features',
        content: {
          title: 'Способы участвовать',
          items: [
            { icon: '🙏', title: 'Воскресные служения', desc: 'Главное собрание нашей общины каждое воскресенье. Поклонение Богу и общение.' },
            { icon: '👥', title: 'Малые группы', desc: 'Группы 10–15 человек для общения, молитвы и изучения Слова — лично или онлайн.' },
            { icon: '🎯', title: 'Войти в команду', desc: 'Начните делать разницу и найдите призвание. Каждый может внести вклад в Божье дело.' },
            { icon: '👦', title: 'Детская церковь', desc: 'Для детей 6 мес. — 6 класс. Параллельные программы во время каждого служения.' }
          ],
          bgColor: '#0f172a',
          textColor: '#ffffff'
        },
        styles: { animateIn: 'fadeUp', animateDelay: '100', padding: '80px 32px' }
      },
      {
        id: 'ch_sh2', type: 'splitHero',
        content: {
          eyebrow: 'НАШИ ПАСТОРЫ',
          title: 'Ричард и Анастасия Виноградовы',
          body: 'Видение нашей церкви родилось из небольшого еженедельного собрания верующих. Миссия — создать церковь в сердце города, которая станет домом для людей всех возрастов и отразит красоту нашего города.',
          image: 'https://placehold.co/800x600/1a1a1a/f5c842?text=Pastors',
          contentBg: '#1a1a2e',
          textColor: '#ffffff',
          ctaText: 'Познакомиться с командой',
          ctaHref: '#team'
        },
        styles: { animateIn: 'fadeLeft' }
      },
      {
        id: 'ch_cta', type: 'cta',
        content: { title: 'ЩЕДРОСТЬ — НАШ ПРИВИЛЕГИЙ', subtitle: 'Бог щедро дал нам — наша честь отдавать в ответ. Присоединитесь к культуре щедрости.', ctaText: 'ПОЖЕРТВОВАТЬ', ctaHref: '#give', bgColor: '#f5c842', textColor: '#0a0a0a', align: 'center' },
        styles: { animateIn: 'zoomIn', fontFamily: 'Bebas Neue', padding: '80px 40px' }
      },
      {
        id: 'ch_ftr', type: 'footer',
        content: {
          companyName: 'GRACE CHURCH',
          description: 'Церковь для всех. Приходите такими, какие вы есть.',
          copyright: '© 2026 Grace Church. Все права защищены.',
          columns: [
            { title: 'СВЯЗЬ', links: [{ label: 'Воскресные служения', href: '#visit' }, { label: 'Малые группы', href: '#groups' }, { label: 'Growth Track', href: '#track' }] },
            { title: 'СЛУЖЕНИЯ', links: [{ label: 'Детская церковь', href: '#kids' }, { label: 'Молодёжь', href: '#youth' }, { label: 'Забота', href: '#care' }] },
            { title: 'РЕСУРСЫ', links: [{ label: 'Пожертвовать', href: '#give' }, { label: 'Проповеди', href: '#sermons' }, { label: 'Контакт', href: '#contact' }] }
          ],
          socialLinks: [{ platform: 'telegram', url: '#' }, { platform: 'youtube', url: '#' }, { platform: 'instagram', url: '#' }],
          bgColor: '#0a0a0a',
          textColor: '#888888',
          linkColor: '#ffffff'
        },
        styles: { fontFamily: 'Lato' }
      }
    ]
  }
];

export type TemplateCategory = 'all' | 'business' | 'personal' | 'store' | 'food' | 'content' | 'event' | 'healthcare' | 'church';

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'Все шаблоны', emoji: '📦' },
  { id: 'church', label: 'Церковь', emoji: '⛪' },
  { id: 'business', label: 'Бизнес', emoji: '🏢' },
  { id: 'personal', label: 'Личное', emoji: '👤' },
  { id: 'store', label: 'Магазин', emoji: '🛒' },
  { id: 'food', label: 'Еда', emoji: '🍽️' },
  { id: 'event', label: 'Мероприятия', emoji: '🎪' },
  { id: 'healthcare', label: 'Медицина', emoji: '🏥' },
  { id: 'content', label: 'Контент', emoji: '📝' },
];
