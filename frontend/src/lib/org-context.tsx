import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyContext } from "@/lib/chat.functions";
import { useAuth } from "@/lib/auth-context";

export type MyOrg = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  logo_url: string | null;
  base_role: string;
  custom_role_slug: string | null;
  custom_role_name: string | null;
};

interface OrgContextValue {
  loading: boolean;
  organizations: MyOrg[];
  activeOrg: MyOrg | null;
  setActiveOrgId: (id: string) => void;
  permissions: string[];
  hasPermission: (key: string) => boolean;
  role: string;
  isOwner: boolean;
  isAdmin: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgContextValue>({
  loading: true,
  organizations: [],
  activeOrg: null,
  setActiveOrgId: () => {},
  permissions: [],
  hasPermission: () => false,
  role: "viewer",
  isOwner: false,
  isAdmin: false,
  refetch: () => {},
});

const STORAGE_KEY = "apex.active_org_id";

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const ctxFn = useServerFn(getMyContext);
  const q = useQuery({
    queryKey: ["my-context", user?.id],
    queryFn: () => ctxFn(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
  );

  useEffect(() => {
    if (!q.data) return;
    const orgs = q.data.organizations;
    if (orgs.length === 0) return;
    if (!activeOrgId || !orgs.find((o) => o.organization_id === activeOrgId)) {
      setActiveOrgIdState(orgs[0].organization_id);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, orgs[0].organization_id);
    }
  }, [q.data, activeOrgId]);

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo<OrgContextValue>(() => {
    const organizations = q.data?.organizations ?? [];
    const activeOrg = organizations.find((o) => o.organization_id === activeOrgId) ?? null;
    const permissions = activeOrg ? q.data?.permissions_by_org[activeOrg.organization_id] ?? [] : [];
    const role = activeOrg?.custom_role_slug || activeOrg?.base_role || "viewer";
    const isOwner = activeOrg?.base_role === "owner";
    const isAdmin = isOwner || activeOrg?.base_role === "admin";
    return {
      loading: authLoading || q.isLoading,
      organizations,
      activeOrg,
      setActiveOrgId,
      permissions,
      hasPermission: (key: string) => isAdmin || permissions.includes(key),
      role,
      isOwner,
      isAdmin,
      refetch: () => q.refetch(),
    };
  }, [q.data, q.isLoading, q.refetch, activeOrgId, authLoading]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export const useOrg = () => useContext(OrgContext);

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useOrg();
  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed = keys.some((k) => hasPermission(k));
  return <>{allowed ? children : fallback}</>;
}
