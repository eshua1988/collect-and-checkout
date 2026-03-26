import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { FormData, FormField } from '@/types/form';
import { TelegramBot, BotNode, BotEdge } from '@/types/bot';
import { AppWebsite } from '@/types/website';
import { useAIHistory } from './useAIHistory';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ParsedAction[];
}

export interface ParsedAction {
  type: 'CREATE_FORM' | 'CREATE_BOT' | 'CREATE_WEBSITE' | 'NAVIGATE_TO' | 'ADD_BOT_NODES' | 'REGISTER_NODE_TYPE';
  data: any;
  executed?: boolean;
}

/** Context injected into AI when user is on a specific page */
export interface AIContext {
  type: 'bot';
  botId: string;
  botName: string;
  nodeCount: number;
  nodeTypes: string[];
}

const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const genId = () => Math.random().toString(36).substring(2, 12);

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Привет! Я **AI-ассистент** этой платформы.

Я могу создавать и редактировать:
- 📋 **Формы** — опросы, анкеты, заявки
- 🤖 **Telegram-боты** — добавляю узлы, логику, ветвления
- 🌐 **Сайты** — лендинги, портфолио, магазины
- 📄 **Документы** — договоры, шаблоны

Если ты сейчас в редакторе бота — я могу **добавить новые узлы и логику** прямо в твой поток!`,
};

// Custom node types registered by AI — stored in localStorage
const CUSTOM_NODES_KEY = 'ai_custom_node_types';

export function getCustomNodeTypes(): Record<string, { label: string; icon: string; color: string; description: string }> {
  try {
    const raw = localStorage.getItem(CUSTOM_NODES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCustomNodeType(type: string, meta: { label: string; icon: string; color: string; description: string }) {
  const existing = getCustomNodeTypes();
  existing[type] = meta;
  localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(existing));
}

export function useAIAssistant(aiContext?: AIContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([WELCOME_MESSAGE]);

  const navigate = useNavigate();
  const location = useLocation();
  const { saveForm } = useFormsStorage();
  const { saveBot, getBot } = useBotsStorage();
  const { saveWebsite } = useWebsitesStorage();

  const history = useAIHistory(WELCOME_MESSAGE);

  // Keep messagesRef in sync
  const updateMessages = useCallback((updater: ((prev: ChatMessage[]) => ChatMessage[]) | ChatMessage[]) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  const parseActions = useCallback((text: string): ParsedAction[] => {
    const actions: ParsedAction[] = [];
    const regex = /```action\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed.type && parsed.data) actions.push(parsed);
      } catch { /* skip */ }
    }
    return actions;
  }, []);

  const executeAction = useCallback(async (action: ParsedAction) => {
    const now = Date.now();

    // ── REGISTER CUSTOM NODE TYPE ──────────────────────────────────
    if (action.type === 'REGISTER_NODE_TYPE') {
      const { nodeType, label, icon, color, description } = action.data;
      if (!nodeType || !label) {
        toast.error('Не указан тип или название узла');
        return;
      }
      saveCustomNodeType(nodeType, { label, icon: icon || '🔧', color: color || 'bg-muted', description: description || '' });
      toast.success(`Тип узла "${label}" зарегистрирован в панели инструментов!`);
      return nodeType;
    }

    // ── CREATE FORM ────────────────────────────────────────────────
    if (action.type === 'CREATE_FORM') {
      const form: FormData = {
        id: genId(),
        title: action.data.title || 'Новая форма',
        description: action.data.description || '',
        fields: (action.data.fields || []).map((f: any) => ({ ...f, id: f.id || genId() })) as FormField[],
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

    // ── CREATE BOT ─────────────────────────────────────────────────
    if (action.type === 'CREATE_BOT') {
      const bot: TelegramBot = {
        id: genId(),
        name: action.data.name || 'Новый бот',
        token: action.data.token || '',
        nodes: (action.data.nodes || []).map((n: any) => ({ ...n, id: n.id || genId() })),
        edges: (action.data.edges || []).map((e: any) => ({ ...e, id: e.id || genId() })),
        createdAt: now,
        updatedAt: now,
      };
      saveBot(bot);
      toast.success(`Бот "${bot.name}" создан!`);
      navigate(`/bot/${bot.id}`);
      return bot.id;
    }

    // ── ADD NODES TO EXISTING BOT ──────────────────────────────────
    if (action.type === 'ADD_BOT_NODES') {
      const targetBotId = action.data.botId || aiContext?.botId;
      if (!targetBotId) {
        toast.error('Не указан ID бота для добавления узлов');
        return;
      }

      const existingBot = getBot(targetBotId);
      if (!existingBot) {
        toast.error('Бот не найден');
        return;
      }

      // Register any new node types that AI declared
      if (action.data.newNodeTypes && Array.isArray(action.data.newNodeTypes)) {
        for (const nt of action.data.newNodeTypes) {
          if (nt.nodeType && nt.label) {
            saveCustomNodeType(nt.nodeType, {
              label: nt.label,
              icon: nt.icon || '🔧',
              color: nt.color || 'bg-muted text-muted-foreground border-border',
              description: nt.description || '',
            });
          }
        }
        if (action.data.newNodeTypes.length > 0) {
          toast.info(`Добавлено ${action.data.newNodeTypes.length} новых типов узлов в панель инструментов`);
        }
      }

      // Remap IDs to avoid collisions with existing nodes
      const idMap: Record<string, string> = {};
      const newNodes: BotNode[] = (action.data.nodes || []).map((n: any) => {
        const newId = genId();
        idMap[n.id] = newId;
        const offsetX = 400 + Math.random() * 100;
        const offsetY = 200 + Math.random() * 100;
        return {
          ...n,
          id: newId,
          position: {
            x: (n.position?.x || 200) + offsetX,
            y: (n.position?.y || 100) + offsetY,
          },
        };
      });

      const newEdges: BotEdge[] = (action.data.edges || []).map((e: any) => ({
        ...e,
        id: genId(),
        source: idMap[e.source] || e.source,
        target: idMap[e.target] || e.target,
      }));

      const updatedBot: TelegramBot = {
        ...existingBot,
        nodes: [...existingBot.nodes, ...newNodes],
        edges: [...existingBot.edges, ...newEdges],
        updatedAt: now,
      };

      saveBot(updatedBot);
      toast.success(`Добавлено ${newNodes.length} узлов в бот "${existingBot.name}"! Переключись на вкладку "Поток".`);

      const currentPath = location.pathname;
      const botPath = `/bot/${targetBotId}`;
      if (!currentPath.startsWith('/bot/')) {
        navigate(botPath);
      }
      return targetBotId;
    }

    // ── CREATE WEBSITE ─────────────────────────────────────────────
    if (action.type === 'CREATE_WEBSITE') {
      const site: AppWebsite = {
        id: genId(),
        name: action.data.name || 'Новый сайт',
        description: action.data.description || '',
        published: false,
        blocks: (action.data.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
        createdAt: now,
        updatedAt: now,
      };
      saveWebsite(site);
      toast.success(`Сайт "${site.name}" создан!`);
      navigate(`/site/edit/${site.id}`);
      return site.id;
    }

    // ── NAVIGATE ───────────────────────────────────────────────────
    if (action.type === 'NAVIGATE_TO') {
      navigate(action.data.path);
    }
  }, [saveForm, saveBot, saveWebsite, navigate, location, aiContext, getBot]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    const currentMessages = messagesRef.current;
    const history_msgs = [...currentMessages, userMsg]
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    updateMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();
    updateMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const body: any = { messages: history_msgs };

      if (aiContext?.type === 'bot') {
        // Include available node types so AI can reuse them
        const customNodes = getCustomNodeTypes();
        const customNodeList = Object.entries(customNodes).map(([type, meta]) =>
          `${type} (${meta.label})`
        ).join(', ');

        body.context = {
          type: 'bot_editor',
          botId: aiContext.botId,
          botName: aiContext.botName,
          nodeCount: aiContext.nodeCount,
          nodeTypes: aiContext.nodeTypes,
          customNodeTypes: customNodeList || 'none',
        };
      }

      const resp = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Ошибка соединения' }));
        toast.error(errData.error || 'Ошибка AI');
        updateMessages(prev => prev.filter(m => m.id !== assistantId));
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
              updateMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      const actions = parseActions(assistantContent);
      updateMessages(prev => {
        const updated = prev.map(m =>
          m.id === assistantId ? { ...m, content: assistantContent, actions } : m
        );
        // Auto-save to history after assistant responds
        history.saveSession(updated);
        return updated;
      });
    } catch (e) {
      console.error(e);
      toast.error('Ошибка AI ассистента');
      updateMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, parseActions, aiContext, updateMessages, history]);

  const clearMessages = useCallback(() => {
    const fresh = [WELCOME_MESSAGE];
    messagesRef.current = fresh;
    setMessages(fresh);
    history.createNewSession();
  }, [history]);

  const loadHistorySession = useCallback((index: number) => {
    const loaded = history.loadSession(index);
    messagesRef.current = loaded;
    setMessages(loaded);
  }, [history]);

  const goToPrevSession = useCallback(() => {
    const loaded = history.goToPrev();
    messagesRef.current = loaded;
    setMessages(loaded);
  }, [history]);

  const goToNextSession = useCallback(() => {
    const loaded = history.goToNext();
    messagesRef.current = loaded;
    setMessages(loaded);
  }, [history]);

  return {
    messages,
    isLoading,
    sendMessage,
    executeAction,
    clearMessages,
    // History
    historyState: history,
    loadHistorySession,
    goToPrevSession,
    goToNextSession,
  };
}
