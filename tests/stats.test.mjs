import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, findDeadTools, findFailingTools, recommend } from '../lib/analyzer.js';

const makeCall = (tool, success, latency, session = 's1') => ({
  tool, timestamp: Date.now(), success, latencyMs: latency, sessionId: session,
});

test('aggregate: counts invocations', () => {
  const calls = [
    makeCall('read', true, 10),
    makeCall('read', true, 20),
    makeCall('write', false, 30),
  ];
  const m = aggregate(calls);
  assert.equal(m.get('read').invocations, 2);
  assert.equal(m.get('write').invocations, 1);
  assert.equal(m.get('write').failures, 1);
});

test('aggregate: failureRate', () => {
  const calls = [
    makeCall('t', true, 10),
    makeCall('t', false, 10),
  ];
  const m = aggregate(calls);
  assert.equal(m.get('t').failureRate, 0.5);
});

test('aggregate: latency percentiles', () => {
  const calls = Array.from({ length: 20 }, (_, i) => makeCall('t', true, (i + 1) * 10));
  const m = aggregate(calls);
  assert.ok(m.get('t').p50Latency > 0);
  assert.ok(m.get('t').p95Latency >= m.get('t').p50Latency);
});

test('findDeadTools: detects unused tools', () => {
  const calls = [makeCall('read', true, 10)];
  const dead = findDeadTools(['read', 'write', 'search'], calls, 1);
  assert.ok(dead.some((d) => d.tool === 'write'));
  assert.ok(dead.some((d) => d.tool === 'search'));
});

test('findFailingTools: detects high failure rate', () => {
  const calls = [
    makeCall('bad', false, 10), makeCall('bad', false, 10), makeCall('bad', false, 10),
    makeCall('bad', false, 10), makeCall('bad', false, 10),
    makeCall('good', true, 10), makeCall('good', true, 10), makeCall('good', true, 10),
    makeCall('good', true, 10), makeCall('good', true, 10),
  ];
  const failing = findFailingTools(calls, 0.3);
  assert.ok(failing.some((f) => f.tool === 'bad'));
  assert.ok(!failing.some((f) => f.tool === 'good'));
});

test('recommend: dead tools recommendation', () => {
  const calls = [makeCall('read', true, 10)];
  const recs = recommend(['read', 'write', 'search'], calls, 1);
  assert.ok(recs.some((r) => r.type === 'dead-tools'));
  assert.ok(recs[0].estimatedTokenSavings > 0);
});

test('recommend: no recommendations when all tools used', () => {
  const calls = [makeCall('read', true, 10), makeCall('write', true, 10)];
  const recs = recommend(['read', 'write'], calls, 10);
  assert.equal(recs.length, 0);
});
