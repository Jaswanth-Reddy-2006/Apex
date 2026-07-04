import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../lib/auth-middleware.js";

async function verifyPermission(context: any, orgId: string, permissionKey: string) {
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

export const getPaymentConsole = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id } = data;
    await verifyPermission(context, organization_id, "Dashboard.View");

    // 1. Fetch wallets
    const wallets = await context.prisma.agentWallet.findMany({
      where: { organization_id },
      orderBy: { created_at: "desc" },
    });

    // 2. Fetch transactions
    const transactions = await context.prisma.agentTransaction.findMany({
      where: { organization_id },
      orderBy: { created_at: "desc" },
    });

    return {
      wallets,
      transactions,
    };
  });

export const createAgentWallet = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      project_id: z.string().optional(),
      agent_name: z.string().trim().min(3),
      daily_limit: z.number().positive(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, project_id, agent_name, daily_limit } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    // Generate a random wallet address
    const hex = "0123456789abcdef";
    let wallet_address = "0x";
    for (let i = 0; i < 40; i++) {
      wallet_address += hex[Math.floor(Math.random() * 16)];
    }

    const wallet = await context.prisma.agentWallet.create({
      data: {
        organization_id,
        project_id,
        agent_name,
        wallet_address,
        daily_limit,
        spent_today: 0.0,
        status: "active",
        reputation_score: 98.0,
      },
    });

    // Audit log
    await context.prisma.auditLog.create({
      data: {
        action: `Created Agent Wallet: ${agent_name} (${wallet_address})`,
        user_id: context.userId,
        organization_id,
        metadata: { wallet_id: wallet.id },
      },
    });

    return { success: true, wallet };
  });

export const toggleWalletFreeze = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      wallet_id: z.string(),
      status: z.enum(["active", "frozen"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, wallet_id, status } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    const wallet = await context.prisma.agentWallet.update({
      where: { id: wallet_id },
      data: { status },
    });

    // Audit log
    await context.prisma.auditLog.create({
      data: {
        action: `${status === "frozen" ? "FREEZED" : "UNFREEZED"} Agent Wallet: ${wallet.agent_name}`,
        user_id: context.userId,
        organization_id,
        metadata: { wallet_id },
      },
    });

    return { success: true, wallet };
  });

export const toggleWalletAutoDelegation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      wallet_id: z.string(),
      auto_delegation: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, wallet_id, auto_delegation } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    const wallet = await context.prisma.agentWallet.update({
      where: { id: wallet_id },
      data: { auto_delegation },
    });

    // Audit log
    await context.prisma.auditLog.create({
      data: {
        action: `Set Auto-Delegation to ${auto_delegation} for Agent Wallet: ${wallet.agent_name}`,
        user_id: context.userId,
        organization_id,
        metadata: { wallet_id, auto_delegation },
      },
    });

    return { success: true, wallet };
  });

