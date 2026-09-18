/**
 * Pure rendering half of the toolStats page.
 *
 * Separate from `index.tsx` so a static render can assert in Node what the page draws —
 * the shipped bundle is a loader factory only a browser can run. Every user-visible
 * string comes from the `t` seat the renderer binds from this plugin's namespace, so the
 * page follows the UI language; no copy is hardcoded here.
 *
 * @module client/view
 */

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import type { PanelPayload } from '../types.js'

/** The translate seat the renderer binds from this plugin's locale namespace. */
export type Translate = (key: string, params?: Record<string, unknown>) => string

export interface PanelProps {
  /** Bound translate function for this plugin's namespace. */
  t: Translate
}

/** Panel route registered by the host half on the web connection. */
const PANEL_PATH = "/api/stats.panel"

const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760, fontFamily: 'inherit' }
const head: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }
const muted: CSSProperties = { fontSize: 12, opacity: 0.75 }
const table: CSSProperties = { borderCollapse: 'collapse', width: '100%' }
const th: CSSProperties = { textAlign: 'left', padding: '4px 10px 4px 0', fontWeight: 600, fontSize: 12, opacity: 0.8, borderBottom: '0.5px solid rgba(128,128,128,0.4)' }
const td: CSSProperties = { padding: '6px 10px 6px 0', fontSize: 13, borderBottom: '0.5px solid rgba(128,128,128,0.18)' }
const list: CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 13 }

interface PanelState {
  payload: PanelPayload | null
  error: string | null
}

/** Fetch the host panel payload; `reload` re-runs the request. */
export function usePanel(): PanelState & { reload: () => void } {
  const [state, setState] = useState<PanelState>({ payload: null, error: null })
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, error: null }))
    fetch(PANEL_PATH, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<PanelPayload>
      })
      .then((payload) => {
        if (!controller.signal.aborted) setState({ payload, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setState({ payload: null, error: cause instanceof Error ? cause.message : String(cause) })
      })
    return () => controller.abort()
  }, [tick])

  return { ...state, reload }
}

export function ToolStatsPanel({ t }: PanelProps) {
  const { payload, error, reload } = usePanel()
  const header = (
    <header style={head}>
      <strong style={{ fontSize: 13 }}>{t('title')}</strong>
      <span style={{ flex: 1 }} />
      <button type="button" onClick={reload} style={{ fontSize: 12 }}>{t('refresh')}</button>
    </header>
  )
  if (error !== null) {
    return (
      <div style={wrap}>
        {header}
        <p role="alert" style={{ margin: 0, fontSize: 13 }}>{t('failed')}: {error}</p>
        <button type="button" onClick={reload} style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('retry')}</button>
      </div>
    )
  }
  if (payload === null) return <p style={muted} aria-live="polite">{t('loading')}</p>
  return (
    <div style={wrap}>
      {header}
      {payload.tools.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{t('empty')}</p>
      ) : (
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>{t('tool')}</th><th style={th}>{t('calls')}</th>
              <th style={th}>{t('failRate')}</th><th style={th}>p50</th><th style={th}>p95</th>
            </tr>
          </thead>
          <tbody>
            {payload.tools.map((row) => (
              <tr key={row.tool}>
                <td style={td}><code style={{ fontSize: 11 }}>{row.tool}</code></td>
                <td style={td}>{row.invocations}</td>
                <td style={td}>{Math.round(row.failureRate * 100)}%</td>
                <td style={td}>{row.p50Latency}ms</td>
                <td style={td}>{row.p95Latency}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {payload.deadTools.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>{t('deadTools')}</strong>
          <ul style={list}>
            {payload.deadTools.map((row) => <li key={row.tool}><code style={{ fontSize: 11 }}>{row.tool}</code></li>)}
          </ul>
        </>
      )}
      {payload.failingTools.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>{t('failingTools')}</strong>
          <ul style={list}>
            {payload.failingTools.map((row) => (
              <li key={row.tool}><code style={{ fontSize: 11 }}>{row.tool}</code> · {Math.round(row.failureRate * 100)}%</li>
            ))}
          </ul>
        </>
      )}
      {payload.recommendations.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>{t('recommendations')}</strong>
          <ul style={list}>
            {payload.recommendations.map((row, index) => <li key={index}>{row.message}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}
