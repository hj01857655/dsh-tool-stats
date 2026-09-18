import type { PanelPayload } from '../types.js';
import { renderPanel } from './view.js';

export const inject = ['@deepseek-ai/dsh-client-ui-settings', '@deepseek-ai/dsh-client-connection'];

export function apply(ctx: {
  inject: (deps: string[], fn: (...services: unknown[]) => void) => void;
}): void {
  ctx.inject(inject, (settings: unknown, connection: unknown) => {
    const s = settings as { section: (id: string, opts: { title: string; render: () => Promise<string> | string }) => void };
    const c = connection as { fetch: (path: string) => Promise<Response> };
    s.section('tool-stats', {
      title: 'Tool Stats',
      render: async () => {
        const res = await c.fetch('/api/stats.panel');
        const payload: PanelPayload = await res.json();
        return renderPanel(payload);
      },
    });
  });
}
