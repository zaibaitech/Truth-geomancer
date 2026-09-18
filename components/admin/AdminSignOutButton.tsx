'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

// Prompt 65: wires the existing logoutAdmin() (unwired since Prompt 28) to
// a real button. router.refresh() re-runs isCurrentUserAdmin() server-side
// on the current page, which will now see no cookie and fall back to
// AdminSignInRequired — the same pattern PaymentRequestActions already
// uses for its own post-mutation refresh.
export function AdminSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-sand/15 px-4 py-2.5 type-body font-medium text-sand-light disabled:opacity-50"
    >
      <LogOut size={15} />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