export const simulateAgentTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      wallet_id: z.string(),
      recipient_agent: z.string().trim().min(3),
      amount: z.number().positive(),
      purpose: z.string().trim().min(5),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, wallet_id, recipient_agent, amount, purpose } = data;
    await verifyPermission(context, organization_id, "Dashboard.View");

    const wallet = await context.prisma.agentWallet.findUnique({
      where: { id: wallet_id },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const traces: string[] = [
      `[Protocol Auth] Verifying cryptographically signed payment intent for agent: "${wallet.agent_name}"...`,
      `[Protocol Auth] Identity verified. Wallet address: ${wallet.wallet_address}`,
    ];

    // 1. Check if wallet is frozen (Kill switch check)
    if (wallet.status === "frozen") {
      traces.push(`[Policy Engine] ERROR: Transaction DENIED. Wallet is frozen by founder kill-switch.`);
      const transaction = await context.prisma.agentTransaction.create({
        data: {
          organization_id,
          wallet_id,
          recipient_agent,
          amount,
          purpose,
          risk_score: 1.0,
          status: "blocked",
          trace: "Wallet is frozen by global policy manager.",
        },
      });
      return { success: false, status: "blocked", traces, transaction };
    }

    // 2. Policy limit validation
    const projectedSpend = wallet.spent_today + amount;
    traces.push(`[Policy Engine] Evaluating daily limits... Current spent today: $${wallet.spent_today}, Requested: $${amount}, Daily Cap: $${wallet.daily_limit}`);
    
    if (projectedSpend > wallet.daily_limit) {
      traces.push(`[Policy Engine] WARNING: Projected spend ($${projectedSpend}) exceeds Daily Cap ($${wallet.daily_limit}).`);
      
      // Auto-delegation check
      if (wallet.auto_delegation && wallet.reputation_score >= 90 && amount <= 30.0) {
        traces.push(`[Policy Engine] AUTO-DELEGATION BYPASS: Settle authorized autonomously. Amount ($${amount}) is within the $30 auto-delegation safety envelope and wallet reputation score is high (${wallet.reputation_score}%).`);
      } else {
        traces.push(`[Policy Engine] Escalating transaction to human approval gate.`);

        const transaction = await context.prisma.agentTransaction.create({
          data: {
            organization_id,
            wallet_id,
            recipient_agent,
            amount,
            purpose,
            risk_score: 0.75,
            status: "pending_approval",
            trace: "Exceeds daily spending limit policy.",
          },
        });

        // Mirror as an Autonomous OS action so founder can see it there too!
        await context.prisma.autonomousAgentAction.create({
          data: {
            organization_id,
            agent_type: "finance",
            action_type: "agent_payment_escalation",
            description: `Authorize Agent Payment: $${amount} from ${wallet.agent_name} to ${recipient_agent}`,
            trace: `Agent requested $${amount} for ${purpose}. Exceeds daily budget.`,
            status: "pending",
            payload: { transaction_id: transaction.id, amount, recipient: recipient_agent },
          },
        });

        return { success: false, status: "pending_approval", traces, transaction };
      }
    }

    // 3. AI Anomaly Risk Assessment
    let risk_score = 0.05;
    // Anomaly logic: higher amount, weird keywords, or low reputation spikes risk score
    const lowerPurpose = purpose.toLowerCase();
    if (amount > 80 || lowerPurpose.includes("crypto") || lowerPurpose.includes("gamble") || lowerPurpose.includes("unverified")) {
      risk_score = 0.85;
    } else if (amount > 40) {
      risk_score = 0.45;
    }

    traces.push(`[AI Risk Engine] Performing anomaly detection check... Risk Score: ${risk_score}`);

    if (risk_score > 0.80) {
      traces.push(`[AI Risk Engine] ANOMALY DETECTED: Transaction flagged as high-risk ($${amount} for ${purpose}).`);
      traces.push(`[Policy Engine] Enforcing security protocol: Auto-blocking transaction to prevent runaway spend.`);

      // Lower reputation score due to anomaly
      await context.prisma.agentWallet.update({
        where: { id: wallet_id },
        data: {
          reputation_score: Math.max(20, wallet.reputation_score - 15),
        },
      });

      const transaction = await context.prisma.agentTransaction.create({
        data: {
          organization_id,
          wallet_id,
          recipient_agent,
          amount,
          purpose,
          risk_score,
          status: "blocked",
          trace: "AI Risk Engine flagged transaction as anomalous.",
        },
      });

      return { success: false, status: "blocked", traces, transaction };
    }

    // 4. Successful Settlement
    traces.push(`[Settlement Layer] Settle intent approved. Deducting $${amount} from wallet.`);
    
    // Update spent today
    const updatedWallet = await context.prisma.agentWallet.update({
      where: { id: wallet_id },
      data: {
        spent_today: wallet.spent_today + amount,
        reputation_score: Math.min(100, wallet.reputation_score + 1.5),
      },
    });

    const transaction = await context.prisma.agentTransaction.create({
      data: {
        organization_id,
        wallet_id,
        recipient_agent,
        amount,
        purpose,
        risk_score,
        status: "settled",
        trace: "Approved and settled autonomously.",
      },
    });

    // Also deduct from global startup cash balance to show connected system!
    const metric = await context.prisma.autonomousMetric.findUnique({
      where: { organization_id },
    });
    if (metric) {
      await context.prisma.autonomousMetric.update({
        where: { organization_id },
        data: {
          cash_balance: Math.max(0, metric.cash_balance - amount),
          runway_months: Math.max(0, parseFloat(((metric.cash_balance - amount) / metric.burn_rate).toFixed(1))),
        },
      });
    }

    traces.push(`[Settlement Layer] Settlement complete. Tx Hash generated: 0x${Math.random().toString(16).slice(2, 10)}...`);

    return { success: true, status: "settled", traces, transaction, wallet: updatedWallet };
  });

