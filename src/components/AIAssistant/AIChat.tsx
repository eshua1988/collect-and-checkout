import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ParsedAction, useAIAssistant, AIContext, WELCOME_MESSAGE } from './useAIAssistant';
import { ChatSession } from './useAIHistory';
import {
  X, Send, Sparkles, RotateCcw, Bot, User,
  Loader2, Globe, FileText, ChevronRight,
  Minimize2, Maximize2, Plus, ChevronLeft,
  History, Trash2, MessageSquare, Copy, Check,
  Zap, Code2, LayoutTemplate, BrainCircuit, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── AI providers list (must match edge function provider names) ─────────────
export const AI_PROVIDERS = [
  { id: 'auto',                label: 'Авто',            icon: '✨', desc: 'Лучший доступный' },
  { id: 'claude-haiku',        label: 'Claude Haiku',    icon: '🟠', desc: 'claude-3-5-haiku' },
  { id: 'claude-sonnet',       label: 'Claude Sonnet',   icon: '🟣', desc: 'claude-3-5-sonnet' },
  { id: 'groq',                label: 'Groq Llama',      icon: '⚡', desc: 'llama-3.3-70b-versatile' },
  { id: 'github-gpt4o-mini',   label: 'GPT-4o mini',     icon: '🤖', desc: 'gpt-4o-mini' },
  { id: 'github-llama',        label: 'GitHub Llama',    icon: '🦙', desc: 'meta-llama-3.3-70b' },
  { id: 'openrouter',          label: 'OpenRouter',      icon: '🔀', desc: 'llama-3.3-70b:free' },
  { id: 'openrouter-deepseek', label: 'DeepSeek R1',     icon: '🧠', desc: 'deepseek-r1:free' },
  { id: 'together',            label: 'Together',        icon: '🤝', desc: 'Llama-3.3-70B-Free' },
  { id: 'gemini',              label: 'Gemini',          icon: '💫', desc: 'gemini-2.0-flash' },
] as const;

export type AIProviderId = (typeof AI_PROVIDERS)[number]['id'];

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CREATE_FORM:        { label: 'Открыть форму',       icon: <FileText className="w-3.5 h-3.5" />,    color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30 dark:text-blue-400' },
  CREATE_BOT:         { label: 'Открыть бота',         icon: <Bot className="w-3.5 h-3.5" />,          color: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-500/30 dark:text-violet-400' },
  CREATE_WEBSITE:     { label: 'Открыть сайт',         icon: <Globe className="w-3.5 h-3.5" />,        color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30 dark:text-emerald-400' },
  NAVIGATE_TO:        { label: 'Перейти',              icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border' },
  ADD_BOT_NODES:      { label: 'Добавить в бота',      icon: <Plus className="w-3.5 h-3.5" />,         color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30' },
  REGISTER_NODE_TYPE: { label: 'Зарегистрировать тип', icon: <Plus className="w-3.5 h-3.5" />,         color: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-500/30' },
};

const DEFAULT_SUGGESTIONS = [
  { icon: 'form',    text: 'Создай форму обратной связи с именем, email и сообщением',   color: 'text-blue-500' },
  { icon: 'globe',   text: 'Создай лендинг для IT-стартапа с разделами цены и отзывы',   color: 'text-emerald-500' },
  { icon: 'bot',     text: 'Создай Telegram-бота для записи на консультацию',             color: 'text-violet-500' },
  { icon: 'layout',  text: 'Создай форму опроса удовлетворённости клиентов',              color: 'text-orange-500' },
];

const BOT_SUGGESTIONS = [
  { icon: 'brain',   text: 'Добавь меню с кнопками и ветвлением по выбору пользователя', color: 'text-violet-500' },
  { icon: 'plus',    text: 'Добавь сбор контактов: имя, телефон, email с валидацией',    color: 'text-blue-500' },
  { icon: 'zap',     text: 'Добавь AI-чат узел с умным ответом на вопросы',              color: 'text-yellow-500' },
  { icon: 'code',    text: 'Добавь webhook уведомление при заполнении формы',             color: 'text-emerald-500' },
];

function SuggestionIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'form')   return <FileText className={className} />;
  if (type === 'globe')  return <Globe className={className} />;
  if (type === 'bot')    return <Bot className={className} />;
  if (type === 'layout') return <LayoutTemplate className={className} />;
  if (type === 'brain')  return <BrainCircuit className={className} />;
  if (type === 'zap')    return <Zap className={className} />;
  if (type === 'code')   return <Code2 className={className} />;
  return <Plus className={className} />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all text-muted-foreground hover:text-foreground absolute -top-2 -right-2 bg-background border border-border/50 shadow-sm"
      title="Копировать"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, onExecuteAction }: { msg: ChatMessage; onExecuteAction: (a: ParsedAction) => void }) {
  const isUser = msg.role === 'user';
  const displayContent = msg.content.replace(/```action\n[\s\S]*?```/g, '').trim();
  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
        isUser
          ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground'
          : 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={cn('flex flex-col gap-2 max-w-[88%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm'
            : 'bg-card text-card-foreground rounded-tl-sm border border-border/60'
        )}>
          {displayContent ? (
            <div className={cn('prose prose-sm max-w-none break-words', isUser ? 'prose-invert' : 'dark:prose-invert')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1.5 pl-4 space-y-1 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1.5 pl-4 space-y-1 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) return <code className="block bg-black/20 rounded-lg p-3 text-xs font-mono my-2 overflow-x-auto whitespace-pre">{children}</code>;
                    return <code className="bg-black/15 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                  },
                  h1: ({ children }) => <h1 className="text-base font-bold mb-1.5 mt-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1.5 first:mt-0">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic opacity-80 my-1">{children}</blockquote>,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="opacity-40 text-xs italic">...</span>
          )}
          {!isUser && displayContent && <CopyButton text={displayContent} />}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((action, i) => {
              const meta = ACTION_LABELS[action.type];
              if (!meta) return null;
              return (
                <button
                  key={i}
                  onClick={() => onExecuteAction(action)}
                  disabled={action.executed}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shadow-sm active:scale-95',
                    action.executed ? 'opacity-50 cursor-default bg-muted text-muted-foreground border-border' : meta.color
                  )}
                >
                  {action.executed ? <Check className="w-3.5 h-3.5" /> : meta.icon}
                  {meta.label}
                  {(action.data?.description || action.data?.name || action.data?.title) && (
                    <span className="font-semibold truncate max-w-[120px]">{action.data.description || action.data.name || action.data.title}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface HistorySidebarProps {
  sessions: ChatSession[];
  currentIndex: number;
  onLoad: (index: number) => void;
  onDelete: (index: number) => void;
  onNew: () => void;
  onClose: () => void;
}

function HistorySidebar({ sessions, currentIndex, onLoad, onDelete, onNew, onClose }: HistorySidebarProps) {
  return (
    <div className="flex flex-col w-60 border-r border-border/50 bg-muted/10 shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" />
          История чатов
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 mx-2 my-2 px-3 py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors border border-primary/20"
      >
        <Plus className="w-3.5 h-3.5" />
        Новый чат
      </button>
      <div className="flex-1 overflow-y-auto px-1 space-y-0.5 pb-2">
        {sessions.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Нет сохранённых чатов
          </div>
        ) : (
          sessions.map((session, i) => (
            <div
              key={session.id}
              className={cn(
                'group flex items-start gap-2 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-muted/50 transition-colors',
                i === currentIndex && 'bg-primary/5 border border-primary/20'
              )}
              onClick={() => onLoad(i)}
            >
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{session.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(session.updatedAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(i); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface AIChatProps {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  aiContext?: AIContext;
}

export function AIChat({ onClose, isExpanded, onToggleExpand, aiContext }: AIChatProps) {
  const {
    messages, isLoading, sendMessage, executeAction, clearMessages,
    historyState, loadHistorySession, goToPrevSession, goToNextSession,
  } = useAIAssistant(aiContext);

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [provider, setProvider] = useState<AIProviderId>('auto');
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBotContext = aiContext?.type === 'bot';
  const suggestions = isBotContext ? BOT_SUGGESTIONS : DEFAULT_SUGGESTIONS;
  const showSuggestions = messages.length === 1 && !isLoading;

  // Close provider menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, provider === 'auto' ? undefined : provider);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isLoading, sendMessage, provider]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sessionLabel = historyState.currentIndex >= 0 && historyState.currentSession
    ? `${historyState.currentIndex + 1} / ${historyState.totalSessions}`
    : `Новый · ${historyState.totalSessions} сохр.`;

  return (
    <div className={cn(
      'flex bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
      isExpanded ? 'fixed inset-4 md:inset-8 z-[200]' : 'w-[440px] h-[620px]'
    )}>
      {showHistory && (
        <HistorySidebar
          sessions={historyState.sessions}
          currentIndex={historyState.currentIndex}
          onLoad={(i) => { loadHistorySession(i); setShowHistory(false); }}
          onDelete={historyState.deleteSession}
          onNew={() => { clearMessages(); setShowHistory(false); }}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-transparent shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <Sparkles className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">AI Ассистент</span>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Онлайн
              </span>
            </div>
            {isBotContext ? (
              <p className="text-[10px] text-violet-500 truncate flex items-center gap-1 mt-0.5">
                <Bot className="w-3 h-3 inline shrink-0" />
                Режим бота: <span className="font-semibold ml-0.5">{aiContext!.botName}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">Формы, боты, сайты и документы</p>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowHistory(s => !s)} className={cn('p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground', showHistory ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60')} title="История">
              <History className="w-3.5 h-3.5" />
            </button>
            <button onClick={goToPrevSession} disabled={!historyState.hasPrev} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground px-1 whitespace-nowrap min-w-[44px] text-center">{sessionLabel}</span>
            <button onClick={goToNextSession} disabled={!historyState.hasNext} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-border/60 mx-1" />
            <button onClick={clearMessages} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" title="Новый чат">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onToggleExpand} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isBotContext && (
          <div className="px-4 py-2 bg-violet-500/5 border-b border-violet-500/10 flex items-center gap-2 text-xs">
            <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="text-muted-foreground">
              Бот <span className="font-medium text-foreground">{aiContext!.botName}</span> · {aiContext!.nodeCount} узлов
            </span>
            <span className="ml-auto text-violet-500 font-medium text-[11px]">+ добавить в бот</span>
          </div>
        )}

        {/* Messages / Suggestions */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {showSuggestions ? (
            <div className="px-4 pt-5 pb-2">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Чем могу помочь?</h3>
                <p className="text-xs text-muted-foreground">Выбери предложение или напиши свой запрос</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex flex-col gap-2.5 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-border/70 text-left transition-all active:scale-[0.97] group"
                  >
                    <span className={cn('w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm border border-border/30', s.color)}>
                      <SuggestionIcon type={s.icon} className="w-4 h-4" />
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground leading-relaxed line-clamp-3 transition-colors">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onExecuteAction={(action) => executeAction(action)} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 border border-border/60 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-muted/10 shrink-0">
          <div className="flex flex-col bg-background rounded-2xl border border-border/60 shadow-sm overflow-hidden focus-within:border-violet-500/50 focus-within:shadow-md focus-within:shadow-violet-500/10 transition-all">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isBotContext ? 'Что добавить в бота?' : 'Опиши что хочешь создать...'}
              className="resize-none min-h-[44px] max-h-[120px] px-4 pt-3 pb-1 text-sm bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none leading-relaxed"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
              {/* Provider selector */}
              <div className="relative" ref={providerMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowProviderMenu(v => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border border-border/50 bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all"
                >
                  <span>{AI_PROVIDERS.find(p => p.id === provider)?.icon ?? '✨'}</span>
                  <span className="hidden sm:inline">{AI_PROVIDERS.find(p => p.id === provider)?.label ?? 'Авто'}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showProviderMenu && (
                  <div className="absolute bottom-full mb-2 left-0 z-50 w-52 bg-popover border border-border/60 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Выбор модели ИИ</p>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {AI_PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setProvider(p.id); setShowProviderMenu(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-muted/60 transition-colors',
                            provider === p.id && 'bg-primary/10 text-primary'
                          )}
                        >
                          <span className="text-base leading-none">{p.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium leading-tight">{p.label}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{p.desc}</div>
                          </div>
                          {provider === p.id && <Check className="w-3 h-3 shrink-0 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="ml-auto h-8 px-4 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-600 hover:to-blue-700 border-0 shadow-md shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" />Отправить</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
