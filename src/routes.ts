import type { Context } from '@deepseek-ai/cordis';
import type { StatsService } from './index.js';
import { STATS_PANEL_PATH } from './stats.js';

export { STATS_PANEL_PATH };

interface FetchRegistrar {
  fetch: {
    register(route: {
      path: string;
      methods: readonly string[];
      requestBody: string;
      fetch: (request: Request) => Promise<Response>;
    }): void;
  };
}

export function registerStatsRoutes(ctx: Context, stats: StatsService): void {
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = (connectionCtx as unknown as { connection: FetchRegistrar }).connection;
    connection.fetch.register({
      path: STATS_PANEL_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: () => Promise.resolve(Response.json(stats.summary(), {
        headers: { 'cache-control': 'no-store' },
      })),
    });
  });
}
