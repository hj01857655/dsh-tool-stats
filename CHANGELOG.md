# Changelog

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