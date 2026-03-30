import { proxyHymnsRequest } from "@/lib/hymns/proxyBackend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return proxyHymnsRequest("ADMIN_HYMNS_BUNDLE", { method: "GET" });
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyHymnsRequest("ADMIN_HYMNS_BUNDLE", {
    method: "PUT",
    body,
  });
}
