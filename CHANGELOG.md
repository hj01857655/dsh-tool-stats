# Changelog

## 0.5.1

**Fixed: the previous release only covered `ui.tsx`.**

The 0.5.0 fix replaced the invented tokens in `ui.tsx` but missed
`view.tsx`, which still read `--error`, `--warning`, `--success` and
`--accent` with hardcoded fallbacks. dsh defines none of those, so the
fallbacks applied in every theme.

Fixed here, 17 sites across the seven plugin panels:

- `var(--error, #e53935)` → `var(--dsw-alias-state-error-primary)`
- `var(--warning, #ed6c02)` → `var(--dsw-alias-state-warn-primary)`
- `var(--success, #2e7d32)` → `var(--dsw-alias-state-success-primary)`
- `var(--accent, #4B8BBE)` → `var(--dsw-alias-brand-primary)`

Also replaced literal colours in the same files (alert card tints, dimmed text,
code-block background) with the matching dsh tokens.

The guard test now scans **every `.ts`/`.tsx` under `src/client/`** instead of
only `ui.tsx` — that narrow scope is exactly how these 17 sites slipped through.
An added assertion fails if `view.tsx` stops being scanned.

## 0.5.0

**Fixed: panels did not follow the host theme.**

ui.tsx read invented custom properties — `--accent`, `--border`, `--bg-primary`,
`--text-primary` and friends. dsh defines none of them, so the hardcoded
fallbacks applied in every theme: each panel rendered its own fixed palette
instead of following the host.

The visible symptom was `surface: 'var(--bg-primary, #fff)'` on the modal,
input, select and textarea backgrounds — **white panels in dark mode**, with text
in the host's near-white label color.

Every name is now a real dsh token, pinned in `tests/ui-tokens.test.mjs`:

- accent → `--dsw-alias-brand-primary`
- surfaces → `--dsw-alias-bg-layer-1` / `-2`
- border → `--dsw-alias-border-l2`
- text / muted → `--dsw-alias-label-primary` / `--dsw-alias-label-tertiary`
- state colors → `--dsw-alias-state-*-primary` with `-tertiary` / `-secondary` tints
- modal scrim → `--dsw-alias-bg-mask-1`
- shadows → `--dsw-elevation-panel` / `--dsw-elevation-prominent`

`#fff` on the primary button became `--dsw-alias-label-primary-inverted`: dsh's
brand color is near-black in light mode and near-white in dark, so the literal
white would have disappeared against the fill.

Fallbacks are gone on purpose. If a token were ever missing, the declaration
becomes invalid at computed-value time and the property inherits, which degrades
gracefully — a hardcoded fallback instead bakes in a color that is wrong in one
of the two themes. The guard test fails on any fallback for exactly that reason.

## 0.2.0

Ecosystem sync: every plugin in this suite shares one version, so a version number
identifies a set that was tested together rather than one plugin's own history.

- Fix the Model Arena panel rendering "Cannot read properties of undefined": the host
  route returned the bare run list while the view reads `payload.recentRuns`.
- The client `inject` field now names services (`slots`, `connection`) instead of the
  packages that provide them.
- README badges cover version, downloads, CI, license, Node requirement, stars, and the
  dsh plugin topic.

## 0.1.4

- **Fix the client half never activating.** The browser half declared package names
  (`@deepseek-ai/dsh-client-ui-settings`) as cordis services, but services are named by
  their runtime identity — the settings shell is `slots`, the host bridge is
  `connection`. The fiber therefore never resolved and the plugin stayed pending, which
  the loader reported as "did not activate". It now injects `slots` and registers into
  the `settings.section` slot the way the official client artifacts do.

## 0.1.3

- **Fix the browser half never registering.** The client bundle was emitted as plain ESM
  with `react` external, which prints a top-level `import` — invalid inside the loader's
  concatenated script bundle, so evaluation aborted and every module after it failed with
  "...loaded without registering ... via __ModuleLoader__.load". The bundle is now emitted
  in the loader's lazy-CJS factory form (`window.__ModuleLoader__.load({ id, factory })`).
- Point the `./client` export's `types` at `lib/client/index.d.ts`, the file the client
  half actually compiles to.

## 0.1.0 (2026-09-18)

Initial release.