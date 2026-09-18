// Prompt 63: the dashboard's compact "Explore the App" strip — pure data
// so its routes/copy are testable without rendering JSX. Every href here
// is an existing, already-working route/anchor (the book reader's own
// section anchors, and the existing casting route) — nothing new is
// invented; "Elements & Work" (still reachable inside the book reader
// itself) is simply no longer one of the four featured shortcuts, per
// Prompt 63's own four-item spec.
const MASTER_READ_PATH = '/books/master-of-geomancy-vol-1/read';

export interface ExploreAppItem {
  href: string;
  iconName: 'cast' | 'stars' | 'sadaqah' | 'buruj';
  title: string;
  description: string;
}

export const EXPLORE_APP_ITEMS: ExploreAppItem[] = [
  { href: '/raml', iconName: 'cast', title: 'Cast', description: 'Get answers' },
  { href: `${MASTER_READ_PATH}#stars-and-symbols`, iconName: 'stars', title: 'The 16 Stars', description: 'Learn their meanings' },
  { href: `${MASTER_READ_PATH}#star-sadaqah`, iconName: 'sadaqah', title: 'Sadaqah Guide', description: 'Spiritual support' },
  { href: `${MASTER_READ_PATH}#knowing-your-buruji`, iconName: 'buruj', title: 'Your Buruj', description: 'Know your sign' },
];
