// Thin client for the wpgoldmine.io public opportunities API.
// All querying runs server-side on wpgoldmine.io — no local database needed.

const DEFAULT_BASE = process.env.WPGOLDMINE_API_BASE || 'https://wpgoldmine.io';

async function getJson(path, { base = DEFAULT_BASE, timeoutMs = 30_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/v1${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (res.status === 429 || res.status === 503) {
      const retry = res.headers.get('retry-after') || '20';
      throw new Error(`API busy (HTTP ${res.status}). Retry after ${retry}s.`);
    }
    if (res.status === 404) {
      let detail = '';
      try {
        detail = (await res.json())?.message || '';
      } catch {
        /* ignore */
      }
      throw new Error(detail || 'Not found (HTTP 404).');
    }
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.json())?.message || '';
      } catch {
        /* ignore */
      }
      throw new Error(`Request failed (HTTP ${res.status}). ${detail}`.trim());
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function toQuery(params) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export function listPresets(opts = {}) {
  return getJson('/presets', opts);
}

export function findOpportunities(params = {}, opts = {}) {
  return getJson(`/opportunities${toQuery(params)}`, opts);
}

export function getPlugin(slug, opts = {}) {
  return getJson(`/plugin/${encodeURIComponent(slug)}`, opts);
}
