import Link from 'next/link';
import { Search, Bell, Settings, History, BookOpen, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';

const ITEMS = [
  { href: '/search', icon: Search, title: 'Search', description: 'Books, chapters and stars' },
  { href: '/raml/history', icon: History, title: 'Past Castings', description: 'Every chart you’ve saved' },
  { href: '/notifications', icon: Bell, title: 'Notifications', description: 'Updates and announcements' },
  { href: '/settings', icon: Settings, title: 'Settings', description: 'Your data and app info' },
  { href: '/books', icon: BookOpen, title: 'Library', description: 'The full manuscript catalog' },
];

export default function MorePage() {
  return (
    <div>
      <Header title="More" />
      <div className="px-4 py-4">
        <Card padding="p-0">
          {ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i !== ITEMS.length - 1 ? 'border-b border-sand/10' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 text-clay-light">
                <item.icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-sand-light">{item.title}</p>
                <p className="text-xs text-sand/45">{item.description}</p>
              </div>
              <ChevronRight size={16} className="text-sand/25" />
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}
