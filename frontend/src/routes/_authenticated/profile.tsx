import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMyProfile, updateMyProfile } from "@/lib/api.functions";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().max(100).optional(),
  headline: z.string().trim().max(200).optional(),
  avatar_url: z.string().trim().max(500).optional(),
});

function ProfilePage() {
  const { user } = useAuth();
  const getFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", headline: "", avatar_url: "" },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        full_name: data.full_name ?? "",
        headline: data.headline ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    }
  }, [data, form]);

  const update = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Your personal APEX profile." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit((v) => update.mutate(v))}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 border-b border-border pb-6 mb-6">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  {form.watch("avatar_url") ? (
                    <AvatarImage src={form.watch("avatar_url")} alt="Profile Avatar" />
                  ) : null}
                  <AvatarFallback className="bg-primary-soft text-primary text-lg font-bold">
                    {(form.watch("full_name") || user?.email || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base text-foreground">{form.watch("full_name") || "Your Name"}</h3>
                  <p className="text-xs text-muted-foreground">{form.watch("headline") || "No headline set"}</p>
                  <p className="text-[11px] text-primary font-medium mt-1 uppercase tracking-wider">{user?.email}</p>
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <Input value={user?.email ?? ""} disabled className="bg-muted/50 cursor-not-allowed mt-1" />
              </div>
              <div>
                <Label htmlFor="p-name">Full Name</Label>
                <Input id="p-name" className="mt-1" {...form.register("full_name")} />
              </div>
              <div>
                <Label htmlFor="p-headline">Headline</Label>
                <Input id="p-headline" className="mt-1" placeholder="Staff engineer at APEX" {...form.register("headline")} />
              </div>
              <div>
                <Label htmlFor="p-avatar">Avatar Image URL</Label>
                <Input id="p-avatar" className="mt-1" placeholder="https://images.unsplash.com/…" {...form.register("avatar_url")} />
              </div>
              <Button
                type="submit"
                disabled={update.isPending}
                className="gradient-primary text-primary-foreground font-semibold"
              >
                {update.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
