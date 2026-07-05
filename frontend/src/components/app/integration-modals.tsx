import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Shield,
  WifiOff,
  RefreshCw,
  GitBranch,
  GitPullRequest,
  GitCommit,
  CircleDot,
  Building2,
  Workflow,
  Check,
  Unplug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Shared backdrop ──────────────────────────────────────────────────────────
function ModalBackdrop({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[8px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    />
  );
}

// ─── Shared modal wrapper ─────────────────────────────────────────────────────
function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <ModalBackdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-3xl",
            "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-[20px]",
            "border border-white/50 dark:border-white/10",
            "shadow-[0_32px_80px_-12px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.15)]",
          )}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glass reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          {children}
        </motion.div>
      </div>
    </>
  );
}

// ─── PERMISSION ITEM ─────────────────────────────────────────────────────────
function PermissionItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <Check className="h-2.5 w-2.5 text-emerald-600" />
      </div>
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

// ─── Permission map per integration ──────────────────────────────────────────
const PERMISSIONS_MAP: Record<string, { icon: React.ElementType; label: string }[]> = {
  github: [
    { icon: GitBranch, label: "Read repositories" },
    { icon: GitPullRequest, label: "Read pull requests" },
    { icon: GitCommit, label: "Read commits" },
    { icon: CircleDot, label: "Read issues" },
    { icon: Building2, label: "Read organizations" },
    { icon: Workflow, label: "Read workflows" },
  ],
  gitlab: [
    { icon: GitBranch, label: "Read repositories" },
    { icon: GitPullRequest, label: "Read merge requests" },
    { icon: GitCommit, label: "Read commits" },
    { icon: CircleDot, label: "Read issues" },
  ],
  notion: [
    { icon: GitBranch, label: "Read workspace pages" },
    { icon: GitCommit, label: "Read databases" },
    { icon: Building2, label: "Read workspace info" },
  ],
  gdrive: [
    { icon: GitBranch, label: "Read files" },
    { icon: GitCommit, label: "Read file metadata" },
    { icon: Building2, label: "Read drive info" },
  ],
  default: [
    { icon: Shield, label: "Read account information" },
    { icon: GitBranch, label: "Read connected resources" },
  ],
};

