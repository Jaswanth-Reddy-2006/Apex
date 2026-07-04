import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  Plus,
  Send,
  Pin,
  PinOff,
  Trash2,
  Search,
  Loader2,
  Bot,
  User as UserIcon,
  Paperclip,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listProjects } from "@/lib/api.functions";
import {
  listConversations,
  createConversation,
  getConversationMessages,
  renameConversation,
  togglePinConversation,
  deleteConversation,
  searchConversations,
  uploadChatFileSignedUrl,
} from "@/lib/chat.functions";
import { useOrg } from "@/lib/org-context";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  const { activeOrg, hasPermission } = useOrg();
  const projectsFn = useServerFn(listProjects);
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });

  const orgProjects = useMemo(
    () => (projectsQ.data ?? []).filter((p) => p.organization_id === activeOrg?.organization_id),
    [projectsQ.data, activeOrg?.organization_id],
  );

  const [projectId, setProjectId] = useState<string | null>(null);
  useEffect(() => {
    if (!projectId && orgProjects[0]) setProjectId(orgProjects[0].id);
  }, [orgProjects, projectId]);

  if (!activeOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Chat" description="Isolated per-project AI assistant." />
        <EmptyState
          icon={MessageSquare}
          title="No organization"
          description="Create or join an organization first."
        />
      </div>
    );
  }

  if (!hasPermission("Chat.Access")) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Chat" description="Isolated per-project AI assistant." />
        <EmptyState
          icon={MessageSquare}
          title="Chat not available"
          description="Your role does not grant Chat.Access permission. Contact an admin."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Chat</h1>
          <p className="text-sm text-muted-foreground">
            Per-project assistant · isolated memory · scoped to your project membership.
          </p>
        </div>
        <div className="w-64">
          <Select value={projectId ?? ""} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project…" />
            </SelectTrigger>
            <SelectContent>
              {orgProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {projectId ? (
        <ProjectChat
          key={projectId}
          projectId={projectId}
          organizationId={activeOrg.organization_id}
        />
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No project selected"
          description="Create a project first, then chat."
        />
      )}
    </div>
  );
}

