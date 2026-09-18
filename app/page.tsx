import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HeroCarousel } from '@/components/dashboard/HeroCarousel';
import { ExploreBooks } from '@/components/dashboard/ExploreBooks';
import { TalkToAuthor } from '@/components/dashboard/TalkToAuthor';
import { QuickAccess } from '@/components/dashboard/QuickAccess';

// Prompt 61: the dashboard doubles as the app's home AND its primary
// discovery/storefront entry point — a visitor sees the books and the path
// to the author here, without opening a book detail page first (see
// ExploreBooks/TalkToAuthor's own comments for why each exists).
export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-2">
      <DashboardHeader />
      <HeroCarousel />
      <ExploreBooks />
      <TalkToAuthor />
      <QuickAccess />
    </div>
  );
}
