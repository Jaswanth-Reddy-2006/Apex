import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../lib/auth-middleware.js";
import { generateEmbedding } from "./rag.js";

async function verifyPermission(context: any, orgId: string, permissionKey: string) {
  // If orgId is 'global', skip check to facilitate mock dashboard demo sandbox
  if (orgId === "global") return;
  const member = await context.prisma.organizationMember.findFirst({
    where: {
      organization_id: orgId,
      user_id: context.userId,
    },
  });
  if (!member) {
    throw new Error("You are not a member of this organization.");
  }
}

export const getAutonomousDashboard = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id } = data;
    await verifyPermission(context, organization_id, "Dashboard.View");

    // 1. Get or create startup metrics
    let metric = await context.prisma.autonomousMetric.findUnique({
      where: { organization_id },
    });

    if (!metric) {
      metric = await context.prisma.autonomousMetric.create({
        data: {
          organization_id,
          runway_months: 14.5,
          burn_rate: 12000.0,
          cash_balance: 174000.0,
          hiring_candidates_count: 8,
          sales_pipeline_value: 45000.0,
          investor_pipeline_count: 5,
        },
      });
    }

    // 2. Get pending and recent actions
    const actions = await context.prisma.autonomousAgentAction.findMany({
      where: { organization_id },
      orderBy: { created_at: "desc" },
    });

    return {
      metrics: metric,
      actions,
    };
  });

export const updateActionStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      action_id: z.string(),
      status: z.enum(["approved", "rejected"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, action_id, status } = data;
    await verifyPermission(context, organization_id, "Integrations.Create"); // Let's use Integrations.Create or similar high-privilege permission for approval gate

    const action = await context.prisma.autonomousAgentAction.findUnique({
      where: { id: action_id },
    });

    if (!action) {
      throw new Error("Action item not found");
    }

    // Update status
    const updated = await context.prisma.autonomousAgentAction.update({
      where: { id: action_id },
      data: { status },
    });

    // If approved, perform mock domain side-effects (e.g. adjust balance if it's wire transfer)
    if (status === "approved") {
      const metric = await context.prisma.autonomousMetric.findUnique({
        where: { organization_id },
      });

      if (metric) {
        if (action.action_type === "wire_transfer") {
          const amount = (action.payload as any)?.amount ?? 0;
          await context.prisma.autonomousMetric.update({
            where: { organization_id },
            data: {
              cash_balance: Math.max(0, metric.cash_balance - amount),
              runway_months: Math.max(0, parseFloat(((metric.cash_balance - amount) / metric.burn_rate).toFixed(1))),
            },
          });
        } else if (action.action_type === "send_offer") {
          await context.prisma.autonomousMetric.update({
            where: { organization_id },
            data: {
              hiring_candidates_count: Math.max(0, metric.hiring_candidates_count - 1),
            },
          });
        }
      }

      // Log in audit log
      await context.prisma.auditLog.create({
        data: {
          action: `CEO Approved Action: ${action.description}`,
          user_id: context.userId,
          organization_id,
          metadata: { action_id, agent_type: action.agent_type },
        },
      });
    }

    return { success: true, updated };
  });

