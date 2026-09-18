import { resolve } from 'node:path';
import type { Context } from '@deepseek-ai/cordis';
import { ToolStats } from './stats.js';
import { registerStatsRoutes } from './routes.js';

export const name = 'dsh-tool-stats';

export interface StatsService {
  record(call: { tool: string; timestamp: number; success: boolean; latencyMs: number; sessionId: string; errorMessage?: string }): void;
  summary(configuredTools?: string[]): ReturnType<ToolStats['summary']>;
}

export function apply(ctx: Context): void {
  const root = resolve(process.cwd());
  const stats = new ToolStats(root);

  const service = {
    record: (call: Parameters<StatsService['record']>[0]) => stats.record(call),
    summary: (configuredTools?: string[]) => stats.summary(configuredTools ?? []),
  } satisfies StatsService;

  ctx.provide('toolStats', service);
  registerStatsRoutes(ctx, service);
}
