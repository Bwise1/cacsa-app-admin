import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { API_ENDPOINTS } from "@/lib/endpoints";
import { canAccessHymns } from "@/lib/hymns/permissions";

function apiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_REST_API_ENDPOINT?.trim();
  if (!raw) return null;
  return raw.replace(/\/?$/, "");
}

/**
 * Forwards the admin session JWT to cacsa_app_api, which performs Firebase Storage I/O.
 */
export async function proxyHymnsRequest(
  endpointKey: "ADMIN_HYMNS_BUNDLE" | "ADMIN_HYMNS_MANIFEST" | "ADMIN_HYMNS_PUBLISH",
  init?: RequestInit
): Promise<NextResponse> {
  const base = apiBase();
  if (!base) {
    return NextResponse.json(
      {
        error: "REST API not configured",
        hint:
          "Set NEXT_PUBLIC_REST_API_ENDPOINT to your cacsa_app_api base URL (same as login). Hymns are stored via the API using Firebase Admin on the server.",
      },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!canAccessHymns(session?.user?.permissions)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        hint:
          "Your account needs hymns:write or admin:analytics. Ask an admin to update permissions.",
      },
      { status: 403 }
    );
  }

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = API_ENDPOINTS[endpointKey];
  const url = `${base}/${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user.accessToken}`,
      ...(init?.headers as Record<string, string>),
    },
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}
