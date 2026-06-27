#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { listPresets, findOpportunities, getPlugin } from './api.js';
import { renderPresets, renderOpportunities, renderPlugin } from './render.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const HELP = `wpgoldmine ${VERSION} — find WordPress plugin opportunities from your terminal.
Powered by wpgoldmine.io. https://github.com/Bishop81/wpgoldmine-cli

Usage:
  wpgoldmine presets
  wpgoldmine search [options]
  wpgoldmine plugin <slug> [--json]

Search options:
  --preset <key>        Curated angle, e.g. abandoned-plugins (see \`wpgoldmine presets\`).
  --niche <tag>         Narrow to a WordPress.org tag, e.g. seo, forms, backup. Composes with --preset.
  --ecosystem <name>    wordpress (default) or woocommerce.
  --min-installs <n>    Minimum active installs.
  --max-installs <n>    Maximum active installs (exclusive).
  --max-rating <r>      Max rating on a 0-100 scale (lower = more dissatisfied users).
  --limit <n>           Max results (requires WPGOLDMINE_API_KEY; free tier is capped at 10).

Global options:
  --json                Print raw JSON (for scripting / CI). Pipe to jq.
  --base <url>          Override API base (default https://wpgoldmine.io, or $WPGOLDMINE_API_BASE).
  -h, --help            Show this help.
  -v, --version         Show version.

Set WPGOLDMINE_API_KEY (a WP Goldmine account token) to raise the limit and unlock extra fields.

Examples:
  wpgoldmine search --preset abandoned-plugins --niche forms
  wpgoldmine search --min-installs 10000 --max-installs 50000 --max-rating 60
  wpgoldmine plugin easy-google-fonts
  wpgoldmine search --preset low-rated-popular --json | jq '.data[].slug'
`;

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  const booleans = new Set(['json', 'help', 'version']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h') { flags.help = true; continue; }
    if (a === '-v') { flags.version = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (booleans.has(key)) { flags[key] = true; continue; }
      flags[key] = argv[++i];
    } else {
      positionals.push(a);
    }
  }
  return { positionals, flags };
}

function num(value, label) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a number (got "${value}").`);
  }
  return n;
}

function out(payload, text, asJson) {
  console.log(asJson ? JSON.stringify(payload, null, 2) : text);
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0];

  if (flags.version) { console.log(VERSION); return; }
  if (flags.help || !command) { console.log(HELP); return; }

  const opts = flags.base ? { base: flags.base } : {};
  const asJson = Boolean(flags.json);

  switch (command) {
    case 'presets': {
      const payload = await listPresets(opts);
      out(payload, renderPresets(payload), asJson);
      return;
    }
    case 'search': {
      const params = {};
      if (flags.preset) params.preset = flags.preset;
      if (flags.niche) params.tag = flags.niche;
      if (flags.tag) params.tag = flags.tag;
      if (flags.ecosystem) params.ecosystem = flags.ecosystem;
      const minInstalls = num(flags['min-installs'], '--min-installs');
      const maxInstalls = num(flags['max-installs'], '--max-installs');
      const maxRating = num(flags['max-rating'], '--max-rating');
      const limit = num(flags.limit, '--limit');
      if (minInstalls !== undefined) params.min_installs = minInstalls;
      if (maxInstalls !== undefined) params.max_installs = maxInstalls;
      if (maxRating !== undefined) params.max_rating = maxRating;
      if (limit !== undefined) params.limit = limit;
      const payload = await findOpportunities(params, opts);
      out(payload, renderOpportunities(payload), asJson);
      return;
    }
    case 'plugin': {
      const slug = positionals[1];
      if (!slug) throw new Error('Usage: wpgoldmine plugin <slug>');
      const payload = await getPlugin(slug, opts);
      out(payload, renderPlugin(payload), asJson);
      return;
    }
    default:
      throw new Error(`Unknown command "${command}". Run \`wpgoldmine --help\`.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
