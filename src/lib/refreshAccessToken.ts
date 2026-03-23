import type { JWT } from "next-auth/jwt";
import { decodeJwtExpMs } from "@/lib/jwtDecode";

const serverUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? "";

/** Call API to swap refresh JWT for new access + refresh tokens. */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken as string | undefined;
  if (!refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
  try {
    const res = await fetch(`${serverUrl}auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { token?: string; refreshToken?: string };
      message?: string;
    };
    if (!res.ok || !json.data?.token) {
      return { ...token, error: "RefreshAccessTokenError" };
    }
    const { token: newAccess, refreshToken: newRefresh } = json.data;
    const exp = decodeJwtExpMs(newAccess);
    return {
      ...token,
      accessToken: newAccess,
      refreshToken: newRefresh ?? refreshToken,
      accessTokenExpires: exp ?? Date.now() + 14 * 60 * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
