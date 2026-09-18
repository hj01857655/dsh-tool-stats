# dsh-tool-stats

[![npm version](https://img.shields.io/npm/v/dsh-tool-stats)](https://www.npmjs.com/package/dsh-tool-stats) [![CI](https://github.com/hj01857655/dsh-tool-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/hj01857655/dsh-tool-stats/actions/workflows/ci.yml)

Every tool call is counted, and the ones that never fire are named so you can remove them.

## Install

```sh
dsh plugin --profile web add dsh-tool-stats
```

## What it does

- **Hook tool calls.** Records tool name, success/failure, latency, session.
- **Dead-tool detection.** Tools configured but never invoked across N sessions are flagged.
- **Failure analysis.** Tools with high failure rates are identified with their last error.
- **Recommendations.** "Removing 12 unused tools would save ~1.8k tokens per context window."
- **Panel.** Usage table, dead/failing sections, recommendations.

## CLI

```sh
dsh-tool-stats summary    # show tool usage, dead tools, failures, recommendations
```

## License

MIT
