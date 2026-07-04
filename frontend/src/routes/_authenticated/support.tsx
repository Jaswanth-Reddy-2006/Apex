import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, MessageSquare, Book } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
});

function SupportPage() {
  const items = [
    { icon: Book, title: "Documentation", body: "Guides, API reference, and architecture.", cta: "Open docs" },
    { icon: MessageSquare, title: "Community", body: "Join the APEX Discord to chat with builders.", cta: "Join Discord" },
    { icon: Mail, title: "Email support", body: "Reach the team directly for account issues.", cta: "Email us" },
    { icon: LifeBuoy, title: "Status", body: "Live status of APEX infrastructure.", cta: "View status" },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="Support" description="We're here to help." />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Card key={i.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <i.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{i.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{i.body}</p>
              <Button variant="outline" className="mt-4" size="sm">
                {i.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
