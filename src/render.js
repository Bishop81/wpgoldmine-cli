// Pure text renderers for human-readable CLI output. JSON mode bypasses these.

export function renderPresets(payload) {
  const presets = Array.isArray(payload?.data) ? payload.data : [];
  if (!presets.length) return 'No presets available.';

  const lines = ['Opportunity presets (use with `search --preset <key>`):', ''];
  for (const p of presets) {
    lines.push(`  ${p.preset}`);
    if (p.title) lines.push(`    ${p.title}`);
    if (p.description) lines.push(`    ${p.description}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function formatInstalls(n) {
  if (n == null) return '?';
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M+`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K+`;
  return String(n);
}

export function renderOpportunities(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const meta = payload?.meta || {};
  const lines = [];

  const scope = meta.preset ? `preset "${meta.preset}"` : 'custom filters';
  lines.push(`Plugin opportunities (${scope}) — showing ${meta.returned ?? rows.length} of ${meta.total ?? '?'}:`);
  lines.push('');

  if (!rows.length) {
    lines.push('No matching plugins. Try a different --preset, a broader --niche, or wider install bounds.');
    return lines.join('\n');
  }

  for (const p of rows) {
    const score = p.opportunity_score != null ? String(p.opportunity_score).padStart(4) : '   ?';
    const rating = p.rating != null ? `${p.rating}/100` : 'n/a';
    lines.push(`  [${score}]  ${p.name}`);
    lines.push(`          ${formatInstalls(p.active_installs)} installs · rating ${rating} · updated ${p.last_updated || 'unknown'}`);
    lines.push(`          ${p.wpgoldmine_url}`);
  }

  if (payload?.upsell?.message) {
    lines.push('');
    lines.push(payload.upsell.message);
  }
  return lines.join('\n');
}

export function renderPlugin(payload) {
  const p = payload?.data;
  if (!p) return 'No plugin data returned.';

  const lines = [];
  lines.push(`${p.name} (${p.slug})`);
  lines.push('');
  lines.push(`  Ecosystem:        ${p.ecosystem}`);
  lines.push(`  Active installs:  ${formatInstalls(p.active_installs)}`);
  lines.push(`  Rating:           ${p.rating != null ? `${p.rating}/100` : 'n/a'} from ${p.num_ratings ?? 0} reviews`);
  lines.push(`  Last updated:     ${p.last_updated || 'unknown'} (added ${p.added_date || 'unknown'})`);
  if (p.support_resolution_rate != null) {
    lines.push(`  Support resolved: ${p.support_resolution_rate}% of ${p.support_threads} threads`);
  }
  lines.push(`  Opportunity:      ${p.opportunity_score ?? '?'} (abandonment ${p.abandonment_score ?? '?'}, monetization ${p.monetization_score ?? '?'})`);
  if (Array.isArray(p.tags) && p.tags.length) lines.push(`  Tags:             ${p.tags.slice(0, 10).join(', ')}`);
  if (p.short_description) {
    lines.push('');
    lines.push(`  ${p.short_description}`);
  }
  if (payload?.upsell?.url) {
    lines.push('');
    lines.push(`  Full metrics & history: ${payload.upsell.url}`);
  }
  return lines.join('\n');
}
