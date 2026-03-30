import { useState, useEffect, useCallback } from 'react';
import { TelegramBot } from '@/types/bot';
import { cloudLoad, cloudSave, cloudDelete, cloudMigrateLocal } from '@/lib/cloudSync';

const TABLE = 'user_bots';
const BOTS_KEY = 'formbuilder_bots';

// Ensure every node has a valid position
function sanitizeBot(bot: TelegramBot): TelegramBot {
  return {
    ...bot,
    nodes: (bot.nodes || []).map((n, i) => ({
      ...n,
      position: {
        x: (n.position as any)?.x ?? 100 + (i % 3) * 250,
        y: (n.position as any)?.y ?? 100 + Math.floor(i / 3) * 180,
      },
    })),
  };
}

function readBotsLocal(): TelegramBot[] {
  try {
    const saved = localStorage.getItem(BOTS_KEY);
    return saved ? (JSON.parse(saved) as TelegramBot[]).map(sanitizeBot) : [];
  } catch { return []; }
}

export function useBotsStorage() {
  const [bots, setBots] = useState<TelegramBot[]>(readBotsLocal);

  // Load from cloud on mount + migrate local data
  useEffect(() => {
    cloudMigrateLocal<TelegramBot>(TABLE, BOTS_KEY).then(() =>
      cloudLoad<TelegramBot>(TABLE, BOTS_KEY).then(items => setBots(items.map(sanitizeBot)))
    );
  }, []);

  const saveBot = useCallback((bot: TelegramBot) => {
    const now = Date.now();
    setBots(prev => {
      const idx = prev.findIndex(b => b.id === bot.id);
      const updated = idx >= 0
        ? prev.map((b, i) => i === idx ? { ...bot, updatedAt: now } : b)
        : [...prev, { ...bot, createdAt: now, updatedAt: now }];
      localStorage.setItem(BOTS_KEY, JSON.stringify(updated));
      return updated;
    });
    cloudSave(TABLE, BOTS_KEY, { ...bot, updatedAt: now, createdAt: bot.createdAt || now });
  }, []);

  const saveBots = useCallback((newBots: TelegramBot[]) => {
    localStorage.setItem(BOTS_KEY, JSON.stringify(newBots));
    setBots(newBots);
    newBots.forEach(b => cloudSave(TABLE, BOTS_KEY, b));
  }, []);

  const deleteBot = useCallback((botId: string) => {
    setBots(prev => {
      const updated = prev.filter(b => b.id !== botId);
      localStorage.setItem(BOTS_KEY, JSON.stringify(updated));
      return updated;
    });
    cloudDelete(TABLE, BOTS_KEY, botId);
  }, []);

  const getBot = useCallback((botId: string) => {
    return readBotsLocal().find(b => b.id === botId);
  }, []);

  return { bots, saveBot, saveBots, deleteBot, getBot };
}
