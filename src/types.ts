// Types for dsh-tool-stats

export interface ToolCall {
  tool: string;
  timestamp: number;
  success: boolean;
  latencyMs: number;
  sessionId: string;
  errorMessage?: string;
}

export interface ToolCounter {
  tool: string;
  invocations: number;
  successes: number;
  failures: number;
  failureRate: number;
  p50Latency: number;
  p95Latency: number;
  lastUsed: number;
  lastError?: string;
}

export interface DeadTool {
  tool: string;
  sessionsSinceLastUse: number;
}

export interface FailingTool {
  tool: string;
  failureRate: number;
  lastError?: string;
}

export interface Recommendation {
  type: 'dead-tools' | 'failing-tools';
  message: string;
  tools: string[];
  estimatedTokenSavings?: number;
}

export interface PanelPayload {
  tools: ToolCounter[];
  deadTools: DeadTool[];
  failingTools: FailingTool[];
  recommendations: Recommendation[];
}
