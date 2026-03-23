import { useState, useCallback } from 'react';
import { AppWebsite } from '@/types/website';

const KEY = 'app_websites';

export function useWebsitesStorage() {
  const [websites, setWebsites] = useState<AppWebsite[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  const saveWebsite = useCallback((w: AppWebsite) => {
    setWebsites(prev => {
      const idx = prev.findIndex(x => x.id === w.id);
      const now = Date.now();
      const updated = idx >= 0
        ? prev.map((x, i) => i === idx ? { ...w, updatedAt: now } : x)
        : [...prev, { ...w, createdAt: now, updatedAt: now }];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteWebsite = useCallback((id: string) => {
    setWebsites(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getWebsite = useCallback((id: string) => {
    try { return (JSON.parse(localStorage.getItem(KEY) || '[]') as AppWebsite[]).find(w => w.id === id); }
    catch { return undefined; }
  }, []);

  const togglePublish = useCallback((id: string) => {
    let result: AppWebsite | undefined;
    setWebsites(prev => {
      const updated = prev.map(w => {
        if (w.id === id) {
          result = { ...w, published: !w.published, updatedAt: Date.now() };
          return result;
        }
        return w;
      });
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
    return result;
  }, []);

  return { websites, saveWebsite, deleteWebsite, getWebsite, togglePublish };
}
