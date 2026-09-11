import { Header } from '@/components/layout/Header';
import { HeroCard } from '@/components/dashboard/HeroCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MarketplaceStrip } from '@/components/dashboard/MarketplaceStrip';

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <Header />
      <HeroCard />
      <QuickActions />
      <MarketplaceStrip />
    </div>
  );
}
