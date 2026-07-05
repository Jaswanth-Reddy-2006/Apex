import re

def rewrite_auth():
    path = r"c:\Users\jeeva\APexx\Apex\frontend\src\routes\auth.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add new imports
    imports = """import { bootstrapOrganization, joinDemoOrganization } from "@/lib/api.functions";
import { RoleSelectionUI, type DemoRole } from "@/components/auth/RoleSelectionUI";"""
    content = content.replace('import { bootstrapOrganization } from "@/lib/api.functions";', imports)

    # Replace registerSchema
    old_schema = """const registerSchema = z
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
  });"""
    
    new_schema = """const registerSchema = z
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
  });"""
    
    content = content.replace(old_schema, new_schema)

    # Rewrite RegisterWizard
    wizard_start = "function RegisterWizard() {"
    wizard_end = "function StepIndicator({"
    
    wizard_block = content[content.find(wizard_start) : content.find(wizard_end)]
    
    new_wizard = """function RegisterWizard() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapOrganization);
  const joinDemo = useServerFn(joinDemoOrganization);
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
    
    // 2. Ensure session
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
    
    // 3. Process path
    try {
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
"""
    
    content = content.replace(wizard_block, new_wizard)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    rewrite_auth()
