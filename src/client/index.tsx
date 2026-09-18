/**
 * Browser half of dsh-tool-stats: the Tool Stats page inside Settings.
 *
 * Services are named by their runtime identity, not by the package that provides them:
 * the settings shell is the `slots` service and the host bridge is `connection`. A
 * fiber that injects package names never resolves and the plugin stays pending, which
 * the loader reports as "did not activate".
 *
 * @module client
 */

import { useCallback, useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import type { PanelPayload } from '../types.js'
import { renderPanel } from './view.js'

/** Path the host half registers on the web connection. */
const PANEL_PATH = '/api/stats.panel'

interface SlotsService {
  inject(name: string, register: () => void): void
  register(options: { name: string; id: string; order: number; label: () => string }, component: ComponentType): unknown
}

/** Fetch the panel payload; `reload` re-runs the request. */
function usePanel() {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetch(PANEL_PATH, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`panel request failed with ${response.status}`)
        return response.json() as Promise<PanelPayload>
      })
      .then((payload) => {
        if (!controller.signal.aborted) setHtml(renderPanel(payload))
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        // Say what failed rather than rendering an empty panel, which would read as
        // "nothing recorded" — a different and wrong answer.
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => controller.abort()
  }, [tick])

  return { html, error, reload }
}

function ToolStatsPage() {
  const { html, error, reload } = usePanel()
  if (error !== null) {
    return (
      <section>
        <p role="alert">Tool Stats panel failed to load: {error}</p>
        <button type="button" onClick={reload}>Retry</button>
      </section>
    )
  }
  if (html === null) return <p aria-live="polite">Loading the Tool Stats panel…</p>
  // The markup is produced by `renderPanel`, which escapes every interpolated value.
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

/** The slots service is what the settings shell exposes. */
export const inject = ['slots']

export function apply(ctx: { slots: SlotsService }): void {
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'tool-stats',
      order: 43,
      label: () => 'Tool Stats',
    },
    ToolStatsPage,
  ))
}
