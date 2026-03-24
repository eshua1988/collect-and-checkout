import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { FormData, FormField } from '@/types/form';
import { TelegramBot } from '@/types/bot';
import { AppWebsite } from '@/types/website';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ParsedAction[];
}

export interface ParsedAction {
  type: 'CREATE_FORM' | 'CREATE_BOT' | 'CREATE_WEBSITE' | 'NAVIGATE_TO';
  data: any;
  executed?: boolean;
}

const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Привет! Я **AI-ассистент** этой платформы.

Я могу создавать и редактировать:
- 📋 **Формы** — опросы, анкеты, заявки
- 🤖 **Telegram-боты** — с логикой, кнопками, AI
- 🌐 **Сайты** — лендинги, портфолио, магазины
- 📄 **Документы** — договоры, шаблоны

Просто опиши что хочешь создать!`,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { saveForm } = useFormsStorage();
  const { saveBot } = useBotsStorage();
  const { saveWebsite } = useWebsitesStorage();

  const parseActions = useCallback((text: string): ParsedAction[] => {
    const actions: ParsedAction[] = [];
    const regex = /```action\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed.type && parsed.data) {
          actions.push(parsed);
        }
      } catch {
        // skip malformed
      }
    }
    return actions;
  }, []);

  const executeAction = useCallback(async (action: ParsedAction) => {
    const genId = () => Math.random().toString(36).substring(2, 12);
    const now = Date.now();

    if (action.type === 'CREATE_FORM') {
      const form: FormData = {
        id: genId(),
        title: action.data.title || 'Новая форма',
        description: action.data.description || '',
        fields: (action.data.fields || []).map((f: any) => ({
          ...f,
          id: f.id || genId(),
        })) as FormField[],
        completionMessage: action.data.completionMessage || 'Спасибо!',
        paymentEnabled: action.data.paymentEnabled || false,
        totalAmount: action.data.totalAmount || 0,
        createdAt: now,
        updatedAt: now,
        published: false,
      };
      saveForm(form);
      toast.success(`Форма "${form.title}" создана!`);
      navigate(`/form/${form.id}`);
      return form.id;
    }

    if (action.type === 'CREATE_BOT') {
      const bot: TelegramBot = {
        id: genId(),
        name: action.data.name || 'Новый бот',
        token: action.data.token || '',
        nodes: action.data.nodes || [],
        edges: action.data.edges || [],
        createdAt: now,
        updatedAt: now,
      };
      saveBot(bot);
      toast.success(`Бот "${bot.name}" создан!`);
      navigate(`/bot/${bot.id}`);
      return bot.id;
    }

    if (action.type === 'CREATE_WEBSITE') {
      const site: AppWebsite = {
        id: genId(),
        name: action.data.name || 'Новый сайт',
        description: action.data.description || '',
        published: false,
        blocks: (action.data.blocks || []).map((b: any) => ({
          ...b,
          id: b.id || genId(),
        })),
        createdAt: now,
        updatedAt: now,
      };
      saveWebsite(site);
      toast.success(`Сайт "${site.name}" создан!`);
      navigate(`/site/edit/${site.id}`);
      return site.id;
    }

    if (action.type === 'NAVIGATE_TO') {
      navigate(action.data.path);
    }
  }, [saveForm, saveBot, saveWebsite, navigate]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    const history = [...messages, userMsg].filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();

    // Add placeholder
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const resp = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Ошибка соединения' }));
        toast.error(errData.error || 'Ошибка AI');
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Parse and attach actions
      const actions = parseActions(assistantContent);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: assistantContent, actions } : m
      ));
    } catch (e) {
      console.error(e);
      toast.error('Ошибка AI ассистента');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, parseActions]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `👋 Привет! Я **AI-ассистент** этой платформы.\n\nЯ могу создавать и редактировать:\n- 📋 **Формы** — опросы, анкеты, заявки\n- 🤖 **Telegram-боты** — с логикой, кнопками, AI\n- 🌐 **Сайты** — лендинги, портфолио, магазины\n- 📄 **Документы** — договоры, шаблоны\n\nПросто опиши что хочешь создать!`,
    }]);
  }, []);

  return { messages, isLoading, sendMessage, executeAction, clearMessages };
}
