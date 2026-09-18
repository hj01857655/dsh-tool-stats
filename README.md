# dsh-tool-stats

[![npm version](https://img.shields.io/npm/v/dsh-tool-stats?color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/dsh-tool-stats)
[![npm downloads](https://img.shields.io/npm/dm/dsh-tool-stats?color=cb3837)](https://www.npmjs.com/package/dsh-tool-stats)
[![CI](https://github.com/hj01857655/dsh-tool-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/hj01857655/dsh-tool-stats/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/dsh-tool-stats?color=blue)](LICENSE)
[![node](https://img.shields.io/node/v/dsh-tool-stats?color=339933&logo=node.js&logoColor=white)](package.json)
[![GitHub stars](https://img.shields.io/github/stars/hj01857655/dsh-tool-stats?color=yellow)](https://github.com/hj01857655/dsh-tool-stats/stargazers)
[![dsh plugin](https://img.shields.io/badge/dsh-plugin-4B8BBE)](https://github.com/topics/dsh-plugin)

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
