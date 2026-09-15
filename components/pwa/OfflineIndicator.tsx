'use client';

import { useEffect, useState } from 'react';

/**
 * Subtle, global connectivity banner (Prompt 23 — offline-first audit).
 * Reassures rather than alarms: while offline, books already downloaded and
 * readings already saved on this device remain fully usable, so the copy
 * says that rather than reading as an error. Briefly confirms reconnection
 * and then gets out of the way.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function goOnline() {
      setIsOnline(true);
      setJustReconnected(true);
      reconnectTimer = setTimeout(() => setJustReconnected(false), 3000);
    }
    function goOffline() {
      setIsOnline(false);
      setJustReconnected(false);
    }

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  if (isOnline && !justReconnected) return null;

  return (
    <p
      role="status"
      className="border-b border-sand/15 bg-ink px-4 py-1.5 text-center type-meta text-sand/65"
    >
      {isOnline
        ? 'Back online'
        : 'Offline · Your books and saved readings remain available.'}
    </p>
  );
}
