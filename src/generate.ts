import type { Payload } from 'payload'

import type { LlmsTxtCollectionConfig, LlmsTxtPluginOptions, LlmsTxtSettingsData } from './types.js'
import { getSettingsGlobalSlug } from './globals/LlmsTxtSettings.js'

function getFieldValue(doc: Record<string, unknown>, path: string): string | undefined {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), doc)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function labelFor(config: LlmsTxtCollectionConfig): string {
  if (config.label) return config.label
  const slug = config.slug.replace(/-/g, ' ')
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

async function fetchDocs(payload: Payload, config: LlmsTxtCollectionConfig, limit: number) {
  const publishedOnly = config.publishedOnly ?? true

  const result = await payload.find({
    collection: config.slug as Parameters<Payload['find']>[0]['collection'],
    overrideAccess: false,
    draft: false,
    depth: 0,
    limit,
    pagination: false,
    ...(publishedOnly
      ? {
          where: {
            _status: {
              equals: 'published',
            },
          },
        }
      : {}),
  })

  return result.docs as Record<string, unknown>[]
}

async function getSettings(
  payload: Payload,
  options: LlmsTxtPluginOptions,
): Promise<LlmsTxtSettingsData | undefined> {
  const slug = getSettingsGlobalSlug(options)
  if (!slug) return undefined

  return (await payload.findGlobal({
    slug: slug as Parameters<Payload['findGlobal']>[0]['slug'],
    depth: 0,
  })) as LlmsTxtSettingsData
}

export async function generateLlmsTxt(payload: Payload, options: LlmsTxtPluginOptions): Promise<string> {
  const settings = await getSettings(payload, options)
  if (settings?.enabled === false) return ''

  const limit = options.limitPerCollection ?? 1000
  const intro = settings?.introOverride || options.siteDescription

  const lines: string[] = [`# ${options.siteName}`, '']
  if (intro) lines.push(`> ${intro}`, '')

  for (const collectionConfig of options.collections) {
    const docs = await fetchDocs(payload, collectionConfig, limit)
    if (docs.length === 0) continue

    lines.push(`## ${labelFor(collectionConfig)}`)
    for (const doc of docs) {
      const title = getFieldValue(doc, collectionConfig.titleField ?? 'title') ?? 'Untitled'
      const url = `${options.siteURL.replace(/\/$/, '')}${collectionConfig.urlPath(doc)}`
      const description = collectionConfig.descriptionField
        ? getFieldValue(doc, collectionConfig.descriptionField)
        : undefined

      lines.push(description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`)
    }
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

export async function generateLlmsFullTxt(payload: Payload, options: LlmsTxtPluginOptions): Promise<string> {
  const settings = await getSettings(payload, options)
  if (settings?.enabled === false) return ''

  const limit = options.limitPerCollection ?? 1000
  const intro = settings?.introOverride || options.siteDescription

  const lines: string[] = [`# ${options.siteName}`, '']
  if (intro) lines.push(`> ${intro}`, '')

  const { convertLexicalToMarkdown, editorConfigFactory } = await import('@payloadcms/richtext-lexical')
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  for (const collectionConfig of options.collections) {
    const docs = await fetchDocs(payload, collectionConfig, limit)
    if (docs.length === 0) continue

    for (const doc of docs) {
      const title = getFieldValue(doc, collectionConfig.titleField ?? 'title') ?? 'Untitled'
      const url = `${options.siteURL.replace(/\/$/, '')}${collectionConfig.urlPath(doc)}`

      lines.push(`## ${title}`, '', `Source: ${url}`, '')

      const richTextData = collectionConfig.contentField
        ? (doc as Record<string, unknown>)[collectionConfig.contentField]
        : undefined

      if (richTextData) {
        try {
          const markdown = convertLexicalToMarkdown({
            data: richTextData as Parameters<typeof convertLexicalToMarkdown>[0]['data'],
            editorConfig,
          })
          lines.push(markdown, '')
        } catch {
          const description = collectionConfig.descriptionField
            ? getFieldValue(doc, collectionConfig.descriptionField)
            : undefined
          if (description) lines.push(description, '')
        }
      } else {
        const description = collectionConfig.descriptionField
          ? getFieldValue(doc, collectionConfig.descriptionField)
          : undefined
        if (description) lines.push(description, '')
      }
    }
  }

  return lines.join('\n').trim() + '\n'
}
