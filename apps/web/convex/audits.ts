import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const emptyCost = {
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  usd: 0,
};

export const createAudit = mutation({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    input: v.object({
      type: v.union(
        v.literal("upload"),
        v.literal("paste"),
        v.literal("url"),
        v.literal("pdf"),
      ),
      originalUrl: v.optional(v.string()),
      hasGroundTruthCsv: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("audits")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`Audit slug already exists: ${args.slug}`);
    }

    return await ctx.db.insert("audits", {
      slug: args.slug,
      sessionId: args.sessionId,
      status: "pending",
      input: args.input,
      violations: [],
      agentSteps: [],
      cost: emptyCost,
      createdAt: Date.now(),
    });
  },
});

export const appendAgentStep = mutation({
  args: {
    slug: v.string(),
    step: v.object({
      step: v.string(),
      status: v.union(
        v.literal("running"),
        v.literal("done"),
        v.literal("error"),
      ),
      summary: v.string(),
      timestamp: v.number(),
      tokensUsed: v.optional(v.number()),
    }),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("complete"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db
      .query("audits")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!audit) {
      throw new Error(`Audit not found: ${args.slug}`);
    }

    const agentSteps = [...audit.agentSteps];
    const existingIndex = agentSteps.findIndex((s) => s.step === args.step.step);

    if (existingIndex >= 0) {
      agentSteps[existingIndex] = args.step;
    } else {
      agentSteps.push(args.step);
    }

    await ctx.db.patch(audit._id, {
      agentSteps,
      status: args.status ?? audit.status,
    });

    return audit._id;
  },
});

export const updateCost = mutation({
  args: {
    slug: v.string(),
    cost: v.object({
      inputTokens: v.number(),
      outputTokens: v.number(),
      reasoningTokens: v.optional(v.number()),
      usd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db
      .query("audits")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!audit) {
      throw new Error(`Audit not found: ${args.slug}`);
    }

    await ctx.db.patch(audit._id, { cost: args.cost });
    return audit._id;
  },
});

export const completeAudit = mutation({
  args: {
    slug: v.string(),
    grade: v.string(),
    trustScore: v.number(),
    violations: v.array(
      v.object({
        code: v.string(),
        severity: v.union(
          v.literal("critical"),
          v.literal("major"),
          v.literal("minor"),
        ),
        title: v.string(),
        explanation: v.string(),
      }),
    ),
    artifacts: v.object({
      reportCardUrl: v.string(),
      auditPdfUrl: v.string(),
      notebookUrl: v.string(),
      honestChartUrl: v.string(),
      originalChartUrl: v.string(),
    }),
    cost: v.object({
      inputTokens: v.number(),
      outputTokens: v.number(),
      reasoningTokens: v.optional(v.number()),
      usd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db
      .query("audits")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!audit) {
      throw new Error(`Audit not found: ${args.slug}`);
    }

    await ctx.db.patch(audit._id, {
      status: "complete",
      grade: args.grade,
      trustScore: args.trustScore,
      violations: args.violations,
      artifacts: args.artifacts,
      cost: args.cost,
    });

    return audit._id;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audits")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audits")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});
