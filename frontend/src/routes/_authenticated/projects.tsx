import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { useOrg } from "@/lib/org-context";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listProjects, createProject, listMyOrganizations, listGithubRepositories, listGitlabRepositories } from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

const schema = z.object({
  organization_id: z.string().uuid("Pick an organization"),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  repository_url: z.string().trim().optional(),
});

function ProjectsPage() {
  const { activeOrg } = useOrg();
  const listFn = useServerFn(listProjects);
  const orgsFn = useServerFn(listMyOrganizations);
  const createFn = useServerFn(createProject);
  const reposFn = useServerFn(listGithubRepositories);
  const gitlabReposFn = useServerFn(listGitlabRepositories);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => listFn() });
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { organization_id: activeOrg?.organization_id || "", name: "", description: "", repository_url: "" },
  });

  const selectedOrgId = form.watch("organization_id");

  useEffect(() => {
    if (activeOrg?.organization_id && !form.getValues("organization_id")) {
      form.setValue("organization_id", activeOrg.organization_id);
    }
  }, [activeOrg, form]);

  const { data: githubData, isLoading: loadingRepos } = useQuery({
    queryKey: ["github-repos", selectedOrgId],
    queryFn: () => reposFn({ data: { organization_id: selectedOrgId } }),
    enabled: !!selectedOrgId,
  });

  const { data: gitlabData, isLoading: loadingGitlab } = useQuery({
    queryKey: ["gitlab-repos", selectedOrgId],
    queryFn: () => gitlabReposFn({ data: { organization_id: selectedOrgId } }),
    enabled: !!selectedOrgId,
  });

  const githubRepos = githubData?.repositories ?? [];
  const gitlabRepos = gitlabData?.repositories ?? [];

  const projectName = form.watch("name") || "";
  const repoUrl = form.watch("repository_url") || "";

  const isMismatch = (() => {
    if (!projectName || !repoUrl) return false;
    
    // Get repo name from URL
    let repoName = "";
    try {
      const parts = repoUrl.split("/");
      repoName = parts[parts.length - 1] || "";
    } catch {
      return false;
    }

    const cleanProject = projectName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanRepo = repoName.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (cleanProject.includes(cleanRepo) || cleanRepo.includes(cleanProject)) {
      return false;
    }

    // Split into words and check overlap (words must be > 2 chars)
    const projectWords = projectName.toLowerCase().split(/[\s-_\/]+/).filter(w => w.length > 2);
    const repoWords = repoName.toLowerCase().split(/[\s-_\/]+/).filter(w => w.length > 2);

    const hasOverlap = projectWords.some(pw => repoWords.some(rw => rw.includes(pw) || pw.includes(rw)));
    return !hasOverlap;
  })();

  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => createFn({ data: values }),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="All projects across your organizations."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="gradient-primary text-primary-foreground"
                disabled={(orgs ?? []).length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a project</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit((v) => create.mutate(v))}
                className="space-y-4"
              >
                <div>
                  <Label>Organization</Label>
                  <Select
                    value={form.watch("organization_id")}
                    onValueChange={(v) => form.setValue("organization_id", v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgs ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.organization_id && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.organization_id.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="p-name">Name</Label>
                  <Input id="p-name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="p-desc">Description</Label>
                  <Textarea id="p-desc" rows={3} {...form.register("description")} />
                </div>
                {selectedOrgId && (
                  <div className="space-y-1">
                    <Label>Linked Repository (Optional)</Label>
                    {loadingRepos || loadingGitlab ? (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading repositories...</span>
                      </div>
                    ) : (githubRepos.length > 0 || gitlabRepos.length > 0) ? (
                      <>
                        <Select
                          value={form.watch("repository_url")}
                          onValueChange={(v) => form.setValue("repository_url", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a repository" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None / Manual URL</SelectItem>
                            {githubRepos.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">GitHub</div>
                                {githubRepos.map((r: any) => (
                                  <SelectItem key={r.full_name} value={r.html_url}>
                                    GitHub: {r.full_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {gitlabRepos.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">GitLab</div>
                                {gitlabRepos.map((r: any) => (
                                  <SelectItem key={r.full_name} value={r.html_url}>
                                    GitLab: {r.full_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {isMismatch && (
                          <p className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
                            ⚠️ The project name and description you have given do not seem to match this repository. Please make sure you have connected the correct space.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No connected repositories found. Connect GitHub or GitLab under the "Integrations" page.
                      </p>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (data ?? []).filter((p) => p.organization_id === activeOrg?.organization_id).length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            (orgs ?? []).length === 0
              ? "Create an organization first, then add a project."
              : "Start by creating your first project for this organization."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? [])
            .filter((p) => p.organization_id === activeOrg?.organization_id)
            .map((p) => (
              <Card key={p.id} className="transition hover:shadow-elegant">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                  <CardTitle className="mt-3">{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description ?? "No description"}
                  </p>
                  {p.repository_url && (
                    <p className="mt-2 text-xs text-primary font-medium hover:underline truncate">
                      <a href={p.repository_url} target="_blank" rel="noopener noreferrer">
                        🔗 {p.repository_url.replace("https://github.com/", "")}
                      </a>
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
