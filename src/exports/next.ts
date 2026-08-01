import type { SanitizedConfig } from 'payload'
import { getPayload } from 'payload'

import type { LlmsTxtPluginOptions } from '../types.js'
import { generateLlmsFullTxt, generateLlmsTxt } from '../generate.js'

type ConfigInput = SanitizedConfig | Promise<SanitizedConfig>

const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' }

/**
 * Creates a Next.js Route Handler for llms.txt. Place at `app/llms.txt/route.ts`
 * (or `app/(frontend)/llms.txt/route.ts` in a route-grouped app) so it's served
 * from the site root, e.g.:
 *
 * ```ts
 * import config from '@payload-config'
 * import { createLlmsTxtRouteHandler } from 'payload-plugin-llms-txt/next'
 * export const GET = createLlmsTxtRouteHandler(config, options)
 * ```
 */
export function createLlmsTxtRouteHandler(config: ConfigInput, options: LlmsTxtPluginOptions) {
  return async function GET() {
    const payload = await getPayload({ config })
    const text = await generateLlmsTxt(payload, options)
    return new Response(text, { headers: TEXT_HEADERS })
  }
}

/** Same as {@link createLlmsTxtRouteHandler}, for `app/llms-full.txt/route.ts`. */
export function createLlmsFullTxtRouteHandler(config: ConfigInput, options: LlmsTxtPluginOptions) {
  return async function GET() {
    const payload = await getPayload({ config })
    const text = await generateLlmsFullTxt(payload, options)
    return new Response(text, { headers: TEXT_HEADERS })
  }
}
