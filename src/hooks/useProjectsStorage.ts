import { useState, useEffect, useCallback } from 'react';
import { AppProject } from '@/types/project';
import { cloudLoad, cloudSave, cloudDelete, cloudMigrateLocal } from '@/lib/cloudSync';

const TABLE = 'user_projects';
const KEY = 'app_projects';

export function useProjectsStorage() {
  const [projects, setProjects] = useState<AppProject[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    cloudMigrateLocal<AppProject>(TABLE, KEY).then(() =>
      cloudLoad<AppProject>(TABLE, KEY).then(items => setProjects(items))
    );
  }, []);

  const saveProject = useCallback((p: AppProject) => {
    const now = Date.now();
    const withTs = { ...p, updatedAt: now, createdAt: p.createdAt || now };
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      const updated = idx >= 0
        ? prev.map((x, i) => i === idx ? withTs : x)
        : [...prev, withTs];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
    cloudSave(TABLE, KEY, withTs);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
    cloudDelete(TABLE, KEY, id);
  }, []);

  const getProject = useCallback((id: string) => {
    try { return (JSON.parse(localStorage.getItem(KEY) || '[]') as AppProject[]).find(p => p.id === id); }
    catch { return undefined; }
  }, []);

  return { projects, saveProject, deleteProject, getProject };
}
