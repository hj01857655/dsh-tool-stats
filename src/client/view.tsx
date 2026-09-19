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

import type { PanelPayload, ToolDetail, Alert } from '../types.js'

export type Translate = (key: string, params?: Record<string, unknown>) => string

export interface PanelProps {
  t: Translate
}

const PANEL_PATH = '/api/stats.panel'
const DETAIL_PATH = '/api/stats.detail'
const EXPORT_PATH = '/api/stats.export'
const CLEAR_PATH = '/api/stats.clear'

const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, fontFamily: 'inherit' }
const head: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }
const muted: CSSProperties = { fontSize: 12, opacity: 0.75 }
const table: CSSProperties = { borderCollapse: 'collapse', width: '100%' }
const th: CSSProperties = { textAlign: 'left', padding: '4px 10px 4px 0', fontWeight: 600, fontSize: 12, opacity: 0.8, borderBottom: '0.5px solid rgba(128,128,128,0.4)' }
const td: CSSProperties = { padding: '6px 10px 6px 0', fontSize: 13, borderBottom: '0.5px solid rgba(128,128,128,0.18)' }
const list: CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 13 }
const card: CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(128,128,128,0.2)', fontSize: 13 }
const statBox: CSSProperties = { ...card, flex: 1, minWidth: 100, textAlign: 'center' as const }
const statRow: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap' }
const btn: CSSProperties = { fontSize: 12, cursor: 'pointer', padding: '3px 10px', borderRadius: 4, border: '0.5px solid rgba(128,128,128,0.4)' }
const dangerBtn: CSSProperties = { ...btn, color: '#e55', borderColor: '#e55' }
const alertCard: CSSProperties = { ...card, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }
const preBlock: CSSProperties = { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, maxHeight: 150, overflow: 'auto', padding: 6, borderRadius: 4, background: 'rgba(128,128,128,0.06)' }
const clickRow: CSSProperties = { cursor: 'pointer' }

interface PanelState {
  payload: PanelPayload | null
  error: string | null
}

export function usePanel(): PanelState & { reload: () => void } {
  const [state, setState] = useState<PanelState>({ payload: null, error: null })
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((v) => v + 1), [])
  useEffect(() => {
    const c = new AbortController()
    setState((p) => ({ ...p, error: null }))
    fetch(PANEL_PATH, { signal: c.signal })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<PanelPayload> })
      .then((payload) => { if (!c.signal.aborted) setState({ payload, error: null }) })
      .catch((e: unknown) => { if (!c.signal.aborted) setState({ payload: null, error: e instanceof Error ? e.message : String(e) }) })
    return () => c.abort()
  }, [tick])
  return { ...state, reload }
}

// --- Alert banner ---
function AlertBanner({ alerts, t }: { alerts: Alert[]; t: Translate }) {
  if (alerts.length === 0) return null
  return (
    <div>
      {alerts.map((a, i) => (
        <div key={i} style={{ ...alertCard, borderColor: a.level === 'error' ? '#e55' : '#ed0', background: a.level === 'error' ? 'rgba(255,80,80,0.06)' : 'rgba(255,200,0,0.06)' }}>
          <span style={{ fontSize: 16 }}>{a.level === 'error' ? '🔴' : '🟡'}</span>
          <span><strong>{a.tool}</strong>: {a.message}</span>
        </div>
      ))}
    </div>
  )
}

// --- Overview stats ---
function Overview({ payload, t }: { payload: PanelPayload; t: Translate }) {
  const o = payload.overview
  return (
    <div style={statRow}>
      <div style={statBox}><div style={{ fontSize: 18, fontWeight: 700 }}>{o.totalCalls}</div><div style={muted}>{t('totalCalls')}</div></div>
      <div style={statBox}><div style={{ fontSize: 18, fontWeight: 700, color: o.totalFailures > 0 ? '#e55' : undefined }}>{o.totalFailures}</div><div style={muted}>{t('totalFailures')}</div></div>
      <div style={statBox}><div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(o.overallFailureRate * 100)}%</div><div style={muted}>{t('failRate')}</div></div>
      <div style={statBox}><div style={{ fontSize: 18, fontWeight: 700 }}>{o.activeSessions}</div><div style={muted}>{t('sessions')}</div></div>
      <div style={statBox}><div style={{ fontSize: 18, fontWeight: 700 }}>{o.avgLatencyMs}ms</div><div style={muted}>{t('avgLatency')}</div></div>
    </div>
  )
}

