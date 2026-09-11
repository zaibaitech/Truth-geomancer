'use client';

const STORAGE_KEY = 'truth-geomancer:recent-intentions';
const MAX_RECENT = 8;

function isBrowser() {
  return typeof window !== 'undefined';
}

export function recordRecentIntention(id: string): void {
  if (!isBrowser() || id === 'general') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...ids.filter((x) => x !== id)].slice(0, MAX_RECENT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore — recents are a convenience, not critical data
  }
}

export function listRecentIntentionIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}
