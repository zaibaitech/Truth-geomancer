// Auth/session redesign, Phase 0 — the service worker must never persist or
// replay a per-user (session-dependent) response. These tests EXECUTE the real
// public/sw.js in a sandbox with an in-memory Cache API and a fake network,
// rather than matching its source text, so they prove behaviour.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';

const SW_SOURCE = readFileSync('public/sw.js', 'utf-8');
const ORIGIN = 'https://truthgeomancer.com';

class MemoryCache {
  entries = new Map<string, Response>();
  async put(req: Request | string, res: Response) {
    this.entries.set(typeof req === 'string' ? new URL(req, ORIGIN).href : req.url, res);
  }
  async add(url: string) {
    this.entries.set(new URL(url, ORIGIN).href, new Response(`shell:${url}`));
  }
  async match(req: Request | string) {
    const key = typeof req === 'string' ? new URL(req, ORIGIN).href : req.url;
    return this.entries.get(key)?.clone();
  }
  async keys() {
    return Array.from(this.entries.keys()).map((u) => new Request(u));
  }
  async delete(req: Request | string) {
    return this.entries.delete(typeof req === 'string' ? new URL(req, ORIGIN).href : req.url);
  }
}

class MemoryCacheStorage {
  stores = new Map<string, MemoryCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new MemoryCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return Array.from(this.stores.keys());
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(req: Request | string) {
    for (const store of Array.from(this.stores.values())) {
      const hit = await store.match(req);
      if (hit) return hit;
    }
    return undefined;
  }
}

interface Harness {
  caches: MemoryCacheStorage;
  network: { online: boolean; body: (url: string) => string; calls: string[] };
  fetch: (path: string) => Promise<Response>;
  activate: () => Promise<void>;
  install: () => Promise<void>;
}

function loadWorker(): Harness {
  const handlers: Record<string, (event: unknown) => void> = {};
  const caches = new MemoryCacheStorage();
  const network = { online: true, body: (url: string) => `network:${new URL(url).pathname}`, calls: [] as string[] };
  const fakeFetch = async (req: Request | string) => {
    const url = typeof req === 'string' ? new URL(req, ORIGIN).href : req.url;
    network.calls.push(new URL(url).pathname);
    if (!network.online) throw new TypeError('offline');
    return new Response(network.body(url), { status: 200 });
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: (event: unknown) => void) => {
      handlers[type] = fn;
    },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(SW_SOURCE, { self, caches, fetch: fakeFetch, URL, Request, Response, Promise, console });

  return {
    caches,
    network,
    async fetch(path: string) {
      let responded: Promise<Response> | undefined;
      handlers.fetch({ request: new Request(ORIGIN + path), respondWith: (p: Promise<Response>) => (responded = p) });
      if (!responded) throw new Error(`worker did not respond to ${path}`);
      return responded;
    },
    async activate() {
      let pending: Promise<unknown> | undefined;
      handlers.activate({ waitUntil: (p: Promise<unknown>) => (pending = p) });
      await pending;
    },
    async install() {
      let pending: Promise<unknown> | undefined;
      handlers.install({ waitUntil: (p: Promise<unknown>) => (pending = p) });
      await pending;
    },
  };
}

async function cachedPaths(caches: MemoryCacheStorage): Promise<string[]> {
  const out: string[] = [];
  for (const [name, store] of Array.from(caches.stores.entries())) {
    for (const key of Array.from(store.entries.keys())) out.push(`${name}:${new URL(key).pathname}`);
  }
  return out;
}

const USER_SPECIFIC = [
  '/books',
  '/books/kanzul-mikban',
  '/books/kanzul-mikban/read',
  '/purchase',
  '/purchase/kanzul-mikban',
  '/preview/kanzul-mikban',
  '/settings',
  '/account',
  '/signin',
  '/auth/confirm',
  '/raml',
  '/raml/history',
  '/raml/practice/x/y',
  '/api/auth/status',
];

let sw: Harness;
beforeEach(() => {
  sw = loadWorker();
});

