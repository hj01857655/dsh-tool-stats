/**
 * Pure rendering half of the toolStats page. Uses shared UI kit.
 * @module client/view
 */

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'

import type { PanelPayload, ToolDetail } from '../types.js'
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Modal, SectionTitle,
  Spinner, StatCard, ToastProvider, tableStyles, usePanel, useToast,
} from './ui.js'

export type Translate = (key: string, params?: Record<string, unknown>) => string
export interface PanelProps { t: Translate }

const PANEL_PATH = '/api/stats.panel'
const DETAIL_PATH = '/api/stats.detail'
const EXPORT_PATH = '/api/stats.export'
const CLEAR_PATH = '/api/stats.clear'

function ToolModal({ tool, t, onClose }: { tool: string; t: Translate; onClose: () => void }): ReactNode {
  const [detail, setDetail] = useState<ToolDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useCallback(() => {
    setLoading(true)
    fetch(`${DETAIL_PATH}?tool=${encodeURIComponent(tool)}`)
      .then(async (r) => { if (r.ok) setDetail(await r.json() as ToolDetail) })
      .finally(() => setLoading(false))
  }, [tool])()

  return (
    <Modal title={`${t('tool')}: ${tool}`} onClose={onClose} width={600}>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={24} /></div>
        : detail === null ? <EmptyState message={t('notFound')} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {detail.errorBreakdown.length > 0 && (
              <Card title={t('errorBreakdown')}>
                {detail.errorBreakdown.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <Badge color="error">×{e.count}</Badge>
                    <span style={{ fontSize: 12 }}>{e.message}</span>
                  </div>
                ))}
              </Card>
            )}
            <Card title={t('recentCalls')}>
              <table style={tableStyles.table}>
                <tbody>
                  {detail.recentCalls.slice(0, 15).map((c, i) => (
                    <tr key={i}>
                      <td style={tableStyles.td}>{c.success ? <Badge color="success">✓</Badge> : <Badge color="error">✗</Badge>}</td>
                      <td style={tableStyles.td}>{c.latencyMs}ms</td>
                      <td style={tableStyles.td}>{new Date(c.timestamp).toLocaleTimeString()}</td>
                      <td style={{ ...tableStyles.td, fontSize: 10, opacity: 0.6 }}>{c.errorMessage?.slice(0, 60)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
    </Modal>
  )
}

function ToolStatsPanelInner({ t }: PanelProps): ReactNode {
  const { payload, error, reload } = usePanel<PanelPayload>(PANEL_PATH)
  const toast = useToast()
  const [toolModal, setToolModal] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = useCallback(async () => {
    const r = await fetch(CLEAR_PATH, { method: 'POST' })
    if (r.ok) { toast('success', t('cleared')); reload() }
  }, [t, toast, reload])

  const header = (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
      <strong style={{ fontSize: 15 }}>🔧 {t('title')}</strong>
      <span style={{ flex: 1 }} />
      <a href={EXPORT_PATH} download><Button variant="secondary" size="sm">{t('export')}</Button></a>
      <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>{t('clear')}</Button>
      <Button variant="secondary" size="sm" onClick={reload}>{t('refresh')}</Button>
    </header>
  )

  if (error !== null) return <div style={{ maxWidth: 820 }}>{header}<Card><p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--error, #e53935)' }}>{t('failed')}: {error}</p></Card></div>
  if (payload === null) return <div style={{ maxWidth: 820 }}>{header}<div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div></div>

  const o = payload.overview
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
      {header}

      {payload.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {payload.alerts.map((a, i) => (
            <Card key={i} style={{ borderColor: a.level === 'error' ? 'var(--error, #e53935)' : 'var(--warning, #ed6c02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={a.level === 'error' ? 'error' : 'warning'}>{a.level === 'error' ? '🔴' : '🟡'}</Badge>
                <strong>{a.tool}</strong><span style={{ fontSize: 12 }}>{a.message}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard value={o.totalCalls} label={t('totalCalls')} />
        <StatCard value={o.totalFailures} label={t('totalFailures')} color={o.totalFailures > 0 ? 'var(--error, #e53935)' : undefined as unknown as string} />
        <StatCard value={`${Math.round(o.overallFailureRate * 100)}%`} label={t('failRate')} />
        <StatCard value={o.activeSessions} label={t('sessions')} />
        <StatCard value={o.avgLatencyMs} unit="ms" label={t('avgLatency')} />
      </div>

      {payload.tools.length === 0 ? <EmptyState icon="📭" message={t('empty')} /> : (
        <>
          <SectionTitle icon="📊">{t('tools')}</SectionTitle>
          <Card padding={0}>
            <table style={tableStyles.table}>
              <thead><tr><th style={tableStyles.th}>{t('tool')}</th><th style={tableStyles.th}>{t('calls')}</th><th style={tableStyles.th}>{t('failRate')}</th><th style={tableStyles.th}>p50</th><th style={tableStyles.th}>p95</th></tr></thead>
              <tbody>
                {payload.tools.map((row) => (
                  <tr key={row.tool} style={tableStyles.clickRow} onClick={() => setToolModal(row.tool)}>
                    <td style={tableStyles.td}><code style={{ fontSize: 11 }}>{row.tool}</code></td>
                    <td style={tableStyles.td}>{row.invocations}</td>
                    <td style={{ ...tableStyles.td, color: row.failureRate > 0.3 ? 'var(--error, #e53935)' : undefined }}>{Math.round(row.failureRate * 100)}%</td>
                    <td style={tableStyles.td}>{row.p50Latency}ms</td>
                    <td style={tableStyles.td}>{row.p95Latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {payload.deadTools.length > 0 && (
        <>
          <SectionTitle icon="💀">{t('deadTools')}</SectionTitle>
          <Card>{payload.deadTools.map((row) => (
            <div key={row.tool} style={{ marginBottom: 4 }}><code style={{ fontSize: 11 }}>{row.tool}</code> — {row.sessionsSinceLastUse} {t('sessionsUnused')}</div>
          ))}</Card>
        </>
      )}

      {payload.failingTools.length > 0 && (
        <>
          <SectionTitle icon="⚠️">{t('failingTools')}</SectionTitle>
          <Card>{payload.failingTools.map((row) => (
            <div key={row.tool} style={{ marginBottom: 4 }}><code style={{ fontSize: 11 }}>{row.tool}</code> · {Math.round(row.failureRate * 100)}%{row.lastError ? ` — ${row.lastError.slice(0, 60)}` : ''}</div>
          ))}</Card>
        </>
      )}

      {payload.recommendations.length > 0 && (
        <>
          <SectionTitle icon="💡">{t('recommendations')}</SectionTitle>
          <Card>{payload.recommendations.map((row, i) => <div key={i} style={{ marginBottom: 4 }}>{row.message}</div>)}</Card>
        </>
      )}

      {toolModal !== null && <ToolModal tool={toolModal} t={t} onClose={() => setToolModal(null)} />}
      {confirmClear && <ConfirmDialog title={t('clear')} message={t('confirmClear')} confirmLabel={t('clear')} danger onConfirm={handleClear} onClose={() => setConfirmClear(false)} />}
    </div>
  )
}

export function ToolStatsPanel({ t }: PanelProps): ReactNode {
  return <ToastProvider><ToolStatsPanelInner t={t} /></ToastProvider>
}
