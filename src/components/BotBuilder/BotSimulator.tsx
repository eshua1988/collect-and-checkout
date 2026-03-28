import { useState, useRef, useEffect } from 'react';
import { BotNode, BotEdge, BotNodeData } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, RefreshCw, Bot, User, Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  buttons?: string[];
  isTyping?: boolean;
}

interface BotSimulatorProps {
  nodes: BotNode[];
  edges: BotEdge[];
  botName: string;
  onClose: () => void;
}

const genId = () => Math.random().toString(36).substring(2, 9);

// Walk the graph: given currentNodeId, return the next node via default edge
function getNextNodeId(nodeId: string, edges: BotEdge[], handleId?: string): string | null {
  const edge = edges.find(e => e.source === nodeId && (handleId ? e.sourceHandle === handleId : !e.sourceHandle || e.sourceHandle === null || e.sourceHandle === ''));
  return edge ? edge.target : null;
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

export function BotSimulator({ nodes, edges, botName, onClose }: BotSimulatorProps) {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [waitingInput, setWaitingInput] = useState(false);
  const [waitingChoice, setWaitingChoice] = useState<string[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text: string, buttons?: string[]) => {
    setMessages(prev => [...prev, { id: genId(), role: 'bot', text, buttons }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: genId(), role: 'user', text }]);
  };

  const addTyping = (): string => {
    const id = genId();
    setMessages(prev => [...prev, { id, role: 'bot', text: '', isTyping: true }]);
    return id;
  };

  const removeTyping = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const processNode = async (nodeId: string | null, vars: Record<string, string>): Promise<void> => {
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const data: BotNodeData = node.data;

    if (node.type === 'start') {
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'message') {
      const text = interpolate(data.text || '(пустое сообщение)', vars);
      const buttonLabels = (data.buttons || []).map(b => b.label);
      addBotMessage(text, buttonLabels.length > 0 ? buttonLabels : undefined);
      // If has buttons, wait for user to click one (handled as choice input)
      if (buttonLabels.length > 0) {
        setCurrentNodeId(nodeId);
        setWaitingChoice(buttonLabels);
        setWaitingInput(false);
        return;
      }
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'media') {
      const mediaEmoji: Record<string, string> = { photo: '🖼️', video: '🎬', audio: '🎵', document: '📄', sticker: '😀' };
      const emoji = mediaEmoji[data.mediaType || 'photo'] || '📎';
      const caption = data.caption ? `\n${interpolate(data.caption, vars)}` : '';
      addBotMessage(`${emoji} [${data.mediaType || 'медиа'}]${caption}`);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'userInput') {
      const q = interpolate(data.text || 'Введите ответ:', vars);
      if (data.inputType === 'choice' && data.choices && data.choices.length > 0) {
        addBotMessage(q, data.choices);
        setCurrentNodeId(nodeId);
        setWaitingChoice(data.choices);
        setWaitingInput(false);
      } else {
        addBotMessage(q);
        setCurrentNodeId(nodeId);
        setWaitingInput(true);
        setWaitingChoice(null);
      }
      return;
    }

    if (node.type === 'condition') {
      const varVal = vars[data.variable || ''] || '';
      const condVal = data.value || '';
      let result = false;
      switch (data.operator) {
        case 'equals': result = varVal === condVal; break;
        case 'notEquals': result = varVal !== condVal; break;
        case 'contains': result = varVal.includes(condVal); break;
        case 'notContains': result = !varVal.includes(condVal); break;
        case 'greater': result = parseFloat(varVal) > parseFloat(condVal); break;
        case 'less': result = parseFloat(varVal) < parseFloat(condVal); break;
        case 'isEmpty': result = !varVal; break;
        case 'isNotEmpty': result = !!varVal; break;
      }
      const edgeHandleId = result ? 'yes' : 'no';
      const edge = edges.find(e => e.source === nodeId && e.sourceHandle === edgeHandleId);
      return processNode(edge?.target || null, vars);
    }

    if (node.type === 'delay') {
      const typingId = addTyping();
      await new Promise(r => setTimeout(r, Math.min((data.delaySeconds || 3) * 400, 3000)));
      removeTyping(typingId);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'variable') {
      const newVars = { ...vars };
      const name = data.varName || '';
      const val = interpolate(data.varValue || '', vars);
      switch (data.varOperation) {
        case 'set': newVars[name] = val; break;
        case 'increment': newVars[name] = String((parseFloat(newVars[name] || '0') + parseFloat(val || '1'))); break;
        case 'decrement': newVars[name] = String((parseFloat(newVars[name] || '0') - parseFloat(val || '1'))); break;
        case 'append': newVars[name] = (newVars[name] || '') + val; break;
        case 'clear': delete newVars[name]; break;
      }
      setVariables(newVars);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, newVars);
    }

    if (node.type === 'aiChat') {
      const typingId = addTyping();
      try {
        const systemPrompt = interpolate(data.aiPrompt || 'Ты — полезный ассистент. Отвечай кратко.', vars);
        const context = data.aiContext ? interpolate(data.aiContext, vars) : '';
        const userMsg = vars['_lastUserInput'] || 'Привет';

        const { data: fnData, error } = await supabase.functions.invoke('bot-ai-chat', {
          body: {
            systemPrompt: context ? `${systemPrompt}\n\nКонтекст: ${context}` : systemPrompt,
            userMessage: userMsg,
            model: data.aiModel || 'google/gemini-3-flash-preview',
            temperature: data.aiTemperature ?? 0.7,
          },
        });

        removeTyping(typingId);
        if (error || !fnData?.reply) {
          addBotMessage('⚠️ Ошибка ИИ: ' + (error?.message || 'нет ответа'));
        } else {
          const reply = fnData.reply as string;
          const newVars = { ...vars };
          if (data.aiResponseVar) newVars[data.aiResponseVar] = reply;
          setVariables(newVars);
          addBotMessage(reply);
          const nextId = getNextNodeId(nodeId, edges);
          return processNode(nextId, newVars);
        }
      } catch (e) {
        removeTyping(typingId);
        addBotMessage('⚠️ Ошибка подключения к ИИ');
      }
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'action') {
      if (data.actionType === 'sendForm' && data.formId) {
        addBotMessage(`📋 *Ссылка на форму:*\n${window.location.origin}/f/${data.formId}`);
      } else if (data.actionType === 'sendMessage' && data.message) {
        addBotMessage(interpolate(data.message, vars));
      } else if (data.actionType === 'webhook') {
        addBotMessage(`🔗 Webhook запрос отправлен на:\n${data.webhookUrl || '(не указан)'}`);
      } else if (data.actionType === 'email') {
        addBotMessage(`📧 Email отправлен на: ${data.emailTo || '?'}`);
      } else {
        addBotMessage(`⚡ Действие выполнено: ${data.actionType || '?'}`);
      }
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }

    if (node.type === 'randomizer') {
      const weights = data.randWeights || [1, 1];
      const total = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      let chosen = 0;
      for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { chosen = i; break; }
      }
      const edge = edges.find(e => e.source === nodeId && e.sourceHandle === String(chosen));
      return processNode(edge?.target || null, vars);
    }

    if (node.type === 'jump') {
      return processNode(data.jumpTarget || null, vars);
    }

    // ── userLangPref: show language buttons, wait for selection ─────────────
    if (node.type === 'userLangPref') {
      const langs = (data.ulpLanguages as string[]) || ['ru', 'en'];
      const flags: Record<string, string> = { ru:'🇷🇺', en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷', es:'🇪🇸', uk:'🇺🇦', zh:'🇨🇳', ar:'🇸🇦', pt:'🇵🇹', it:'🇮🇹', tr:'🇹🇷', pl:'🇵🇱' };
      const showFlags = data.ulpShowFlags !== false;
      const labels = langs.map(l => showFlags ? `${flags[l] || ''}${l.toUpperCase()}` : l.toUpperCase());
      const question = interpolate((data.ulpQuestion as string) || 'Выберите язык:', vars);
      addBotMessage(question, labels);
      setCurrentNodeId(nodeId);
      setWaitingChoice(labels);
      setWaitingInput(false);
      return;
    }

    // ── translate: simulate translation ────────────────────────────────────
    if (node.type === 'translate') {
      const sourceVar = (data.translateSourceVar as string) || '';
      const resultVar = (data.translateResultVar as string) || 'translated_text';
      const src = vars[sourceVar] || '';
      const newVars = { ...vars };
      if (src) {
        const typingId = addTyping();
        try {
          const { data: fnData } = await supabase.functions.invoke('bot-translate', {
            body: { text: src, targetLang: data.translateTargetLang || 'en' },
          });
          removeTyping(typingId);
          newVars[resultVar] = fnData?.translatedText || fnData?.translated || src;
        } catch {
          removeTyping(typingId);
          newVars[resultVar] = `[перевод: ${src}]`;
        }
      }
      setVariables(newVars);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, newVars);
    }

    // ── yandexTranslate: simulate Yandex translation ────────────────────────
    if (node.type === 'yandexTranslate') {
      const sourceVar = (data.yandexSourceVar as string) || '';
      const resultVar = (data.yandexResultVar as string) || 'translated_text';
      const src = vars[sourceVar] || '';
      const newVars = { ...vars };
      if (src) {
        const typingId = addTyping();
        try {
          const { data: fnData } = await supabase.functions.invoke('bot-yandex-translate', {
            body: {
              text: src,
              targetLang: data.yandexTargetLang || 'ru',
              sourceLang: data.yandexSourceLang || '',
              folderId: data.yandexFolderId || '',
              apiKey: data.yandexApiKey || '',
            },
          });
          removeTyping(typingId);
          newVars[resultVar] = fnData?.translatedText || src;
        } catch {
          removeTyping(typingId);
          newVars[resultVar] = `[перевод: ${src}]`;
        }
      }
      setVariables(newVars);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, newVars);
    }

    // ── langDetect: detect language ─────────────────────────────────────────
    if (node.type === 'langDetect') {
      const sourceVar = (data.langDetectVar as string) || '';
      const resultVar = (data.langResultVar as string) || 'user_lang';
      const src = vars[sourceVar] || '';
      const newVars = { ...vars };
      if (src) {
        try {
          const { data: fnData } = await supabase.functions.invoke('bot-lang-detect', {
            body: { text: src },
          });
          newVars[resultVar] = fnData?.lang || 'ru';
        } catch {
          newVars[resultVar] = 'ru';
        }
      }
      setVariables(newVars);
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, newVars);
    }

    // Generic handler for all unknown/custom node types
    {
      const steps = data.executionSteps as any[] | undefined;
      if (steps && steps.length > 0) {
        // Inject node.data properties into vars so executionSteps can reference them via {{key}}
        let currentVars = { ...vars };
        for (const [k, v] of Object.entries(data)) {
          if (k === 'executionSteps' || k === 'label' || k === 'icon' || k === 'description' || k === 'buttons' || k === 'color') continue;
          if (typeof v === 'string' && v) currentVars[k] = v;
          else if (typeof v === 'number') currentVars[k] = String(v);
          else if (typeof v === 'boolean') currentVars[k] = String(v);
        }
        // Execute steps sequentially
        for (const step of steps) {
          switch (step.action) {
            case 'sendMessage': {
              const text = interpolate(step.text || '', currentVars);
              if (text) {
                const btnLabels = (step.buttons || []).map((b: any) => interpolate(b.label, currentVars));
                addBotMessage(text, btnLabels.length > 0 ? btnLabels : undefined);
                if (btnLabels.length > 0) {
                  setCurrentNodeId(nodeId);
                  setWaitingChoice(btnLabels);
                  setWaitingInput(false);
                  setVariables(currentVars);
                  return;
                }
              }
              break;
            }
            case 'setVariable': {
              const name = step.variable || step.variableName || '';
              if (name) {
                const val = interpolate(step.value || '', currentVars);
                const op = step.operation || 'set';
                const cur = currentVars[name] ?? '';
                switch (op) {
                  case 'set': currentVars[name] = val; break;
                  case 'increment': currentVars[name] = String((parseFloat(cur) || 0) + (parseFloat(val) || 1)); break;
                  case 'decrement': currentVars[name] = String((parseFloat(cur) || 0) - (parseFloat(val) || 1)); break;
                  case 'append': currentVars[name] = cur + val; break;
                  case 'clear': delete currentVars[name]; break;
                  default: currentVars[name] = val; break;
                }
              }
              break;
            }
            case 'fetchUrl': {
              const url = interpolate(step.url || '', currentVars);
              if (url) {
                const typingId = addTyping();
                try {
                  const method = (step.method || 'GET').toUpperCase();
                  const opts: RequestInit = { method };
                  if (method !== 'GET' && step.body) {
                    opts.body = interpolate(step.body, currentVars);
                    opts.headers = { 'Content-Type': 'application/json', ...(step.headers || {}) };
                  }
                  const resp = await fetch(url, opts);
                  const txt = await resp.text();
                  const resultVar = step.resultVar || 'fetch_response';
                  currentVars[resultVar] = txt;
                  try {
                    const json = JSON.parse(txt);
                    if (step.resultPath) {
                      const parts = step.resultPath.split('.');
                      let val: any = json;
                      for (const p of parts) val = val?.[p];
                      if (val !== undefined) currentVars[resultVar] = String(val);
                    }
                    if (json.translatedText) currentVars[resultVar] = String(json.translatedText);
                    else if (json.reply) currentVars[resultVar] = String(json.reply);
                    else if (json.result) currentVars[resultVar] = String(json.result);
                  } catch {}
                  removeTyping(typingId);
                } catch (e) {
                  removeTyping(typingId);
                  addBotMessage(`⚠️ Ошибка запроса: ${url}`);
                }
              }
              break;
            }
            case 'callFunction': {
              const funcName = step.function || '';
              if (funcName) {
                const typingId = addTyping();
                try {
                  const rawBody: Record<string, any> = step.functionBody || {};
                  const body: Record<string, any> = {};
                  for (const [k, v] of Object.entries(rawBody)) {
                    body[k] = typeof v === 'string' ? interpolate(v, currentVars) : v;
                  }
                  const { data: fnData, error } = await supabase.functions.invoke(funcName, { body });
                  removeTyping(typingId);
                  const resultVar = step.resultVar || 'function_response';
                  if (error) {
                    currentVars[resultVar] = `error: ${error.message}`;
                  } else if (fnData) {
                    if (fnData.translatedText) currentVars[resultVar] = String(fnData.translatedText);
                    else if (fnData.reply) currentVars[resultVar] = String(fnData.reply);
                    else if (fnData.result) currentVars[resultVar] = String(fnData.result);
                    else if (fnData.lang) currentVars[resultVar] = String(fnData.lang);
                    else if (fnData.text) currentVars[resultVar] = String(fnData.text);
                    else currentVars[resultVar] = JSON.stringify(fnData);
                  }
                } catch (e) {
                  removeTyping(typingId);
                  addBotMessage(`⚠️ Ошибка вызова ${funcName}`);
                }
              }
              break;
            }
            case 'condition': {
              const varVal = currentVars[step.variable || ''] || '';
              const condVal = interpolate(step.value || '', currentVars);
              let ok = false;
              switch (step.operator || 'equals') {
                case 'equals': ok = varVal === condVal; break;
                case 'notEquals': ok = varVal !== condVal; break;
                case 'contains': ok = varVal.includes(condVal); break;
                case 'notContains': ok = !varVal.includes(condVal); break;
                case 'greater': ok = parseFloat(varVal) > parseFloat(condVal); break;
                case 'less': ok = parseFloat(varVal) < parseFloat(condVal); break;
                case 'isEmpty': ok = !varVal; break;
                case 'isNotEmpty': ok = !!varVal; break;
              }
              // Execute branch steps inline (simplified — no nested wait support)
              const branch = ok ? (step.thenSteps || []) : (step.elseSteps || []);
              for (const sub of branch) {
                if (sub.action === 'sendMessage') {
                  const t = interpolate(sub.text || '', currentVars);
                  if (t) addBotMessage(t);
                } else if (sub.action === 'setVariable' && (sub.variable || sub.variableName)) {
                  currentVars[sub.variable || sub.variableName] = interpolate(sub.value || '', currentVars);
                }
              }
              break;
            }
            case 'waitInput': {
              const prompt = interpolate(step.prompt || step.text || 'Введите значение:', currentVars);
              if (step.inputType === 'choice' && step.choices?.length) {
                addBotMessage(prompt, step.choices);
                setCurrentNodeId(nodeId);
                setWaitingChoice(step.choices);
                setWaitingInput(false);
              } else {
                addBotMessage(prompt);
                setCurrentNodeId(nodeId);
                setWaitingInput(true);
                setWaitingChoice(null);
              }
              // Store variable name for when input arrives
              currentVars.__customWaitVar = step.variableName || 'user_input';
              setVariables(currentVars);
              return;
            }
          }
        }
        setVariables(currentVars);
        const nextId = getNextNodeId(nodeId, edges);
        return processNode(nextId, currentVars);
      }

      // Fallback: show text/message if present, otherwise show type label
      const typeLabel = node.type || 'unknown';
      const dataText = data.text || data.message || data.caption || '';
      const displayText = dataText ? interpolate(dataText, vars) : '';
      if (displayText) {
        const buttonLabels = (data.buttons as any[] || []).map((b: any) => b.label);
        addBotMessage(displayText, buttonLabels.length > 0 ? buttonLabels : undefined);
        if (buttonLabels.length > 0) {
          setCurrentNodeId(nodeId);
          setWaitingChoice(buttonLabels);
          setWaitingInput(false);
          return;
        }
      } else {
        addBotMessage(`⚙️ [${typeLabel}]`);
      }
      const nextId = getNextNodeId(nodeId, edges);
      return processNode(nextId, vars);
    }
  };

  const startSimulation = async () => {
    setMessages([]);
    setVariables({});
    setWaitingInput(false);
    setWaitingChoice(null);
    setIsRunning(true);
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      addBotMessage('⚠️ Нет стартового узла в потоке');
      setIsRunning(false);
      return;
    }
    await processNode(startNode.id, {});
    setIsRunning(false);
  };

  const handleUserInput = async (input: string) => {
    if (!currentNodeId) return;
    addUserMessage(input);
    setWaitingInput(false);
    setWaitingChoice(null);

    const node = nodes.find(n => n.id === currentNodeId);
    const newVars = { ...variables, _lastUserInput: input };
    if (node?.type === 'userInput' && node.data.variableName) {
      newVars[node.data.variableName] = input;
    }
    // Custom node waitInput: save input to the stored variable name
    if (variables.__customWaitVar) {
      newVars[variables.__customWaitVar] = input;
      delete newVars.__customWaitVar;
    }
    setVariables(newVars);
    setInputValue('');
    setIsRunning(true);
    const nextId = getNextNodeId(currentNodeId, edges);
    await processNode(nextId, newVars);
    setIsRunning(false);
  };

  // Handle button click with per-button routing (handle ID = button index)
  const handleButtonClick = async (btnIndex: number, btnLabel: string) => {
    if (!currentNodeId || isRunning) return;
    addUserMessage(btnLabel);
    setWaitingInput(false);
    setWaitingChoice(null);

    const node = nodes.find(n => n.id === currentNodeId);
    const newVars = { ...variables, _lastUserInput: btnLabel, _lastButtonClick: btnLabel, _lastButtonIndex: String(btnIndex) };
    if (node?.type === 'userInput' && node.data.variableName) {
      newVars[node.data.variableName] = btnLabel;
    }
    // userLangPref: extract lang code from button label and save to variable
    if (node?.type === 'userLangPref') {
      const langs = (node.data.ulpLanguages as string[]) || ['ru', 'en'];
      const lang = langs[btnIndex] || btnLabel.replace(/[^\w]/g, '').toLowerCase();
      const ulpVar = (node.data.ulpSaveVar as string) || 'user_lang';
      newVars[ulpVar] = lang;
    }
    setVariables(newVars);
    setInputValue('');
    setIsRunning(true);
    // Try per-button edge (sourceHandle = index), then fall back to default edge
    const btnEdge = edges.find(e => e.source === currentNodeId && e.sourceHandle === String(btnIndex));
    const nextId = btnEdge ? btnEdge.target : getNextNodeId(currentNodeId, edges);
    await processNode(nextId, newVars);
    setIsRunning(false);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    handleUserInput(inputValue.trim());
  };

  const varEntries = Object.entries(variables).filter(([k]) => !k.startsWith('_'));

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm">🤖</div>
          <div>
            <p className="text-sm font-semibold">{botName}</p>
            <p className="text-xs text-muted-foreground">Симулятор диалога</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={startSimulation} title="Перезапустить">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
            <div className="text-3xl">▶️</div>
            <p className="text-sm text-muted-foreground">Нажмите "Старт" чтобы симулировать диалог</p>
            <Button size="sm" onClick={startSimulation}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Запустить
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs mr-1.5 shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.isTyping ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">печатает...</span>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.buttons.map((btn, i) => (
                            <button
                              key={i}
                              onClick={() => !isRunning && handleButtonClick(i, btn)}
                              disabled={isRunning || !waitingChoice}
                              className="px-2 py-1 text-xs rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs ml-1.5 shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Variables debug */}
      {varEntries.length > 0 && (
        <div className="border-t px-3 py-1.5 shrink-0">
          <p className="text-xs text-muted-foreground font-medium mb-1">📦 Переменные:</p>
          <div className="flex flex-wrap gap-1">
            {varEntries.map(([k, v]) => (
              <span key={k} className="text-xs font-mono bg-muted rounded px-1.5 py-0.5">
                {k}={String(v).slice(0, 20)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-3 py-2 shrink-0">
        {messages.length === 0 ? (
          <Button className="w-full" size="sm" onClick={startSimulation}>
            <Play className="w-3.5 h-3.5 mr-1.5" /> Запустить симулятор
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={waitingInput ? 'Введите ответ...' : 'Ожидание...'}
              disabled={!waitingInput || isRunning}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!waitingInput || isRunning || !inputValue.trim()}
              className="h-8 w-8 p-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
