import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { huggingface } from "@ai-sdk/huggingface";
import { generateEmbedding } from "../../services/rag.js";

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

        if (!process.env.HUGGINGFACE_API_KEY) {
          return new Response("Missing HUGGINGFACE_API_KEY", { status: 500 });
        }

        let userId: string;
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          userId = decoded.userId;
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // Verify conversation belongs to user + project
        const conv = await prisma.chatConversation.findUnique({
          where: { id: conversationId }
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
              attachments: ((last as any).attachments || []) as any,
            }
          });

          // Auto-title on first user message
          if (conv.title === "New chat" && text.length > 0) {
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { title: text.slice(0, 60), last_message_at: new Date() }
            });
          } else {
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { last_message_at: new Date() }
            });
          }
        }

        let contextData = "";
        
        // Retrieve RAG Context
        if (last?.role === "user") {
          try {
            const userText = last.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("").trim();
            
            const embedding = await generateEmbedding(userText);
            
            // Raw MongoDB Vector Search
            const rawResult: any = await prisma.$runCommandRaw({
              aggregate: "integration_data_nodes",
              pipeline: [
                {
                  $vectorSearch: {
                    index: "vector_index", // Requires an Atlas Vector Search index named 'vector_index'
                    path: "embedding",
                    queryVector: embedding,
                    numCandidates: 100,
                    limit: 5,
                    filter: { organization_id: conv.organization_id }
                  }
                },
                {
                  $project: { content: 1, score: { $meta: "searchScore" } }
                }
              ],
              cursor: {}
            });

            const docs = rawResult?.cursor?.firstBatch ?? [];
            if (docs.length > 0) {
              contextData = docs.map((d: any) => d.content).join("\n\n");
            }
          } catch (e) {
            console.error("[RAG] Vector search failed:", e);
          }
        }

        const model = huggingface("Qwen/Qwen2.5-72B-Instruct");

        const systemPrompt = `You are APEX, an AI assistant embedded inside a specific project (id: ${projectId}). ` +
          `You have per-project memory and MUST never reveal data from other projects. Be concise, technical, and helpful. ` +
          `Format responses in markdown.\n\n` +
          (contextData ? `Relevant context from connected integrations (GitHub, Vercel):\n${contextData}\n\n` : ` `);

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
                model: "Qwen/Qwen2.5-72B-Instruct",
              }
            });
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { last_message_at: new Date() }
            });
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
