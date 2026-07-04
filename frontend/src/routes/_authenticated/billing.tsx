import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

const plans = [
  {
    name: "Starter",
    price: "$0",
    features: ["3 projects", "5 integrations", "Community support"],
    current: true,
  },
  {
    name: "Team",
    price: "$29/user/mo",
    features: ["Unlimited projects", "All integrations", "RBAC & audit logs"],
    current: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["SSO / SAML", "Custom SLAs", "Dedicated support"],
    current: false,
  },
];

function BillingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Manage your plan and payment methods. Payments arrive in Phase 2."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.current ? "border-primary shadow-elegant" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                {p.current && <Badge className="gradient-primary text-primary-foreground">Current</Badge>}
              </div>
              <p className="mt-2 text-2xl font-bold">{p.price}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={p.current ? "outline" : "default"}
                className={`mt-4 w-full ${p.current ? "" : "gradient-primary text-primary-foreground"}`}
                disabled={p.current}
              >
                {p.current ? "Current plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
