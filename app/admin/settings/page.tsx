import { ShieldCheck, MessageCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton';
import { Card } from '@/components/ui/Card';
import { AdminPlatformOnly } from '@/components/admin/AdminPlatformOnly';
import { getAdminActor, isPlatformAdminActor } from '@/lib/server/adminActor';

// Prompt 65: an administrator-facing settings page, distinct from the
// customer-facing /settings (app/settings/page.tsx, untouched by this
// prompt — different audience, different purpose). Only shows session
// status and sign-out — no WhatsApp/pricing configuration is added here,
// per Phase 17's explicit "do not duplicate or alter the existing WhatsApp
// implementation ... in this prompt".
export default async function AdminSettingsPage() {
  // Server-side authorization (lib/server/adminActor.ts): platform admins only.
  const actor = await getAdminActor();
  if (!actor) return <AdminSignInRequired />;
  if (!isPlatformAdminActor(actor)) return <AdminPlatformOnly />;

  return (
    <AdminShell variant="platform">
      <div className="space-y-4 px-4 py-4">
        <Card>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-clay-light" />
            <div>
              <p className="type-body font-semibold text-sand-light">
                {actor.kind === 'break-glass' ? 'Signed in with emergency access' : 'Signed in as Platform Administrator'}
              </p>
              <p className="type-meta text-sand/65">
                {actor.kind === 'break-glass'
                  ? 'Emergency access stays signed in for up to 12 hours.'
                  : 'You are using your own account. Sign out from Settings in the app.'}
              </p>
            </div>
          </div>
          {actor.kind === 'break-glass' ? (
            <div className="mt-4">
              <AdminSignOutButton />
            </div>
          ) : null}
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
