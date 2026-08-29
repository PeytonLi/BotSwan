import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const inputValidator = v.object({
  type: v.union(
    v.literal("upload"),
    v.literal("paste"),
    v.literal("url"),
    v.literal("pdf"),
  ),
  originalUrl: v.optional(v.string()),
  hasGroundTruthCsv: v.boolean(),
});

const violationValidator = v.object({
  code: v.string(),
  severity: v.union(
    v.literal("critical"),
    v.literal("major"),
    v.literal("minor"),
  ),
  title: v.string(),
  explanation: v.string(),
});

const artifactsValidator = v.object({
  reportCardUrl: v.string(),
  auditPdfUrl: v.string(),
  notebookUrl: v.string(),
  honestChartUrl: v.string(),
  originalChartUrl: v.string(),
});

const agentStepValidator = v.object({
  step: v.string(),
  status: v.union(
    v.literal("running"),
    v.literal("done"),
    v.literal("error"),
  ),
  summary: v.string(),
  timestamp: v.number(),
  tokensUsed: v.optional(v.number()),
});

const costValidator = v.object({
  inputTokens: v.number(),
  outputTokens: v.number(),
  reasoningTokens: v.optional(v.number()),
  usd: v.number(),
});

export default defineSchema({
  audits: defineTable({
    slug: v.string(),
    sessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
    ),
    input: inputValidator,
    grade: v.optional(v.string()),
    trustScore: v.optional(v.number()),
    violations: v.array(violationValidator),
    artifacts: v.optional(artifactsValidator),
    agentSteps: v.array(agentStepValidator),
    cost: costValidator,
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_session", ["sessionId", "createdAt"]),
});
