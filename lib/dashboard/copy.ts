// Prompt 61/63: centralized static dashboard copy. Kept in one small module
// (rather than inline in JSX) so the "no pricing yet" business decision is
// something a test can actually check, not just a promise kept by review.
export const HERO_VALUE_PROP = {
  tags: ['Classical Knowledge', 'Practical Tools', 'Real Insights'],
  heading: ['Read the Tradition.', 'Practice the Method.'],
  body: 'Explore the classical books and interactive tools of Truth Geomancer.',
  cta: 'Begin a Casting',
  href: '/raml',
} as const;

export const EXPLORE_BOOKS_COPY = {
  heading: 'The Books',
  body: 'Discover the books behind the tradition — and explore their methods inside the app.',
} as const;

export const TALK_TO_AUTHOR_COPY = {
  heading: 'Talk to the Author',
  body: 'Have a question about a book, payment, or the methods? Contact the author directly on WhatsApp.',
  cta: 'Chat on WhatsApp',
} as const;

export const EXPLORE_APP_COPY = {
  heading: 'Explore the App',
} as const;

export const CONTACT_FOR_PRICE_COPY = 'Contact the Author for current price and payment information.';
