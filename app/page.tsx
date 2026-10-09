import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Hero } from '@/components/dashboard/Hero';
import { ExploreBooks } from '@/components/dashboard/ExploreBooks';
import { TalkToAuthor } from '@/components/dashboard/TalkToAuthor';
import { ExploreApp } from '@/components/dashboard/ExploreApp';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOME_DESCRIPTION, HOME_TITLE, organizationJsonLd, publicPageMetadata, websiteJsonLd } from '@/lib/seo';

export const metadata = publicPageMetadata({ absoluteTitle: HOME_TITLE, description: HOME_DESCRIPTION, path: '/' });

// Prompt 61/63: the dashboard doubles as the app's home AND its primary
// discovery/storefront entry point — a visitor sees the books and the path
// to the author here, without opening a book detail page first. Prompt 63
// tightened this further: a single compact Hero (no rotating carousel) so
// "The Books" appears as early as possible in the first screenful, per the
// approved visual concept (see each component's own comment for why).
export default async function DashboardPage() {
  // Server-known sign-in state, so a signed-out visitor sees "Sign in" in the
  // first HTML (not only after a client-side status check). Only the yes/no
  // is passed — never the email — because `/` is the service worker's cached
  // offline shell and must carry no personal data. The live client check
  // still runs and fills in the account details.
  const user = await getCurrentUserIfPresent();
  const initialAuth = { authenticated: Boolean(user?.email), email: null };

  // JSON-LD sits outside the space-y-5 wrapper so it can't add a sibling margin.
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <div className="space-y-5 pb-2">
        <DashboardHeader initialAuth={initialAuth} />
        <Hero />
        <ExploreBooks />
        <TalkToAuthor />
        <ExploreApp />
      </div>
    </>
  );
}
