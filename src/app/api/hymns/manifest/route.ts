import { proxyHymnsRequest } from "@/lib/hymns/proxyBackend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return proxyHymnsRequest("ADMIN_HYMNS_MANIFEST", { method: "GET" });
}
