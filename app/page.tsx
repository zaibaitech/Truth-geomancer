import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HeroCarousel } from '@/components/dashboard/HeroCarousel';
import { RecommendedBooks } from '@/components/dashboard/RecommendedBooks';
import { QuickAccess } from '@/components/dashboard/QuickAccess';

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-2">
      <DashboardHeader />
      <HeroCarousel />
      <RecommendedBooks />
      <QuickAccess />
    </div>
  );
}
