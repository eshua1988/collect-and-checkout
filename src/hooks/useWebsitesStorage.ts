import { useState, useEffect, useCallback } from 'react';
import { AppWebsite } from '@/types/website';
import { cloudLoad, cloudSave, cloudDelete, cloudMigrateLocal } from '@/lib/cloudSync';

const TABLE = 'user_websites';
const KEY = 'app_websites';

export function useWebsitesStorage() {
  const [websites, setWebsites] = useState<AppWebsite[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    cloudMigrateLocal<AppWebsite>(TABLE, KEY).then(() =>
      cloudLoad<AppWebsite>(TABLE, KEY).then(items => setWebsites(items))
    );
  }, []);

  const saveWebsite = useCallback((w: AppWebsite) => {
    const now = Date.now();
    const withTs = { ...w, updatedAt: now, createdAt: w.createdAt || now };
    setWebsites(prev => {
      const idx = prev.findIndex(x => x.id === w.id);
      const updated = idx >= 0
        ? prev.map((x, i) => i === idx ? withTs : x)
        : [...prev, withTs];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
    cloudSave(TABLE, KEY, withTs);
    // Notify open editors about the change
    window.dispatchEvent(new CustomEvent('websiteStorageUpdated', { detail: { id: w.id } }));
  }, []);

  const deleteWebsite = useCallback((id: string) => {
    setWebsites(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
    cloudDelete(TABLE, KEY, id);
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
    if (result) cloudSave(TABLE, KEY, result);
    return result;
  }, []);

  return { websites, saveWebsite, deleteWebsite, getWebsite, togglePublish };
}
