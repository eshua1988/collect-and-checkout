import { useState, useCallback } from 'react';
import { AppProject } from '@/types/project';

const KEY = 'app_projects';

export function useProjectsStorage() {
  const [projects, setProjects] = useState<AppProject[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  const save = useCallback((list: AppProject[]) => {
    localStorage.setItem(KEY, JSON.stringify(list));
    setProjects(list);
  }, []);

  const saveProject = useCallback((p: AppProject) => {
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      const now = Date.now();
      const updated = idx >= 0
        ? prev.map((x, i) => i === idx ? { ...p, updatedAt: now } : x)
        : [...prev, { ...p, createdAt: now, updatedAt: now }];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getProject = useCallback((id: string) => {
    try { return (JSON.parse(localStorage.getItem(KEY) || '[]') as AppProject[]).find(p => p.id === id); }
    catch { return undefined; }
  }, []);

  return { projects, saveProject, deleteProject, getProject };
}
