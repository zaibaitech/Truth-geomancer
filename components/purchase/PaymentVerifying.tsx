'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Shown while a payment the buyer just made has not been confirmed by the
// server yet (the webhook may land a moment after the browser returns).
// Re-renders the parent Server Component a few times; it never decides
// anything itself — the page flips to "activated" only when the entitlement
// really exists.
export function PaymentVerifying() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      router.refresh();
      if (n >= 10) clearInterval(id);
    }, 4000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
