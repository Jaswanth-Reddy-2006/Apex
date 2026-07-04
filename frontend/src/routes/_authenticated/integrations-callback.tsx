import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { connectGithub, connectNotionOAuth, connectGoogleDriveOAuth } from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/integrations-callback")({
  component: IntegrationsCallbackPage,
  validateSearch: (search) => ({
    code: typeof search.code === "string" ? search.code : "",
    state: typeof search.state === "string" ? search.state : "",
  }),
});

function IntegrationsCallbackPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/integrations-callback" });
  const connectGithubFn = useServerFn(connectGithub);
  const connectNotionOAuthFn = useServerFn(connectNotionOAuth);
  const connectGoogleDriveOAuthFn = useServerFn(connectGoogleDriveOAuth);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [username, setUsername] = useState("");

  const stateStr = search.state || "";
  const isNotion = stateStr.startsWith("notion:");
  const isGDrive = stateStr.startsWith("gdrive:");
  const providerName = isNotion ? "Notion" : isGDrive ? "Google Drive" : "GitHub";

  useEffect(() => {
    let active = true;

    async function exchangeCode() {
      if (!search.code || !search.state) {
        setStatus("error");
        setErrorMessage(`Missing authorization code or state parameters from ${providerName} OAuth redirect.`);
        return;
      }

      const organization_id = isNotion 
        ? stateStr.replace("notion:", "") 
        : isGDrive 
        ? stateStr.replace("gdrive:", "") 
        : stateStr;

      try {
        if (isNotion) {
          const result = await connectNotionOAuthFn({
            data: { code: search.code, organization_id },
          });
          if (!active) return;
          if (result && result.success) {
            setStatus("success");
            setUsername(result.workspaceName);
            setTimeout(() => { if (active) navigate({ to: "/integrations" }); }, 2000);
          } else {
            setStatus("error");
            setErrorMessage("Failed to establish secure Notion connection.");
          }
        } else if (isGDrive) {
          const result = await connectGoogleDriveOAuthFn({
            data: { code: search.code, organization_id },
          });
          if (!active) return;
          if (result && result.success) {
            setStatus("success");
            setUsername(result.username);
            setTimeout(() => { if (active) navigate({ to: "/integrations" }); }, 2000);
          } else {
            setStatus("error");
            setErrorMessage("Failed to establish secure Google Drive connection.");
          }
        } else {
          const result = await connectGithubFn({
            data: { code: search.code, organization_id },
          });
          if (!active) return;
          if (result && result.success) {
            setStatus("success");
            setUsername(result.username);
            setTimeout(() => { if (active) navigate({ to: "/integrations" }); }, 2000);
          } else {
            setStatus("error");
            setErrorMessage("Failed to establish secure GitHub connection.");
          }
        }
      } catch (err: any) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(err.message || `An unexpected error occurred during ${providerName} integration.`);
      }
    }

    exchangeCode();

    return () => {
      active = false;
    };
  }, [search.code, search.state, connectGithubFn, connectNotionOAuthFn, connectGoogleDriveOAuthFn, navigate, isNotion, isGDrive, stateStr, providerName]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-md shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">{providerName} Connection</CardTitle>
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
                  Establishing a secure token handshake with {providerName}
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
                  {isNotion ? "Connected Notion Workspace: " : isGDrive ? "Connected Google Drive: " : "Connected GitHub profile: "}
                  <span className="font-mono text-primary">{username}</span>
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
