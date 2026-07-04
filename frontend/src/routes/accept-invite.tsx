import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInvitation, lookupInvitation } from "@/lib/api.functions";
import { useAuth } from "@/lib/auth-context";
import { createClientFn } from "@/lib/api-client";

const apiLogin = createClientFn("login", "POST");
const apiSignup = createClientFn("signup", "POST");
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApexLogo } from "@/components/app/apex-logo";
import { Badge } from "@/components/ui/badge";

type Search = { token?: string };

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const lookupFn = useServerFn(lookupInvitation);
  const acceptFn = useServerFn(acceptInvitation);
  const navigate = useNavigate();
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const { user, setToken } = useAuth();
  
  useEffect(() => {
    setSessionUserEmail(user?.email ?? null);
  }, [user]);

  const { data: invitation, isLoading } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => (token ? lookupFn({ data: { token } }) : Promise.resolve(null)),
    enabled: !!token,
  });

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await acceptFn({ data: { token } });
      toast.success("Joined organization");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setAccepting(false);
    }
  };

  const expired =
    invitation &&
    (invitation.status !== "pending" || new Date(invitation.expires_at) < new Date());

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 gradient-hero pointer-events-none" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <ApexLogo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          {!token ? (
            <ErrorState message="Missing invitation token." />
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !invitation ? (
            <ErrorState message="This invitation could not be found." />
          ) : expired ? (
            <ErrorState
              message={`This invitation is ${invitation.status === "pending" ? "expired" : invitation.status}.`}
            />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-xl font-semibold">
                  Join {invitation.organization_name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You've been invited as{" "}
                  <Badge variant="secondary" className="ml-1">
                    {invitation.role}
                  </Badge>
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Invitation for <strong>{invitation.email}</strong>
                </p>
              </div>

              {sessionUserEmail ? (
                <div className="space-y-3">
                  {sessionUserEmail.toLowerCase() !== invitation.email.toLowerCase() && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                      You are signed in as <strong>{sessionUserEmail}</strong> but this
                      invite is for <strong>{invitation.email}</strong>. Accepting will
                      still add you as a member.
                    </div>
                  )}
                  <Button
                    onClick={accept}
                    disabled={accepting}
                    className="w-full gradient-primary text-primary-foreground"
                  >
                    {accepting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Accept invitation</>
                    )}
                  </Button>
                </div>
              ) : (
                <SignInOrSignUp email={invitation.email} />
              )}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center">
      <XCircle className="mx-auto h-10 w-10 text-destructive" />
      <p className="mt-3 text-sm">{message}</p>
      <Link
        to="/auth"
        className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        Go to sign in
      </Link>
    </div>
  );
}

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});
const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2).max(100),
});

function SignInOrSignUp({ email }: { email: string }) {
  return (
    <Tabs defaultValue="signup">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="signup">Create account</TabsTrigger>
        <TabsTrigger value="signin">I have an account</TabsTrigger>
      </TabsList>
      <TabsContent value="signup" className="mt-4">
        <InlineSignUp email={email} />
      </TabsContent>
      <TabsContent value="signin" className="mt-4">
        <InlineSignIn email={email} />
      </TabsContent>
    </Tabs>
  );
}

function InlineSignUp({ email }: { email: string }) {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email, fullName: "", password: "" },
  });
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const onSubmit = form.handleSubmit(async (v) => {
    setLoading(true);
    try {
      const res = await apiSignup({
        email: v.email,
        password: v.password,
        fullName: v.fullName,
      });
      setToken(res.token, res.user);
      toast.success("Account created — you can now accept.");
    } catch (e: any) {
      toast.error(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>Full name</Label>
        <Input {...form.register("fullName")} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...form.register("email")} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}

function InlineSignIn({ email }: { email: string }) {
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email, password: "" },
  });
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const onSubmit = form.handleSubmit(async (v) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email: v.email, password: v.password });
      setToken(res.token, res.user);
    } catch (e: any) {
      toast.error(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>Email</Label>
        <Input type="email" {...form.register("email")} />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

// Suppress unused
void CheckCircle2;
