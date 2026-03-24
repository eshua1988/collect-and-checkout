import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ParsedAction, useAIAssistant } from './useAIAssistant';
import {
  X, Send, Sparkles, RotateCcw, Bot, User,
  Loader2, Globe, FileText, ChevronRight,
  Minimize2, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CREATE_FORM: { label: 'Открыть форму', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' },
  CREATE_BOT: { label: 'Открыть бота', icon: <Bot className="w-3.5 h-3.5" />, color: 'bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 border-border' },
  CREATE_WEBSITE: { label: 'Открыть сайт', icon: <Globe className="w-3.5 h-3.5" />, color: 'bg-accent/40 text-accent-foreground hover:bg-accent/60 border-border' },
  NAVIGATE_TO: { label: 'Перейти', icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border' },
};

const SUGGESTIONS = [
  'Создай форму обратной связи с именем, email и сообщением',
  'Создай лендинг для IT-стартапа с разделами цены и отзывы',
  'Создай Telegram-бота для записи на консультацию',
  'Создай форму опроса удовлетворённости клиентов',
  'Создай сайт-портфолио для дизайнера',
];

function MessageBubble({ msg, onExecuteAction }: { msg: ChatMessage; onExecuteAction: (a: ParsedAction) => void }) {
  const isUser = msg.role === 'user';

  // Strip action blocks from displayed content
  const displayContent = msg.content.replace(/```action\n[\s\S]*?```/g, '').trim();

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-primary/80 text-primary-foreground'
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      <div className={cn('flex flex-col gap-2 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        {/* Content bubble */}
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

        {/* Action buttons */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((action, i) => {
              const meta = ACTION_LABELS[action.type];
              if (!meta) return null;
              return (
                <button
                  key={i}
                  onClick={() => onExecuteAction(action)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    meta.color
                  )}
                >
                  {meta.icon}
                  {meta.label}: <span className="font-semibold">{action.data?.name || action.data?.title || action.data?.label || '→'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface AIChatProps {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function AIChat({ onClose, isExpanded, onToggleExpand }: AIChatProps) {
  const { messages, isLoading, sendMessage, executeAction, clearMessages } = useAIAssistant();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className={cn(
      'flex flex-col bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden',
      'transition-all duration-300',
      isExpanded
        ? 'fixed inset-4 md:inset-8 z-[200]'
        : 'w-[380px] h-[580px]'
    )}>
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
          <p className="text-[10px] text-muted-foreground truncate">Создаёт формы, боты, сайты по запросу</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            title="Очистить чат"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onExecuteAction={executeAction}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
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

        {/* Suggestions if only welcome message */}
        {messages.length === 1 && !isLoading && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">💡 Попробуй:</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s, i) => (
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
              placeholder="Опиши что хочешь создать..."
              className="resize-none min-h-[44px] max-h-32 pr-2 text-sm bg-background border-border/60 rounded-xl focus:ring-violet-500/30 focus:border-violet-500/50"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shrink-0 shadow-lg"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
          Enter — отправить · Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}
