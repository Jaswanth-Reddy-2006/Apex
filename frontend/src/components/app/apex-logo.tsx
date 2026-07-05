import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";

export function ApexLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center">
        <img src="/logo.png" alt="Apex Logo" className="h-full w-full object-contain" />
      </div>
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight">APEX</span>
      )}
    </Link>
  );
}
