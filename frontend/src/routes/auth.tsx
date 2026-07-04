import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { createClientFn } from "@/lib/api-client";
import { bootstrapOrganization, joinDemoOrganization } from "@/lib/api.functions";
import { useAuth } from "@/lib/auth-context";
import { RoleSelectionUI, type DemoRole } from "@/components/auth/RoleSelectionUI";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApexLogo } from "@/components/app/apex-logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { PasswordInput } from "@/components/app/password-input";

const apiLogin = createClientFn("login", "POST");
const apiSignup = createClientFn("signup", "POST");

type SearchParams = { mode?: "login" | "register"; next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    mode: s.mode === "register" ? "register" : "login",
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: AuthPage,
});

const INDUSTRIES = [
  "Software / SaaS",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Media",
  "Consulting",
  "Government",
  "Other",
];
const EMPLOYEE_BUCKETS = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "India",
  "Singapore",
  "Australia",
  "Japan",
  "Brazil",
  "Other",
];
const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    // Owner
    fullName: z.string().trim().min(2, "Required").max(100),
    email: z.string().trim().email("Invalid email").max(255),
    password: z.string().min(8, "Min 8 characters").max(128),
    confirmPassword: z.string().min(8).max(128),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    // Organization
    orgName: z.string().trim().max(80).optional(),
    orgDomain: z.string().trim().max(120).optional().or(z.literal("")),
    logoUrl: z
      .string()
      .trim()
      .url("Must be a valid URL")
      .max(500)
      .optional()
      .or(z.literal("")),
    industry: z.string().optional(),
    employeeCount: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    // Demo Mode
    demoRole: z.string().optional(),
    acceptTerms: z.boolean().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, setToken } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  useEffect(() => {
    if (user) {
      navigate({ to: search.next ?? "/dashboard", replace: true });
    }
  }, [user, navigate, search.next]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 gradient-hero pointer-events-none" aria-hidden />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <ApexLogo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Welcome to APEX</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One AI Operating System For Modern Companies
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create organization</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <RegisterWizard />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { setToken } = useAuth();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email: values.email, password: values.password });
      setToken(res.token, res.user);
      toast.success("Signed in");
      navigate({ to: search.next ?? "/dashboard", replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={form.watch("remember") ?? true}
          onCheckedChange={(v) => form.setValue("remember", Boolean(v))}
        />
        Remember me on this device
      </label>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground shadow-elegant"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function RegisterWizard() {
  const navigate = useNavigate();
  const bootstrap = bootstrapOrganization;
  const joinDemo = joinDemoOrganization;
  const { setToken } = useAuth();
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<"create" | "demo" | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      orgName: "",
      orgDomain: "",
      logoUrl: "",
      industry: "",
      employeeCount: "",
      country: "",
      timezone:
        typeof Intl !== "undefined"
          ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC")
          : "UTC",
      acceptTerms: false,
      demoRole: "",
    },
  });

  const next = async () => {
    let ok = false;
    if (step === 0) {
      ok = await form.trigger(["fullName", "email", "password", "confirmPassword", "phone"]);
      if (ok && !form.getValues().acceptTerms) {
        form.setError("acceptTerms", { message: "You must accept the terms" });
        ok = false;
      }
    } else if (step === 1 && path === "create") {
      ok = await form.trigger(["orgName", "industry", "employeeCount", "orgDomain", "logoUrl", "country", "timezone"]);
    } else if (step === 1 && path === "demo") {
      if (!form.getValues().demoRole) {
        toast.error("Please select a role");
        ok = false;
      } else {
        ok = true;
      }
    }
    
    if (ok) setStep((s) => Math.min(s + 1, 2));
  };

  const submit = form.handleSubmit(async (values) => {
    if (!path) return;
    setLoading(true);
    try {
      // 1. Sign up the owner
      const res = await apiSignup({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      setToken((res as any).token, (res as any).user);
      if (path === "create") {
        await bootstrap({
          data: {
            name: values.orgName || "My Organization",
            description: "",
            domain: values.orgDomain || "",
            industry: values.industry || "Other",
            employee_count: values.employeeCount || "1-10",
            country: values.country || "United States",
            timezone: values.timezone || "UTC",
            phone: values.phone || "",
            logo_url: values.logoUrl || "",
            default_project_name: "First Project",
          },
        });
        toast.success("Organization created. Welcome as Owner.");
      } else if (path === "demo") {
        await joinDemo({
          data: {
            // @ts-ignore
            role: values.demoRole,
          }
        });
        toast.success(`Joined Demo Mode as ${values.demoRole}.`);
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Initialization failed");

    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <StepIndicator step={step} total={path ? 3 : 2} labels={path === "create" ? ["Profile", "Options", "Company"] : path === "demo" ? ["Profile", "Options", "Role"] : ["Profile", "Options"]} />

      {step === 0 && (
        <div className="space-y-4">
          <Field
            label="Your full name"
            id="fullName"
            autoComplete="name"
            {...form.register("fullName")}
            error={form.formState.errors.fullName?.message}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Work email"
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              error={form.formState.errors.email?.message}
            />
            <Field
              label="Phone (optional)"
              id="phone"
              autoComplete="tel"
              {...form.register("phone")}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField
              label="Password"
              id="password"
              autoComplete="new-password"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
            />
            <PasswordField
              label="Confirm password"
              id="confirmPassword"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
              error={form.formState.errors.confirmPassword?.message}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={Boolean(form.watch("acceptTerms"))}
              onCheckedChange={(v) => form.setValue("acceptTerms", Boolean(v), { shouldValidate: true })}
            />
            <span>
              I agree to the APEX <a href="#" className="text-primary hover:underline">Terms</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message as string}</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Choose Your Path</h3>
          <p className="text-sm text-muted-foreground mb-4">How would you like to get started with Apex AI?</p>
          
          <div className="grid gap-4">
            <div 
              role="button" 
              className={cn("border rounded-xl p-4 cursor-pointer transition-colors", path === "create" ? "border-primary bg-primary/5" : "hover:border-primary/50")}
              onClick={() => setPath("create")}
            >
              <h4 className="font-medium">Create a New Organization</h4>
              <p className="text-xs text-muted-foreground mt-1">Start fresh with a new workspace. You will automatically become the Owner.</p>
            </div>

            <div 
              role="button" 
              className={cn("border rounded-xl p-4 cursor-pointer transition-colors", "hover:border-primary/50")}
              onClick={() => navigate({ to: "/accept-invite" })}
            >
              <h4 className="font-medium">Join an Existing Organization</h4>
              <p className="text-xs text-muted-foreground mt-1">Have an invite code? Click here to join your team's workspace.</p>
            </div>

            <div 
              role="button" 
              className={cn("border rounded-xl p-4 cursor-pointer transition-colors", path === "demo" ? "border-primary bg-primary/5" : "hover:border-primary/50")}
              onClick={() => setPath("demo")}
            >
              <h4 className="font-medium">Try Demo Mode</h4>
              <p className="text-xs text-muted-foreground mt-1">Explore Apex AI with a specific enterprise role. A personal sandbox will be created for you.</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && path === "create" && (
        <div className="space-y-4">
          <Field
            label="Organization name"
            id="orgName"
            {...form.register("orgName")}
            error={form.formState.errors.orgName?.message}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Industry"
              value={form.watch("industry") || ""}
              onChange={(v) => form.setValue("industry", v, { shouldValidate: true })}
              options={INDUSTRIES}
              error={form.formState.errors.industry?.message}
            />
            <SelectField
              label="Employees"
              value={form.watch("employeeCount") || ""}
              onChange={(v) => form.setValue("employeeCount", v, { shouldValidate: true })}
              options={EMPLOYEE_BUCKETS}
              error={form.formState.errors.employeeCount?.message}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Country"
              value={form.watch("country") || ""}
              onChange={(v) => form.setValue("country", v, { shouldValidate: true })}
              options={COUNTRIES}
              error={form.formState.errors.country?.message}
            />
            <SelectField
              label="Timezone"
              value={form.watch("timezone") || ""}
              onChange={(v) => form.setValue("timezone", v, { shouldValidate: true })}
              options={TIMEZONES}
              error={form.formState.errors.timezone?.message}
            />
          </div>
          <Field label="Domain (optional)" id="orgDomain" placeholder="acme.com" {...form.register("orgDomain")} />
          <Field label="Logo URL (optional)" id="logoUrl" placeholder="https://…/logo.png" {...form.register("logoUrl")} />
        </div>
      )}

      {step === 2 && path === "demo" && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg mb-4">Select your role</h3>
          <RoleSelectionUI 
            value={form.watch("demoRole") as DemoRole | null} 
            onChange={(role) => form.setValue("demoRole", role)}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => {
             if (step === 2) setPath(null);
             setStep((s) => s - 1);
          }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        
        {step === 0 ? (
          <Button type="button" onClick={next} className="gradient-primary text-primary-foreground">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : step === 1 ? (
          <Button type="button" onClick={next} disabled={!path} className="gradient-primary text-primary-foreground">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground shadow-elegant">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Setup"}
          </Button>
        )}
      </div>
    </form>
  );
}
function StepIndicator({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${
              i === step ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {labels[i]}
          </span>
          {i < total - 1 && <div className="h-px flex-1 bg-border" />}
        </div>
      ))}
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
};

const Field = ({ label, id, error, ...rest }: FieldProps) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} {...rest} />
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
  </div>
);

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  id: string;
  error?: string;
};

const PasswordField = ({ label, id, error, ...rest }: PasswordFieldProps) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <PasswordInput id={id} {...rest} />
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
  </div>
);

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
