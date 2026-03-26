import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from './useAIAssistant';

const HISTORY_KEY = 'ai_chat_sessions';
const MAX_SESSIONS = 50;

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

function readSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: ChatSession[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

function genId() {
  return Math.random().toString(36).substring(2, 12);
}

function sessionNameFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'Новый чат';
  const text = firstUser.content.trim();
  return text.length > 45 ? text.slice(0, 45) + '…' : text;
}

export function useAIHistory(welcomeMessage: ChatMessage) {
  const [sessions, setSessions] = useState<ChatSession[]>(readSessions);
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 = new unsaved session

  // Current session messages
  const currentSession = currentIndex >= 0 ? sessions[currentIndex] : null;

  const createNewSession = useCallback(() => {
    setCurrentIndex(-1);
    return [welcomeMessage] as ChatMessage[];
  }, [welcomeMessage]);

  const saveSession = useCallback((messages: ChatMessage[]) => {
    // Don't save if only welcome message
    const meaningful = messages.filter(m => m.id !== 'welcome');
    if (meaningful.length === 0) return;

    setSessions(prev => {
      let updated: ChatSession[];
      if (currentIndex >= 0 && prev[currentIndex]) {
        // Update existing
        updated = prev.map((s, i) =>
          i === currentIndex
            ? { ...s, messages, name: sessionNameFromMessages(messages), updatedAt: Date.now() }
            : s
        );
      } else {
        // Create new session
        const newSession: ChatSession = {
          id: genId(),
          name: sessionNameFromMessages(messages),
          messages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updated = [newSession, ...prev];
        // Update index to point to new session
        setCurrentIndex(0);
      }
      writeSessions(updated);
      return updated;
    });
  }, [currentIndex]);

  const loadSession = useCallback((index: number) => {
    setCurrentIndex(index);
    return sessions[index]?.messages ?? [welcomeMessage];
  }, [sessions, welcomeMessage]);

  const goToPrev = useCallback(() => {
    const nextIdx = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, sessions.length - 1);
    setCurrentIndex(nextIdx);
    return sessions[nextIdx]?.messages ?? [welcomeMessage];
  }, [currentIndex, sessions, welcomeMessage]);

  const goToNext = useCallback(() => {
    if (currentIndex <= 0) {
      setCurrentIndex(-1);
      return [welcomeMessage] as ChatMessage[];
    }
    const nextIdx = currentIndex - 1;
    setCurrentIndex(nextIdx);
    return sessions[nextIdx]?.messages ?? [welcomeMessage];
  }, [currentIndex, sessions, welcomeMessage]);

  const deleteSession = useCallback((index: number) => {
    setSessions(prev => {
      const updated = prev.filter((_, i) => i !== index);
      writeSessions(updated);
      return updated;
    });
    if (currentIndex === index) {
      setCurrentIndex(-1);
    } else if (currentIndex > index) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const hasPrev = currentIndex < sessions.length - 1 || (currentIndex < 0 && sessions.length > 0);
  const hasNext = currentIndex > 0 || (currentIndex === 0 && sessions.length > 1);

  return {
    sessions,
    currentIndex,
    currentSession,
    saveSession,
    loadSession,
    goToPrev,
    goToNext,
    deleteSession,
    createNewSession,
    hasPrev,
    hasNext,
    totalSessions: sessions.length,
  };
}
