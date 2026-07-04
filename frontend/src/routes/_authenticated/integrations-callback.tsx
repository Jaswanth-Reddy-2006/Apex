import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { connectGithub } from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Declare search parameter schema
const callbackSearchSchema = {
  code: (val: unknown) => (typeof val === "string" ? val : ""),
  state: (val: unknown) => (typeof val === "string" ? val : ""),
};

export const Route = createFileRoute("/_authenticated/integrations-callback")({
  component: IntegrationsCallbackPage,
  validateSearch: (search) => ({
    code: callbackSearchSchema.code(search.code),
    state: callbackSearchSchema.state(search.state),
  }),
});

function IntegrationsCallbackPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/integrations-callback" });
  const connectFn = useServerFn(connectGithub);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    let active = true;

    async function exchangeCode() {
      if (!search.code || !search.state) {
        setStatus("error");
        setErrorMessage("Missing authorization code or state parameters from GitHub OAuth redirect.");
        return;
      }

      try {
        const result = await connectFn({
          data: {
            code: search.code,
            organization_id: search.state,
          },
        });

        if (!active) return;

        if (result && result.success) {
          setStatus("success");
          setUsername(result.username);
          setTimeout(() => {
            if (active) {
              navigate({ to: "/integrations" });
            }
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage("Failed to establish secure connection.");
        }
      } catch (err: any) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(err.message || "An unexpected error occurred during GitHub integration.");
      }
    }

    exchangeCode();

    return () => {
      active = false;
    };
  }, [search.code, search.state, connectFn, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-md shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">GitHub Connection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pb-8 text-center">
          {status === "loading" && (
            <>
              <div className="relative flex h-16 w-16 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium">Exchanging OAuth credentials...</p>
                <p className="text-xs text-muted-foreground">
                  Establishing a secure token handshake with GitHub
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">Connected Successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Connected GitHub profile: <span className="font-mono text-primary">{username}</span>
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  Redirecting you back to integrations...
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-destructive">Handshake Failed</p>
                <p className="text-sm text-muted-foreground max-w-xs">{errorMessage}</p>
              </div>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => navigate({ to: "/integrations" })}
              >
                Return to Integrations
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
