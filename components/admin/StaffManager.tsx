'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

// Client UI for staff management. It holds NO authority: every action is a
// request to /api/admin/staff, which authorizes the caller server-side and
// validates every target. This component only displays what that API returns.
type Role = 'platform_admin' | 'author';
interface Member {
  userId: string;
  email: string;
  role: Role;
  grantedAt: string;
  bookIds: string[];
}
interface BookOption {
  id: string;
  title: string;
}

const ROLE_LABEL: Record<Role, string> = { platform_admin: 'Platform admin', author: 'Author' };

export function StaffManager({
  initialStaff,
  books,
  currentUserId,
}: {
  initialStaff: Member[];
  books: BookOption[];
  currentUserId: string | null;
}) {
  const [staff, setStaff] = useState<Member[]>(initialStaff);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('author');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function send(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { staff?: Member[]; error?: string };
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error ?? 'That change could not be made.' });
        return false;
      }
      if (data.staff) setStaff(data.staff);
      setMessage({ kind: 'ok', text: success });
      return true;
    } catch {
      setMessage({ kind: 'error', text: 'Could not reach the server. Check your connection and try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const titleOf = (id: string) => books.find((b) => b.id === id)?.title ?? id;

  return (
    <div className="space-y-4">
      <Card>
        <p className="type-body font-semibold text-sand-light">Add or change a staff role</p>
        <p className="mt-1 type-meta text-sand/65">
          The person must already have signed in to Truth Geomancer with this email.
        </p>
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await send({ action: 'grant-role', email, role }, 'Role saved.')) setEmail('');
          }}
        >
          <label className="block">
            <span className="type-label text-sand/65">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
            />
          </label>
          <label className="block">
            <span className="type-label text-sand/65">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
            >
              <option value="author">Author — reads and sees only their assigned books</option>
              <option value="platform_admin">Platform admin — full administration and all books</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busy || email.trim().length === 0}
            className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
          >
            Save role
          </button>
        </form>
      </Card>

      {message ? (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`type-body ${message.kind === 'error' ? 'text-red-400' : 'text-clay-light'}`}>
          {message.text}
        </p>
      ) : null}

      <div>
        <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Staff ({staff.length})</p>
        {staff.length === 0 ? <p className="type-body text-sand/70">No staff accounts yet.</p> : null}
        <div className="space-y-3">
          {staff.map((member) => {
            const unassigned = books.filter((b) => !member.bookIds.includes(b.id));
            return (
              <Card key={member.userId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all type-body font-semibold text-sand-light">{member.email}</p>
                    <p className="type-meta text-sand/65">{ROLE_LABEL[member.role]}</p>
                  </div>
                  {member.userId !== currentUserId ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => send({ action: 'revoke-role', userId: member.userId }, 'Role removed.')}
                      className="min-h-[40px] shrink-0 rounded-lg border border-sand/15 px-3 type-label text-sand/70 disabled:opacity-50"
                    >
                      Remove role
                    </button>
                  ) : (
                    <span className="shrink-0 type-label text-sand/65">You</span>
                  )}
                </div>
                {member.role === 'author' ? (
                  <div className="mt-3 space-y-2">
                    <p className="type-label uppercase tracking-widest text-sand/65">Assigned books</p>
                    {member.bookIds.length === 0 ? <p className="type-meta text-sand/65">None yet.</p> : null}
                    {member.bookIds.map((bookId) => (
                      <div key={bookId} className="flex items-center justify-between gap-2">
                        <p className="min-w-0 type-body text-sand-light">{titleOf(bookId)}</p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => send({ action: 'unassign-book', userId: member.userId, bookId }, 'Book unassigned.')}
                          className="min-h-[40px] shrink-0 rounded-lg border border-sand/15 px-3 type-label text-sand/70 disabled:opacity-50"
                        >
                          Unassign
                        </button>
                      </div>
                    ))}
                    {unassigned.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        disabled={busy}
                        onClick={() => send({ action: 'assign-book', userId: member.userId, bookId: book.id }, 'Book assigned.')}
                        className="flex min-h-[40px] w-full items-center justify-center rounded-lg border border-clay/40 px-3 type-label text-clay-light disabled:opacity-50"
                      >
                        Assign “{book.title}”
                      </button>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
