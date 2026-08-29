export type AuditStatus = "pending" | "running" | "complete" | "failed";

export type AgentStepStatus = "running" | "done" | "error";

export type PipelineStep =
  | "INTAKE"
  | "EXTRACT"
  | "PLAN"
  | "COMPUTE"
  | "VERIFY"
  | "RENDER"
  | "PACKAGE";

export type InputType = "upload" | "paste" | "url" | "pdf";

export type ViolationSeverity = "critical" | "major" | "minor";

export interface Violation {
  code: string;
  severity: ViolationSeverity;
  title: string;
  explanation: string;
}

export interface AuditInput {
  type: InputType;
  originalUrl?: string;
  hasGroundTruthCsv: boolean;
}

export interface AuditArtifacts {
  reportCardUrl: string;
  auditPdfUrl: string;
  notebookUrl: string;
  honestChartUrl: string;
  originalChartUrl: string;
}

export interface AgentStep {
  step: PipelineStep | string;
  status: AgentStepStatus;
  summary: string;
  timestamp: number;
  tokensUsed?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
}

export interface AuditCost extends TokenUsage {
  usd: number;
}

export interface ExtractedClaim {
  text: string;
  confidence?: number;
}

export interface ChartExtraction {
  chartType: string;
  xAxis?: string;
  yAxis?: string;
  timeRange?: string;
  claims: ExtractedClaim[];
  notes?: string;
}

export interface PlannedCheck {
  id: string;
  name: string;
  rationale: string;
}

export interface AuditPlan {
  checks: PlannedCheck[];
}

export interface AuditRecord {
  id: string;
  slug: string;
  sessionId: string;
  status: AuditStatus;
  input: AuditInput;
  grade?: string;
  trustScore?: number;
  violations: Violation[];
  artifacts?: AuditArtifacts;
  agentSteps: AgentStep[];
  cost: AuditCost;
  createdAt: number;
}

export interface PipelineContext {
  imageDataUrl: string;
  groundTruthCsv?: string;
  extraction?: ChartExtraction;
  plan?: AuditPlan;
  steps: AgentStep[];
  cost: AuditCost;
}
