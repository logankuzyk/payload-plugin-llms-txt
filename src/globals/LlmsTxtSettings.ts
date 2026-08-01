import type { GlobalConfig } from 'payload'

import type { LlmsTxtPluginOptions } from '../types.js'

export const DEFAULT_SETTINGS_GLOBAL_SLUG = 'llms-txt-settings'

export function getSettingsGlobalSlug(options: LlmsTxtPluginOptions): string | undefined {
  if (!options.addSettingsGlobal) return undefined
  return typeof options.addSettingsGlobal === 'string'
    ? options.addSettingsGlobal
    : DEFAULT_SETTINGS_GLOBAL_SLUG
}

export function buildSettingsGlobal(slug: string): GlobalConfig {
  return {
    slug,
    label: 'LLMs.txt Settings',
    admin: {
      description: 'Controls the content of /llms.txt and /llms-full.txt.',
    },
    access: {
      read: () => true,
    },
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable llms.txt generation',
      },
      {
        name: 'introOverride',
        type: 'textarea',
        label: 'Intro text override',
        admin: {
          description:
            'Shown at the top of llms.txt instead of the plugin siteDescription option, when set.',
        },
      },
    ],
  }
}
