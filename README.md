# dsh-tool-stats

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
