import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** Cordis plugin name. */
export const name = 'pen-dev-skill'

/** Registers a skill provider, so it needs the skill registry. */
export const inject = ['skills']

const PROVIDER_NAME = 'pen-dev'
/** Rank 600 is the documented slot for skills bundled by a package. */
const RANK = 600
const BODY_URL = new URL('../assets/pen-dev.md', import.meta.url)
const RESOURCE_BASE = {
  kind: 'directory',
  path: fileURLToPath(new URL('../assets/', import.meta.url)),
}

const DESCRIPTION =
  'Design on the pen.dev infinite canvas via the pen.dev MCP tools (mcp__pen__*). ' +
  'Use when the user wants to create, edit, inspect, or reproduce screens in pen.dev / .pen files, ' +
  'or mentions canvas, frames, components, or a design file opened in Pen.'

const CANDIDATE = {
  name: PROVIDER_NAME,
  description: DESCRIPTION,
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  provider: PROVIDER_NAME,
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: RANK,
  locator: BODY_URL,
}

const provider = {
  name: PROVIDER_NAME,
  list: () => Promise.resolve([CANDIDATE]),
  async get(_candidate) {
    return {
      name: CANDIDATE.name,
      description: CANDIDATE.description,
      invocation: CANDIDATE.invocation,
      provider: CANDIDATE.provider,
      source: CANDIDATE.source,
      resourceBase: RESOURCE_BASE,
      content: await readFile(BODY_URL, 'utf8'),
    }
  },
}

/** Register the bundled `pen-dev` skill provider on `ctx.skills`. */
export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}
