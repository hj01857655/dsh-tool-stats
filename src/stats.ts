import { StatsStore } from './store.js';
import { aggregate, findDeadTools, findFailingTools, recommend, toolDetail, generateAlerts, overview } from './analyzer.js';
import type { ToolCall, ToolCounter, PanelPayload, ToolDetail, TimeRange } from './types.js';

export const STATS_PANEL_PATH = '/api/stats.panel'

export class ToolStats {
  private store: StatsStore;

  constructor(private projectDir: string) {
    this.store = new StatsStore(projectDir);
  }

  record(call: ToolCall): void {
    this.store.append(call);
  }

  summary(configuredTools: string[] = []): PanelPayload {
    const calls = this.store.readAll();
    const counters = aggregate(calls);
    const tools = [...counters.values()].sort((a, b) => b.invocations - a.invocations);
    return {
      tools,
      deadTools: findDeadTools(configuredTools, calls),
      failingTools: findFailingTools(calls),
      recommendations: recommend(configuredTools, calls),
      overview: overview(calls),
      alerts: generateAlerts(calls),
    };
  }

  /** Query calls with optional time range. */
  query(range?: TimeRange, configuredTools: string[] = []): PanelPayload {
    const calls = this.store.query(range?.from, range?.to);
    const counters = aggregate(calls);
    const tools = [...counters.values()].sort((a, b) => b.invocations - a.invocations);
    return {
      tools,
      deadTools: findDeadTools(configuredTools, calls),
      failingTools: findFailingTools(calls),
      recommendations: recommend(configuredTools, calls),
      overview: overview(calls),
      alerts: generateAlerts(calls),
    };
  }

  /** Get detailed stats for one tool. */
  detail(toolName: string): ToolDetail | null {
    const calls = this.store.readAll();
    return toolDetail(calls, toolName);
  }

  /** Export all calls as CSV. */
  exportCSV(): string {
    const calls = this.store.readAll();
    const header = 'tool,timestamp,success,latencyMs,sessionId,errorMessage';
    const rows = calls.map((c) =>
      [c.tool, c.timestamp, c.success, c.latencyMs, c.sessionId, c.errorMessage ?? ''].join(',')
    );
    return [header, ...rows].join('\n');
  }

  /** Clear all recorded data. */
  clearData(): void {
    this.store.clear();
  }
}
