import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIChat } from './AIChat';

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Backdrop for expanded mode */}
      {isExpanded && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[199]"
          onClick={() => { setIsExpanded(false); setIsOpen(false); }}
        />
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className={cn(
          'z-[200]',
          isExpanded
            ? 'fixed inset-0 flex items-stretch justify-stretch p-4 md:p-8 pointer-events-none'
            : 'fixed bottom-24 right-6 pointer-events-auto'
        )}>
          <div className={cn(
            'pointer-events-auto',
            isExpanded ? 'w-full h-full' : ''
          )}>
            <AIChat
              onClose={() => { setIsOpen(false); setIsExpanded(false); }}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(v => !v)}
            />
          </div>
        </div>
      )}

      {/* Floating button */}
      {!isExpanded && (
        <button
          onClick={() => setIsOpen(v => !v)}
          className={cn(
            'fixed bottom-6 right-6 z-[200]',
            'w-14 h-14 rounded-2xl shadow-2xl',
            'flex items-center justify-center',
            'bg-gradient-to-br from-violet-500 to-purple-600',
            'hover:from-violet-600 hover:to-purple-700',
            'active:scale-95 transition-all duration-200',
            'text-white',
            isOpen && 'rotate-12'
          )}
          title="AI Ассистент"
        >
          {isOpen
            ? <X className="w-5 h-5" />
            : (
              <>
                <Sparkles className="w-5 h-5" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl bg-violet-500/30 animate-ping" />
              </>
            )
          }
        </button>
      )}
    </>
  );
}
