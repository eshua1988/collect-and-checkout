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
  images?: string[]; // base64 data URLs for display
}

export interface ParsedAction {
  type: 'CREATE_FORM' | 'CREATE_BOT' | 'CREATE_WEBSITE' | 'NAVIGATE_TO' | 'ADD_BOT_NODES' | 'REGISTER_NODE_TYPE' | 'REPLACE_BOT' | 'EDIT_BOT_NODE' | 'REMOVE_BOT_NODES' | 'ADD_WEBSITE_BLOCKS' | 'ADD_FORM_FIELDS' | 'REPLACE_FORM' | 'EDIT_FORM_FIELD' | 'REMOVE_FORM_FIELDS' | 'REPLACE_WEBSITE' | 'EDIT_WEBSITE_BLOCK' | 'REMOVE_WEBSITE_BLOCKS' | 'REGISTER_FIELD_TYPE' | 'REGISTER_BLOCK_TYPE';
  data: any;
  executed?: boolean;
}

/** Context injected into AI when user is on a specific page */
export type AIContext =
  | { type: 'bot'; botId: string; botName: string; nodeCount: number; nodeTypes: string[]; nodes?: BotNode[]; edges?: BotEdge[] }
  | { type: 'form'; formId: string; formTitle: string; fieldCount: number; fields?: FormField[] }
  | { type: 'website'; websiteId: string; websiteName: string; blockCount: number; pageCount: number; blocks?: any[]; pages?: any[] };

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
  // Notify BotFlowEditor in the same tab to refresh its toolbar immediately
  window.dispatchEvent(new CustomEvent('customNodeTypesUpdated'));
}

// Built-in node types — nodes with any other type are auto-registered as custom
const BASE_NODE_TYPES_SET = new Set([
  'start', 'message', 'userInput', 'condition', 'action',
  'aiChat', 'delay', 'media', 'variable', 'randomizer', 'jump',
  'translate', 'langDetect', 'youtubeMonitor', 'socialShare',
  'instagramMonitor', 'facebookMonitor', 'userLangPref',
]);

// Custom FORM field types registered by AI — stored in localStorage
const CUSTOM_FIELDS_KEY = 'ai_custom_field_types';

export function getCustomFieldTypes(): Record<string, { label: string; icon: string; description: string; defaultProps?: Record<string, any> }> {
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCustomFieldType(type: string, meta: { label: string; icon: string; description: string; defaultProps?: Record<string, any> }) {
  const existing = getCustomFieldTypes();
  existing[type] = meta;
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('customFieldTypesUpdated'));
}

// Custom WEBSITE block types registered by AI — stored in localStorage
const CUSTOM_BLOCKS_KEY = 'ai_custom_block_types';

