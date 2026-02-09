/**
 * Guest token helper utilities
 *
 * Usage:
 * - call `ensureGuestToken()` on the client to create a session-only token for the guest (stored in sessionStorage)
 * - pass `guest_token` (the raw token) when calling server APIs that accept a guest identifier
 * - or use `getOrCreateGuestIdentifier()` to get the API-ready identifier formatted as `guest_<token>`
 * - use `getGuestName()` to get the guest's display name from sessionStorage
 *
 * These functions are safe to import on the server (they won't access `sessionStorage` at module scope).
 */

export const GUEST_STORAGE_KEY = "guest_token";

/**
 * Returns the guest token stored in sessionStorage, or null when not present.
 * Safe to call on server — returns null when `sessionStorage` isn't available.
 */
export function getGuestToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const t = sessionStorage.getItem(GUEST_STORAGE_KEY);
  return t && t.trim() ? t : null;
}

/**
 * Ensures a guest token exists and returns it.
 * Creates a new token if missing and stores it in sessionStorage (session-only).
 * Returns an empty string on server-side calls (can't access `sessionStorage`).
 */
export function ensureGuestToken(days = 0): string {
  if (typeof sessionStorage === "undefined") return "";
  let token = getGuestToken();
  if (!token) {
    // Prefer crypto.randomUUID when available for stronger uniqueness.
    // Avoid using `any` by checking for the presence of `randomUUID` via a typed access.
    const maybeCrypto = (
      globalThis as unknown as { crypto?: { randomUUID?: () => string } }
    ).crypto;
    const newToken =
      maybeCrypto && typeof maybeCrypto.randomUUID === "function"
        ? maybeCrypto.randomUUID()
        : `g_${Date.now()}_${Math.random().toString(days).slice(2, 10)}`;

    sessionStorage.setItem(GUEST_STORAGE_KEY, newToken);
    token = newToken;
  }
  return token;
}

/**
 * Returns a user-identifier string suitable for API path parameters when checking wishlist,
 * e.g. `guest_<token>`. Returns null if no token exists and this is executed on server.
 */
export function getGuestIdentifier(): string | null {
  const token = getGuestToken();
  return token ? `guest_${token}` : null;
}

/**
 * Returns the guest name stored in sessionStorage, or null when not present.
 * Safe to call on server — returns null when `sessionStorage` isn't available.
 */
export function getGuestName(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const name = sessionStorage.getItem("guestName");
  return name && name.trim() ? name : null;
}

/**
 * Ensures a guest token exists (creates one if needed) and returns the API identifier `guest_<token>`.
 * Returns an empty string on server-side calls.
 */
export function getOrCreateGuestIdentifier(days = 0): string {
  const token = ensureGuestToken(days);
  return token ? `guest_${token}` : "";
}

/**
 * Removes the guest token from sessionStorage (client-side only).
 */
export function clearGuestToken(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(GUEST_STORAGE_KEY);
}

/**
 * Returns true if a guest token exists in cookies (client-side).
 */
export function hasGuestToken(): boolean {
  return !!getGuestToken();
}
