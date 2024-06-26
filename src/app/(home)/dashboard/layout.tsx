import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { EdgeStoreProvider } from "@/lib/edgestore";

import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col md:flex-row items-start h-full">
      <div className="md:block hidden">
        <Suspense fallback={<div>Loading...</div>}>
          <Sidebar />
        </Suspense>
      </div>
      <div className="md:hidden flex items-center bg-gray-100 w-full p-2">
        <Suspense fallback={<div>Loading...</div>}>
          <MobileSidebar>
            <Sidebar />
          </MobileSidebar>
        </Suspense>
        <div className="text-lg font-semibold">MediShield Admin</div>
      </div>
      <main className="w-full md:ml-[250px]  ml-0 overflow-auto">
        <EdgeStoreProvider>{children}</EdgeStoreProvider>
      </main>
    </div>
  );
}
