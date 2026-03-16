import { useState } from 'react';
import { X, Layers, Zap, PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TelegramBot, BotNode, BotEdge } from '@/types/bot';
import { toast } from 'sonner';

interface BotTemplatesPanelProps {
  bot: TelegramBot;
  onLoad: (nodes: BotNode[], edges: BotEdge[]) => void;
  onMerge: (nodes: BotNode[], edges: BotEdge[]) => void;
  onClose: () => void;
}

const gen = () => Math.random().toString(36).substring(2, 9);

// ─── TEMPLATES ──────────────────────────────────────────────────────────────────

const templates: {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tags: string[];
  nodes: BotNode[];
  edges: BotEdge[];
}[] = [
  // ── 1. Welcome bot ────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    title: 'Приветственный бот',
    description: 'Встречает пользователя, узнаёт имя и предлагает меню',
    emoji: '👋',
    tags: ['простой', 'меню', 'старт'],
    nodes: [
      { id: 'start',  type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',     type: 'message',   position: { x: 220, y: 200 }, data: { text: 'Привет! 👋\nЯ твой личный помощник.\nКак тебя зовут?' } },
      { id: 'n2',     type: 'userInput', position: { x: 460, y: 200 }, data: { text: 'Введи своё имя:', inputType: 'text', variableName: 'user_name' } },
      { id: 'n3',     type: 'message',   position: { x: 700, y: 200 }, data: { text: 'Приятно познакомиться, {{user_name}}! 🎉\nЧем могу помочь?', buttons: [{ id: gen(), label: '📋 Оставить заявку', callbackData: 'form' }, { id: gen(), label: '📞 Контакты', callbackData: 'contacts' }, { id: gen(), label: '❓ FAQ', callbackData: 'faq' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
    ],
  },

  // ── 2. AI consultant ──────────────────────────────────────────────────────────
  {
    id: 'ai-consultant',
    title: 'ИИ-Консультант',
    description: 'Бот отвечает на вопросы с помощью ИИ, с задержкой "печатает..."',
    emoji: '🤖',
    tags: ['ИИ', 'поддержка', 'чат'],
    nodes: [
      { id: 'start', type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',   position: { x: 220, y: 200 }, data: { text: '👋 Привет! Я ИИ-консультант.\nЗадайте любой вопрос — отвечу за секунду!' } },
      { id: 'n2',    type: 'userInput', position: { x: 460, y: 200 }, data: { text: 'Ваш вопрос:', inputType: 'text', variableName: 'user_question' } },
      { id: 'n3',    type: 'delay',     position: { x: 700, y: 200 }, data: { delaySeconds: 2, delayMessage: '⏳ Думаю...' } },
      { id: 'n4',    type: 'aiChat',    position: { x: 940, y: 200 }, data: { aiPrompt: 'Ты — вежливый и полезный ИИ-консультант. Отвечай чётко и по делу на вопросы пользователя.', aiModel: 'google/gemini-2.5-flash', aiResponseVar: 'ai_answer', aiTemperature: 0.7 } },
      { id: 'n5',    type: 'message',   position: { x: 1180, y: 200 }, data: { text: '{{ai_answer}}', buttons: [{ id: gen(), label: '🔄 Ещё вопрос', callbackData: 'again' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5' },
      { id: 'e6', source: 'n5',   target: 'n2' },
    ],
  },

  // ── 3. Lead collector ─────────────────────────────────────────────────────────
  {
    id: 'lead-collector',
    title: 'Сборщик лидов',
    description: 'Собирает имя, телефон, email и отправляет на webhook',
    emoji: '📋',
    tags: ['лиды', 'CRM', 'webhook'],
    nodes: [
      { id: 'start', type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',   position: { x: 220, y: 200 }, data: { text: '👋 Привет! Оставьте заявку и мы свяжемся с вами.' } },
      { id: 'n2',    type: 'userInput', position: { x: 460, y: 120 }, data: { text: 'Как вас зовут?', inputType: 'text', variableName: 'lead_name' } },
      { id: 'n3',    type: 'userInput', position: { x: 700, y: 120 }, data: { text: 'Ваш номер телефона:', inputType: 'phone', variableName: 'lead_phone' } },
      { id: 'n4',    type: 'userInput', position: { x: 940, y: 120 }, data: { text: 'Ваш email:', inputType: 'email', variableName: 'lead_email' } },
      { id: 'n5',    type: 'action',    position: { x: 1180, y: 120 }, data: { actionType: 'webhook', webhookUrl: 'https://your-crm.com/api/leads', webhookMethod: 'POST', webhookBody: '{"name":"{{lead_name}}","phone":"{{lead_phone}}","email":"{{lead_email}}"}' } },
      { id: 'n6',    type: 'message',   position: { x: 1420, y: 120 }, data: { text: '✅ Спасибо, {{lead_name}}!\nВаша заявка принята. Мы позвоним в течение часа! 📞' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5' },
      { id: 'e6', source: 'n5',   target: 'n6' },
    ],
  },

  // ── 4. Quiz / Trivia ──────────────────────────────────────────────────────────
  {
    id: 'quiz',
    title: 'Викторина / Квиз',
    description: 'Задаёт вопросы с вариантами ответов и считает очки',
    emoji: '🎯',
    tags: ['квиз', 'игра', 'обучение'],
    nodes: [
      { id: 'start', type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'variable',  position: { x: 220, y: 200 }, data: { varOperation: 'set', varName: 'score', varValue: '0' } },
      { id: 'n2',    type: 'message',   position: { x: 460, y: 200 }, data: { text: '🎯 Привет! Давай проверим твои знания!\nОтвечай на вопросы и набирай очки.' } },
      { id: 'n3',    type: 'userInput', position: { x: 700, y: 200 }, data: { text: '❓ Вопрос 1: Столица Франции?', inputType: 'choice', variableName: 'q1', choices: ['Париж', 'Берлин', 'Мадрид', 'Рим'] } },
      { id: 'n4',    type: 'condition', position: { x: 940, y: 200 }, data: { variable: 'q1', operator: 'equals', value: 'Париж' } },
      { id: 'n5',    type: 'variable',  position: { x: 1180, y: 120 }, data: { varOperation: 'increment', varName: 'score', varValue: '1' } },
      { id: 'n6',    type: 'message',   position: { x: 1180, y: 320 }, data: { text: '❌ Неверно! Правильный ответ: Париж' } },
      { id: 'n7',    type: 'message',   position: { x: 1420, y: 200 }, data: { text: '🏆 Ваш результат: {{score}} очко(ов)!\n\nОтличная работа! 🎉' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5', sourceHandle: 'yes' },
      { id: 'e6', source: 'n4',   target: 'n6', sourceHandle: 'no' },
      { id: 'e7', source: 'n5',   target: 'n7' },
      { id: 'e8', source: 'n6',   target: 'n7' },
    ],
  },

  // ── 5. Multilingual YouTube notifier ──────────────────────────────────────────
  {
    id: 'youtube-multilang',
    title: 'YouTube + Мультиязык',
    description: 'Отслеживает YouTube-канал и переводит уведомление на язык пользователя',
    emoji: '▶️',
    tags: ['YouTube', 'перевод', 'мультиязык'],
    nodes: [
      { id: 'start', type: 'start',        position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'userLangPref', position: { x: 220, y: 200 }, data: { ulpQuestion: 'Выберите язык уведомлений:', ulpSaveVar: 'user_lang', ulpShowFlags: true, ulpLanguages: ['ru', 'en', 'de', 'fr', 'es', 'uk'] } },
      { id: 'n2',    type: 'message',      position: { x: 460, y: 200 }, data: { text: '✅ Язык сохранён! Теперь буду присылать уведомления с YouTube на вашем языке.' } },
      { id: 'n3',    type: 'youtubeMonitor', position: { x: 700, y: 200 }, data: { ytChannelId: 'UCxxxxxxxxx', ytCheckInterval: 15, ytNotifyVideos: true, ytNotifyStreams: true, ytAutoTranslate: true, ytMessageTemplate: '🎬 {{title}}\n👤 {{author}}\n▶️ {{url}}' } },
      { id: 'n4',    type: 'translate',    position: { x: 940, y: 200 }, data: { translateMode: 'userLang', translateSourceLang: 'auto', translateSourceVar: 'yt_message', translateResultVar: 'translated_msg', translateContentType: 'post' } },
      { id: 'n5',    type: 'message',      position: { x: 1180, y: 200 }, data: { text: '{{translated_msg}}' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5' },
    ],
  },

  // ── 6. Instagram monitor + translate ──────────────────────────────────────────
  {
    id: 'instagram-monitor',
    title: 'Instagram Monitor',
    description: 'Отслеживает Instagram-аккаунт, переводит посты на язык пользователя',
    emoji: '📸',
    tags: ['Instagram', 'соц.сети', 'перевод'],
    nodes: [
      { id: 'start', type: 'start',           position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'userLangPref',    position: { x: 220, y: 200 }, data: { ulpQuestion: '🌍 Choose language / Выберите язык:', ulpSaveVar: 'user_lang', ulpShowFlags: true, ulpLanguages: ['ru', 'en', 'de', 'es', 'fr'] } },
      { id: 'n2',    type: 'instagramMonitor', position: { x: 460, y: 200 }, data: { igCheckInterval: 30, igNotifyPosts: true, igNotifyReels: true, igTranslateContent: true, igTranslateContentType: 'both', igMessageTemplate: '📸 {{author}}\n\n{{caption}}\n\n🔗 {{url}}' } },
      { id: 'n3',    type: 'message',         position: { x: 700, y: 200 }, data: { text: '{{ig_translated_post}}', buttons: [{ id: gen(), label: '👁 Смотреть', url: '{{url}}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
    ],
  },

  // ── 7. Social hub ─────────────────────────────────────────────────────────────
  {
    id: 'social-hub',
    title: 'Хаб соц. сетей',
    description: 'Красивое меню со ссылками на все ваши ресурсы и каналы',
    emoji: '🌐',
    tags: ['меню', 'соц.сети', 'ссылки'],
    nodes: [
      { id: 'start', type: 'start',      position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',    position: { x: 220, y: 200 }, data: { text: '👋 Привет! Выбери, куда хочешь перейти:' } },
      { id: 'n2',    type: 'socialShare', position: { x: 460, y: 200 }, data: {
        shareText: '🔗 Наши ресурсы:',
        shareLayout: 'buttons',
        shareLinks: [
          { id: gen(), platform: 'telegram', label: '✈️ Telegram канал', url: 'https://t.me/your_channel' },
          { id: gen(), platform: 'youtube',  label: '▶️ YouTube',         url: 'https://youtube.com/@yourchannel' },
          { id: gen(), platform: 'instagram', label: '📸 Instagram',      url: 'https://instagram.com/yourprofile' },
          { id: gen(), platform: 'website',   label: '🌐 Наш сайт',       url: 'https://yoursite.com' },
        ],
      } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
    ],
  },

  // ── 8. Customer support ───────────────────────────────────────────────────────
  {
    id: 'support',
    title: 'Поддержка клиентов',
    description: 'FAQ + ИИ ответы + передача в живой чат через webhook',
    emoji: '🎧',
    tags: ['поддержка', 'ИИ', 'FAQ'],
    nodes: [
      { id: 'start', type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',   position: { x: 220, y: 200 }, data: { text: '🎧 Служба поддержки\n\nЧем могу помочь?', buttons: [{ id: gen(), label: '❓ Часто задаваемые вопросы', callbackData: 'faq' }, { id: gen(), label: '💬 Задать вопрос ИИ', callbackData: 'ai' }, { id: gen(), label: '👤 Связаться с оператором', callbackData: 'human' }] } },
      { id: 'n2',    type: 'userInput', position: { x: 460, y: 320 }, data: { text: 'Опишите вашу проблему:', inputType: 'text', variableName: 'support_question' } },
      { id: 'n3',    type: 'aiChat',    position: { x: 700, y: 320 }, data: { aiPrompt: 'Ты — специалист техподдержки. Помогай пользователям решить проблему. Если не можешь — предложи написать на support@company.com', aiModel: 'google/gemini-2.5-flash', aiResponseVar: 'support_answer' } },
      { id: 'n4',    type: 'message',   position: { x: 940, y: 320 }, data: { text: '{{support_answer}}', buttons: [{ id: gen(), label: '✅ Проблема решена', callbackData: 'done' }, { id: gen(), label: '🔄 Ещё вопрос', callbackData: 'retry' }] } },
      { id: 'n5',    type: 'action',    position: { x: 460, y: 500 }, data: { actionType: 'webhook', webhookUrl: 'https://your-helpdesk.com/ticket', webhookMethod: 'POST', message: 'Пользователь запросил живого оператора' } },
      { id: 'n6',    type: 'message',   position: { x: 700, y: 500 }, data: { text: '👤 Ваш запрос передан оператору.\nОжидайте ответа в течение 10 минут.' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n2' },
      { id: 'e6', source: 'n1',   target: 'n5' },
      { id: 'e7', source: 'n5',   target: 'n6' },
    ],
  },

  // ── 9. FB Monitor + translate ─────────────────────────────────────────────────
  {
    id: 'facebook-monitor',
    title: 'Facebook Monitor',
    description: 'Следит за Facebook страницей и переводит посты на язык пользователя',
    emoji: '📘',
    tags: ['Facebook', 'соц.сети', 'перевод'],
    nodes: [
      { id: 'start', type: 'start',          position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'userLangPref',   position: { x: 220, y: 200 }, data: { ulpQuestion: '🌍 Choose language:', ulpSaveVar: 'user_lang', ulpShowFlags: true, ulpLanguages: ['ru', 'en', 'de', 'uk', 'fr'] } },
      { id: 'n2',    type: 'facebookMonitor', position: { x: 460, y: 200 }, data: { fbCheckInterval: 30, fbNotifyPosts: true, fbNotifyVideos: true, fbTranslateContent: true, fbMessageTemplate: '📘 {{author}}\n\n{{text}}\n\n🔗 {{url}}' } },
      { id: 'n3',    type: 'translate',      position: { x: 700, y: 200 }, data: { translateMode: 'userLang', translateSourceLang: 'auto', translateSourceVar: 'fb_post_text', translateResultVar: 'translated_post', translateContentType: 'post' } },
      { id: 'n4',    type: 'message',        position: { x: 940, y: 200 }, data: { text: '{{translated_post}}' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
    ],
  },

  // ── 10. Language A/B ──────────────────────────────────────────────────────────
  {
    id: 'lang-ab',
    title: 'Авто-определение языка',
    description: 'Определяет язык пользователя и отвечает на его языке',
    emoji: '🌍',
    tags: ['мультиязык', 'ИИ', 'авто'],
    nodes: [
      { id: 'start', type: 'start',      position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',    position: { x: 220, y: 200 }, data: { text: 'Hello! / Привет! / Hola! 👋\nWrite anything and I\'ll reply in your language.' } },
      { id: 'n2',    type: 'userInput',  position: { x: 460, y: 200 }, data: { text: '...', inputType: 'text', variableName: 'first_message' } },
      { id: 'n3',    type: 'langDetect', position: { x: 700, y: 200 }, data: { langDetectVar: 'first_message', langResultVar: 'user_lang', langSetAsDefault: true } },
      { id: 'n4',    type: 'aiChat',     position: { x: 940, y: 200 }, data: { aiPrompt: 'Respond ONLY in the language with code: {{user_lang}}. Be friendly and helpful.', aiModel: 'google/gemini-2.5-flash', aiResponseVar: 'greeting', aiContext: '{{first_message}}' } },
      { id: 'n5',    type: 'message',    position: { x: 1180, y: 200 }, data: { text: '{{greeting}}' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5' },
    ],
  },

  // ── 11. Referral system ───────────────────────────────────────────────────────
  {
    id: 'referral',
    title: 'Реферальная система',
    description: 'Выдаёт реферальную ссылку, считает приглашённых друзей',
    emoji: '🎁',
    tags: ['реферал', 'маркетинг', 'бонусы'],
    nodes: [
      { id: 'start', type: 'start',    position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'variable', position: { x: 220, y: 200 }, data: { varOperation: 'set', varName: 'ref_count', varValue: '0' } },
      { id: 'n2',    type: 'message',  position: { x: 460, y: 200 }, data: { text: '🎁 Реферальная программа!\n\nПриглашайте друзей и получайте бонусы:\n• 1 друг = 50 баллов\n• 5 друзей = 300 баллов + VIP статус\n\nВаша ссылка:\nhttps://t.me/yourbot?start={{user_id}}' } },
      { id: 'n3',    type: 'userInput', position: { x: 700, y: 200 }, data: { text: 'Введите реферальный код друга (если есть):', inputType: 'text', variableName: 'ref_code' } },
      { id: 'n4',    type: 'condition', position: { x: 940, y: 200 }, data: { variable: 'ref_code', operator: 'isNotEmpty' } },
      { id: 'n5',    type: 'variable', position: { x: 1180, y: 120 }, data: { varOperation: 'increment', varName: 'ref_count', varValue: '1' } },
      { id: 'n6',    type: 'message',  position: { x: 1420, y: 120 }, data: { text: '✅ Реферальный код принят! +50 баллов вашему другу.' } },
      { id: 'n7',    type: 'message',  position: { x: 1180, y: 320 }, data: { text: 'Используйте свою ссылку чтобы приглашать друзей!' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
      { id: 'e5', source: 'n4',   target: 'n5', sourceHandle: 'yes' },
      { id: 'e6', source: 'n4',   target: 'n7', sourceHandle: 'no' },
      { id: 'e7', source: 'n5',   target: 'n6' },
    ],
  },

  // ── 12. Subscription reminder ─────────────────────────────────────────────────
  {
    id: 'subscription',
    title: 'Подписка и напоминания',
    description: 'Проверяет подписку на канал, выдаёт контент подписчикам',
    emoji: '🔔',
    tags: ['подписка', 'монетизация', 'контент'],
    nodes: [
      { id: 'start', type: 'start',     position: { x: 40,  y: 200 }, data: {} },
      { id: 'n1',    type: 'message',   position: { x: 220, y: 200 }, data: { text: '🔔 Привет!\n\nЧтобы получить доступ к эксклюзивному контенту — подпишись на наш канал:', buttons: [{ id: gen(), label: '✈️ Подписаться на канал', url: 'https://t.me/your_channel' }] } },
      { id: 'n2',    type: 'userInput', position: { x: 460, y: 200 }, data: { text: 'Нажмите кнопку когда подпишетесь:', inputType: 'choice', variableName: 'subscribed', choices: ['✅ Я подписался!'] } },
      { id: 'n3',    type: 'message',   position: { x: 700, y: 200 }, data: { text: '🎉 Отлично! Вот твой эксклюзивный контент:', buttons: [{ id: gen(), label: '📚 Получить материалы', callbackData: 'content' }, { id: gen(), label: '🎬 Последнее видео', url: 'https://youtube.com/your_video' }] } },
      { id: 'n4',    type: 'socialShare', position: { x: 940, y: 200 }, data: { shareText: '📌 Все наши ресурсы:', shareLayout: 'buttons', shareLinks: [{ id: gen(), platform: 'telegram', label: 'Канал', url: 'https://t.me/your_channel' }, { id: gen(), platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@yourchannel' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'n1' },
      { id: 'e2', source: 'n1',   target: 'n2' },
      { id: 'e3', source: 'n2',   target: 'n3' },
      { id: 'e4', source: 'n3',   target: 'n4' },
    ],
  },
];

const tagColors: Record<string, string> = {
  'простой': 'bg-success/10 text-success',
  'ИИ': 'bg-primary/10 text-primary',
  'соц.сети': 'bg-destructive/10 text-destructive',
  'перевод': 'bg-accent/10 text-accent-foreground',
  'мультиязык': 'bg-primary/10 text-primary',
  'YouTube': 'bg-destructive/10 text-destructive',
  'Instagram': 'bg-destructive/10 text-destructive',
  'Facebook': 'bg-primary/10 text-primary',
  'webhook': 'bg-accent/10 text-accent-foreground',
};

export function BotTemplatesPanel({ bot, onLoad, onMerge, onClose }: BotTemplatesPanelProps) {
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  // Re-generate all IDs so merged nodes don't collide with existing ones
  const remapIds = (tpl: typeof templates[0]): { nodes: BotNode[]; edges: BotEdge[] } => {
    const idMap: Record<string, string> = {};
    // skip remapping 'start' — there's already one on canvas
    tpl.nodes.forEach(n => {
      idMap[n.id] = n.id === 'start' ? n.id : gen();
    });
    const nodes: BotNode[] = tpl.nodes
      .filter(n => n.id !== 'start')
      .map(n => ({
        ...n,
        id: idMap[n.id],
        // Offset so merged nodes appear to the right of existing content
        position: { x: n.position.x + 200 + Math.random() * 60, y: n.position.y + 80 + Math.random() * 40 },
      }));
    const edges: BotEdge[] = tpl.edges
      .filter(e => e.source !== 'start' && e.target !== 'start')
      .map(e => ({
        ...e,
        id: gen(),
        source: idMap[e.source] ?? e.source,
        target: idMap[e.target] ?? e.target,
      }));
    return { nodes, edges };
  };

  const handleLoad = (tpl: typeof templates[0]) => {
    onLoad(tpl.nodes, tpl.edges);
    toast.success(`Шаблон "${tpl.title}" загружен!`);
    onClose();
  };

  const handleMerge = (tpl: typeof templates[0]) => {
    const { nodes, edges } = remapIds(tpl);
    onMerge(nodes, edges);
    toast.success(`Шаблон "${tpl.title}" добавлен к текущему потоку!`);
    setConfirmId(null);
  };

  return (
    <div className="w-96 border-l bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Шаблоны ботов</span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{templates.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b shrink-0">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Поиск шаблонов..."
          className="w-full h-8 px-3 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Banner */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="rounded-lg bg-muted/50 p-2.5 flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Загрузка шаблона <strong>заменит</strong> текущий поток. Убедитесь что сохранили важное.</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filtered.map(tpl => (
            <div key={tpl.id} className="rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden">
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tpl.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{tpl.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{tpl.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2.5">
                  {tpl.tags.map(tag => (
                    <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag] || 'bg-muted text-muted-foreground'}`}>
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {tpl.nodes.length} узлов
                  </span>
                </div>

                {confirmId === tpl.id ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => { handleLoad(tpl); setConfirmId(null); }}>
                      ✅ Загрузить
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setConfirmId(null)}>
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    onClick={() => setConfirmId(tpl.id)}
                  >
                    Использовать шаблон →
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Шаблоны не найдены по запросу "{search}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
