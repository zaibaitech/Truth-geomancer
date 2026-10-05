// Same-origin guard for state-changing auth POSTs (auth/session redesign).
//
// The session cookie is SameSite=Lax, so a cross-site POST never carries it;
// this adds an explicit, independent check (defence in depth against
// login-CSRF): a browser always sends an Origin header on a POST, and when it
// is present it must be this app's own origin. A request with no Origin header
// cannot come from a browser page on another site, so it is allowed (that also
// keeps server-to-server tooling and tests simple).
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    // ignore
  }
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      // ignore a malformed value; the request URL origin still applies
    }
  }
  return allowed.has(origin);
}
