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

## License

MIT
