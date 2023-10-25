import Navbar from "./Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-white h-[100dvh] min-h-[720px]  flex ">
      <Navbar />
      <div className="pt-9 px-9 pb-3 bg-black w-full flex h-full ">
        {children}
      </div>
    </div>
  );
}
