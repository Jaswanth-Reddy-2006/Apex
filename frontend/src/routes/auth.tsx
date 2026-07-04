import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { bootstrapOrganization } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
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
    orgName: z.string().trim().min(2, "Required").max(80),
    orgDomain: z.string().trim().max(120).optional().or(z.literal("")),
    logoUrl: z
      .string()
      .trim()
      .url("Must be a valid URL")
      .max(500)
      .optional()
      .or(z.literal("")),
    industry: z.string().min(1, "Required"),
    employeeCount: z.string().min(1, "Required"),
    country: z.string().min(1, "Required"),
    timezone: z.string().min(1, "Required"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.next ?? "/dashboard", replace: true });
    });
  }, [navigate, search.next]);

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
              <Divider />
              <GoogleButton />
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

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">or continue with</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate({ to: search.next ?? "/dashboard", replace: true });
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
  const bootstrap = useServerFn(bootstrapOrganization);
  const [step, setStep] = useState(0);
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
      // @ts-expect-error checkbox literal
      acceptTerms: false,
    },
  });

  const stepFields: Array<Array<keyof z.infer<typeof registerSchema>>> = [
    ["orgName", "industry", "employeeCount", "orgDomain", "logoUrl"],
    ["country", "timezone"],
    ["fullName", "email", "phone", "password", "confirmPassword", "acceptTerms"],
  ];

  const next = async () => {
    const ok = await form.trigger(stepFields[step] as Parameters<typeof form.trigger>[0]);
    if (ok) setStep((s) => Math.min(s + 1, 2));
  };

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    // 1. Sign up the owner
    const { data: signUp, error: signErr } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: values.fullName, phone: values.phone },
      },
    });
    if (signErr) {
      setLoading(false);
      toast.error(signErr.message);
      return;
    }
    // 2. Ensure session — email confirmations are disabled, so sign in immediately if needed.
    if (!signUp.session) {
      const { error: sErr } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (sErr) {
        setLoading(false);
        toast.error(sErr.message);
        return;
      }
    }
    // 3. Bootstrap org + workspace + project
    try {
      await bootstrap({
        data: {
          name: values.orgName,
          description: "",
          domain: values.orgDomain || "",
          industry: values.industry,
          employee_count: values.employeeCount,
          country: values.country,
          timezone: values.timezone,
          phone: values.phone || "",
          logo_url: values.logoUrl || "",
          default_project_name: "First Project",
        },
      });
      toast.success("Organization created. Welcome to APEX.");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bootstrap failed");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <StepIndicator step={step} total={3} labels={["Company", "Location", "Owner"]} />

      {step === 0 && (
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
              value={form.watch("industry")}
              onChange={(v) => form.setValue("industry", v, { shouldValidate: true })}
              options={INDUSTRIES}
              error={form.formState.errors.industry?.message}
            />
            <SelectField
              label="Employees"
              value={form.watch("employeeCount")}
              onChange={(v) => form.setValue("employeeCount", v, { shouldValidate: true })}
              options={EMPLOYEE_BUCKETS}
              error={form.formState.errors.employeeCount?.message}
            />
          </div>
          <Field
            label="Domain (optional)"
            id="orgDomain"
            placeholder="acme.com"
            {...form.register("orgDomain")}
          />
          <Field
            label="Logo URL (optional)"
            id="logoUrl"
            placeholder="https://…/logo.png"
            {...form.register("logoUrl")}
            error={form.formState.errors.logoUrl?.message}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <SelectField
            label="Country"
            value={form.watch("country")}
            onChange={(v) => form.setValue("country", v, { shouldValidate: true })}
            options={COUNTRIES}
            error={form.formState.errors.country?.message}
          />
          <SelectField
            label="Timezone"
            value={form.watch("timezone")}
            onChange={(v) => form.setValue("timezone", v, { shouldValidate: true })}
            options={TIMEZONES}
            error={form.formState.errors.timezone?.message}
          />
        </div>
      )}

      {step === 2 && (
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
              onCheckedChange={(v) =>
                form.setValue("acceptTerms", Boolean(v) as true, { shouldValidate: true })
              }
            />
            <span>
              I agree to the APEX{" "}
              <a href="#" className="text-primary hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive">
              {form.formState.errors.acceptTerms.message as string}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button
            type="button"
            onClick={next}
            className="gradient-primary text-primary-foreground"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={loading}
            className="gradient-primary text-primary-foreground shadow-elegant"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create organization"
            )}
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

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    window.location.href = "/dashboard";
  };
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </>
      )}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.87l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
