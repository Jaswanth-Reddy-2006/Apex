import { CheckCircle2, Code, FileCode2, LineChart, ShieldCheck, Briefcase, Calculator, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEMO_ROLES = [
  {
    id: "Project Manager",
    name: "Project Manager",
    icon: Briefcase,
    description: "Manage projects, timelines, and coordinate team deliverables.",
  },
  {
    id: "Team Lead",
    name: "Team Lead",
    icon: Users,
    description: "Lead development teams and manage technical architecture.",
  },
  {
    id: "Developer",
    name: "Developer",
    icon: Code,
    description: "Build software, manage repositories, and collaborate with AI coding assistants.",
  },
  {
    id: "Designer",
    name: "Designer",
    icon: FileCode2,
    description: "Access design tools, creative projects, and UI/UX assets.",
  },
  {
    id: "QA Engineer",
    name: "QA Engineer",
    icon: ShieldCheck,
    description: "Ensure software quality through testing and automation.",
  },
  {
    id: "HR",
    name: "HR",
    icon: Users,
    description: "Manage employees, recruitment, policies, and HR analytics.",
  },
  {
    id: "Finance",
    name: "Finance",
    icon: Calculator,
    description: "Access finance dashboards, invoices, payments, and reports.",
  },
  {
    id: "Sales",
    name: "Sales",
    icon: LineChart,
    description: "Manage CRM, sales pipelines, and revenue forecasting.",
  },
] as const;

export type DemoRole = typeof DEMO_ROLES[number]["id"];

interface RoleSelectionUIProps {
  value: DemoRole | null;
  onChange: (role: DemoRole) => void;
}

export function RoleSelectionUI({ value, onChange }: RoleSelectionUIProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DEMO_ROLES.map((role) => {
        const Icon = role.icon;
        const isSelected = value === role.id;
        return (
          <div
            key={role.id}
            role="button"
            tabIndex={0}
            onClick={() => onChange(role.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(role.id);
              }
            }}
            className={cn(
              "relative flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-all hover:border-primary/50",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card",
            )}
          >
            {isSelected && (
              <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />
            )}
            <div
              className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-lg border",
                isSelected
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-medium">{role.name}</h3>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        );
      })}
    </div>
  );
}
