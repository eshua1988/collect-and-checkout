import { useState, useCallback } from 'react';
import { Sparkles, X, GripHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AIChat } from './AIChat';
import { AIContext } from './useAIAssistant';
import { useBotsStorage } from '@/hooks/useBotsStorage';

const DEFAULT_W = 440;
const DEFAULT_H = 620;
const MIN_W = 320;
const MIN_H = 400;

function getDefaultPos(w = DEFAULT_W, h = DEFAULT_H) {
  return {
    x: Math.max(0, window.innerWidth - w - 24),
    y: Math.max(0, window.innerHeight - h - 96),
  };
}

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [pos, setPos] = useState(() => getDefaultPos());

  const location = useLocation();
  const { getBot } = useBotsStorage();

  const botMatch = location.pathname.match(/^\/bot\/([^/]+)$/);
  const botId = botMatch ? botMatch[1] : null;

  const aiContext: AIContext | undefined = (() => {
    if (!botId || botId === 'new') return undefined;
    const bot = getBot(botId);
    if (!bot) return undefined;
    return { type: 'bot', botId: bot.id, botName: bot.name, nodeCount: bot.nodes.length, nodeTypes: [...new Set(bot.nodes.map(n => n.type))], nodes: bot.nodes, edges: bot.edges };
  })();

  const isBotMode = !!aiContext;

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const isTouch = 'touches' in e;
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    setPos(current => {
      const origX = current.x, origY = current.y;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.w, origX + cx - startX)),
          y: Math.max(0, Math.min(window.innerHeight - size.h, origY + cy - startY)),
        });
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);

      return current; // no change
    });
  }, [isExpanded, size.w, size.h]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    e.preventDefault();
    e.stopPropagation();

    const isTouch = 'touches' in e;
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    setSize(current => {
      const origW = current.w, origH = current.h;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
        setSize({
          w: Math.max(MIN_W, origW + cx - startX),
          h: Math.max(MIN_H, origH + cy - startY),
        });
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);

      return current; // no change
    });
  }, [isExpanded]);

  return (
    <>
      {isExpanded && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[199]"
          onClick={() => { setIsExpanded(false); setIsOpen(false); }}
        />
      )}

      {isOpen && (
        <div
          className={cn(
            'z-[200]',
            isExpanded
              ? 'fixed inset-0 flex items-stretch justify-stretch p-4 md:p-8 pointer-events-none'
              : 'fixed pointer-events-auto'
          )}
          style={!isExpanded ? { left: pos.x, top: pos.y, width: size.w, height: size.h } : undefined}
        >
          <div className={cn('pointer-events-auto relative', isExpanded ? 'w-full h-full' : 'w-full h-full')}>
            <AIChat
              onClose={() => { setIsOpen(false); setIsExpanded(false); }}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(v => !v)}
              aiContext={aiContext}
              onDragStart={handleDragStart}
            />
            {!isExpanded && (
              <div
                className="absolute bottom-1 right-1 w-5 h-5 cursor-se-resize z-10 flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity rounded-br-2xl"
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
              >
                <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground rotate-[-45deg]" />
              </div>
            )}
          </div>
        </div>
      )}

      {!isExpanded && (
        <button
          onClick={() => setIsOpen(v => !v)}
          className={cn(
            'fixed bottom-6 right-6 z-[200]',
            'w-14 h-14 rounded-2xl shadow-2xl',
            'flex items-center justify-center',
            'bg-gradient-to-br from-violet-500 to-blue-600',
            'hover:from-violet-600 hover:to-blue-700',
            'active:scale-95 transition-all duration-200',
            'text-white',
            isOpen && 'from-slate-600 to-slate-700'
          )}
          title={isBotMode ? `AI ассистент бота "${aiContext!.botName}"` : 'AI Ассистент'}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {isBotMode && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center text-[9px]">
                  🤖
                </span>
              )}
              <span className="absolute inset-0 rounded-2xl bg-violet-400/30 animate-ping" />
              <span className="absolute inset-0 rounded-2xl shadow-lg shadow-violet-500/40" />
            </>
          )}
        </button>
      )}
    </>
  );
}
