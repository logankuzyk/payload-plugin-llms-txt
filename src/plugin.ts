import type { Config, Endpoint } from 'payload'

import type { LlmsTxtPluginOptions } from './types.js'
import { buildSettingsGlobal, getSettingsGlobalSlug } from './globals/LlmsTxtSettings.js'
import { generateLlmsFullTxt, generateLlmsTxt } from './generate.js'

/**
 * Adds an optional admin-editable settings Global, and (for convenience/portability
 * outside Next.js) `/llms.txt` and `/llms-full.txt` endpoints under Payload's configured
 * API route. In Next.js apps, prefer the route handlers exported from `payload-plugin-llms-txt/next`
 * so the files can be served from the site root as the llms.txt convention requires.
 */
export const llmsTxtPlugin =
  (options: LlmsTxtPluginOptions) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    const settingsGlobalSlug = getSettingsGlobalSlug(options)
    if (settingsGlobalSlug) {
      config.globals = [...(config.globals ?? []), buildSettingsGlobal(settingsGlobalSlug)]
    }

    const endpoints: Endpoint[] = [
      {
        path: '/llms.txt',
        method: 'get',
        handler: async (req) => {
          const text = await generateLlmsTxt(req.payload, options)
          return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        },
      },
      ...(options.enableFullText
        ? [
            {
              path: '/llms-full.txt',
              method: 'get',
              handler: async (req) => {
                const text = await generateLlmsFullTxt(req.payload, options)
                return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
              },
            } satisfies Endpoint,
          ]
        : []),
    ]

    config.endpoints = [...(config.endpoints ?? []), ...endpoints]

    return config
  }
