export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  priceDisplay: string;
  status: 'readable' | 'coming-soon';
  coverFrom: string;
  coverTo: string;
  chapterCount: number;
}

export const BOOKS: Book[] = [
  {
    id: 'master-of-geomancy-vol-1',
    title: 'The Master of Geomancy',
    author: 'Volume 1',
    description:
      'The foundation text: the history of Ilm al-Raml, how to cast a chart by hand, the Bazdaaho arrangement of the sixteen stars, and every star’s meaning, element and sadaqah.',
    priceDisplay: 'In your library',
    status: 'readable',
    coverFrom: '#3a2a17',
    coverTo: '#161009',
    chapterCount: 10,
  },
  {
    id: 'kanzul-mikban',
    title: 'Kanzul Mikban',
    author: 'The Advanced Treasury',
    description:
      'The advanced companion volume — further casting methods, deeper interpretive technique, and extended chart work. Coming soon.',
    priceDisplay: 'Coming soon',
    status: 'coming-soon',
    coverFrom: '#4a2f1a',
    coverTo: '#1f1610',
    chapterCount: 0,
  },
];

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}
