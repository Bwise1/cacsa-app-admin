"use client";

import Navbar from "./Navbar";
import { Toaster } from "react-hot-toast";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster />
      <div className="text-white h-[100dvh] min-h-[720px] flex w-full overflow-hidden">
        <Navbar />
        <div className="pt-9 px-6 sm:px-9 pb-3 bg-black flex-1 min-w-0 flex flex-col h-full overflow-auto">
          {children}
        </div>
      </div>
    </>
  );
}
