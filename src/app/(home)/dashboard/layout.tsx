import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { EdgeStoreProvider } from "@/lib/edgestore";

import { Suspense } from "react";
import { ShieldPlus } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="md:block hidden">
        <Suspense fallback={<div>Loading...</div>}>
          <Sidebar />
        </Suspense>
      </div>
      <div className="mobile-header">
        <Suspense fallback={<div>Loading...</div>}>
          <MobileSidebar>
            <Sidebar />
          </MobileSidebar>
        </Suspense>
        <ShieldPlus size={22} aria-hidden="true" />
        <div className="brand-name">MediShield</div>
      </div>
      <main className="admin-content" id="main-content" tabIndex={-1}>
        <EdgeStoreProvider>{children}</EdgeStoreProvider>
      </main>
    </div>
  );
}