export function getCustomBlockTypes(): Record<string, { label: string; icon: string; description: string; defaultContent?: Record<string, any> }> {
  try {
    const raw = localStorage.getItem(CUSTOM_BLOCKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCustomBlockType(type: string, meta: { label: string; icon: string; description: string; defaultContent?: Record<string, any> }) {
  const existing = getCustomBlockTypes();
  existing[type] = meta;
  localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('customBlockTypesUpdated'));
}

/** Scans nodes for unknown types and auto-registers them in the toolbar. Returns count of new registrations. */
function autoRegisterUnknownNodeTypes(nodes: any[]): number {
  let count = 0;
  for (const node of nodes) {
    const t = node.type as string;
    if (!t || BASE_NODE_TYPES_SET.has(t)) continue;
    const existing = getCustomNodeTypes();
    if (existing[t]) continue; // already registered
    saveCustomNodeType(t, {
      label: node.data?.label || node.data?.title || t,
      icon: node.data?.icon || '🔧',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      description: node.data?.description || '',
    });
    count++;
  }
  return count;
}

export function useAIAssistant(aiContext?: AIContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([WELCOME_MESSAGE]);

  const navigate = useNavigate();
  const location = useLocation();
  const { saveForm, getForm } = useFormsStorage();
  const { saveBot, getBot } = useBotsStorage();
  const { saveWebsite, getWebsite } = useWebsitesStorage();

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
    // Fallback: if no closed action block found, try to find an unclosed one (truncated response)
    if (actions.length === 0) {
      const unclosed = text.match(/```action\n([\s\S]+)$/);
      if (unclosed) {
        let json = unclosed[1].trim();
        // Try to repair truncated JSON by closing brackets
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const parsed = JSON.parse(json);
            if (parsed.type && parsed.data) { actions.push(parsed); break; }
          } catch {
            // Try appending closing brackets
            const openBraces = (json.match(/\{/g) || []).length;
            const closeBraces = (json.match(/\}/g) || []).length;
            const openBrackets = (json.match(/\[/g) || []).length;
            const closeBrackets = (json.match(/\]/g) || []).length;
            // Remove trailing comma if present
            json = json.replace(/,\s*$/, '');
            if (openBrackets > closeBrackets) json += ']'.repeat(openBrackets - closeBrackets);
            if (openBraces > closeBraces) json += '}'.repeat(openBraces - closeBraces);
            if (attempt > 0) break; // only try repair once
          }
        }
      }
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

    // ── REGISTER CUSTOM FIELD TYPE (для форм) ──────────────────────
    if (action.type === 'REGISTER_FIELD_TYPE') {
      const { fieldType, label, icon, description, defaultProps } = action.data;
      if (!fieldType || !label) {
        toast.error('Не указан тип или название поля');
        return;
      }
      saveCustomFieldType(fieldType, { label, icon: icon || '📝', description: description || '', defaultProps: defaultProps || {} });
      toast.success(`Тип поля "${label}" зарегистрирован в панели формы!`);
      return fieldType;
    }

    // ── REGISTER CUSTOM BLOCK TYPE (для сайтов) ────────────────────
    if (action.type === 'REGISTER_BLOCK_TYPE') {
      const { blockType, label, icon, description, defaultContent } = action.data;
      if (!blockType || !label) {
        toast.error('Не указан тип или название блока');
        return;
      }
      saveCustomBlockType(blockType, { label, icon: icon || '🧩', description: description || '', defaultContent: defaultContent || {} });
      toast.success(`Тип блока "${label}" зарегистрирован в конструкторе сайтов!`);
      return blockType;
    }

    // ── CREATE FORM ────────────────────────────────────────────────
    if (action.type === 'CREATE_FORM') {
      // Register any new field types declared by AI
      if (action.data.newFieldTypes && Array.isArray(action.data.newFieldTypes)) {
        for (const ft of action.data.newFieldTypes) {
          if (ft.fieldType && ft.label) {
            saveCustomFieldType(ft.fieldType, { label: ft.label, icon: ft.icon || '📝', description: ft.description || '', defaultProps: ft.defaultProps || {} });
          }
        }
        if (action.data.newFieldTypes.length > 0) toast.info(`🔧 ${action.data.newFieldTypes.length} новых типов полей добавлено`);
      }
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

    // ── ADD FORM FIELDS (добавление полей в существующую форму) ───
    if (action.type === 'ADD_FORM_FIELDS') {
      // Register any new field types declared by AI
      if (action.data.newFieldTypes && Array.isArray(action.data.newFieldTypes)) {
        for (const ft of action.data.newFieldTypes) {
          if (ft.fieldType && ft.label) {
            saveCustomFieldType(ft.fieldType, { label: ft.label, icon: ft.icon || '📝', description: ft.description || '', defaultProps: ft.defaultProps || {} });
          }
        }
      }
      const targetFormId = action.data.formId || (aiContext?.type === 'form' ? aiContext.formId : null);
      if (!targetFormId) { toast.error('Не указан ID формы'); return; }
      const existingForm = getForm(targetFormId);
      if (!existingForm) { toast.error('Форма не найдена'); return; }

      const newFields = (action.data.fields || []).map((f: any) => ({ ...f, id: f.id || genId() })) as FormField[];
      if (newFields.length === 0) { toast.error('Нет полей для добавления'); return; }

      const updatedForm: FormData = {
        ...existingForm,
        fields: [...existingForm.fields, ...newFields],
        updatedAt: now,
      };
      saveForm(updatedForm);
      toast.success(`Добавлено ${newFields.length} полей в форму "${existingForm.title}"`);
      navigate(`/form/${existingForm.id}`);
      return existingForm.id;
    }

    // ── REPLACE FORM (полная замена полей формы) ───────────────────
    if (action.type === 'REPLACE_FORM') {
      // Register any new field types declared by AI
      if (action.data.newFieldTypes && Array.isArray(action.data.newFieldTypes)) {
        for (const ft of action.data.newFieldTypes) {
          if (ft.fieldType && ft.label) {
            saveCustomFieldType(ft.fieldType, { label: ft.label, icon: ft.icon || '📝', description: ft.description || '', defaultProps: ft.defaultProps || {} });
          }
        }
      }
      const targetFormId = action.data.formId || (aiContext?.type === 'form' ? aiContext.formId : null);
      if (!targetFormId) { toast.error('Не указан ID формы'); return; }
      const existingForm = getForm(targetFormId);
      if (!existingForm) { toast.error('Форма не найдена'); return; }

      const newFields = (action.data.fields || []).map((f: any) => ({ ...f, id: f.id || genId() })) as FormField[];
      const updatedForm: FormData = {
        ...existingForm,
        title: action.data.title || existingForm.title,
        description: action.data.description ?? existingForm.description,
        fields: newFields,
        completionMessage: action.data.completionMessage || existingForm.completionMessage,
        updatedAt: now,
      };
      saveForm(updatedForm);
      toast.success(`Форма "${updatedForm.title}" полностью обновлена! ${newFields.length} полей.`);
      return targetFormId;
    }

    // ── EDIT FORM FIELD (изменение данных одного поля) ─────────────
    if (action.type === 'EDIT_FORM_FIELD') {
      const targetFormId = action.data.formId || (aiContext?.type === 'form' ? aiContext.formId : null);
      if (!targetFormId) { toast.error('Не указан ID формы'); return; }
      const existingForm = getForm(targetFormId);
      if (!existingForm) { toast.error('Форма не найдена'); return; }

      const { fieldId, newData } = action.data;
      if (!fieldId || !newData) { toast.error('Не указан fieldId или newData'); return; }

      const patchedCount = existingForm.fields.filter(f => f.id === fieldId).length;
      if (patchedCount === 0) { toast.error(`Поле "${fieldId}" не найдено`); return; }

      const updatedFields = existingForm.fields.map(f =>
        f.id === fieldId ? { ...f, ...newData } : f
      );
      saveForm({ ...existingForm, fields: updatedFields, updatedAt: now });
      toast.success(`Поле "${fieldId}" обновлено.`);
      return targetFormId;
    }

    // ── REMOVE FORM FIELDS (удаление полей по ID) ──────────────────
    if (action.type === 'REMOVE_FORM_FIELDS') {
      const targetFormId = action.data.formId || (aiContext?.type === 'form' ? aiContext.formId : null);
      if (!targetFormId) { toast.error('Не указан ID формы'); return; }
      const existingForm = getForm(targetFormId);
      if (!existingForm) { toast.error('Форма не найдена'); return; }

      const removeIds: string[] = Array.isArray(action.data.fieldIds) ? action.data.fieldIds : [];
      if (removeIds.length === 0) { toast.error('Не указаны fieldIds для удаления'); return; }

      const removeSet = new Set(removeIds);
      const filteredFields = existingForm.fields.filter(f => !removeSet.has(f.id));
      saveForm({ ...existingForm, fields: filteredFields, updatedAt: now });
      toast.success(`Удалено ${removeIds.length} полей из формы "${existingForm.title}".`);
      return targetFormId;
    }

    // ── CREATE BOT ─────────────────────────────────────────────────
    if (action.type === 'CREATE_BOT') {
      const rawNodes: any[] = action.data.nodes || [];
      // Remap node IDs to avoid collisions, keep AI-supplied IDs if stable
      const idMap: Record<string, string> = {};
      const mappedNodes = rawNodes.map((n: any, i: number) => {
        const newId = n.id || genId();
        idMap[n.id] = newId;
        return {
          ...n,
          id: newId,
          position: {
            x: n.position?.x ?? 100 + (i % 3) * 250,
            y: n.position?.y ?? 100 + Math.floor(i / 3) * 180,
          },
        };
      });
      const mappedEdges = (action.data.edges || []).map((e: any) => ({
        ...e,
        id: e.id || genId(),
        source: idMap[e.source] || e.source,
        target: idMap[e.target] || e.target,
      }));

      // FALLBACK: if AI returned 0 edges but there are 2+ nodes — auto-wire a linear chain
      // so the bot is never left with disconnected nodes
      let finalEdges = mappedEdges;
      if (finalEdges.length === 0 && mappedNodes.length > 1) {
        finalEdges = mappedNodes.slice(0, -1).map((n: any, i: number) => ({
          id: genId(),
          source: n.id,
          target: mappedNodes[i + 1].id,
          animated: true,
        }));
        toast.warning(`⚠️ ИИ не создал связи — авто-создано ${finalEdges.length} линейных связей. Проверь в редакторе.`);
      }

      // Register explicitly declared custom node types (newNodeTypes field)
      const explicitNewTypes: any[] = action.data.newNodeTypes || [];
      for (const nt of explicitNewTypes) {
        if (nt.nodeType && nt.label) {
          saveCustomNodeType(nt.nodeType, {
            label: nt.label,
            icon: nt.icon || '🔧',
            color: nt.color || 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            description: nt.description || '',
          });
        }
      }
      // Auto-register any unknown node types found in the nodes list
      const autoNewCount = autoRegisterUnknownNodeTypes(mappedNodes);
      const totalNewTypes = autoNewCount + explicitNewTypes.filter((n: any) => n.nodeType && n.label).length;
      if (totalNewTypes > 0) {
        toast.info(`🔧 ${totalNewTypes} новых типа узлов добавлено в панель инструментов`);
      }

      const bot: TelegramBot = {
        id: genId(),
        name: action.data.name || 'Новый бот',
        token: action.data.token || '',
        nodes: mappedNodes,
        edges: finalEdges,
        createdAt: now,
        updatedAt: now,
      };
      saveBot(bot);
      toast.success(`Бот "${bot.name}" создан! ${mappedNodes.length} узлов, ${finalEdges.length} связей.`);
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
      const newNodes: BotNode[] = (action.data.nodes || []).map((n: any, i: number) => {
        const newId = genId();
        idMap[n.id] = newId;
        // Place new nodes to the right of existing ones, with safe fallback for missing position
        const baseX = n.position?.x ?? (100 + (i % 3) * 240);
        const baseY = n.position?.y ?? (100 + Math.floor(i / 3) * 180);
        return {
          ...n,
          id: newId,
          position: { x: baseX + 250, y: baseY },
        };
      });

      const newEdges: BotEdge[] = (action.data.edges || []).map((e: any) => ({
        ...e,
        id: genId(),
        source: idMap[e.source] || e.source,
        target: idMap[e.target] || e.target,
      }));

      // Auto-register unknown node types from the newly added nodes
      autoRegisterUnknownNodeTypes(newNodes);

      // FALLBACK: if AI returned 0 edges but added 2+ nodes — auto-wire linearly
      let finalNewEdges: BotEdge[] = newEdges;
      if (finalNewEdges.length === 0 && newNodes.length > 1) {
        finalNewEdges = newNodes.slice(0, -1).map((n: BotNode, i: number) => ({
          id: genId(),
          source: n.id,
          target: newNodes[i + 1].id,
          animated: true,
        })) as BotEdge[];
      }

      const updatedBot: TelegramBot = {
        ...existingBot,
        nodes: [...existingBot.nodes, ...newNodes],
        edges: [...existingBot.edges, ...finalNewEdges],
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

    // ── REPLACE BOT (полная замена узлов и связей) ─────────────────
    if (action.type === 'REPLACE_BOT') {
      const targetBotId = action.data.botId || aiContext?.botId;
      if (!targetBotId) { toast.error('Не указан ID бота'); return; }
      const existingBot = getBot(targetBotId);
      if (!existingBot) { toast.error('Бот не найден'); return; }

      const rawNodes: any[] = action.data.nodes || [];
      const idMap: Record<string, string> = {};
      const mappedNodes: BotNode[] = rawNodes.map((n: any, i: number) => {
        const newId = n.id || genId();
        idMap[n.id] = newId;
        return { ...n, id: newId, position: { x: n.position?.x ?? 100 + (i % 3) * 250, y: n.position?.y ?? 100 + Math.floor(i / 3) * 180 } };
      });
      let mappedEdges: BotEdge[] = (action.data.edges || []).map((e: any) => ({
        ...e, id: e.id || genId(), source: idMap[e.source] || e.source, target: idMap[e.target] || e.target,
      }));
      if (mappedEdges.length === 0 && mappedNodes.length > 1) {
        mappedEdges = mappedNodes.slice(0, -1).map((n: BotNode, i: number) => ({
          id: genId(), source: n.id, target: mappedNodes[i + 1].id, animated: true,
        })) as BotEdge[];
      }
      const explicitNewTypes: any[] = action.data.newNodeTypes || [];
      for (const nt of explicitNewTypes) {
        if (nt.nodeType && nt.label) saveCustomNodeType(nt.nodeType, { label: nt.label, icon: nt.icon || '🔧', color: nt.color || 'bg-purple-500/10 text-purple-400 border-purple-500/30', description: nt.description || '' });
      }
      autoRegisterUnknownNodeTypes(mappedNodes);

      const updatedBot: TelegramBot = { ...existingBot, nodes: mappedNodes, edges: mappedEdges, updatedAt: now };
      saveBot(updatedBot);
      toast.success(`Бот "${existingBot.name}" полностью обновлён! ${mappedNodes.length} узлов, ${mappedEdges.length} связей.`);
      return targetBotId;
    }

    // ── EDIT BOT NODE (изменение данных одного узла) ───────────────
    if (action.type === 'EDIT_BOT_NODE') {
      const targetBotId = action.data.botId || aiContext?.botId;
      if (!targetBotId) { toast.error('Не указан ID бота'); return; }
      const existingBot = getBot(targetBotId);
      if (!existingBot) { toast.error('Бот не найден'); return; }

      const { nodeId, newData } = action.data;
      if (!nodeId || !newData) { toast.error('Не указан nodeId или newData'); return; }

      const updatedNodes: BotNode[] = existingBot.nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
      );
      const patchedCount = existingBot.nodes.filter(n => n.id === nodeId).length;
      if (patchedCount === 0) { toast.error(`Узел "${nodeId}" не найден`); return; }

      saveBot({ ...existingBot, nodes: updatedNodes, updatedAt: now });
      toast.success(`Узел "${nodeId}" обновлён.`);
      return targetBotId;
    }

    // ── REMOVE BOT NODES (удаление узлов по ID) ────────────────────
    if (action.type === 'REMOVE_BOT_NODES') {
      const targetBotId = action.data.botId || aiContext?.botId;
      if (!targetBotId) { toast.error('Не указан ID бота'); return; }
      const existingBot = getBot(targetBotId);
      if (!existingBot) { toast.error('Бот не найден'); return; }

      const removeIds: string[] = Array.isArray(action.data.nodeIds) ? action.data.nodeIds : [];
      if (removeIds.length === 0) { toast.error('Не указаны nodeIds для удаления'); return; }

      const removeSet = new Set(removeIds);
      const filteredNodes: BotNode[] = existingBot.nodes.filter(n => !removeSet.has(n.id));
      const filteredEdges: BotEdge[] = existingBot.edges.filter(e => !removeSet.has(e.source) && !removeSet.has(e.target));

      saveBot({ ...existingBot, nodes: filteredNodes, edges: filteredEdges, updatedAt: now });
      toast.success(`Удалено ${removeIds.length} узлов из бота "${existingBot.name}".`);
      return targetBotId;
    }

    // ── CREATE WEBSITE ─────────────────────────────────────────────
    if (action.type === 'CREATE_WEBSITE') {
      // Register any new block types declared by AI
      if (action.data.newBlockTypes && Array.isArray(action.data.newBlockTypes)) {
        for (const bt of action.data.newBlockTypes) {
          if (bt.blockType && bt.label) {
            saveCustomBlockType(bt.blockType, { label: bt.label, icon: bt.icon || '🧩', description: bt.description || '', defaultContent: bt.defaultContent || {} });
          }
        }
        if (action.data.newBlockTypes.length > 0) toast.info(`🧩 ${action.data.newBlockTypes.length} новых типов блоков добавлено`);
      }
      // Support multi-page: action.data.pages or fallback to action.data.blocks
      const pages = action.data.pages
        ? (action.data.pages as any[]).map((p: any) => ({
            id: p.id || genId(),
            slug: p.slug || 'home',
            title: p.title || p.slug || 'Страница',
            blocks: (p.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
          }))
        : undefined;

      const site: AppWebsite = {
        id: genId(),
        name: action.data.name || 'Новый сайт',
        description: action.data.description || '',
        published: false,
        blocks: pages
          ? (pages.find(p => p.slug === 'home')?.blocks || pages[0]?.blocks || [])
          : (action.data.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
        pages,
        createdAt: now,
        updatedAt: now,
      };
      saveWebsite(site);
      const pageCount = pages ? pages.length : 1;
      toast.success(`Сайт "${site.name}" создан! ${pageCount > 1 ? `(${pageCount} страниц)` : ''}`);
      navigate(`/site/edit/${site.id}`);
      return site.id;
    }

    // ── ADD WEBSITE BLOCKS (добавление блоков в существующий сайт) ─
    if (action.type === 'ADD_WEBSITE_BLOCKS') {
      // Register any new block types declared by AI
      if (action.data.newBlockTypes && Array.isArray(action.data.newBlockTypes)) {
        for (const bt of action.data.newBlockTypes) {
          if (bt.blockType && bt.label) {
            saveCustomBlockType(bt.blockType, { label: bt.label, icon: bt.icon || '🧩', description: bt.description || '', defaultContent: bt.defaultContent || {} });
          }
        }
      }
      const targetSiteId = action.data.websiteId || (aiContext?.type === 'website' ? aiContext.websiteId : null);
      if (!targetSiteId) { toast.error('Не указан ID сайта'); return; }
      const existingSite = getWebsite(targetSiteId);
      if (!existingSite) { toast.error('Сайт не найден'); return; }

      const newBlocks = (action.data.blocks || action.data.pages?.[0]?.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() }));
      const newPages = action.data.pages
        ? (action.data.pages as any[]).map((p: any) => ({
            id: p.id || genId(),
            slug: p.slug || 'page-' + genId().slice(0, 4),
            title: p.title || p.slug || 'Страница',
            blocks: (p.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
          }))
        : undefined;

      let updatedSite: AppWebsite;
      if (newPages && existingSite.pages) {
        // Merge pages: add new pages, append blocks to existing pages with same slug
        const mergedPages = [...existingSite.pages];
        for (const np of newPages) {
          const existIdx = mergedPages.findIndex(ep => ep.slug === np.slug);
          if (existIdx >= 0) {
            mergedPages[existIdx] = { ...mergedPages[existIdx], blocks: [...mergedPages[existIdx].blocks, ...np.blocks] };
          } else {
            mergedPages.push(np);
          }
        }
        updatedSite = { ...existingSite, pages: mergedPages, updatedAt: now };
      } else {
        // Single-page: append blocks
        updatedSite = { ...existingSite, blocks: [...existingSite.blocks, ...newBlocks], updatedAt: now };
      }

      saveWebsite(updatedSite);
      const addedCount = newPages ? newPages.reduce((s, p) => s + p.blocks.length, 0) : newBlocks.length;
      toast.success(`Добавлено ${addedCount} блоков в сайт "${existingSite.name}"`);
      navigate(`/site/edit/${existingSite.id}`);
      return existingSite.id;
    }

    // ── REPLACE WEBSITE (полная замена блоков сайта) ────────────────
    if (action.type === 'REPLACE_WEBSITE') {
      // Register any new block types declared by AI
      if (action.data.newBlockTypes && Array.isArray(action.data.newBlockTypes)) {
        for (const bt of action.data.newBlockTypes) {
          if (bt.blockType && bt.label) {
            saveCustomBlockType(bt.blockType, { label: bt.label, icon: bt.icon || '🧩', description: bt.description || '', defaultContent: bt.defaultContent || {} });
          }
        }
      }
      const targetSiteId = action.data.websiteId || (aiContext?.type === 'website' ? aiContext.websiteId : null);
      if (!targetSiteId) { toast.error('Не указан ID сайта'); return; }
      const existingSite = getWebsite(targetSiteId);
      if (!existingSite) { toast.error('Сайт не найден'); return; }

      const pages = action.data.pages
        ? (action.data.pages as any[]).map((p: any) => ({
            id: p.id || genId(),
            slug: p.slug || 'home',
            title: p.title || p.slug || 'Страница',
            blocks: (p.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
          }))
        : undefined;

      const updatedSite: AppWebsite = {
        ...existingSite,
        name: action.data.name || existingSite.name,
        description: action.data.description ?? existingSite.description,
        blocks: pages
          ? (pages.find(p => p.slug === 'home')?.blocks || pages[0]?.blocks || [])
          : (action.data.blocks || []).map((b: any) => ({ ...b, id: b.id || genId() })),
        pages,
        updatedAt: now,
      };
      saveWebsite(updatedSite);
      const blockCount = pages ? pages.reduce((s: number, p: any) => s + p.blocks.length, 0) : updatedSite.blocks.length;
      toast.success(`Сайт "${updatedSite.name}" полностью обновлён! ${blockCount} блоков.`);
      return targetSiteId;
    }

    // ── EDIT WEBSITE BLOCK (изменение данных одного блока) ──────────
    if (action.type === 'EDIT_WEBSITE_BLOCK') {
      const targetSiteId = action.data.websiteId || (aiContext?.type === 'website' ? aiContext.websiteId : null);
      if (!targetSiteId) { toast.error('Не указан ID сайта'); return; }
      const existingSite = getWebsite(targetSiteId);
      if (!existingSite) { toast.error('Сайт не найден'); return; }

      const { blockId, newContent, pageSlug } = action.data;
      if (!blockId || !newContent) { toast.error('Не указан blockId или newContent'); return; }

      let found = false;
      if (pageSlug && existingSite.pages) {
        const updatedPages = existingSite.pages.map(p => {
          if (p.slug === pageSlug) {
            return { ...p, blocks: p.blocks.map(b => {
              if (b.id === blockId) { found = true; return { ...b, content: { ...b.content, ...newContent } }; }
              return b;
            }) };
          }
          return p;
        });
        if (!found) { toast.error(`Блок "${blockId}" не найден на странице "${pageSlug}"`); return; }
        saveWebsite({ ...existingSite, pages: updatedPages, updatedAt: now });
      } else {
        const updatedBlocks = existingSite.blocks.map(b => {
          if (b.id === blockId) { found = true; return { ...b, content: { ...b.content, ...newContent } }; }
          return b;
        });
        if (!found) { toast.error(`Блок "${blockId}" не найден`); return; }
        saveWebsite({ ...existingSite, blocks: updatedBlocks, updatedAt: now });
      }
      toast.success(`Блок "${blockId}" обновлён.`);
      return targetSiteId;
    }

    // ── REMOVE WEBSITE BLOCKS (удаление блоков по ID) ──────────────
    if (action.type === 'REMOVE_WEBSITE_BLOCKS') {
      const targetSiteId = action.data.websiteId || (aiContext?.type === 'website' ? aiContext.websiteId : null);
      if (!targetSiteId) { toast.error('Не указан ID сайта'); return; }
      const existingSite = getWebsite(targetSiteId);
      if (!existingSite) { toast.error('Сайт не найден'); return; }

      const removeIds: string[] = Array.isArray(action.data.blockIds) ? action.data.blockIds : [];
      if (removeIds.length === 0) { toast.error('Не указаны blockIds для удаления'); return; }

      const removeSet = new Set(removeIds);
      if (existingSite.pages) {
        const updatedPages = existingSite.pages.map(p => ({
          ...p,
          blocks: p.blocks.filter(b => !removeSet.has(b.id)),
        }));
        saveWebsite({ ...existingSite, pages: updatedPages, blocks: existingSite.blocks.filter(b => !removeSet.has(b.id)), updatedAt: now });
      } else {
        saveWebsite({ ...existingSite, blocks: existingSite.blocks.filter(b => !removeSet.has(b.id)), updatedAt: now });
      }
      toast.success(`Удалено ${removeIds.length} блоков из сайта "${existingSite.name}".`);
      return targetSiteId;
    }

    // ── NAVIGATE ───────────────────────────────────────────────────
    if (action.type === 'NAVIGATE_TO') {
      navigate(action.data.path);
    }
  }, [saveForm, getForm, saveBot, saveWebsite, getWebsite, navigate, location, aiContext, getBot]);

  const sendMessage = useCallback(async (userText: string, preferredProvider?: string, images?: string[]) => {
    if ((!userText.trim() && (!images || images.length === 0)) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      images,
    };

    const currentMessages = messagesRef.current;
    // Build history messages — for vision support, include image content
    const history_msgs = [...currentMessages, userMsg]
      .filter(m => m.id !== 'welcome')
      .map(m => {
        if (m.images && m.images.length > 0) {
          // Multimodal message: text + images
          const content: any[] = [];
          if (m.content) content.push({ type: 'text', text: m.content });
          for (const img of m.images) {
            // img is data:image/...;base64,...
            const match = img.match(/^data:(image\/[^;]+);base64,(.+)$/);
            if (match) {
              content.push({ type: 'image_url', image_url: { url: img } });
            }
          }
          return { role: m.role, content };
        }
        return { role: m.role, content: m.content };
      });

    updateMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();
    updateMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const body: any = { messages: history_msgs };
      if (preferredProvider) body.preferredProvider = preferredProvider;

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
          // Full nodes/edges for AI analysis and fixes
          nodes: aiContext.nodes || [],
          edges: aiContext.edges || [],
        };
      }

      if (aiContext?.type === 'form') {
        body.context = {
          type: 'form_editor',
          formId: aiContext.formId,
          formTitle: aiContext.formTitle,
          fieldCount: aiContext.fieldCount,
          fields: aiContext.fields || [],
        };
      }

      if (aiContext?.type === 'website') {
        body.context = {
          type: 'website_editor',
          websiteId: aiContext.websiteId,
          websiteName: aiContext.websiteName,
          blockCount: aiContext.blockCount,
          pageCount: aiContext.pageCount,
          blocks: aiContext.blocks || [],
          pages: aiContext.pages || [],
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
        const details = errData.details ? `\n${errData.details.join(', ')}` : '';
        toast.error(`${errData.error || 'Ошибка AI'}${details}`);
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
