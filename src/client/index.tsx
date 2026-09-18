/**
 * Browser half of dsh-tool-stats: its page inside Settings.
 *
 * Two services are injected by their runtime identity, not by the packages that provide
 * them: the settings shell is `slots`, the dictionary registry is `locale`. The label and
 * every string inside the component are translated through this plugin's own namespace,
 * which is why the page follows the UI language instead of the plugin author's.
 *
 * @module client
 */

import type { ComponentType } from 'react'

import { NS, en, zh } from './locales.js'
import { ToolStatsPanel } from './view.js'

export const inject = ['slots', 'locale']

interface SlotsService {
  inject(name: string, register: () => void): void
  register(
    options: { name: string; id: string; order: number; label: () => string; locale: string },
    component: ComponentType<{ t: (key: string, params?: Record<string, unknown>) => string }>,
  ): unknown
}

interface ClientContext {
  slots: SlotsService
  locale: {
    register(ns: string, dicts: { zh: unknown; en: unknown }): () => void
    bind(ns: string): (key: string, params?: Record<string, unknown>) => string
  }
  effect(callback: () => unknown, label?: string): unknown
}

export function apply(ctx: ClientContext): void {
  // `zh` is the key-set source of truth, matching the official client plugins.
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-tool-stats: dictionaries')

  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'tool-stats',
      order: 43,
      label: () => ctx.locale.bind(NS)('nav'),
      locale: NS,
    },
    ToolStatsPanel,
  ))
}
