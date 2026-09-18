import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolCall } from './types.js';

export class StatsStore {
  private readonly statsDir: string;
  private readonly callsPath: string;

  constructor(private readonly projectDir: string) {
    this.statsDir = join(projectDir, '.toolstats');
    this.callsPath = join(this.statsDir, 'calls.jsonl');
  }

  private ensureDir(): void {
    if (!existsSync(this.statsDir)) mkdirSync(this.statsDir, { recursive: true });
  }

  append(call: ToolCall): void {
    this.ensureDir();
    appendFileSync(this.callsPath, JSON.stringify(call) + '\n', 'utf8');
  }

  readAll(): ToolCall[] {
    if (!existsSync(this.callsPath)) return [];
    return readFileSync(this.callsPath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ToolCall);
  }
}
