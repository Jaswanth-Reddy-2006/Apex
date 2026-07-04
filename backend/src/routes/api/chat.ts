import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createSupabasePrismaClient } from "../../lib/supabase-prisma-adapter.js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  messages?: UIMessage[];
  conversationId?: string;
  projectId?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization");
        const token = auth?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const { messages, conversationId, projectId } = body;
        if (!Array.isArray(messages) || !conversationId || !projectId) {
          return new Response("Bad request", { status: 400 });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Decode JWT token directly to extract userId (sub claim)
        const parts = token.split(".");
        if (parts.length !== 3) return new Response("Unauthorized", { status: 401 });
        let userId: string;
        let email: string | undefined;
        let userMetadata: any = undefined;
        try {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          userId = payload.sub;
          email = payload.email;
          userMetadata = payload.user_metadata;
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // Instantiate Prisma compatibility client
        const supabase = createSupabasePrismaClient(userId, email, userMetadata) as any;

        // Verify conversation belongs to user + project (RLS also enforces)
        const { data: conv, error: convErr } = await supabase
          .from("chat_conversations")
          .select("id, project_id, organization_id, title")
          .eq("id", conversationId)
          .maybeSingle();
        if (convErr || !conv || conv.project_id !== projectId) {
          return new Response("Forbidden", { status: 403 });
        }

        // Persist the latest user message
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const text = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            project_id: projectId,
            user_id: userId,
            role: "user",
            content: text,
            attachments: (last as unknown as { attachments?: unknown }).attachments ?? [],
          });
          // Auto-title on first user message
          if (conv.title === "New chat" && text.length > 0) {
            await supabase
              .from("chat_conversations")
              .update({ title: text.slice(0, 60), last_message_at: new Date().toISOString() })
              .eq("id", conversationId);
          } else {
            await supabase
              .from("chat_conversations")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", conversationId);
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const systemPrompt = `You are APEX, an AI assistant embedded inside a specific project (id: ${projectId}). ` +
          `You have per-project memory and MUST never reveal data from other projects. Be concise, technical, and helpful. ` +
          `Format responses in markdown.`;

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            await supabase.from("chat_messages").insert({
              conversation_id: conversationId,
              project_id: projectId,
              user_id: userId,
              role: "assistant",
              content: text,
              model: "google/gemini-3-flash-preview",
            });
            await supabase
              .from("chat_conversations")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", conversationId);
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
