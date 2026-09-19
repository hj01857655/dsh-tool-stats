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

export interface TimeRange {
  from?: number | undefined;
  to?: number | undefined;
}

export interface DailyToolTrend {
  date: string; // YYYY-MM-DD
  invocations: number;
  failures: number;
  avgLatencyMs: number;
}

export interface ToolDetail {
  counter: ToolCounter;
  recentCalls: ToolCall[];
  trend: DailyToolTrend[];
  errorBreakdown: { message: string; count: number }[];
}

export interface Alert {
  level: 'warn' | 'error';
  tool: string;
  message: string;
  timestamp: number;
}

export interface ToolStatsOverview {
  totalCalls: number;
  totalFailures: number;
  overallFailureRate: number;
  activeSessions: number;
  avgLatencyMs: number;
}

export interface PanelPayload {
  tools: ToolCounter[];
  deadTools: DeadTool[];
  failingTools: FailingTool[];
  recommendations: Recommendation[];
  overview: ToolStatsOverview;
  alerts: Alert[];
}
