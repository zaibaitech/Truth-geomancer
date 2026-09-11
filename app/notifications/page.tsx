import { BellOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';

export default function NotificationsPage() {
  return (
    <div>
      <Header title="Notifications" />
      <div className="px-4 py-4">
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <BellOff size={22} className="text-sand/30" />
          <div>
            <p className="text-sm font-medium text-sand-light">No notifications yet</p>
            <p className="mt-1 max-w-[240px] text-xs text-sand/45">
              We’ll let you know here about new manuscripts and features as they arrive.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
