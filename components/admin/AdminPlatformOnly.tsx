import { ShieldAlert } from 'lucide-react';
import { AdminShell } from './AdminShell';
import { Card } from '@/components/ui/Card';

/** Shown to a signed-in AUTHOR who opens a platform-admin-only page. Renders no
 * data — the page returns this before loading anything. */
export function AdminPlatformOnly() {
  return (
    <AdminShell variant="author">
      <div className="px-4 py-4">
        <Card>
          <div className="flex items-center gap-2 text-clay-light">
            <ShieldAlert size={16} aria-hidden />
            <p className="type-body font-semibold text-sand-light">Platform administrators only</p>
          </div>
          <p className="mt-1.5 type-body text-sand/70">
            This area is for platform administrators. As an author you can see and read the books assigned to you.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
