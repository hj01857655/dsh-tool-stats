import type { Context } from '@deepseek-ai/cordis';
import type { StatsService } from './index.js';
import { STATS_PANEL_PATH } from './stats.js';

export { STATS_PANEL_PATH };
export const STATS_DETAIL_PATH = '/api/stats.detail';
export const STATS_EXPORT_PATH = '/api/stats.export';
export const STATS_CLEAR_PATH = '/api/stats.clear';

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

    // Panel overview
    connection.fetch.register({
      path: STATS_PANEL_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: (req) => {
        const url = new URL(req.url, 'http://localhost');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const range = (from || to) ? { from: from ? Number(from) : undefined, to: to ? Number(to) : undefined } : undefined;
        return Promise.resolve(Response.json(range ? stats.query(range) : stats.summary(), {
          headers: { 'cache-control': 'no-store' },
        }));
      },
    });

    // Tool detail
    connection.fetch.register({
      path: STATS_DETAIL_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: (req) => {
        const url = new URL(req.url, 'http://localhost');
        const tool = url.searchParams.get('tool');
        if (!tool) return Promise.resolve(Response.json({ error: 'tool required' }, { status: 400 }));
        const detail = stats.detail(tool);
        if (!detail) return Promise.resolve(Response.json({ error: 'not found' }, { status: 404 }));
        return Promise.resolve(Response.json(detail, { headers: { 'cache-control': 'no-store' } }));
      },
    });

    // Export CSV
    connection.fetch.register({
      path: STATS_EXPORT_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: () => {
        const csv = stats.exportCSV();
        return Promise.resolve(new Response(csv, {
          headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename=tool-stats.csv' },
        }));
      },
    });

    // Clear data
    connection.fetch.register({
      path: STATS_CLEAR_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: () => {
        stats.clearData();
        return Promise.resolve(Response.json({ ok: true }));
      },
    });
  });
}
