'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js (Prompt 23 — offline-first audit). Renders nothing;
 * a failed or unsupported registration is silently ignored so it can never
 * block the app from loading normally.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
