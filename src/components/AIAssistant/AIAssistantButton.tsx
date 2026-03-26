import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AIChat } from './AIChat';
import { AIContext } from './useAIAssistant';
import { useBotsStorage } from '@/hooks/useBotsStorage';

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const location = useLocation();
  const { getBot } = useBotsStorage();

  const botMatch = location.pathname.match(/^\/bot\/([^/]+)$/);
  const botId = botMatch ? botMatch[1] : null;

  const aiContext: AIContext | undefined = (() => {
    if (!botId || botId === 'new') return undefined;
    const bot = getBot(botId);
    if (!bot) return undefined;
    return { type: 'bot', botId: bot.id, botName: bot.name, nodeCount: bot.nodes.length, nodeTypes: [...new Set(bot.nodes.map(n => n.type))] };
  })();

  const isBotMode = !!aiContext;

  return (
    <>
      {isExpanded && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[199]"
          onClick={() => { setIsExpanded(false); setIsOpen(false); }}
        />
      )}

      {isOpen && (
        <div className={cn(
          'z-[200]',
          isExpanded
            ? 'fixed inset-0 flex items-stretch justify-stretch p-4 md:p-8 pointer-events-none'
            : 'fixed bottom-24 right-6 pointer-events-auto'
        )}>
          <div className={cn('pointer-events-auto', isExpanded ? 'w-full h-full' : '')}>
            <AIChat
              onClose={() => { setIsOpen(false); setIsExpanded(false); }}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(v => !v)}
              aiContext={aiContext}
            />
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
