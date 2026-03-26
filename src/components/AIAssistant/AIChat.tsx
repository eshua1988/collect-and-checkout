import { useState, useRef, useEffect } from 'react';
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
  History, Trash2, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CREATE_FORM:         { label: 'Открыть форму',      icon: <FileText className="w-3.5 h-3.5" />,    color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' },
  CREATE_BOT:          { label: 'Открыть бота',        icon: <Bot className="w-3.5 h-3.5" />,         color: 'bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 border-border' },
  CREATE_WEBSITE:      { label: 'Открыть сайт',        icon: <Globe className="w-3.5 h-3.5" />,       color: 'bg-accent/40 text-accent-foreground hover:bg-accent/60 border-border' },
  NAVIGATE_TO:         { label: 'Перейти',              icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border' },
  ADD_BOT_NODES:       { label: 'Добавить в бота',     icon: <Plus className="w-3.5 h-3.5" />,        color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30' },
  REGISTER_NODE_TYPE:  { label: 'Зарегистрировать тип', icon: <Plus className="w-3.5 h-3.5" />,       color: 'bg-accent/40 text-accent-foreground hover:bg-accent/60 border-border' },
};

const DEFAULT_SUGGESTIONS = [
  'Создай форму обратной связи с именем, email и сообщением',
  'Создай лендинг для IT-стартапа с разделами цены и отзывы',
  'Создай Telegram-бота для записи на консультацию',
  'Создай форму опроса удовлетворённости клиентов',
  'Создай сайт-портфолио для дизайнера',
];

const BOT_SUGGESTIONS = [
  'Добавь меню с кнопками и ветвлением по выбору пользователя',
  'Добавь сбор контактов: имя, телефон, email с валидацией',
  'Добавь AI-чат узел с умным ответом на вопросы',
  'Добавь опрос удовлетворённости из 3 вопросов',
  'Добавь ветвление: если пользователь новый — приветствие, иначе — меню',
  'Добавь уведомление через webhook при заполнении формы',
];

function MessageBubble({ msg, onExecuteAction }: { msg: ChatMessage; onExecuteAction: (a: ParsedAction) => void }) {
  const isUser = msg.role === 'user';
  const displayContent = msg.content.replace(/```action\n[\s\S]*?```/g, '').trim();

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-primary/80 text-primary-foreground'
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      <div className={cn('flex flex-col gap-2 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted/60 text-foreground rounded-tl-sm border border-border/50'
        )}>
          {displayContent ? (
            <div className={cn('prose prose-sm max-w-none', isUser ? 'prose-invert' : 'prose-neutral dark:prose-invert')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 pl-4 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 pl-4 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) return <code className="block bg-black/20 rounded p-2 text-xs font-mono my-1 overflow-x-auto">{children}</code>;
                    return <code className="bg-black/20 px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
                  },
                  h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="opacity-50">...</span>
          )}
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
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    action.executed ? 'opacity-50 cursor-default bg-muted text-muted-foreground border-border' : meta.color
                  )}
                >
                  {meta.icon}
                  {meta.label}
                  {action.data?.description && (
                    <span className="font-semibold truncate max-w-[120px]">{action.data.description}</span>
                  )}
                  {!action.data?.description && (
                    <span className="font-semibold truncate max-w-[120px]">{action.data?.name || action.data?.title || action.data?.label || action.data?.nodeType || ''}</span>
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

// ── History sidebar ────────────────────────────────────────────────────────────

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
    <div className="flex flex-col w-56 border-r border-border/50 bg-muted/20 shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" />
          История
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={onNew}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border-b border-border/30"
      >
        <Plus className="w-3.5 h-3.5" />
        Новый чат
      </button>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Нет сохранённых чатов</div>
        ) : (
          sessions.map((session, i) => (
            <div
              key={session.id}
              className={cn(
                'group flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/20',
                i === currentIndex && 'bg-primary/5 border-l-2 border-l-primary'
              )}
              onClick={() => onLoad(i)}
            >
              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{session.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(session.updatedAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(i); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
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

// ── Main chat component ────────────────────────────────────────────────────────

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBotContext = aiContext?.type === 'bot';
  const suggestions = isBotContext ? BOT_SUGGESTIONS : DEFAULT_SUGGESTIONS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExecuteAction = async (action: ParsedAction) => {
    await executeAction(action);
  };

  const handleNewChat = () => {
    clearMessages();
    setShowHistory(false);
  };

  const handleLoadSession = (index: number) => {
    loadHistorySession(index);
    setShowHistory(false);
  };

  const sessionLabel = historyState.currentIndex >= 0 && historyState.currentSession
    ? `${historyState.currentIndex + 1} / ${historyState.totalSessions}`
    : `Новый · ${historyState.totalSessions} сохранено`;

  return (
    <div className={cn(
      'flex bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden',
      'transition-all duration-300',
      isExpanded ? 'fixed inset-4 md:inset-8 z-[200]' : 'w-[420px] h-[600px]'
    )}>
      {/* History sidebar */}
      {showHistory && (
        <HistorySidebar
          sessions={historyState.sessions}
          currentIndex={historyState.currentIndex}
          onLoad={handleLoadSession}
          onDelete={historyState.deleteSession}
          onNew={handleNewChat}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/5 border-b border-border/50 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">AI Ассистент</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Онлайн
              </span>
            </div>
            {isBotContext ? (
              <p className="text-[10px] text-primary truncate flex items-center gap-1">
                <Bot className="w-3 h-3 inline" />
                Режим бота: <span className="font-semibold">{aiContext!.botName}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground truncate">Создаёт формы, боты, сайты по запросу</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* History nav */}
            <button
              onClick={() => setShowHistory(s => !s)}
              className={cn(
                'p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground',
                showHistory ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
              )}
              title="История чатов"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goToPrevSession}
              disabled={!historyState.hasPrev}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              title="Предыдущий чат"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground px-0.5 whitespace-nowrap min-w-[40px] text-center">{sessionLabel}</span>
            <button
              onClick={goToNextSession}
              disabled={!historyState.hasNext}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              title="Следующий чат"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-border/50 mx-0.5" />

            <button onClick={clearMessages} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" title="Новый чат">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onToggleExpand} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" title={isExpanded ? 'Свернуть' : 'Развернуть'}>
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bot context banner */}
        {isBotContext && (
          <div className="px-3 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2 text-xs">
            <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Открыт бот <span className="font-medium text-foreground">{aiContext!.botName}</span> · {aiContext!.nodeCount} узлов
            </span>
            <span className="ml-auto text-primary font-medium">+ добавит в бот</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onExecuteAction={handleExecuteAction} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 border border-border/50">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && !isLoading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">
                {isBotContext ? '🤖 Что добавить в бота:' : '💡 Попробуй:'}
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-muted/20 shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isBotContext ? 'Что добавить в бота?' : 'Опиши что хочешь создать...'}
                className="resize-none min-h-[44px] max-h-32 pr-2 text-sm bg-background border-border/60 rounded-xl"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-xl shrink-0 shadow-lg"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
            Enter — отправить · Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  );
}