export const approveEscalatedTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
      transaction_id: z.string(),
      status: z.enum(["approved", "rejected"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id, transaction_id, status } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    const transaction = await context.prisma.agentTransaction.findUnique({
      where: { id: transaction_id },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending_approval") {
      throw new Error("Transaction is already finalized.");
    }

    if (status === "rejected") {
      const updated = await context.prisma.agentTransaction.update({
        where: { id: transaction_id },
        data: { status: "blocked", trace: "Rejected by founder escalation review." },
      });
      return { success: true, transaction: updated };
    }

    // Settle it
    const wallet = await context.prisma.agentWallet.findUnique({
      where: { id: transaction.wallet_id },
    });

    if (!wallet) {
      throw new Error("Associated wallet not found.");
    }

    // Update wallet spent today
    await context.prisma.agentWallet.update({
      where: { id: wallet.id },
      data: {
        spent_today: wallet.spent_today + transaction.amount,
        reputation_score: Math.min(100, wallet.reputation_score + 2.0),
      },
    });

    const updated = await context.prisma.agentTransaction.update({
      where: { id: transaction_id },
      data: { status: "settled", trace: "Settled after human approval bypass." },
    });

    // Also deduct from global cash balance
    const metric = await context.prisma.autonomousMetric.findUnique({
      where: { organization_id },
    });
    if (metric) {
      await context.prisma.autonomousMetric.update({
        where: { organization_id },
        data: {
          cash_balance: Math.max(0, metric.cash_balance - transaction.amount),
          runway_months: Math.max(0, parseFloat(((metric.cash_balance - transaction.amount) / metric.burn_rate).toFixed(1))),
        },
      });
    }

    // Mark corresponding Autonomous OS Action as approved
    const action = await context.prisma.autonomousAgentAction.findFirst({
      where: {
        organization_id,
        payload: {
          path: ["transaction_id"],
          equals: transaction_id,
        },
      },
    });
    if (action) {
      await context.prisma.autonomousAgentAction.update({
        where: { id: action.id },
        data: { status: "approved" },
      });
    }

    // Audit log
    await context.prisma.auditLog.create({
      data: {
        action: `Approved Escalated Agent Payment: $${transaction.amount} from ${wallet.agent_name}`,
        user_id: context.userId,
        organization_id,
        metadata: { transaction_id },
      },
    });

    return { success: true, transaction: updated };
  });

export const seedPaymentsDemo = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      organization_id: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { organization_id } = data;
    await verifyPermission(context, organization_id, "Integrations.Create");

    // 1. Clear old data
    await context.prisma.agentWallet.deleteMany({ where: { organization_id } });
    await context.prisma.agentTransaction.deleteMany({ where: { organization_id } });

    // 2. Insert mock wallets
    const wallets = await context.prisma.agentWallet.createMany({
      data: [
        {
          organization_id,
          agent_name: "Finance_Ops_Agent",
          wallet_address: "0x3c4fde2e8e9a26388421374ac1259e847ef29302",
          daily_limit: 150.0,
          spent_today: 15.0,
          status: "active",
          reputation_score: 98.0,
          auto_delegation: true,
        },
        {
          organization_id,
          agent_name: "Hiring_ATS_Agent",
          wallet_address: "0xf8574ac193023c4fde2e8e9a26388421259e847e",
          daily_limit: 100.0,
          spent_today: 0.0,
          status: "active",
          reputation_score: 95.0,
          auto_delegation: true,
        },
        {
          organization_id,
          agent_name: "Legal_Docs_Agent",
          wallet_address: "0xe8e9a26388421374ac1259e847ef293023c4fde28",
          daily_limit: 50.0,
          spent_today: 0.0,
          status: "active",
          reputation_score: 99.0,
          auto_delegation: true,
        },
        {
          organization_id,
          agent_name: "GTM_Campaign_Agent",
          wallet_address: "0xabcde26388421374ac1259e847ef293023c4fde2f",
          daily_limit: 120.0,
          spent_today: 45.0,
          status: "active",
          reputation_score: 92.0,
          auto_delegation: false,
        },
        {
          organization_id,
          agent_name: "Fundraising_CRM_Agent",
          wallet_address: "0x9876e26388421374ac1259e847ef293023c4fde2a",
          daily_limit: 250.0,
          spent_today: 0.0,
          status: "active",
          reputation_score: 75.0,
          auto_delegation: false,
        },
      ],
    });

    const activeWallets = await context.prisma.agentWallet.findMany({ where: { organization_id } });
    const finance = activeWallets.find((w) => w.agent_name === "Finance_Ops_Agent");
    const hiring = activeWallets.find((w) => w.agent_name === "Hiring_ATS_Agent");
    const gtm = activeWallets.find((w) => w.agent_name === "GTM_Campaign_Agent");

    // 3. Insert mock transactions
    if (finance && hiring && gtm) {
      await context.prisma.agentTransaction.createMany({
        data: [
          {
            organization_id,
            wallet_id: finance.id,
            recipient_agent: "AWS Serverless Compute Node",
            amount: 15.0,
            purpose: "Spin up serverless compute instance for automated testing",
            risk_score: 0.05,
            status: "settled",
            trace: "Approved autonomously.",
          },
          {
            organization_id,
            wallet_id: gtm.id,
            recipient_agent: "MailChimp Campaign API",
            amount: 45.0,
            purpose: "Send newsletter updates to subscriber base",
            risk_score: 0.15,
            status: "settled",
            trace: "Approved autonomously.",
          },
        ],
      });
    }

    return { success: true };
  });
