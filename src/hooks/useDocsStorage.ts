import { useState, useEffect, useCallback } from 'react';
import { DocData } from '@/types/document';

const DOCS_KEY = 'docbuilder_docs';

export function useDocsStorage() {
  const [docs, setDocs] = useState<DocData[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveDocs = useCallback((newDocs: DocData[]) => {
    localStorage.setItem(DOCS_KEY, JSON.stringify(newDocs));
    setDocs(newDocs);
  }, []);

  const saveDoc = useCallback((doc: DocData) => {
    setDocs(prev => {
      const exists = prev.findIndex(d => d.id === doc.id);
      const updated = exists >= 0
        ? prev.map((d, i) => i === exists ? { ...doc, updatedAt: Date.now() } : d)
        : [...prev, { ...doc, createdAt: Date.now(), updatedAt: Date.now() }];
      localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteDoc = useCallback((docId: string) => {
    setDocs(prev => {
      const updated = prev.filter(d => d.id !== docId);
      localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
      return updated;
    });
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
    return updated;
  }, []);

  return { docs, saveDoc, deleteDoc, getDoc, togglePublish };
}
