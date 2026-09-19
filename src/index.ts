import { resolve } from 'node:path';
import type { Context } from '@deepseek-ai/cordis';
import { ToolStats } from './stats.js';
import { registerStatsRoutes } from './routes.js';

export const name = 'dsh-tool-stats';

export interface StatsService {
  record(call: { tool: string; timestamp: number; success: boolean; latencyMs: number; sessionId: string; errorMessage?: string }): void;
  summary(configuredTools?: string[]): ReturnType<ToolStats['summary']>;
  query(range?: { from?: number | undefined; to?: number | undefined }, configuredTools?: string[]): ReturnType<ToolStats['summary']>;
  detail(toolName: string): ReturnType<ToolStats['detail']>;
  exportCSV(): string;
  clearData(): void;
}

export function apply(ctx: Context): void {
  const root = resolve(process.cwd());
  const stats = new ToolStats(root);

  const service = {
    record: (call: Parameters<StatsService['record']>[0]) => stats.record(call),
    summary: (configuredTools?: string[]) => stats.summary(configuredTools ?? []),
    query: (range?: { from?: number; to?: number }, configuredTools?: string[]) => stats.query(range, configuredTools ?? []),
    detail: (toolName: string) => stats.detail(toolName),
    exportCSV: () => stats.exportCSV(),
    clearData: () => stats.clearData(),
  } satisfies StatsService;

  ctx.provide('toolStats', service);
  registerStatsRoutes(ctx, service);
}
