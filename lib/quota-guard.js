/**
 * pen.dev quota guard for DeepSeek Harness.
 *
 * pen.dev meters MCP usage as "active days" per billing period. When the
 * allowance is used up the upstream app rejects tools and injects a long
 * English "STOP … you MUST NOT work around this" instruction aimed at its own
 * agent. That text is confusing inside DSH and invites retries.
 *
 * This listener rewrites exactly that failure into a short bilingual notice
 * with the upgrade link, and keeps every other result untouched.
 */

/** Cordis plugin name. */
export const name = 'pen-dev-quota-guard'

/** Needs the tool registry to observe executions. */
export const inject = ['tools']

const DEFAULT_UPGRADE_URL = 'https://pen.dev/upgrade'

const QUOTA_PATTERNS = [
  /usage limit has been reached/i,
  /all design tools are now blocked/i,
  /active days of mcp usage/i,
  /reached the usage limit of your/i,
  /free days of designing with agents/i,
]

const URL_PATTERN = /https:\/\/pen\.dev\/[A-Za-z0-9./?=&_%-]+/

/** All text a failed tool result carries, including the error message. */
export function collectText(result) {
  const parts = []
  const content = result?.content
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
    }
  }
  if (typeof result?.error?.message === 'string') parts.push(result.error.message)
  return parts.join('\n')
}

/** True only for a failed MCP call whose text mentions the pen.dev quota. */
export function isQuotaFailure(exec, result) {
  if (!result || result.isError !== true) return false
  const toolName = exec?.name
  if (typeof toolName !== 'string' || !toolName.startsWith('mcp__')) return false
  const text = collectText(result)
  return QUOTA_PATTERNS.some((pattern) => pattern.test(text))
}

/** The upgrade URL pen.dev attached to the error, when it is present. */
export function upgradeUrlFrom(result) {
  const match = URL_PATTERN.exec(collectText(result))
  return match ? match[0] : DEFAULT_UPGRADE_URL
}

/** Replacement content for the blocked call. */
export function buildNotice(upgradeUrl = DEFAULT_UPGRADE_URL) {
  return [
    {
      type: 'text',
      text: [
        '[pen-dev] 已达到 pen.dev 当前计费周期的 MCP 活跃天数上限，设计工具被上游拒绝。',
        '[pen-dev] The pen.dev MCP active-days allowance for this billing period is used up.',
        '',
        `升级后可继续 / Upgrade to continue: ${upgradeUrl}`,
        '',
        '请勿重试同一调用，也不要直接修改 .pen 文件；升级后从 get_app_state 重新开始。',
        'Do not retry this call and do not edit .pen files directly. After upgrading, restart from get_app_state.',
      ].join('\n'),
    },
  ]
}

/** Register the post-execute listener that rewrites quota failures. */
export function apply(ctx) {
  ctx.on('tools/post-execute', async (exec, result, next) => {
    const downstream = await next()
    if (!isQuotaFailure(exec, result)) return downstream
    if (downstream?.kind === 'block') return downstream
    return {
      ...downstream,
      kind: 'accept',
      content: buildNotice(upgradeUrlFrom(result)),
    }
  })
}
