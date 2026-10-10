// Titles, descriptions and headings of the public learning pages (SEO
// Phase 1, Stage 1b), exactly as approved in the short drafts. Kept as data
// so the guard tests can check them (unique, snippet length, no rulings or
// claims) without rendering.
export const LEARN_PUBLISHED = '2026-10-09';

export const LEARN_HUB = {
  path: '/learn',
  title: 'Learn Ilm al-Raml (Geomancy): Free Basics',
  description:
    'Free basics of Ilm al-Raml, the science of the sand: what it is, the 16 figures, the 16 houses, and how to cast your own chart.',
  h1: 'Learn Ilm al-Raml',
  crumb: 'Learn',
} as const;

export const ILM_AL_RAML_INTRO = {
  path: '/learn/ilm-al-raml',
  // 64 characters with the " | Truth Geomancer" suffix, so it is used as the whole title.
  absoluteTitle: 'What Is Ilm al-Raml? Geomancy Explained Simply',
  description:
    'Ilm al-Raml, the science of the sand, is the classical art of geomancy. Learn what it is, where it comes from and how a 16-house chart is built.',
  h1: 'What is Ilm al-Raml?',
  crumb: 'What is Ilm al-Raml?',
} as const;

export const GLOSSARY = {
  path: '/learn/glossary',
  title: 'Ilm al-Raml Glossary: Key Geomancy Terms',
  description: 'Short definitions of the key terms of Ilm al-Raml: figures, houses, Mothers, the Judge and more.',
  h1: 'Ilm al-Raml: key terms',
  crumb: 'Glossary',
} as const;

export interface GlossaryTerm {
  term: string;
  definition: string;
  /** Optional "see also" page; shown only once that page is published. */
  see?: { label: string; href: string };
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Ilm al-Raml', definition: '“The science of the sand”, the Arabic name for geomancy.' },
  { term: 'Geomancy', definition: 'The English name, from the Latin geomantia.' },
  {
    term: 'Figure (star)',
    definition: 'One of sixteen stacks of four rows, each row with one dot or two.',
    see: { label: 'The 16 figures', href: '/figures' },
  },
  { term: 'Element', definition: 'Each figure belongs to Fire, Air, Water or Sand/Earth.' },
  {
    term: 'House',
    definition: 'One of the sixteen positions in a chart.',
    see: { label: 'The 16 houses', href: '/houses' },
  },
  { term: 'Mothers', definition: 'The first four figures cast, from which the rest of the chart is built.' },
  { term: 'Judge', definition: 'The fifteenth house, which gives the chart’s overall answer.' },
  { term: 'Querent', definition: 'The person asking the question.' },
];
