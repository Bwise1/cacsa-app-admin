"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/** Forces logout when API refresh token is invalid or expired. */
export default function SessionErrorBridge() {
  const { data: session, status } = useSession();
  const didForceSignOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      didForceSignOut.current = false;
      return;
    }
    if (
      session?.error === "RefreshAccessTokenError" &&
      !didForceSignOut.current
    ) {
      didForceSignOut.current = true;
      void signOut({ callbackUrl: "/", redirect: true });
    }
  }, [session?.error, status]);

  return null;
}
