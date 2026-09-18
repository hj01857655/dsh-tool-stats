import { StatsStore } from './store.js';
import { aggregate, findDeadTools, findFailingTools, recommend } from './analyzer.js';
import type { ToolCall, ToolCounter, PanelPayload } from './types.js';

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
    };
  }
}
