import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { AdminPlatformOnly } from '@/components/admin/AdminPlatformOnly';
import { StaffManager } from '@/components/admin/StaffManager';
import { BOOKS } from '@/content/books';
import { getAdminActor, isPlatformAdminActor } from '@/lib/server/adminActor';
import { getDb } from '@/lib/server/db';
import { listStaff } from '@/lib/server/staffAdmin';

// Staff management — platform admins only. Every change goes through
// /api/admin/staff, which re-checks platform-admin authority server-side.
export default async function AdminStaffPage() {
  const actor = await getAdminActor();
  if (!actor) return <AdminSignInRequired />;
  if (!isPlatformAdminActor(actor)) return <AdminPlatformOnly />;

  const staff = await listStaff(getDb());

  return (
    <AdminShell variant="platform">
      <div className="px-4 py-4">
        <StaffManager
          initialStaff={staff}
          books={BOOKS.map((b) => ({ id: b.id, title: b.title }))}
          currentUserId={actor.userId}
        />
      </div>
    </AdminShell>
  );
}
