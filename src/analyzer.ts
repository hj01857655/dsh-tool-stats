import type { ToolCall, ToolCounter, DeadTool, FailingTool, Recommendation, DailyToolTrend, ToolDetail, Alert, ToolStatsOverview } from './types.js';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function aggregate(calls: ToolCall[]): Map<string, ToolCounter> {
  const map = new Map<string, ToolCounter>();
  for (const call of calls) {
    const c = map.get(call.tool) ?? {
      tool: call.tool,
      invocations: 0,
      successes: 0,
      failures: 0,
      failureRate: 0,
      p50Latency: 0,
      p95Latency: 0,
      lastUsed: 0,
    };
    c.invocations++;
    if (call.success) c.successes++;
    else {
      c.failures++;
      if (call.errorMessage) c.lastError = call.errorMessage;
    }
    c.lastUsed = Math.max(c.lastUsed, call.timestamp);
    map.set(call.tool, c);
  }

  // Compute derived fields
  const latenciesByTool = new Map<string, number[]>();
  for (const call of calls) {
    const arr = latenciesByTool.get(call.tool) ?? [];
    arr.push(call.latencyMs);
    latenciesByTool.set(call.tool, arr);
  }
  for (const c of map.values()) {
    c.failureRate = c.invocations > 0 ? c.failures / c.invocations : 0;
    const lats = (latenciesByTool.get(c.tool) ?? []).sort((a, b) => a - b);
    c.p50Latency = percentile(lats, 50);
    c.p95Latency = percentile(lats, 95);
  }

  return map;
}

export function findDeadTools(
  configuredTools: string[],
  calls: ToolCall[],
  threshold = 10,
): DeadTool[] {
  const counters = aggregate(calls);
  const sessions = new Set(calls.map((c) => c.sessionId));
  const sessionCount = sessions.size;

  return configuredTools
    .filter((tool) => {
      const c = counters.get(tool);
      return !c || c.invocations === 0 || (sessionCount - new Set(calls.filter((c) => c.tool === tool).map((c) => c.sessionId)).size) >= threshold;
    })
    .map((tool) => ({
      tool,
      sessionsSinceLastUse: sessionCount - (counters.get(tool)?.invocations ?? 0),
    }));
}

export function findFailingTools(calls: ToolCall[], threshold = 0.3): FailingTool[] {
  const counters = aggregate(calls);
  return [...counters.values()]
    .filter((c) => c.invocations >= 5 && c.failureRate >= threshold)
    .map((c) => {
      const ft: FailingTool = { tool: c.tool, failureRate: c.failureRate };
      if (c.lastError !== undefined) ft.lastError = c.lastError;
      return ft;
    })
    .sort((a, b) => b.failureRate - a.failureRate);
}

export function recommend(
  configuredTools: string[],
  calls: ToolCall[],
  deadThreshold = 10,
  estimatedTokensPerTool = 150,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const dead = findDeadTools(configuredTools, calls, deadThreshold);
  if (dead.length > 0) {
    recs.push({
      type: 'dead-tools',
      message: `You have ${configuredTools.length} tools, but ${dead.length} haven't been used in ${deadThreshold}+ sessions. Removing them would save ~${dead.length * estimatedTokensPerTool} tokens per context window.`,
      tools: dead.map((d) => d.tool),
      estimatedTokenSavings: dead.length * estimatedTokensPerTool,
    });
  }
  const failing = findFailingTools(calls);
  if (failing.length > 0) {
    recs.push({
      type: 'failing-tools',
      message: `${failing.length} tools have a failure rate above 30%. Check their configuration.`,
      tools: failing.map((f) => f.tool),
    });
  }
  return recs;
}

/** Build daily trend for a specific tool. */
export function dailyTrend(calls: ToolCall[], toolName: string): DailyToolTrend[] {
  const toolCalls = calls.filter((c) => c.tool === toolName);
  const byDay = new Map<string, { invocations: number; failures: number; totalLatency: number }>();

  for (const c of toolCalls) {
    const day = new Date(c.timestamp).toISOString().slice(0, 10);
    const d = byDay.get(day) ?? { invocations: 0, failures: 0, totalLatency: 0 };
    d.invocations++;
    if (!c.success) d.failures++;
    d.totalLatency += c.latencyMs;
    byDay.set(day, d);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      invocations: d.invocations,
      failures: d.failures,
      avgLatencyMs: Math.round(d.totalLatency / d.invocations),
    }));
}

/** Detailed view for a single tool. */
export function toolDetail(calls: ToolCall[], toolName: string): ToolDetail | null {
  const counters = aggregate(calls);
  const counter = counters.get(toolName);
  if (!counter) return null;

  const toolCalls = calls.filter((c) => c.tool === toolName);
  const recentCalls = toolCalls.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  const trend = dailyTrend(calls, toolName);

  // Error breakdown
  const errorCounts = new Map<string, number>();
  for (const c of toolCalls) {
    if (!c.success && c.errorMessage) {
      const msg = c.errorMessage.slice(0, 100);
      errorCounts.set(msg, (errorCounts.get(msg) ?? 0) + 1);
    }
  }
  const errorBreakdown = [...errorCounts.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);

  return { counter, recentCalls, trend, errorBreakdown };
}

/** Generate alerts for failing tools. */
export function generateAlerts(calls: ToolCall[], threshold = 0.5): Alert[] {
  const alerts: Alert[] = [];
  const counters = aggregate(calls);
  const now = Date.now();

  for (const c of counters.values()) {
    if (c.invocations >= 5 && c.failureRate >= threshold) {
      alerts.push({
        level: c.failureRate >= 0.8 ? 'error' : 'warn',
        tool: c.tool,
        message: `Failure rate ${Math.round(c.failureRate * 100)}% (${c.failures}/${c.invocations})`,
        timestamp: now,
      });
    }
  }
  return alerts;
}

/** Compute overview stats. */
export function overview(calls: ToolCall[]): ToolStatsOverview {
  const totalCalls = calls.length;
  const totalFailures = calls.filter((c) => !c.success).length;
  const sessions = new Set(calls.map((c) => c.sessionId));
  const totalLatency = calls.reduce((s, c) => s + c.latencyMs, 0);
  return {
    totalCalls,
    totalFailures,
    overallFailureRate: totalCalls > 0 ? totalFailures / totalCalls : 0,
    activeSessions: sessions.size,
    avgLatencyMs: totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0,
  };
}
