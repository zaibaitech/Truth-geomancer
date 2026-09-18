import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

// Prompt 65: the same sign-in gate every /admin/* page renders when
// isCurrentUserAdmin() is false — factored out so every page shows an
// identical, deliberately minimal screen (no nav, no stats, nothing that
// hints at what's behind it) rather than five slightly different copies.
export function AdminSignInRequired() {
  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink-card text-clay-light">
          <ShieldCheck size={16} />
        </div>
        <div>
          <p className="font-logo text-lg text-sand-light">Truth Geomancer</p>
          <p className="type-label text-sand/65">Author Dashboard</p>
        </div>
      </div>
      <Card>
        <p className="type-body font-semibold text-sand-light">Administrator sign-in required</p>
        <p className="mt-1.5 type-body text-sand/70">This page is only visible to the configured administrator.</p>
        <AdminLoginForm />
      </Card>
    </div>
  );
}
