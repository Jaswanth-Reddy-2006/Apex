/** Static catalog of supported integrations (Phase 1 — UI wiring only). */
export type IntegrationCategory =
  | "code"
  | "cloud"
  | "communication"
  | "productivity"
  | "ai"
  | "payments";

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  { id: "github", name: "GitHub", category: "code", description: "Repositories, issues, PRs" },
  { id: "gitlab", name: "GitLab", category: "code", description: "Repositories & CI" },
  { id: "bitbucket", name: "Bitbucket", category: "code", description: "Atlassian repos" },
  { id: "vercel", name: "Vercel", category: "cloud", description: "Deployments & preview URLs" },
  { id: "aws", name: "AWS", category: "cloud", description: "Cloud infrastructure" },
  { id: "cloudflare", name: "Cloudflare", category: "cloud", description: "Edge, DNS, R2" },
  { id: "railway", name: "Railway", category: "cloud", description: "Backend hosting" },
  { id: "render", name: "Render", category: "cloud", description: "App hosting" },
  { id: "dockerhub", name: "Docker Hub", category: "cloud", description: "Container registry" },
  { id: "notion", name: "Notion", category: "productivity", description: "Docs & wiki" },
  { id: "slack", name: "Slack", category: "communication", description: "Channels & DMs" },
  { id: "discord", name: "Discord", category: "communication", description: "Servers & channels" },
  { id: "gdrive", name: "Google Drive", category: "productivity", description: "File storage" },
  { id: "gmail", name: "Gmail", category: "communication", description: "Email" },
  { id: "gcal", name: "Google Calendar", category: "productivity", description: "Calendars" },
  { id: "jira", name: "Jira", category: "productivity", description: "Issue tracking" },
  { id: "linear", name: "Linear", category: "productivity", description: "Modern issue tracker" },
  { id: "trello", name: "Trello", category: "productivity", description: "Kanban boards" },
  { id: "openai", name: "OpenAI", category: "ai", description: "GPT models" },
  { id: "claude", name: "Claude", category: "ai", description: "Anthropic models" },
  { id: "gemini", name: "Gemini", category: "ai", description: "Google AI" },
  { id: "ollama", name: "Ollama", category: "ai", description: "Local models" },
  { id: "stripe", name: "Stripe", category: "payments", description: "Payments & billing" },
  { id: "razorpay", name: "Razorpay", category: "payments", description: "Payments (India)" },
];
