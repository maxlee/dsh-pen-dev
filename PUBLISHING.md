# Publishing and discovery: how `dsh-pen-dev` shows up in a plugin market

## What this DSH build actually offers

There is **no submission channel to an official plugin library**, and no bundled official index:

- The market is user-configured index sources. `plugin-market`'s `indexes` defaults to `[]`; with none
  configured the host sends no market requests at all. The Discover tab's example URL is
  `https://example.com/index.json`.
- "Official" plugins come from a **build-time** allowlist: `ON_DEMAND_BUNDLES` (in this release only
  `@deepseek-ai/dsh-subagent-claude-code` and `@deepseek-ai/dsh-subagent-codex`) plus the generated
  `OFFICIAL_ON_DEMAND_CATALOG` produced by `pnpm gen-official-bundle-catalog`. Third-party packages
  cannot enter it without becoming a DSH release member and shipping a release.

So "searchable in the official library" is not a capability gap on our side — that library does not
exist as a runtime thing. Being discoverable does not require it.

## Route A — npm plus a self-hosted index (available today)

1. **Publish**

   ```bash
   npm login
   npm publish        # package: dsh-pen-dev
   ```

2. **Fill in** [`market/index.json`](market/index.json): real `author`, `homepage`, `repository`.
   Each release **appends** a `versions` entry (old ones stay), with an exact SemVer `version` and a
   Unix-seconds `publishTimestamp`.

3. **Host** it on GitHub Pages or any static HTTPS URL, e.g.
   `https://<user>.github.io/dsh-pen-dev/market/index.json`.

4. **User side:** Plugins → Explore → **Add index source** → paste the URL. Searching `pen`,
   `canvas`, or `设计` then finds the plugin, and install pins `dsh-pen-dev@0.1.0`.

5. **Validate locally** with the runtime's own parser:

   ```js
   import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index'
   parseMarketIndex(JSON.parse(readFileSync('market/index.json', 'utf8')), 'https://example.com/index.json')
   ```

### Format 1 in one table

| Field | Rule |
| --- | --- |
| `format` | exactly `1` |
| `title` | required; string or language map that **must include `en`** |
| `plugins[].name` | valid npm package name, unique in the index |
| `versions[]` | non-empty; exact SemVer `version`; integer Unix-seconds `publishTimestamp` |
| `source` | `{"type":"npm"}` (optional `registry`) or git (`url` + 40-hex commit, optional `path`) |
| `icon` | https URL, `data:` base64 (≤32 KiB decoded), or a relative same-origin reference |
| `metadata.category` / `labels` | must be declared in the index's `metadata` first |

Text search covers `name`, `author`, `keywords`, and every language of `title`, `description`,
category and label titles. `name` and `title` weigh 3×, `keywords` 2×. Chinese is matched by
character bigrams, so bilingual titles plus keywords are what make the entry findable.

## Route B — getting into the official catalog (not ours to decide)

The official catalog is a release artifact. The realistic move is a GitHub issue on
`deepseek-ai/deepseek-harness` asking either for community entries in the official on-demand
catalog or for a public official market index (default `indexes: []` makes third-party discovery
impossible otherwise). Include the package name, the index entry, MIT licensing, a maintenance
commitment, and the supported DSH version. If they instead require publishing under
`@deepseek-ai/*`, that effectively means donating the project.

## Route C — third-party community markets

Search surfaces sites claiming to accept plugin submissions. They are not DSH artifacts, their
provenance and longevity are unverifiable (this machine's network is proxied, so I could not confirm
any of them), and some may be SEO farms. Before using one, check domain ownership, HTTPS, and
whether it demands package ownership.

## Release checklist

- [ ] `npm login` works and the name is free
- [ ] `market/index.json` passes the official parser with zero errors
- [ ] the new version is appended to `versions`, with a post-publish `publishTimestamp`
- [ ] README install commands match the published version
- [ ] uninstall and rollback steps are documented

## If no index ever lists it

Discovery only affects search. Users can still install directly with **Add plugin → Install
third-party plugin**, entering `dsh-pen-dev`, a Git URL, or a local path.
