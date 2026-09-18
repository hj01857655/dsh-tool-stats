import { parseArgs } from 'node:util';
import { ToolStats } from './stats.js';

export function run(argv: string[]): number {
  const { positionals } = parseArgs({
    args: argv,
    options: {
      'tool': { type: 'string' },
      'success': { type: 'boolean' },
      'latency': { type: 'string' },
      'session': { type: 'string' },
    },
    allowPositionals: true,
  });

  const projectDir = process.cwd();
  const stats = new ToolStats(projectDir);
  const cmd = positionals[0] ?? 'summary';

  switch (cmd) {
    case 'summary': {
      const s = stats.summary();
      if (s.tools.length === 0) {
        console.log('No tool calls recorded.');
        return 0;
      }
      console.log('Tool usage:');
      for (const t of s.tools) {
        console.log(`  ${t.tool}: ${t.invocations} calls, ${Math.round(t.failureRate * 100)}% fail, p50=${t.p50Latency}ms`);
      }
      if (s.deadTools.length > 0) {
        console.log(`\nDead tools (${s.deadTools.length}):`);
        for (const d of s.deadTools) console.log(`  ${d.tool}`);
      }
      if (s.failingTools.length > 0) {
        console.log(`\nFailing tools (${s.failingTools.length}):`);
        for (const f of s.failingTools) console.log(`  ${f.tool}: ${Math.round(f.failureRate * 100)}% fail`);
      }
      for (const r of s.recommendations) {
        console.log(`\n💡 ${r.message}`);
      }
      return 0;
    }
    case 'record': {
      const tool = positionals[1] ?? '';
      const success = positionals.includes('--success');
      const latency = parseInt(positionals[positionals.indexOf('--latency') + 1] ?? '0', 10);
      const session = positionals[positionals.indexOf('--session') + 1] ?? 'cli';
      stats.record({ tool, timestamp: Date.now(), success, latencyMs: latency, sessionId: session });
      console.log(`Recorded: ${tool} ${success ? 'ok' : 'fail'}`);
      return 0;
    }
    case 'help':
    default:
      console.log('Usage: dsh-tool-stats <command> [options]');
      console.log('Commands: summary, record');
      return 0;
  }
}
