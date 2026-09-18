# Design — dsh-tool-stats

## Positioning

A dsh agent with 20 tools loaded sends 20 tool schemas in every context window. Half of
them are never called. This plugin shows which tools earn their context budget and which
are dead weight.

One sentence: **every tool call is counted, and the ones that never fire are named so
you can remove them.**

## What it does

- **Hook tool calls.** Listen to the Cordis event that fires when a tool is invoked.
  Record: tool name, timestamp, success/failure, latency, session id.
- **Accumulate.** Maintain `.toolstats/counters.json` with per-tool totals: invocations,
  successes, failures, p50/p95 latency, last-used timestamp.
- **Dead-tool detection.** A tool configured in the profile but with zero invocations
  across N sessions is flagged as dead. The threshold N is configurable (default 10).
- **Failure analysis.** Tools with high failure rates are flagged. The most recent
  error message for each failing tool is kept for diagnosis.
- **Recommendations.** "You have 20 tools, used 8 in the last 10 sessions. Removing
  the 12 unused tools would save ~2k tokens per context window."
- **Panel.** A settings page with: tool usage table (sorted by invocations), dead tools
  section, failing tools section, latency histogram.

## Architecture

| Half | Entry | Owns |
|---|---|---|
| host | `apply(ctx)` | event listener on tool calls, counter store, analysis engine |
| client | `exports["./client"]` | settings page: usage table, dead/failing sections |

## Milestones

| # | Milestone |
|---|---|
| M0 | Skeleton + event hook + counter store |
| M1 | Dead-tool detection + failure analysis |
| M2 | Lat&ency percentiles + recommendations |
| M3 | Panel: usage table, dead/failing sections |
| M4 | CLI: `toolstats summary`, `toolstats dead`, `toolstats failures` |

## Non-goals

- Not a tool profiler in the profiling-tools sense (flame graphs, CPU). It counts
  invocations and measures wall-clock latency, nothing deeper.
- Not a tool configurator. It tells you what to remove; it does not remove it for you.