// ─── 1. CONNECT CONFIRM MODAL ─────────────────────────────────────────────────
export function ConnectConfirmModal({
  integrationName,
  integrationId,
  onConfirm,
  onCancel,
}: {
  integrationName: string;
  integrationId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const permissions = PERMISSIONS_MAP[integrationId] ?? PERMISSIONS_MAP.default;
  const [hoveringContinue, setHoveringContinue] = useState(false);

  return (
    <AnimatePresence>
      <ModalWrapper onClose={onCancel}>
        <div className="p-7 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Secure Connection
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Connect {integrationName}</h2>
            </div>
            <button
              onClick={onCancel}
              className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are about to securely connect your{" "}
            <span className="font-semibold text-foreground">{integrationName}</span> account to{" "}
            <span className="font-semibold text-foreground">Apex AI</span>. Apex AI will only access
            the permissions you approve. Your credentials are never stored.
          </p>

          {/* Permissions card */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Permissions Requested
            </p>
            {permissions.map((p) => (
              <PermissionItem key={p.label} icon={p.icon} label={p.label} />
            ))}
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>End-to-end encrypted · OAuth 2.0 · No passwords stored</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            <motion.button
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
              onHoverStart={() => setHoveringContinue(true)}
              onHoverEnd={() => setHoveringContinue(false)}
              whileHover={{ y: -2, boxShadow: "0 12px 30px -6px rgba(108, 76, 241, 0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
            >
              <span>Continue to {integrationName}</span>
              <motion.span animate={{ x: hoveringContinue ? 4 : 0 }} transition={{ duration: 0.2 }}>
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </ModalWrapper>
    </AnimatePresence>
  );
}

// ─── 2. REDIRECT LOADING OVERLAY ──────────────────────────────────────────────
export function RedirectLoadingOverlay({ integrationName }: { integrationName: string }) {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDotCount((d) => (d % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      <>
        <ModalBackdrop />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-3xl text-center p-10",
              "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-[20px]",
              "border border-white/50 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.28)]",
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            {/* Animated logo */}
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-4xl font-bold text-primary"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              {integrationName[0]}
            </motion.div>

            {/* SVG spinner */}
            <div className="relative mx-auto mb-5 h-12 w-12">
              <svg className="animate-spin -rotate-90" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                <circle
                  cx="22" cy="22" r="18"
                  stroke="currentColor" strokeWidth="3"
                  strokeDasharray="40 73"
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>

            <h3 className="text-base font-bold mb-1">Redirecting to {integrationName}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Please wait{".".repeat(dotCount)}
            </p>
            <p className="text-xs text-muted-foreground/60">Do not close this window</p>

            {/* Animated dots */}
            <div className="mt-6 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary/50"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.22 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}

// ─── 3. DISCONNECT CONFIRM MODAL ─────────────────────────────────────────────
export function DisconnectConfirmModal({
  integrationName,
  onConfirm,
  onCancel,
}: {
  integrationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      <ModalWrapper onClose={onCancel}>
        <div className="p-7 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Unplug className="h-4 w-4 text-destructive" />
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Disconnect Integration
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Disconnect {integrationName}?</h2>
            </div>
            <button
              onClick={onCancel}
              className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Disconnecting{" "}
            <span className="font-semibold text-foreground">{integrationName}</span> will stop Apex
            AI from receiving new updates. Existing synced information will remain unless removed
            manually.
          </p>

          {/* Warning */}
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 dark:bg-amber-900/15 dark:border-amber-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Before you disconnect
              </span>
            </div>
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400/80 pl-6">
              {[
                "You can reconnect anytime",
                "No company data will be deleted automatically",
                "Active syncs will be paused immediately",
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            <motion.button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground shadow-sm"
              whileHover={{ y: -1, boxShadow: "0 8px 24px -4px rgba(239,68,68,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
            >
              <Unplug className="h-3.5 w-3.5" />
              Disconnect
            </motion.button>
          </div>
        </div>
      </ModalWrapper>
    </AnimatePresence>
  );
}

// ─── 4. DISCONNECT LOADING MODAL ──────────────────────────────────────────────
const DISCONNECT_STEPS = [
  "Disconnecting account…",
  "Removing active sync…",
  "Revoking access tokens…",
  "Cleaning up…",
];

export function DisconnectLoadingModal({ integrationName }: { integrationName: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < DISCONNECT_STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 900);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <AnimatePresence>
      <>
        <ModalBackdrop />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-3xl p-8",
              "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-[20px]",
              "border border-white/50 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.28)]",
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-2 border-destructive/20" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-destructive"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Unplug className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold">Disconnecting {integrationName}</h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {DISCONNECT_STEPS[step]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5">
                {DISCONNECT_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      i <= step ? "bg-destructive w-6" : "bg-muted w-2",
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}

// ─── 5. DISCONNECT SUCCESS MODAL ──────────────────────────────────────────────
export function DisconnectSuccessModal({
  integrationName,
  onDone,
}: {
  integrationName: string;
  onDone: () => void;
}) {
  return (
    <AnimatePresence>
      <ModalWrapper onClose={onDone}>
        <div className="p-8 flex flex-col items-center text-center space-y-5">
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
            >
              <Unplug className="h-9 w-9 text-muted-foreground" />
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h3 className="text-xl font-bold">{integrationName} Disconnected</h3>
            <p className="text-sm text-muted-foreground">
              Your integration has been removed. All syncs have been paused.
            </p>
            <p className="text-xs text-muted-foreground/70 pt-1">
              You can reconnect anytime from the Integrations page.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full pt-2"
          >
            <Button className="w-full rounded-xl" variant="outline" onClick={onDone}>
              Close
            </Button>
          </motion.div>
        </div>
      </ModalWrapper>
    </AnimatePresence>
  );
}

// ─── 6. CONNECT SUCCESS MODAL ─────────────────────────────────────────────────
const SYNC_STEPS = [
  "Syncing repositories…",
  "Syncing pull requests…",
  "Syncing commits…",
  "Fetching organization…",
];

export function ConnectSuccessModal({
  integrationName,
  onDone,
}: {
  integrationName: string;
  onDone: () => void;
}) {
  const [syncStep, setSyncStep] = useState(0);

  useEffect(() => {
    if (syncStep < SYNC_STEPS.length - 1) {
      const t = setTimeout(() => setSyncStep((s) => s + 1), 700);
      return () => clearTimeout(t);
    }
  }, [syncStep]);

  return (
    <AnimatePresence>
      <ModalWrapper onClose={onDone}>
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          {/* Animated check */}
          <div className="relative">
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 15 }}
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut", delay: 0.5 }}
            />
          </div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h3 className="text-xl font-bold">{integrationName} Connected!</h3>
            <p className="text-sm text-muted-foreground">
              Securely connected. We're now syncing your data.
            </p>
          </motion.div>

          {/* Sync progress */}
          <motion.div
            className="w-full rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {SYNC_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2.5">
                {i < syncStep ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : i === syncStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs transition-colors duration-300",
                    i < syncStep
                      ? "text-emerald-600 line-through"
                      : i === syncStep
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="w-full"
          >
            <Button className="w-full rounded-xl gradient-primary text-primary-foreground shadow-md" onClick={onDone}>
              Done
            </Button>
          </motion.div>
        </div>
      </ModalWrapper>
    </AnimatePresence>
  );
}

// ─── 7. ERROR / CANCELLED MODAL ───────────────────────────────────────────────
export function ConnectionErrorModal({
  integrationName,
  errorType = "generic",
  onRetry,
  onCancel,
}: {
  integrationName: string;
  errorType?: "generic" | "offline" | "cancelled";
  onRetry?: () => void;
  onCancel: () => void;
}) {
  const config = {
    generic: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50/60 dark:bg-amber-900/15",
      borderColor: "border-amber-200/60 dark:border-amber-500/20",
      title: "Connection Failed",
      desc: `We couldn't connect your ${integrationName} account. Please try again.`,
    },
    offline: {
      icon: WifiOff,
      iconColor: "text-zinc-500",
      bgColor: "bg-zinc-50/60 dark:bg-zinc-900/20",
      borderColor: "border-zinc-200/60",
      title: "No Internet Connection",
      desc: "Please check your network connection and try again.",
    },
    cancelled: {
      icon: X,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted/30",
      borderColor: "border-border/60",
      title: "Connection Cancelled",
      desc: `${integrationName} connection was cancelled. Nothing was changed.`,
    },
  }[errorType];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <ModalWrapper onClose={onCancel}>
        <div className="p-7 space-y-5">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-foreground">{config.title}</h2>
            <button
              onClick={onCancel}
              className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-6 flex flex-col items-center text-center gap-3",
              config.bgColor,
              config.borderColor,
            )}
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className={cn("h-10 w-10", config.iconColor)} />
            </motion.div>
            <p className="text-sm text-muted-foreground">{config.desc}</p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            {onRetry && errorType !== "cancelled" && (
              <motion.button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRetry}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </motion.button>
            )}
          </div>
        </div>
      </ModalWrapper>
    </AnimatePresence>
  );
}