describe('user-specific routes are network-only', () => {
  it.each(USER_SPECIFIC)('%s is fetched from the network and never written to any cache', async (path) => {
    const res = await sw.fetch(path);
    expect(await res.text()).toBe(`network:${path}`);
    expect(sw.network.calls).toContain(path);
    await new Promise((r) => setTimeout(r, 0));
    expect((await cachedPaths(sw.caches)).filter((p) => p.endsWith(`:${path}`))).toEqual([]);
  });

  it('a stale signed-out copy already in the cache is never served — the live (signed-in) page is', async () => {
    const runtime = await sw.caches.open('tg-runtime-v9');
    await runtime.put(new Request(`${ORIGIN}/books/kanzul-mikban`), new Response('STALE: Not yet unlocked'));
    sw.network.body = () => 'LIVE: unlocked for the signed-in user';
    expect(await (await sw.fetch('/books/kanzul-mikban')).text()).toBe('LIVE: unlocked for the signed-in user');
  });

  it("user A's cached state can never be shown to user B on the same browser", async () => {
    const runtime = await sw.caches.open('tg-runtime-v9');
    await runtime.put(new Request(`${ORIGIN}/purchase/kanzul-mikban`), new Response("user A's pending request"));
    sw.network.body = () => "user B's own status";
    expect(await (await sw.fetch('/purchase/kanzul-mikban')).text()).toBe("user B's own status");
  });

  it('offline, a user-specific page falls back to the account-free shell — never a cached per-user copy', async () => {
    await sw.install();
    const runtime = await sw.caches.open('tg-runtime-v9');
    await runtime.put(new Request(`${ORIGIN}/books`), new Response('STALE per-user books'));
    sw.network.online = false;
    expect(await (await sw.fetch('/books')).text()).toBe('shell:/');
  });
});

describe('public pages are network-first; hashed assets cache-first', () => {
  it('online, the home page always comes from the network (a deploy can never leave stale HTML)', async () => {
    const runtime = await sw.caches.open('tg-runtime-v9');
    await runtime.put(new Request(`${ORIGIN}/`), new Response('old deploy'));
    expect(await (await sw.fetch('/')).text()).toBe('network:/');
  });

  it('offline, a public page is served from cache', async () => {
    await sw.fetch('/search');
    await new Promise((r) => setTimeout(r, 0));
    sw.network.online = false;
    expect(await (await sw.fetch('/search')).text()).toBe('network:/search');
  });

  it('content-hashed /_next/static assets are cache-first', async () => {
    await sw.fetch('/_next/static/chunks/a.js');
    await new Promise((r) => setTimeout(r, 0));
    sw.network.online = false;
    expect(await (await sw.fetch('/_next/static/chunks/a.js')).text()).toBe('network:/_next/static/chunks/a.js');
  });
});

describe('install and activate', () => {
  it('the precached shell contains no user-specific page', async () => {
    await sw.install();
    const shell = (await cachedPaths(sw.caches)).map((p) => p.split(':')[1]);
    expect(shell).toContain('/');
    for (const path of USER_SPECIFIC) expect(shell).not.toContain(path);
  });

  it('activation retires old-version caches, purges per-user entries, and never touches book downloads', async () => {
    const oldRuntime = await sw.caches.open('tg-runtime-v8');
    await oldRuntime.put(new Request(`${ORIGIN}/books`), new Response('v8 per-user'));
    const current = await sw.caches.open('tg-runtime-v9');
    await current.put(new Request(`${ORIGIN}/purchase`), new Response('leftover per-user'));
    await current.put(new Request(`${ORIGIN}/search`), new Response('public'));
    const book = await sw.caches.open('tg-book-kanzul-mikban-v1');
    await book.put(new Request(`${ORIGIN}/books/kanzul-mikban/read`), new Response('downloaded book'));

    await sw.activate();

    const names = await sw.caches.keys();
    expect(names).not.toContain('tg-runtime-v8');
    expect(names).toContain('tg-book-kanzul-mikban-v1');
    const remaining = await cachedPaths(sw.caches);
    expect(remaining).toContain('tg-runtime-v9:/search');
    expect(remaining).not.toContain('tg-runtime-v9:/purchase');
    expect(remaining).toContain('tg-book-kanzul-mikban-v1:/books/kanzul-mikban/read');
  });
});
