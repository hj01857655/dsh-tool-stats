/**
 * Guards the panel's host-theme token names.
 *
 * ui.tsx used to read invented custom properties — `--accent`, `--border`,
 * `--bg-primary`, `--text-primary` and friends. dsh defines none of them, so the
 * hardcoded fallbacks applied in every theme: each panel rendered its own fixed
 * palette instead of following the host, and the modal and input surfaces stayed
 * white in dark mode.
 *
 * This test fails if an unverified name reappears, or if a token is read with a
 * hardcoded fallback — the fallback is what made the mistake invisible.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'src', 'client', 'ui.tsx'), 'utf8')

/** Custom properties confirmed present in dsh's shipped stylesheets. */
const VERIFIED = new Set([
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-mask-1',
  '--dsw-alias-border-l2',
  '--dsw-alias-brand-primary',
  '--dsw-alias-button-primary-hover',
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-primary-inverted',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-state-business-tertiary',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-error-secondary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-success-tertiary',
  '--dsw-alias-state-warn-primary',
  '--dsw-alias-state-warn-tertiary',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
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

test('every custom property read by ui.tsx is a verified dsh token', () => {
  const unverified = variableNames(source).filter((n) => !VERIFIED.has(n))
  assert.deepEqual(
    unverified, [],
    `unverified custom properties in ui.tsx: ${unverified.join(', ')}`,
  )
})

test('no invented token name comes back', () => {
  const present = variableNames(source).filter((n) => INVENTED.includes(n))
  assert.deepEqual(present, [], `invented tokens reappeared: ${present.join(', ')}`)
})

test('no token is read with a hardcoded fallback', () => {
  const offenders = []
  for (const match of source.matchAll(/var\(\s*(--[\w-]+)\s*,/g)) {
    offenders.push(match[1])
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
