import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listMyOrganizations, createOrganization } from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationsPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Min 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
});

function OrganizationsPage() {
  const listFn = useServerFn(listMyOrganizations);
  const createFn = useServerFn(createOrganization);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => listFn(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => createFn({ data: values }),
    onSuccess: () => {
      toast.success("Organization created");
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizations"
        description="Every APEX customer is an organization. Create one to start inviting members."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> New organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new organization</DialogTitle>
                <DialogDescription>
                  You'll become the owner. You can invite members afterwards.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit((v) => create.mutate(v))}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="org-name">Name</Label>
                  <Input id="org-name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="org-desc">Description</Label>
                  <Textarea id="org-desc" rows={3} {...form.register("description")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
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
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to start building on APEX."
          action={
            <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Create organization
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((org) => (
            <Card key={org.id} className="transition hover:shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="mt-3">{org.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {org.description ?? "No description"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
