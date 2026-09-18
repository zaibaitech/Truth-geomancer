import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Hero } from '@/components/dashboard/Hero';
import { ExploreBooks } from '@/components/dashboard/ExploreBooks';
import { TalkToAuthor } from '@/components/dashboard/TalkToAuthor';
import { ExploreApp } from '@/components/dashboard/ExploreApp';

// Prompt 61/63: the dashboard doubles as the app's home AND its primary
// discovery/storefront entry point — a visitor sees the books and the path
// to the author here, without opening a book detail page first. Prompt 63
// tightened this further: a single compact Hero (no rotating carousel) so
// "The Books" appears as early as possible in the first screenful, per the
// approved visual concept (see each component's own comment for why).
export default function DashboardPage() {
  return (
    <div className="space-y-5 pb-2">
      <DashboardHeader />
      <Hero />
      <ExploreBooks />
      <TalkToAuthor />
      <ExploreApp />
    </div>
  );
}
