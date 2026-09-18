import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AdminNav } from './AdminNav';

// Prompt 65: the chrome every authenticated /admin/* page shares — header
// + tab nav. Only ever rendered AFTER a page's own isCurrentUserAdmin()
// check has already passed (see each page.tsx) — this component itself
// performs no auth check and renders no data, so it carries no security
// weight of its own; it exists purely to avoid five copies of the same
// header/nav markup.
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <header className="border-b border-sand/10 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink-card text-clay-light">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="font-logo text-lg text-sand-light">Truth Geomancer</p>
            <p className="type-label text-sand/65">Author Dashboard</p>
          </div>
        </div>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
