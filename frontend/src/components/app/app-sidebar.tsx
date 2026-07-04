import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Plug,
  BarChart3,
  Bell,
  Settings,
  CreditCard,
  LifeBuoy,
  Boxes,
  User,
  Shield,
  FileText,
  MessageSquare,
  Triangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ApexLogo } from "./apex-logo";
import { useOrg } from "@/lib/org-context";

type Item = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  adminOnly?: boolean;
};

const primary: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Chat", url: "/chat", icon: MessageSquare, permission: "Chat.Access" },
  { title: "Organization", url: "/organization", icon: Building2, permission: "Org.Manage" },
  { title: "Workspaces", url: "/workspace", icon: Boxes, permission: "Workspace.View" },
  { title: "Projects", url: "/projects", icon: FolderKanban, permission: "Project.View" },
  { title: "Members", url: "/members", icon: Users, permission: "People.View" },
  { title: "Roles", url: "/roles", icon: Shield, permission: "Roles.View" },
  { title: "Integrations", url: "/integrations", icon: Plug, permission: "Integrations.View" },
  { title: "Vercel", url: "/vercel", icon: Triangle, permission: "Integrations.View" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, permission: "Analytics.View" },
  { title: "Audit Logs", url: "/audit", icon: FileText, permission: "AuditLogs.View" },
  { title: "Notifications", url: "/notifications", icon: Bell, permission: "Notifications.View" },
];

const secondary: Item[] = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Billing", url: "/billing", icon: CreditCard, permission: "Billing.View" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "Org.Manage" },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasPermission, activeOrg } = useOrg();
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const gate = (i: Item) => {
    if (!activeOrg) return i.url === "/dashboard" || i.url === "/profile" || i.url === "/support";
    if (i.permission) return hasPermission(i.permission);
    return true;
  };

  const visiblePrimary = primary.filter(gate);
  const visibleSecondary = secondary.filter(gate);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center px-2 py-1.5">
          <ApexLogo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visiblePrimary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          APEX · v0.1 Foundation
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
