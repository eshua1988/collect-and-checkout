import { useState, useEffect, useCallback } from 'react';
import { TelegramBot } from '@/types/bot';

const BOTS_KEY = 'formbuilder_bots';

// Read directly from localStorage (sync) so getBot works on first render
function readBots(): TelegramBot[] {
  try {
    const saved = localStorage.getItem(BOTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useBotsStorage() {
  const [bots, setBots] = useState<TelegramBot[]>(readBots);

  // Keep in sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === BOTS_KEY) setBots(readBots());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const saveBots = useCallback((newBots: TelegramBot[]) => {
    localStorage.setItem(BOTS_KEY, JSON.stringify(newBots));
    setBots(newBots);
  }, []);

  const saveBot = useCallback((bot: TelegramBot) => {
    setBots(prev => {
      const idx = prev.findIndex(b => b.id === bot.id);
      const updated = idx >= 0
        ? prev.map((b, i) => i === idx ? { ...bot, updatedAt: Date.now() } : b)
        : [...prev, { ...bot, createdAt: Date.now(), updatedAt: Date.now() }];
      localStorage.setItem(BOTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteBot = useCallback((botId: string) => {
    setBots(prev => {
      const updated = prev.filter(b => b.id !== botId);
      localStorage.setItem(BOTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getBot = useCallback((botId: string) => {
    // Read fresh from localStorage to avoid stale state on first render
    return readBots().find(b => b.id === botId);
  }, []);

  return { bots, saveBot, saveBots, deleteBot, getBot };
}
