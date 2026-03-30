/**
 * Who can open /hymns and call hymns APIs.
 * - `hymns:write`: explicit (see db migration 008_hymns_permission.sql)
 * - `admin:analytics`: same admins who see Overview (avoids empty nav if migration not applied)
 */
export function canAccessHymns(permissions: string[] | undefined): boolean {
  if (!permissions?.length) return false;
  return (
    permissions.includes("hymns:write") ||
    permissions.includes("admin:analytics")
  );
}
