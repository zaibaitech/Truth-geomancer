import { ShieldCheck, MessageCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton';
import { Card } from '@/components/ui/Card';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';

// Prompt 65: an administrator-facing settings page, distinct from the
// customer-facing /settings (app/settings/page.tsx, untouched by this
// prompt — different audience, different purpose). Only shows session
// status and sign-out — no WhatsApp/pricing configuration is added here,
// per Phase 17's explicit "do not duplicate or alter the existing WhatsApp
// implementation ... in this prompt".
export default async function AdminSettingsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return <AdminSignInRequired />;

  return (
    <AdminShell>
      <div className="space-y-4 px-4 py-4">
        <Card>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-clay-light" />
            <div>
              <p className="type-body font-semibold text-sand-light">Signed in as Administrator</p>
              <p className="type-meta text-sand/65">Your session stays signed in for up to 12 hours.</p>
            </div>
          </div>
          <div className="mt-4">
            <AdminSignOutButton />
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-2.5">
            <MessageCircle size={16} className="mt-0.5 shrink-0 text-clay-light" />
            <p className="type-meta text-sand/70">
              Pricing and payment collection are still handled directly with customers over WhatsApp — there's nothing to configure
              here yet.
            </p>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
