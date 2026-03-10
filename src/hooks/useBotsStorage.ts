import { useState, useEffect, useCallback } from 'react';
import { TelegramBot } from '@/types/bot';

const BOTS_KEY = 'formbuilder_bots';

export function useBotsStorage() {
  const [bots, setBots] = useState<TelegramBot[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(BOTS_KEY);
    if (saved) setBots(JSON.parse(saved));
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
    return bots.find(b => b.id === botId);
  }, [bots]);

  return { bots, saveBot, deleteBot, getBot };
}
