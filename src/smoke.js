// Smoke test: exercises the renderers offline, then (optionally) the live API + CLI dispatch.
// Run: node src/smoke.js                                          (offline only)
//      WPGOLDMINE_API_BASE=http://127.0.0.1:8099 node src/smoke.js --live
import { renderOpportunities, renderPlugin, renderPresets } from './render.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

console.log('renderPresets:');
check('lists preset key', renderPresets({ data: [{ preset: 'abandoned-plugins', title: 'T', description: 'd' }] }).includes('abandoned-plugins'));
check('empty handled', renderPresets({ data: [] }) === 'No presets available.');

console.log('renderOpportunities:');
const opp = renderOpportunities({
  data: [{ name: 'Easy Google Fonts', slug: 'easy-google-fonts', active_installs: 100000, rating: 92, opportunity_score: 5.8, last_updated: '2021-07-23', wpgoldmine_url: 'https://wpgoldmine.io/plugin/easy-google-fonts' }],
  meta: { returned: 1, total: 331, capped: true, preset: 'abandoned-plugins' },
  upsell: { message: 'Showing 1 of 331...', url: 'https://wpgoldmine.io/database' },
});
check('shows total', opp.includes('of 331'));
check('shows name', opp.includes('Easy Google Fonts'));
check('shows url', opp.includes('/plugin/easy-google-fonts'));
check('empty handled', renderOpportunities({ data: [], meta: {} }).includes('No matching plugins'));

console.log('renderPlugin:');
const plug = renderPlugin({
  data: { name: 'Easy Google Fonts', slug: 'easy-google-fonts', ecosystem: 'wordpress', active_installs: 100000, rating: 92, num_ratings: 218, last_updated: '2021-07-23', opportunity_score: 5.8, tags: ['fonts'], short_description: 'Adds google fonts.' },
  upsell: { url: 'https://wpgoldmine.io/plugin/easy-google-fonts' },
});
check('shows name', plug.includes('Easy Google Fonts'));
check('shows rating', plug.includes('92/100'));
check('missing data handled', renderPlugin({}) === 'No plugin data returned.');

if (failures) {
  console.error(`\n${failures} offline check(s) failed.`);
  process.exit(1);
}
console.log('\nAll offline checks passed.');

if (process.argv.includes('--live')) {
  const { listPresets, findOpportunities, getPlugin } = await import('./api.js');
  const base = process.env.WPGOLDMINE_API_BASE || 'https://wpgoldmine.io';
  console.log(`\nLive API: ${base}/api/v1`);
  try {
    const presets = await listPresets();
    console.log(`  presets: ${presets.data?.length ?? 0}`);
    const opps = await findOpportunities({ preset: 'abandoned-plugins' });
    console.log(`  opportunities: ${opps.meta?.returned}/${opps.meta?.total}`);
    const first = opps.data?.[0]?.slug;
    if (first) console.log(`  plugin: ${(await getPlugin(first)).data?.name}`);
    console.log('  live checks ok.');
  } catch (e) {
    console.error(`  live error: ${e.message}`);
    process.exit(1);
  }
}
