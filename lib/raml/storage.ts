'use client';

import type { Pattern } from '@/content/stars';

export interface SavedCasting {
  id: string;
  createdAt: string; // ISO timestamp
  question: string;
  mothers: [Pattern, Pattern, Pattern, Pattern];
}

const STORAGE_KEY = 'truth-geomancer:castings';
const MAX_SAVED = 100;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readAll(): SavedCasting[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(castings: SavedCasting[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(castings.slice(0, MAX_SAVED)));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — fail silently,
    // the casting still rendered for this session, it just won't persist.
  }
}

function makeId(): string {
  if (isBrowser() && 'randomUUID' in window.crypto) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first. */
export function listCastings(): SavedCasting[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCasting(id: string): SavedCasting | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveCasting(input: {
  question: string;
  mothers: [Pattern, Pattern, Pattern, Pattern];
}): SavedCasting {
  const casting: SavedCasting = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    question: input.question.trim(),
    mothers: input.mothers,
  };
  const all = readAll();
  all.unshift(casting);
  writeAll(all);
  return casting;
}

export function deleteCasting(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}
