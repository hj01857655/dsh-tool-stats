/**
 * Guards the panel's host-theme token names, across the whole client half.
 *
 * An earlier version of this guard only read `ui.tsx`, so the invented tokens
 * in `view.tsx` — `--error`, `--warning`, `--success`, `--accent` — sailed past
 * it. dsh defines none of those, so their hardcoded fallbacks applied in every
 * theme and the panels rendered fixed colors instead of following the host.
 *
 * This version scans every `.ts`/`.tsx` file under `src/client/` and fails on:
 *   - a custom property that is not a real dsh token
 *   - any of the known invented names coming back
 *   - a `var(--token, fallback)` hardcoded fallback, which hides a missing token
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const clientDir = join(here, '..', 'src', 'client')

const sources = readdirSync(clientDir)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .map((f) => ({ file: f, text: readFileSync(join(clientDir, f), 'utf8') }))

/** Custom properties confirmed present in dsh's shipped stylesheets. */
const VERIFIED = new Set([
  '--dsh-content-font-size',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-mask-1',
  '--dsw-alias-border-l2',
  '--dsw-alias-brand-primary',
  '--dsw-alias-button-primary-fill',
  '--dsw-alias-button-primary-hover',
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-hover-accent',
  '--dsw-alias-label-dimmed',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-primary-inverted',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-link',
  '--dsw-alias-state-business-primary',
  '--dsw-alias-state-business-tertiary',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-error-secondary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-success-tertiary',
  '--dsw-alias-state-warn-primary',
  '--dsw-alias-state-warn-tertiary',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-font-family',
  '--dsw-font-mono',
])

/** Names an earlier version invented; they must never come back. */
const INVENTED = [
  '--accent',
  '--accent-hover',
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--text-primary',
  '--text-secondary',
  '--border',
  '--error',
  '--success',
  '--warning',
]

function variableNames(text) {
  return [...new Set([...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].sort()
}

test('the guard actually sees the client sources', () => {
  assert.ok(sources.length > 0, 'no .ts/.tsx found under src/client')
  assert.ok(
    sources.some((s) => s.file === 'view.tsx'),
    'view.tsx is not being scanned — the gap that let --error through',
  )
})

test('every custom property read by the client half is a verified dsh token', () => {
  const unverified = []
  for (const { file, text } of sources) {
    for (const name of variableNames(text)) {
      if (!VERIFIED.has(name)) unverified.push(`${file}:${name}`)
    }
  }
  assert.deepEqual(unverified, [], `unverified custom properties: ${unverified.join(', ')}`)
})

test('no invented token name comes back', () => {
  const present = []
  for (const { file, text } of sources) {
    for (const name of variableNames(text)) {
      if (INVENTED.includes(name)) present.push(`${file}:${name}`)
    }
  }
  assert.deepEqual(present, [], `invented tokens reappeared: ${present.join(', ')}`)
})

test('no token is read with a hardcoded fallback', () => {
  const offenders = []
  for (const { file, text } of sources) {
    for (const match of text.matchAll(/var\(\s*(--[\w-]+)\s*,/g)) {
      offenders.push(`${file}:${match[1]}`)
    }
  }
  assert.deepEqual(
    offenders, [],
    `these tokens carry a hardcoded fallback, which hides a missing token: ${offenders.join(', ')}`,
  )
})

test('every verified name is in a dsh namespace', () => {
  for (const name of VERIFIED) {
    assert.ok(
      name.startsWith('--dsw-') || name.startsWith('--dsh-'),
      `${name} is not in a dsh namespace`,
    )
  }
})
