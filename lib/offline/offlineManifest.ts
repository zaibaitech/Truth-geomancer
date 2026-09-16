// Local offline-authorization manifest (Prompt 30, Phase 3/16). Records
// "this device downloaded book X at content version Y, because it was
// entitled at the time" — descriptive metadata only, never an
// authorization credential. See this module's own comment below on why
// it is deliberately unsigned.
//
// WHY NO SIGNATURE: a signed manifest would let the client cryptographically
// prove "the server said I was authorized." But nothing in this app ever
// asks the manifest that question — the actual security boundary is the
// server-side canAccessForUser() check made at DOWNLOAD time (see
// app/api/books/[bookId]/offline/route.ts), whose result — the real
// protected text, or nothing at all — is what gets written into Cache
// Storage. The manifest here is read only to decide UI state ("Available
// offline" vs "Update available"); it is never consulted to decide
// whether to RENDER protected content. Forging a manifest entry gains an
// attacker nothing: it cannot conjure real cached content that was never
// legitimately downloaded, since the cache entries themselves only ever
// come from an authorized 200 response. Signing this value would
// therefore misrepresent it as a credential it structurally cannot be —
// exactly what Prompt 30 Phase 16 says not to fake. If a future
// architecture change ever makes the manifest itself load-bearing for an
// access decision, it would need a real signature (server-side secret,
// never shipped to the client) at that point — not before.
//
// Stores no session token, secret, password, or payment detail — only the
// fields below, in localStorage (small, synchronous, easy to reason about
// — separate from the actual book content, which stays in Cache Storage).
export interface OfflineManifestEntry {
  bookId: string;
  contentVersion: string;
  authorizedAt: string; // ISO 8601
  accessType: 'entitled';
}

const STORAGE_PREFIX = 'tg-offline-manifest:';

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

export function writeOfflineManifest(entry: OfflineManifestEntry): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + entry.bookId, JSON.stringify(entry));
  } catch {
    // Storage unavailable/full — the download itself (Cache Storage) may
    // still have succeeded; losing only the version-metadata convenience
    // is not worth failing the whole operation over.
  }
}

export function readOfflineManifest(bookId: string): OfflineManifestEntry | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + bookId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineManifestEntry>;
    if (
      typeof parsed.bookId !== 'string' ||
      typeof parsed.contentVersion !== 'string' ||
      typeof parsed.authorizedAt !== 'string' ||
      parsed.accessType !== 'entitled'
    ) {
      return null;
    }
    return parsed as OfflineManifestEntry;
  } catch {
    return null;
  }
}

export function removeOfflineManifest(bookId: string): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + bookId);
  } catch {
    // Nothing more to do.
  }
}
