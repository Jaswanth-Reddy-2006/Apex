import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = localStorage.getItem("apex_token");
    const userStr = localStorage.getItem("apex_user");
    if (!token || !userStr) throw redirect({ to: "/auth" });
    try {
      const user = JSON.parse(userStr);
      return { user };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
