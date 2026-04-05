import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card">
        <div className="h-16 border-b flex items-center px-6 gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">
              AgencyMail
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t p-4">
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-start",
              },
            }}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="lg:hidden flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="font-bold">AgencyMail</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
