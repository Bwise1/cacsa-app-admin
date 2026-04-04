import { proxyHymnsRequest } from "@/lib/hymns/proxyBackend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return proxyHymnsRequest("ADMIN_HYMNS_PUBLISH", { method: "POST" });
}
