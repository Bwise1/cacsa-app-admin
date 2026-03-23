"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import SessionErrorBridge from "./SessionErrorBridge";

interface Props {
  children: ReactNode;
}

const AuthProvider = ({ children }: Props) => {
  return (
    <SessionProvider
      refetchInterval={4 * 60}
      refetchOnWindowFocus
    >
      <SessionErrorBridge />
      {children}
    </SessionProvider>
  );
};

export default AuthProvider;
