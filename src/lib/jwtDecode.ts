/** Decode JWT `exp` (seconds) to ms. Uses `atob` only (Edge-safe; no Buffer). */
export function decodeJwtExpMs(accessToken: string): number | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: number };
    return payload.exp != null ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