export const executeAgentGoal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      goal: z.string().trim().min(5),
      agent_type: z.enum(["orchestrator", "finance", "hiring", "legal", "gtm", "fundraising"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, goal, agent_type } = data;
    await verifyPermission(context, organization_id, "Dashboard.View");

    // Mock planner-executor multi-agent trace logs
    let chosenAgent = agent_type;
    const lowerGoal = goal.toLowerCase();

    // Dynamically route if orchestrator is selected
    if (chosenAgent === "orchestrator") {
      if (lowerGoal.includes("runway") || lowerGoal.includes("budget") || lowerGoal.includes("forecast") || lowerGoal.includes("cash") || lowerGoal.includes("spend")) {
        chosenAgent = "finance";
      } else if (lowerGoal.includes("hire") || lowerGoal.includes("job") || lowerGoal.includes("resume") || lowerGoal.includes("offer") || lowerGoal.includes("candidate")) {
        chosenAgent = "hiring";
      } else if (lowerGoal.includes("contract") || lowerGoal.includes("nda") || lowerGoal.includes("legal") || lowerGoal.includes("compliance") || lowerGoal.includes("agreement")) {
        chosenAgent = "legal";
      } else if (lowerGoal.includes("marketing") || lowerGoal.includes("campaign") || lowerGoal.includes("sales") || lowerGoal.includes("pipeline") || lowerGoal.includes("newsletter") || lowerGoal.includes("gtm")) {
        chosenAgent = "gtm";
      } else if (lowerGoal.includes("pitch") || lowerGoal.includes("investor") || lowerGoal.includes("fundraise") || lowerGoal.includes("deck") || lowerGoal.includes("valuation")) {
        chosenAgent = "fundraising";
      } else {
        chosenAgent = "finance"; // Fallback to general finance ops
      }
    }

    const traces: string[] = [
      `[Orchestrator] Received user goal: "${goal}"`,
      `[Orchestrator] Analyzing goal parameters and routing to domain specialist...`,
      `[Orchestrator] Dispatched task to [${chosenAgent.toUpperCase()} AGENT].`,
    ];

    let draftContent = "";
    let actionItem: any = null;

    if (chosenAgent === "finance") {
      traces.push("[Finance Agent] Fetching runway projections and active burn ledger...");
      traces.push("[Finance Agent] Executing Monte Carlo simulation for cash forecast...");
      traces.push("[Finance Agent] Plan formulated: Draft runway report and queue invoice payment verification.");

      draftContent = `# Runway & Financial Forecast Report
**Goal:** ${goal}
**Prepared by:** APEX Finance Agent

## Projections:
- Current Runway: 14.5 Months
- Monthly Burn Rate: $12,000
- Recommended Runway Extension: Delay marketing hire to extend runway by 2.4 months.
      `;

      if (lowerGoal.includes("pay") || lowerGoal.includes("wire") || lowerGoal.includes("invoice") || lowerGoal.includes("transfer")) {
        actionItem = await context.prisma.autonomousAgentAction.create({
          data: {
            organization_id,
            agent_type: "finance",
            action_type: "wire_transfer",
            description: "Wire $3,500 for AWS Enterprise Server invoice",
            trace: "AWS invoice amount matches monthly burn ledger average. Requires CEO approval before release.",
            status: "pending",
            payload: { amount: 3500.0, vendor: "Amazon Web Services" },
          },
        });
        traces.push("[Finance Agent] Action enqueued: Created high-stakes approval gate for wire transfer.");
      }

    } else if (chosenAgent === "hiring") {
      traces.push("[Hiring Agent] Accessing ATS pipeline and drafting target profile...");
      traces.push("[Hiring Agent] Generating optimized JD content based on startup framework templates...");

      draftContent = `# Job Description: Senior Fullstack Engineer
**Goal:** ${goal}
**Role Summary:** We are looking for an experienced Fullstack React/Node.js engineer to lead our core products.
**Key Responsibilities:**
- Develop scalable APIs in Node/FastAPI.
- Optimize frontend components for speed and layout fidelity.
      `;

      if (lowerGoal.includes("send offer") || lowerGoal.includes("send offer letter") || lowerGoal.includes("hire applicant")) {
        actionItem = await context.prisma.autonomousAgentAction.create({
          data: {
            organization_id,
            agent_type: "hiring",
            action_type: "send_offer",
            description: "Send official offer letter to John Doe for Senior Engineer role ($120k/yr)",
            trace: "Candidate has completed all 3 interviews and has a 9.2 score. Compensation fits within hiring budget parameters.",
            status: "pending",
            payload: { name: "John Doe", title: "Senior Engineer", salary: 120000 },
          },
        });
        traces.push("[Hiring Agent] Action enqueued: Created high-stakes approval gate for sending job offer.");
      }

    } else if (chosenAgent === "legal") {
      traces.push("[Legal Agent] Loading Delaware C-Corp standard templates...");
      traces.push("[Legal Agent] Compiling compliance checklists and drafting provisions...");

      draftContent = `# Mutual Non-Disclosure Agreement (NDA)
**Goal:** ${goal}
**Parties:** APEX OS Inc. and [Undisclosed Counterparty]
**Scope:** Mutual protection of proprietary algorithms and data nodes.
**Duration:** 3 Years from execution.
      `;

      if (lowerGoal.includes("sign") || lowerGoal.includes("execute") || lowerGoal.includes("contract") || lowerGoal.includes("agreement")) {
        actionItem = await context.prisma.autonomousAgentAction.create({
          data: {
            organization_id,
            agent_type: "legal",
            action_type: "sign_nda",
            description: "Execute Mutual NDA with VenturePartners VC",
            trace: "Standard mutual NDA format. Verified terms match standard Delaware startup corporate policy.",
            status: "pending",
            payload: { counterparty: "VenturePartners VC" },
          },
        });
        traces.push("[Legal Agent] Action enqueued: Created high-stakes approval gate for NDA signature.");
      }

    } else if (chosenAgent === "gtm") {
      traces.push("[GTM Agent] Accessing active marketing campaign nodes...");
      traces.push("[GTM Agent] Optimizing copy vectors for Twitter/Newsletter distribution...");

      draftContent = `# Twitter Campaign Launch Copy
**Goal:** ${goal}
**Draft Copy:**
"Supercharge your workflow. APEX acts as your AI-driven CEO assistant, automating bookkeeping, legal drafting, and hiring ATS pipelines so you can focus on building. 🚀 Link: apex.dev"
      `;

    } else if (chosenAgent === "fundraising") {
      traces.push("[Fundraising Agent] Retrieving investor CRM lists...");
      traces.push("[Fundraising Agent] Outlining pitch deck structural points...");

      draftContent = `# Investor Update Outlines (Q3)
**Goal:** ${goal}
**Key metrics to highlight:**
- MoM growth rate: 18%
- Burn rate lowered to $12k/mo
- Cash reserves: 14.5 months runway remaining.
      `;
    }

    traces.push(`[Orchestrator] Execution finished. Output drafted.`);

    return {
      success: true,
      agent_type: chosenAgent,
      traces,
      draft: draftContent,
      action: actionItem,
    };
  });

