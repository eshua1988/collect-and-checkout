import { useState, useEffect, useCallback } from 'react';
import { DocData } from '@/types/document';
import { cloudLoad, cloudSave, cloudDelete, cloudMigrateLocal } from '@/lib/cloudSync';

const TABLE = 'user_docs';
const DOCS_KEY = 'docbuilder_docs';

export function useDocsStorage() {
  const [docs, setDocs] = useState<DocData[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    cloudMigrateLocal<DocData>(TABLE, DOCS_KEY).then(() =>
      cloudLoad<DocData>(TABLE, DOCS_KEY).then(items => setDocs(items))
    );
  }, []);

  const saveDocs = useCallback((newDocs: DocData[]) => {
    localStorage.setItem(DOCS_KEY, JSON.stringify(newDocs));
    setDocs(newDocs);
    newDocs.forEach(d => cloudSave(TABLE, DOCS_KEY, d));
  }, []);

  const saveDoc = useCallback((doc: DocData) => {
    const now = Date.now();
    const withTs = { ...doc, updatedAt: now, createdAt: doc.createdAt || now };
    setDocs(prev => {
      const exists = prev.findIndex(d => d.id === doc.id);
      const updated = exists >= 0
        ? prev.map((d, i) => i === exists ? withTs : d)
        : [...prev, withTs];
      localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
      return updated;
    });
    cloudSave(TABLE, DOCS_KEY, withTs);
  }, []);

  const deleteDoc = useCallback((docId: string) => {
    setDocs(prev => {
      const updated = prev.filter(d => d.id !== docId);
      localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
      return updated;
    });
    cloudDelete(TABLE, DOCS_KEY, docId);
  }, []);

  const getDoc = useCallback((docId: string) => {
    const saved = localStorage.getItem(DOCS_KEY);
    if (!saved) return undefined;
    const all: DocData[] = JSON.parse(saved);
    return all.find(d => d.id === docId);
  }, []);

  const togglePublish = useCallback((docId: string) => {
    let updated: DocData | undefined;
    setDocs(prev => {
      const newDocs = prev.map(d => {
        if (d.id === docId) { updated = { ...d, published: !d.published, updatedAt: Date.now() }; return updated; }
        return d;
      });
      localStorage.setItem(DOCS_KEY, JSON.stringify(newDocs));
      return newDocs;
    });
    if (updated) cloudSave(TABLE, DOCS_KEY, updated);
    return updated;
  }, []);

  return { docs, saveDoc, deleteDoc, getDoc, togglePublish };
}
