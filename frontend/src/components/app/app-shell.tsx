import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { OrgProvider } from "@/lib/org-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <OrgProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-transparent">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            <AppHeader>
              <SidebarTrigger className="-ml-1" />
            </AppHeader>
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </OrgProvider>
  );
}

