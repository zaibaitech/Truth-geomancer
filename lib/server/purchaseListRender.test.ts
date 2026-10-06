// Renders the real /purchase list page: new prices and the bundle card.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/session', () => ({ getCurrentUserIfPresent: async () => null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh() {}, push() {} }),
  usePathname: () => '/purchase',
}));

import PurchasePage from '../../app/purchase/page';

describe('purchase list page', () => {
  it('shows the new prices and a clear Complete Geomancy Library bundle card, without the legacy bundle', async () => {
    const html = renderToStaticMarkup(await PurchasePage());
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const expected of ['GH₵120', 'GH₵180', 'GH₵250', 'Complete Geomancy Library', 'Master of Geomancy Vol. 1 + Kanzul Mikban', 'Individual value GH₵300', 'Bundle price GH₵250', 'You save GH₵50']) {
      expect(text, expected).toContain(expected);
    }
    expect(text).not.toContain('Master + Kanzul Bundle');
    expect(text).not.toMatch(/GH₵(100|150)\b/);
  });
});
