// Renders the REAL homepage (app/page.tsx) to HTML, as the server sends it
// before any JavaScript runs, and checks the header's sign-in entry point.
// Production QA found the homepage header showed no "Sign in" until a
// client-side status check completed.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let current: { id: string; email: string | null } | null;

vi.mock('@/lib/server/session', () => ({ getCurrentUserIfPresent: async () => current }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh() {}, push() {} }),
}));

// The page's content sections (some are async Server Components) are not what
// this test is about; the REAL page logic and the REAL header are rendered.
vi.mock('@/components/dashboard/Hero', () => ({ Hero: () => null }));
vi.mock('@/components/dashboard/ExploreBooks', () => ({ ExploreBooks: () => null }));
vi.mock('@/components/dashboard/TalkToAuthor', () => ({ TalkToAuthor: () => null }));
vi.mock('@/components/dashboard/ExploreApp', () => ({ ExploreApp: () => null }));

import DashboardPage from '../../app/page';

async function html() {
  return renderToStaticMarkup(await DashboardPage());
}
const header = (m: string) => m.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
const signInLinks = (m: string) => m.match(/<a[^>]*href="\/signin\?returnTo=[^"]*"[^>]*>Sign in<\/a>/g) ?? [];

beforeEach(() => {
  current = null;
});

describe('homepage header sign-in entry point (server-rendered)', () => {
  it('a visitor with no session sees exactly one Sign in, in the header, returning to /', async () => {
    const m = await html();
    expect(signInLinks(header(m))).toHaveLength(1);
    expect(signInLinks(m)).toHaveLength(1);
    expect(header(m)).toContain('href="/signin?returnTo=%2F"');
  });

  it('an anonymous identity (no email) also sees Sign in', async () => {
    current = { id: 'anon-1', email: null };
    expect(signInLinks(header(await html()))).toHaveLength(1);
  });

  it('a signed-in visitor sees the account control, no Sign in — and the email is never in the HTML', async () => {
    current = { id: 'acct-1', email: 'reader@example.com' };
    const m = await html();
    expect(signInLinks(m)).toHaveLength(0);
    expect(header(m)).toContain('aria-label="Account — signed in"');
    expect(m).not.toContain('reader@example.com');
  });

  it('the rest of the header is unchanged: search, notifications and settings remain', async () => {
    const h = header(await html());
    for (const label of ['Search', 'Notifications', 'Settings']) expect(h).toContain(`aria-label="${label}"`);
  });
});
