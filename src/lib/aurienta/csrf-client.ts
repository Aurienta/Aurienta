// AURIENTA CSRF-aware fetch helper.
//
// Wraps the native fetch() to automatically include the X-CSRF-Token header
// (double-submit pattern) on state-changing requests (POST/PATCH/PUT/DELETE).
// The middleware accepts EITHER a same-origin Origin OR a matching
// X-CSRF-Token header — sending both maximizes compatibility with browsers
// or extensions that strip the Origin header for same-origin POSTs.
//
// Usage (drop-in replacement for fetch in client components):
//   const res = await csrfFetch("/api/auth", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });

/** Read the CSRF token from the aurienta_csrf cookie. */
export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("aurienta_csrf="));
  return cookie?.split("=").slice(1).join("=") ?? "";
}

const STATE_CHANGING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Fetch wrapper that automatically adds the X-CSRF-Token header and
 * credentials: "same-origin" for state-changing requests. GET/HEAD/OPTIONS
 * pass through unchanged.
 */
export async function csrfFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  if (!STATE_CHANGING.has(method)) {
    // Safe method — no CSRF needed.
    return fetch(input, init);
  }

  const token = getCsrfToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("X-CSRF-Token", token);

  return fetch(input, {
    ...init,
    credentials: "same-origin",
    headers,
  });
}
