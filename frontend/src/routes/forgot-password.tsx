import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApexLogo } from "@/components/app/apex-logo";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
});

function ForgotPassword() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setLoading(true);
    // TODO: implement custom reset password endpoint
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    toast.error("Password reset is not implemented yet in the new auth system");
    return;
    setSent(true);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><ApexLogo /></div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll send you a secure link to reset it.
          </p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-primary-soft p-4 text-sm text-primary">
              If an account exists for that email, a reset link is on its way.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <Input id="fp-email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
