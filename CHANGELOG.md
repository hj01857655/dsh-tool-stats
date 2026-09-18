# Changelog

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