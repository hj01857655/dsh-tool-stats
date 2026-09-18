import type { PanelPayload } from '../types.js';

export function renderPanel(payload: PanelPayload): string {
  const toolRows = payload.tools
    .map((t) => `<tr><td>${t.tool}</td><td>${t.invocations}</td><td>${Math.round(t.failureRate * 100)}%</td><td>${t.p50Latency}ms</td><td>${t.p95Latency}ms</td></tr>`)
    .join('');

  const deadSection = payload.deadTools.length > 0
    ? `<h3>Dead tools</h3><ul>${payload.deadTools.map((d) => `<li>${d.tool}</li>`).join('')}</ul>`
    : '';

  const failSection = payload.failingTools.length > 0
    ? `<h3>Failing tools</h3><ul>${payload.failingTools.map((f) => `<li>${f.tool}: ${Math.round(f.failureRate * 100)}%</li>`).join('')}</ul>`
    : '';

  const recSection = payload.recommendations.length > 0
    ? `<h3>Recommendations</h3><ul>${payload.recommendations.map((r) => `<li>${r.message}</li>`).join('')}</ul>`
    : '';

  return `<div class="stats-panel">
    <h2>Tool Stats</h2>
    ${toolRows ? `<table><thead><tr><th>Tool</th><th>Calls</th><th>Fail</th><th>p50</th><th>p95</th></tr></thead><tbody>${toolRows}</tbody></table>` : '<p>No calls recorded.</p>'}
    ${deadSection}${failSection}${recSection}
  </div>`;
}
