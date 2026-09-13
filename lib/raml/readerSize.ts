// Reading size (Prompt 18).
//
// One preference, three steps, kept on the device. It scales the reading type
// scale defined in app/globals.css — and only that scale, so the text a person
// reads grows while figure glyphs, chart geometry, icons and the logo stay
// exactly as they are. Nothing here touches a calculation or a source.
export type ReaderSize = 'standard' | 'large' | 'xlarge';

export const READER_SIZE_KEY = 'truth-geomancer:reader-size';
export const DEFAULT_READER_SIZE: ReaderSize = 'standard';

/** The attribute the stylesheet keys off, on <html>. */
export const READER_SIZE_ATTRIBUTE = 'data-reader-size';

export const READER_SIZES: { id: ReaderSize; label: string; hint: string }[] = [
  { id: 'standard', label: 'Standard', hint: 'The default reading size' },
  { id: 'large', label: 'Large', hint: 'About 15% larger' },
  { id: 'xlarge', label: 'Extra large', hint: 'About a third larger' },
];

export function isReaderSize(value: unknown): value is ReaderSize {
  return value === 'standard' || value === 'large' || value === 'xlarge';
}

/** Reads the stored preference, falling back to Standard for anything at all
 * unexpected — no storage, blocked storage, a value from a future version, or
 * a corrupted one. A bad preference must never keep the app from loading. */
export function readReaderSize(): ReaderSize {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_READER_SIZE;
    const raw = window.localStorage.getItem(READER_SIZE_KEY);
    return isReaderSize(raw) ? raw : DEFAULT_READER_SIZE;
  } catch {
    return DEFAULT_READER_SIZE;
  }
}

export function applyReaderSize(size: ReaderSize): void {
  try {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(READER_SIZE_ATTRIBUTE, size);
  } catch {
    // Nothing to do: the page simply stays at the standard size.
  }
}

/** Applies the choice and remembers it. Returns false when the browser would
 * not store it — the size still changes for this visit. */
export function setReaderSize(size: ReaderSize): boolean {
  applyReaderSize(size);
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(READER_SIZE_KEY, size);
    return true;
  } catch {
    return false;
  }
}

/** Runs before first paint, from the document head, so a reader who chose a
 * larger size never sees a flash of the standard one. Deliberately tiny and
 * total: any failure leaves the standard size in place. */
export const READER_SIZE_BOOTSTRAP = `(function(){try{var v=localStorage.getItem('${READER_SIZE_KEY}');if(v==='large'||v==='xlarge'){document.documentElement.setAttribute('${READER_SIZE_ATTRIBUTE}',v);}}catch(e){}})();`;
