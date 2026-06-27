# wpgoldmine

A command-line tool to find **WordPress plugin opportunities** — large, established plugins weakened
by **abandonment, low ratings, or poor support**, i.e. plugins you could realistically replace or
out-build. Powered by [wpgoldmine.io](https://wpgoldmine.io); querying runs server-side, so there's
nothing to install but the CLI itself.

## Usage

```bash
npx wpgoldmine search --preset abandoned-plugins --niche forms
```

Or install globally:

```bash
npm install -g wpgoldmine
wpgoldmine presets
```

## Commands

```
wpgoldmine presets                 List the curated opportunity presets.
wpgoldmine search [options]        Find ranked plugin opportunities.
wpgoldmine plugin <slug>           Opportunity snapshot for one plugin.
```

### `search` options

| Option | Description |
| --- | --- |
| `--preset <key>` | Curated angle, e.g. `abandoned-plugins`, `low-rated-popular`, `beatable-niche`. Composes with `--niche`. |
| `--niche <tag>` | Narrow to a WordPress.org tag, e.g. `seo`, `forms`, `backup`. |
| `--ecosystem <name>` | `wordpress` (default) or `woocommerce`. |
| `--min-installs <n>` / `--max-installs <n>` | Active-install bounds. |
| `--max-rating <r>` | Max rating on a 0–100 scale (lower = more dissatisfied users). |

### Global options

| Option | Description |
| --- | --- |
| `--json` | Print raw JSON for scripting / CI. Pipe to `jq`. |
| `--base <url>` | Override API base (default `https://wpgoldmine.io`, or `$WPGOLDMINE_API_BASE`). |
| `-h, --help` / `-v, --version` | Help / version. |

Set `WPGOLDMINE_API_KEY` (a WP Goldmine account token, from your account settings) to raise the result
limit and unlock extra fields. Without it, the CLI uses the free, capped tier.

```bash
export WPGOLDMINE_API_KEY=wpg_your_token_here
wpgoldmine search --preset abandoned-plugins --niche forms --limit 100
```

## Examples

```bash
# Abandoned plugins in a specific niche
wpgoldmine search --preset abandoned-plugins --niche forms

# Mid-size, low-rated plugins (proven demand, poor execution)
wpgoldmine search --min-installs 10000 --max-installs 50000 --max-rating 60

# One plugin's opportunity snapshot
wpgoldmine plugin easy-google-fonts

# Scripting: list slugs of low-rated popular plugins
wpgoldmine search --preset low-rated-popular --json | jq -r '.data[].slug'
```

## Use in CI

Because `--json` is machine-readable, you can wire wpgoldmine into a scheduled job to watch a niche:

```bash
wpgoldmine search --preset newest-opportunities --niche ai --json > opportunities.json
```

## GitHub Action

This repo also ships a GitHub Action, so you can run the same queries in a workflow without managing
Node yourself.

```yaml
- id: opportunities
  uses: Bishop81/wpgoldmine-cli@v1
  with:
    args: search --preset abandoned-plugins --niche forms
    output-file: opportunities.json

- run: cat opportunities.json | jq '.data[0]'
```

| Input | Default | Description |
| --- | --- | --- |
| `args` | `presets` | Arguments for the CLI, e.g. `search --preset abandoned-plugins --niche forms`. |
| `json` | `true` | Append `--json` for machine-readable output. |
| `api-base` | _(prod)_ | Override the API base (`WPGOLDMINE_API_BASE`). |
| `output-file` | _(none)_ | Also write the output to this path. |

The step output `result` holds the CLI stdout. A full scheduled example is in
[`examples/watch-niche.yml`](examples/watch-niche.yml).

## License

MIT