// --- Tool detail expansion ---
function ToolDetailRow({ tool, t }: { tool: string; t: Translate }) {
  const [detail, setDetail] = useState<ToolDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(async () => {
    if (detail) { setDetail(null); return }
    setLoading(true)
    try {
      const r = await fetch(`${DETAIL_PATH}?tool=${encodeURIComponent(tool)}`)
      if (r.ok) setDetail(await r.json() as ToolDetail)
    } finally { setLoading(false) }
  }, [detail, tool])

  return (
    <>
      <tr style={clickRow} onClick={toggle}>
        <td style={td}>{loading ? '…' : detail ? '▼' : '▶'}</td>
      </tr>
      {detail && (
        <tr>
          <td colSpan={6} style={{ padding: '4px 0' }}>
            <div style={card}>
              {/* Error breakdown */}
              {detail.errorBreakdown.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 12 }}>{t('errorBreakdown')}</strong>
                  {detail.errorBreakdown.map((e, i) => (
                    <div key={i} style={{ ...preBlock, marginTop: 4 }}>
                      <span style={{ color: '#e55', fontWeight: 600 }}>×{e.count}</span> {e.message}
                    </div>
                  ))}
                </div>
              )}
              {/* Recent calls */}
              <strong style={{ fontSize: 12 }}>{t('recentCalls')}</strong>
              <table style={{ ...table, marginTop: 4 }}>
                <tbody>
                  {detail.recentCalls.slice(0, 10).map((c, i) => (
                    <tr key={i}>
                      <td style={td}>{c.success ? '✓' : '✗'}</td>
                      <td style={td}>{c.latencyMs}ms</td>
                      <td style={td}>{new Date(c.timestamp).toLocaleTimeString()}</td>
                      <td style={{ ...td, fontSize: 10, opacity: 0.7 }}>{c.errorMessage?.slice(0, 60)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function ToolStatsPanel({ t }: PanelProps) {
  const { payload, error, reload } = usePanel()

  const handleClear = useCallback(() => {
    if (!confirm(t('confirmClear'))) return
    fetch(CLEAR_PATH, { method: 'POST' }).then(() => reload()).catch(() => {})
  }, [t, reload])

  const header = (
    <header style={head}>
      <strong style={{ fontSize: 13 }}>{t('title')}</strong>
      <span style={{ flex: 1 }} />
      <a href={EXPORT_PATH} download style={{ ...btn, textDecoration: 'none', color: 'inherit' }}>{t('export')}</a>
      <button type="button" style={dangerBtn} onClick={handleClear}>{t('clear')}</button>
      <button type="button" style={btn} onClick={reload}>{t('refresh')}</button>
    </header>
  )

  if (error !== null) {
    return (
      <div style={wrap}>
        {header}
        <p role="alert" style={{ margin: 0, fontSize: 13 }}>{t('failed')}: {error}</p>
        <button type="button" onClick={reload} style={{ ...btn, alignSelf: 'flex-start' }}>{t('retry')}</button>
      </div>
    )
  }
  if (payload === null) return <p style={muted} aria-live="polite">{t('loading')}</p>

  return (
    <div style={wrap}>
      {header}

      {/* Alerts */}
      <AlertBanner alerts={payload.alerts} t={t} />

      {/* Overview */}
      <Overview payload={payload} t={t} />

      {/* Tool table */}
      {payload.tools.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{t('empty')}</p>
      ) : (
        <table style={table}>
          <thead>
            <tr>
              <th style={th} /><th style={th}>{t('tool')}</th><th style={th}>{t('calls')}</th>
              <th style={th}>{t('failRate')}</th><th style={th}>p50</th><th style={th}>p95</th>
            </tr>
          </thead>
          <tbody>
            {payload.tools.map((row) => (
              <>
                <tr key={row.tool} style={clickRow} onClick={() => {}}>
                  <td style={td}><ToolDetailRow tool={row.tool} t={t} /></td>
                  <td style={td}><code style={{ fontSize: 11 }}>{row.tool}</code></td>
                  <td style={td}>{row.invocations}</td>
                  <td style={{ ...td, color: row.failureRate > 0.3 ? '#e55' : undefined }}>{Math.round(row.failureRate * 100)}%</td>
                  <td style={td}>{row.p50Latency}ms</td>
                  <td style={td}>{row.p95Latency}ms</td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      )}

      {/* Dead tools */}
      {payload.deadTools.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>💀 {t('deadTools')}</strong>
          <ul style={list}>
            {payload.deadTools.map((row) => <li key={row.tool}><code style={{ fontSize: 11 }}>{row.tool}</code> — {row.sessionsSinceLastUse} {t('sessionsUnused')}</li>)}
          </ul>
        </>
      )}

      {/* Failing tools */}
      {payload.failingTools.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>⚠️ {t('failingTools')}</strong>
          <ul style={list}>
            {payload.failingTools.map((row) => (
              <li key={row.tool}><code style={{ fontSize: 11 }}>{row.tool}</code> · {Math.round(row.failureRate * 100)}%{row.lastError ? ` — ${row.lastError.slice(0, 60)}` : ''}</li>
            ))}
          </ul>
        </>
      )}

      {/* Recommendations */}
      {payload.recommendations.length > 0 && (
        <>
          <strong style={{ fontSize: 13 }}>💡 {t('recommendations')}</strong>
          <ul style={list}>
            {payload.recommendations.map((row, i) => <li key={i}>{row.message}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}