function ProjectChat({
  projectId,
  organizationId,
}: {
  projectId: string;
  organizationId: string;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const msgsFn = useServerFn(getConversationMessages);
  const renameFn = useServerFn(renameConversation);
  const pinFn = useServerFn(togglePinConversation);
  const delFn = useServerFn(deleteConversation);
  const searchFn = useServerFn(searchConversations);
  const uploadSignFn = useServerFn(uploadChatFileSignedUrl);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const convsQ = useQuery({
    queryKey: ["chat-convs", projectId],
    queryFn: () => listFn({ data: { project_id: projectId } }),
  });

  const searchQ = useQuery({
    queryKey: ["chat-search", projectId, search],
    queryFn: () => searchFn({ data: { project_id: projectId, q: search } }),
    enabled: search.length > 1,
  });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { project_id: projectId, organization_id: organizationId } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["chat-convs", projectId] });
      setActiveId(row.id);
    },
  });

  useEffect(() => {
    if (!activeId && convsQ.data && convsQ.data.length > 0) {
      setActiveId(convsQ.data[0].id);
    }
  }, [convsQ.data, activeId]);

  const results = search.length > 1 ? (searchQ.data ?? []) : [];

  return (
    <div className="grid flex-1 grid-cols-12 gap-4 overflow-hidden">
      {/* Conversations sidebar */}
      <Card className="col-span-12 flex flex-col overflow-hidden md:col-span-4 lg:col-span-3">
        <div className="border-b border-border p-3">
          <Button
            className="w-full"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
          >
            {createMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            New chat
          </Button>
        </div>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {search.length > 1 ? (
              results.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">No matches</p>
              ) : (
                results.map((r, idx) => {
                  const conv = (r.chat_conversations as unknown as { id: string; title: string } | null);
                  if (!conv) return null;
                  return (
                    <button
                      key={`${conv.id}-${idx}`}
                      onClick={() => {
                        setActiveId(conv.id);
                        setSearch("");
                      }}
                      className="w-full rounded-md p-2 text-left text-sm hover:bg-muted"
                    >
                      <div className="truncate font-medium">{conv.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.content.slice(0, 80)}
                      </div>
                    </button>
                  );
                })
              )
            ) : convsQ.isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (convsQ.data ?? []).length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No conversations yet. Start one above.
              </p>
            ) : (
              (convsQ.data ?? []).map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md pr-1 transition hover:bg-muted",
                    activeId === c.id && "bg-muted",
                  )}
                >
                  <button
                    onClick={() => setActiveId(c.id)}
                    className="flex-1 truncate px-2 py-2 text-left text-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                      <span className="truncate">{c.title}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleString()}
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await pinFn({ data: { id: c.id, pinned: !c.pinned } });
                      qc.invalidateQueries({ queryKey: ["chat-convs", projectId] });
                    }}
                    className="opacity-0 transition hover:text-primary group-hover:opacity-100"
                    title={c.pinned ? "Unpin" : "Pin"}
                  >
                    {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={async () => {
                      const name = prompt("Rename chat", c.title);
                      if (name && name.trim()) {
                        await renameFn({ data: { id: c.id, title: name.trim() } });
                        qc.invalidateQueries({ queryKey: ["chat-convs", projectId] });
                      }
                    }}
                    className="opacity-0 px-1 text-xs transition group-hover:opacity-100"
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this chat?")) return;
                      await delFn({ data: { id: c.id } });
                      qc.invalidateQueries({ queryKey: ["chat-convs", projectId] });
                      if (activeId === c.id) setActiveId(null);
                    }}
                    className="opacity-0 transition hover:text-destructive group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat window */}
      <Card className="col-span-12 flex flex-col overflow-hidden md:col-span-8 lg:col-span-9">
        {activeId ? (
          <ChatWindow
            key={activeId}
            conversationId={activeId}
            projectId={projectId}
            msgsFn={msgsFn}
            uploadSignFn={uploadSignFn}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={Bot}
              title="Start a new conversation"
              description="Create a new chat or pick one from the left."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

type MsgsFn = ReturnType<typeof useServerFn<typeof getConversationMessages>>;
type UploadFn = ReturnType<typeof useServerFn<typeof uploadChatFileSignedUrl>>;

function ChatWindow({
  conversationId,
  projectId,
  msgsFn,
  uploadSignFn,
}: {
  conversationId: string;
  projectId: string;
  msgsFn: MsgsFn;
  uploadSignFn: UploadFn;
}) {
  const historyQ = useQuery({
    queryKey: ["chat-msgs", conversationId],
    queryFn: () => msgsFn({ data: { conversation_id: conversationId } }),
  });

  const initialMessages: UIMessage[] = useMemo(() => {
    return (historyQ.data ?? []).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      parts: [{ type: "text", text: m.content }],
    })) as UIMessage[];
  }, [historyQ.data]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat`,
        body: { conversationId, projectId },
        fetch: async (input, init) => {
          const { data: sess } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (sess.session?.access_token) {
            headers.set("Authorization", `Bearer ${sess.session.access_token}`);
          }
          return fetch(input as RequestInfo, { ...init, headers });
        },
      }),
    [conversationId, projectId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Chat failed"),
  });

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string; mime: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    const attachmentText = attachments.length
      ? `\n\n_(Attached: ${attachments.map((a) => a.name).join(", ")})_`
      : "";
    sendMessage({ text: text + attachmentText });
    setInput("");
    setAttachments([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    setUploading(true);
    try {
      const signed = await uploadSignFn({
        data: {
          conversation_id: conversationId,
          project_id: projectId,
          file_name: f.name,
          mime_type: f.type || "application/octet-stream",
          size_bytes: f.size,
        },
      });
      const { error: upErr } = await supabase.storage
        .from("chat-uploads")
        .uploadToSignedUrl(signed.path, signed.token, f);
      if (upErr) throw upErr;
      const { data: pub } = await supabase.storage
        .from("chat-uploads")
        .createSignedUrl(signed.path, 60 * 60);
      setAttachments((a) => [
        ...a,
        { name: f.name, url: pub?.signedUrl ?? "", mime: f.type },
      ]);
      toast.success(`Attached ${f.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {historyQ.isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-2xl bg-primary-soft p-4 text-primary">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Ask APEX anything about this project</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Conversations, memory, and files are isolated to this project only.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary",
                  )}
                >
                  {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    {m.role === "user" ? "You" : "APEX AI"}
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <Paperclip className="h-3 w-3" />
                  {a.name}
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" hidden onChange={onPickFile} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || busy}
              title="Attach file"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Message APEX AI…"
              rows={1}
              className="max-h-40 min-h-[40px] resize-none"
            />
            <Button onClick={submit} disabled={busy || !input.trim()} size="icon">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
