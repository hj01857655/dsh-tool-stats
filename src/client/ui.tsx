/**
 * Shared UI component kit for dsh plugin panels.
 *
 * Self-contained: imports nothing but React. All styling is inline + CSS custom
 * properties so the components follow the host theme. A single <style> tag injects
 * keyframes the first time any component mounts.
 *
 * @module client/ui
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

// ─── Theme tokens ──────────────────────────────────────────────
const T = {
  accent: 'var(--accent, #4B8BBE)',
  accentHover: 'var(--accent-hover, #3a6f9e)',
  error: 'var(--error, #e53935)',
  success: 'var(--success, #2e7d32)',
  warning: 'var(--warning, #ed6c02)',
  bg: 'var(--bg-secondary, rgba(128,128,128,0.04))',
  bgHover: 'var(--bg-tertiary, rgba(128,128,128,0.08))',
  border: 'var(--border, rgba(128,128,128,0.2))',
  text: 'var(--text-primary, inherit)',
  muted: 'var(--text-secondary, rgba(128,128,128,0.65))',
  surface: 'var(--bg-primary, #fff)',
}

// ─── Style injection (once) ────────────────────────────────────
let injected = false
function ensureStyles(): void {
  if (injected || typeof document === 'undefined') return
  injected = true
  const el = document.createElement('style')
  el.textContent = `
@keyframes dsh-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dsh-slide-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes dsh-spin{to{transform:rotate(360deg)}}
.dsh-modal-overlay{animation:dsh-fade-in .15s ease}
.dsh-modal-body{animation:dsh-slide-up .2s ease}
.dsh-toast{animation:dsh-slide-up .2s ease}
.dsh-spin{animation:dsh-spin .6s linear infinite}
  `
  document.head.appendChild(el)
}

// ─── Modal ─────────────────────────────────────────────────────
export function Modal({
  title,
  onClose,
  children,
  footer,
  width = 520,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}): ReactNode {
  useEffect(() => {
    ensureStyles()
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="dsh-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="dsh-modal-body"
        style={{
          background: T.surface,
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          width: `min(92vw, ${width}px)`,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: T.muted,
              padding: '0 4px',
              lineHeight: 1,
              borderRadius: 4,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ padding: 22, overflow: 'auto', flex: 1 }}>{children}</div>
        {footer !== undefined && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: T.bg,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ConfirmDialog ─────────────────────────────────────────────
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  danger,
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}): ReactNode {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger === true ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}

// ─── Button ────────────────────────────────────────────────────
export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  style,
  ...rest
}: {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
  style?: CSSProperties
} & ButtonHTMLAttributes<HTMLButtonElement>): ReactNode {
  const base: CSSProperties = {
    cursor: 'pointer',
    borderRadius: 7,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '5px 12px' : '8px 18px',
    fontFamily: 'inherit',
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: T.accent, color: '#fff' },
    secondary: {
      background: T.bg,
      color: T.text,
      border: `1px solid ${T.border}`,
    },
    danger: {
      background: 'transparent',
      color: T.error,
      border: `1px solid ${T.error}`,
    },
    ghost: { background: 'transparent', color: T.muted, border: 'none' },
  }
  return (
    <button type="button" style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  )
}

// ─── Card ──────────────────────────────────────────────────────
export function Card({
  title,
  icon,
  children,
  actions,
  style,
  padding = 14,
}: {
  title?: string
  icon?: string
  children: ReactNode
  actions?: ReactNode
  style?: CSSProperties
  padding?: number
}): ReactNode {
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.bg,
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title !== undefined || actions !== undefined) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: title !== undefined ? `1px solid ${T.border}` : 'none',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon !== undefined && <span>{icon}</span>}
            {title}
          </span>
          {actions}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  )
}

// ─── StatCard ──────────────────────────────────────────────────
export function StatCard({
  value,
  label,
  color,
  unit,
}: {
  value: string | number
  label: string
  color?: string
  unit?: string
}): ReactNode {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 90,
        textAlign: 'center',
        padding: '14px 10px',
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.bg,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? T.text, lineHeight: 1.2 }}>
        {value}
        {unit !== undefined && (
          <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginLeft: 2 }}>{unit}</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── Badge ─────────────────────────────────────────────────────
export function Badge({
  children,
  color = 'default',
}: {
  children: ReactNode
  color?: 'default' | 'success' | 'error' | 'warning' | 'info'
}): ReactNode {
  const colors: Record<string, { bg: string; fg: string }> = {
    default: { bg: 'rgba(128,128,128,0.12)', fg: T.muted },
    success: { bg: 'rgba(46,125,50,0.12)', fg: T.success },
    error: { bg: 'rgba(229,57,53,0.12)', fg: T.error },
    warning: { bg: 'rgba(245,124,0,0.12)', fg: T.warning },
    info: { bg: 'rgba(75,139,190,0.12)', fg: T.accent },
  }
  const c = colors[color]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 9px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
      }}
    >
      {children}
    </span>
  )
}

// ─── Input ─────────────────────────────────────────────────────
export function Input({
  style,
  ...rest
}: { style?: CSSProperties } & InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <input
      {...rest}
      style={{
        fontSize: 13,
        padding: '8px 12px',
        borderRadius: 7,
        border: `1px solid ${T.border}`,
        background: T.surface,
        color: T.text,
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
    />
  )
}

// ─── Select ────────────────────────────────────────────────────
export function Select({
  style,
  children,
  ...rest
}: {
  style?: CSSProperties
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return (
    <select
      {...rest}
      style={{
        fontSize: 13,
        padding: '8px 12px',
        borderRadius: 7,
        border: `1px solid ${T.border}`,
        background: T.surface,
        color: T.text,
        cursor: 'pointer',
        fontFamily: 'inherit',
        outline: 'none',
        ...style,
      }}
    >
      {children}
    </select>
  )
}

// ─── Textarea ──────────────────────────────────────────────────
export function Textarea({
  style,
  ...rest
}: { style?: CSSProperties } & React.TextareaHTMLAttributes<HTMLTextAreaElement>): ReactNode {
  return (
    <textarea
      {...rest}
      style={{
        fontSize: 13,
        padding: '8px 12px',
        borderRadius: 7,
        border: `1px solid ${T.border}`,
        background: T.surface,
        color: T.text,
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'vertical',
        lineHeight: 1.5,
        ...style,
      }}
    />
  )
}

// ─── Toast ─────────────────────────────────────────────────────
interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const ToastContext = createContext<(type: ToastItem['type'], message: string) => void>(
  () => {},
)

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = useCallback((type: ToastItem['type'], message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="dsh-toast"
              style={{
                padding: '12px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                color: '#fff',
                background:
                  t.type === 'success'
                    ? T.success
                    : t.type === 'error'
                      ? T.error
                      : T.accent,
                maxWidth: 360,
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): (type: ToastItem['type'], message: string) => void {
  return useContext(ToastContext)
}

// ─── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }): ReactNode {
  ensureStyles()
  return (
    <span
      className="dsh-spin"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${T.border}`,
        borderTopColor: T.accent,
        borderRadius: '50%',
      }}
    />
  )
}

// ─── EmptyState ────────────────────────────────────────────────
export function EmptyState({
  icon,
  message,
}: {
  icon?: string
  message: string
}): ReactNode {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '36px 16px',
        color: T.muted,
      }}
    >
      {icon !== undefined && (
        <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>{icon}</div>
      )}
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

// ─── SectionTitle ──────────────────────────────────────────────
export function SectionTitle({
  icon,
  children,
  actions,
}: {
  icon?: string
  children: ReactNode
  actions?: ReactNode
}): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {icon !== undefined && <span>{icon}</span>}
        {children}
      </span>
      {actions}
    </div>
  )
}

// ─── Table helpers ─────────────────────────────────────────────
export const tableStyles = {
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px 8px 0',
    fontWeight: 600 as const,
    fontSize: 12 as const,
    color: T.muted,
    borderBottom: `1px solid ${T.border}`,
  },
  td: {
    padding: '8px 12px 8px 0',
    fontSize: 13 as const,
    borderBottom: '1px solid rgba(128,128,128,0.08)',
  },
  clickRow: { cursor: 'pointer' as const },
}

// ─── CodeBlock ─────────────────────────────────────────────────
export function CodeBlock({
  children,
  maxHeight = 200,
  style,
}: {
  children: string
  maxHeight?: number
  style?: CSSProperties
}): ReactNode {
  return (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 12,
        maxHeight,
        overflow: 'auto',
        padding: 10,
        borderRadius: 7,
        background: 'rgba(128,128,128,0.06)',
        border: `1px solid ${T.border}`,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </pre>
  )
}

// ─── ProgressBar ───────────────────────────────────────────────
export function ProgressBar({
  pct,
  color,
  height = 18,
}: {
  pct: number
  color?: string
  height?: number
}): ReactNode {
  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'rgba(128,128,128,0.12)',
        borderRadius: 5,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: '100%',
          background: color ?? T.accent,
          borderRadius: 5,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

// ─── Field label ───────────────────────────────────────────────
export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</label>
      {children}
      {hint !== undefined && (
        <span style={{ fontSize: 11, color: T.muted }}>{hint}</span>
      )}
    </div>
  )
}

// ─── usePanel hook (shared fetch logic) ────────────────────────
export function usePanel<P>(path: string): {
  payload: P | null
  error: string | null
  reload: () => void
} {
  const [payload, setPayload] = useState<P | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    const c = new AbortController()
    setError(null)
    fetch(path, { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<P>
      })
      .then((p) => {
        if (!c.signal.aborted) setPayload(p)
      })
      .catch((e: unknown) => {
        if (!c.signal.aborted) setPayload(null), setError(e instanceof Error ? e.message : String(e))
      })
    return () => c.abort()
  }, [tick, path])

  return useMemo(() => ({ payload, error, reload }), [payload, error, reload])
}
