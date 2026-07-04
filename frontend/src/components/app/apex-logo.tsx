import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";

export function ApexLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-elegant">
        <Layers className="h-4 w-4 text-primary-foreground" />
      </div>
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight">APEX</span>
      )}
    </Link>
  );
}