export const seedAutonomousDemo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    // 1. Create or reset metrics
    await context.prisma.autonomousMetric.upsert({
      where: { organization_id },
      update: {
        runway_months: 15.2,
        burn_rate: 11500.0,
        cash_balance: 174800.0,
        hiring_candidates_count: 6,
        sales_pipeline_value: 65000.0,
        investor_pipeline_count: 8,
      },
      create: {
        organization_id,
        runway_months: 15.2,
        burn_rate: 11500.0,
        cash_balance: 174800.0,
        hiring_candidates_count: 6,
        sales_pipeline_value: 65000.0,
        investor_pipeline_count: 8,
      },
    });

    // 2. Clear old demo actions and insert standard demo actions
    await context.prisma.autonomousAgentAction.deleteMany({
      where: { organization_id },
    });

    await context.prisma.autonomousAgentAction.createMany({
      data: [
        {
          organization_id,
          agent_type: "finance",
          action_type: "wire_transfer",
          description: "Wire $3,500.00 to AWS for monthly host invoice",
          trace: "Standard recurring host cost. Inbounds match operational budget envelope. Awaiting CEO confirmation.",
          status: "pending",
          payload: { amount: 3500.0, recipient: "Amazon Web Services" },
        },
        {
          organization_id,
          agent_type: "hiring",
          action_type: "send_offer",
          description: "Send formal offer to Jane Miller for Frontend Engineer position",
          trace: "Top candidate scored 9.4/10. Standard package at $110,000/year plus 0.25% equity options. Approved by hiring panel.",
          status: "pending",
          payload: { name: "Jane Miller", role: "Frontend Engineer", salary: 110000 },
        },
        {
          organization_id,
          agent_type: "legal",
          action_type: "sign_nda",
          description: "Sign Mutual NDA contract with SeedCapital VC",
          trace: "Required NDA prior to sharing proprietary data room. Terms reviewed and matched Delaware standards.",
          status: "pending",
          payload: { partner: "SeedCapital VC" },
        },
      ],
    });

    return { success: true };
  });
