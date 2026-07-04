import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApexLogo } from "@/components/app/apex-logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords must match",
  });

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setLoading(true);
    // TODO: implement custom reset password logic
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    toast.error("Password reset is not implemented yet in the new auth system");
    navigate({ to: "/auth", replace: true });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><ApexLogo /></div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password you don't use elsewhere.
          </p>
          {!ready ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="rp-pw">New password</Label>
                <Input id="rp-pw" type="password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rp-cf">Confirm password</Label>
                <Input id="rp-cf" type="password" {...form.register("confirm")} />
                {form.formState.errors.confirm && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
