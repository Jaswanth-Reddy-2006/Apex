import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_please_change_in_production";

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

        // Verify JWT and extract userId
        let userId: string;
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          userId = decoded.userId;
          if (!userId) throw new Error("Invalid token payload");
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }

        // Verify conversation belongs to user + project
        const conv = await prisma.chatConversation.findUnique({
          where: { id: conversationId },
          select: { id: true, project_id: true, organization_id: true, title: true },
        });

        if (!conv || conv.project_id !== projectId) {
          return new Response("Forbidden", { status: 403 });
        }

        // Persist the latest user message
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const text = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();

          await prisma.chatMessage.create({
            data: {
              conversation_id: conversationId,
              project_id: projectId,
              user_id: userId,
              role: "user",
              content: text,
              attachments: (last as any).attachments ?? [],
            },
          });

          // Auto-title on first user message
          if (conv.title === "New chat" && text.length > 0) {
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { title: text.slice(0, 60), last_message_at: new Date() },
            });
          } else {
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { last_message_at: new Date() },
            });
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const systemPrompt =
          `You are APEX, an AI assistant embedded inside a specific project (id: ${projectId}). ` +
          `You have per-project memory and MUST never reveal data from other projects. Be concise, technical, and helpful. ` +
          `Format responses in markdown.`;

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            await prisma.chatMessage.create({
              data: {
                conversation_id: conversationId,
                project_id: projectId,
                user_id: userId,
                role: "assistant",
                content: text,
                model: "google/gemini-3-flash-preview",
              },
            });
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { last_message_at: new Date() },
            });
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
