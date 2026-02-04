/**
 * Guest token helper utilities
 *
 * Usage:
 * - call `ensureGuestToken()` on the client to create a persistent token for the guest (stored in cookie)
 * - pass `guest_token` (the raw token) when calling server APIs that accept a guest identifier
 * - or use `getOrCreateGuestIdentifier()` to get the API-ready identifier formatted as `guest_<token>`
 *
 * These functions are safe to import on the server (they won't access `document` at module scope).
 */

import { getCookie, setCookie, removeCookie } from "@/lib/cookieUtils";

export const GUEST_COOKIE_NAME = "guest_token";

/**
 * Returns the guest token stored in cookies, or null when not present.
 * Safe to call on server — returns null when `document` isn't available.
 */
export function getGuestToken(): string | null {
  if (typeof document === "undefined") return null;
  const t = getCookie(GUEST_COOKIE_NAME);
  return t && t.trim() ? t : null;
}

/**
 * Ensures a guest token exists and returns it.
 * Creates a new token if missing and stores it in a cookie for the specified number of days.
 * Returns an empty string on server-side calls (can't access `document`).
 */
export function ensureGuestToken(days = 365): string {
  if (typeof document === "undefined") return "";
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
        : `g_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    setCookie(GUEST_COOKIE_NAME, newToken, days);
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
 * Ensures a guest token exists (creates one if needed) and returns the API identifier `guest_<token>`.
 * Returns an empty string on server-side calls.
 */
export function getOrCreateGuestIdentifier(days = 365): string {
  const token = ensureGuestToken(days);
  return token ? `guest_${token}` : "";
}

/**
 * Removes the guest token cookie (client-side only).
 */
export function clearGuestToken(): void {
  if (typeof document === "undefined") return;
  removeCookie(GUEST_COOKIE_NAME);
}

/**
 * Returns true if a guest token exists in cookies (client-side).
 */
export function hasGuestToken(): boolean {
  return !!getGuestToken();
}
