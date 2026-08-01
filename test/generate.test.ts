import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { generateLlmsFullTxt, generateLlmsTxt } from '../src/generate.js'
import type { LlmsTxtPluginOptions } from '../src/types.js'

vi.mock('@payloadcms/richtext-lexical', () => ({
  convertLexicalToMarkdown: ({ data }: { data: unknown }) => `MARKDOWN(${JSON.stringify(data)})`,
  editorConfigFactory: {
    default: async () => ({}),
  },
}))

const postsDocs = [
  { id: '1', title: 'First Post', slug: 'first-post', meta: { description: 'About the first post' } },
  { id: '2', title: 'Second Post', slug: 'second-post' },
]

const projectsDocs = [
  {
    id: '10',
    title: 'Cool Project',
    slug: 'cool-project',
    content: { root: { children: [] } },
  },
]

function makeFakePayload({
  docsByCollection = { posts: postsDocs, projects: projectsDocs },
  global,
}: {
  docsByCollection?: Record<string, Record<string, unknown>[]>
  global?: Record<string, unknown>
} = {}) {
  return {
    config: {},
    find: vi.fn(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
      const docs = docsByCollection[collection] ?? []
      // Simulate published-only filtering: our fixtures have no `_status`, so a
      // `_status: published` where-clause should exclude everything.
      const filtered = where?._status ? [] : docs
      return { docs: filtered }
    }),
    findGlobal: vi.fn(async () => global ?? {}),
  } as unknown as Payload
}

const baseOptions: LlmsTxtPluginOptions = {
  siteName: 'Test Site',
  siteDescription: 'A site for testing',
  siteURL: 'https://example.com',
  collections: [
    {
      slug: 'posts',
      descriptionField: 'meta.description',
      urlPath: (doc) => `/posts/${doc.slug}`,
      publishedOnly: false,
    },
    {
      slug: 'projects',
      contentField: 'content',
      urlPath: (doc) => `/projects/${doc.slug}`,
      publishedOnly: false,
    },
  ],
}

describe('generateLlmsTxt', () => {
  it('includes the site name, description, and grouped entries', async () => {
    const payload = makeFakePayload()
    const text = await generateLlmsTxt(payload, baseOptions)

    expect(text).toContain('# Test Site')
    expect(text).toContain('> A site for testing')
    expect(text).toContain('## Posts')
    expect(text).toContain('- [First Post](https://example.com/posts/first-post): About the first post')
    expect(text).toContain('- [Second Post](https://example.com/posts/second-post)')
    expect(text).toContain('## Projects')
    expect(text).toContain('- [Cool Project](https://example.com/projects/cool-project)')
  })

  it('excludes drafts when publishedOnly is true (default)', async () => {
    const payload = makeFakePayload()
    const options: LlmsTxtPluginOptions = {
      ...baseOptions,
      collections: [{ slug: 'posts', urlPath: (doc) => `/posts/${doc.slug}` }],
    }

    const text = await generateLlmsTxt(payload, options)

    expect(text).not.toContain('First Post')
  })

  it('skips collections with no matching documents', async () => {
    const payload = makeFakePayload({ docsByCollection: { posts: [], projects: projectsDocs } })
    const text = await generateLlmsTxt(payload, baseOptions)

    expect(text).not.toContain('## Posts')
    expect(text).toContain('## Projects')
  })

  it('falls back to "Untitled" when the title field is missing', async () => {
    const payload = makeFakePayload({
      docsByCollection: { posts: [{ id: '1', slug: 'no-title' }], projects: [] },
    })
    const text = await generateLlmsTxt(payload, baseOptions)

    expect(text).toContain('- [Untitled](https://example.com/posts/no-title)')
  })

  it('returns an empty string when the settings global disables generation', async () => {
    const payload = makeFakePayload({ global: { enabled: false } })
    const options: LlmsTxtPluginOptions = { ...baseOptions, addSettingsGlobal: true }

    const text = await generateLlmsTxt(payload, options)

    expect(text).toBe('')
  })

  it('uses the settings global introOverride instead of siteDescription', async () => {
    const payload = makeFakePayload({ global: { introOverride: 'Overridden intro' } })
    const options: LlmsTxtPluginOptions = { ...baseOptions, addSettingsGlobal: true }

    const text = await generateLlmsTxt(payload, options)

    expect(text).toContain('> Overridden intro')
    expect(text).not.toContain('A site for testing')
  })
})

describe('generateLlmsFullTxt', () => {
  it('converts richtext content for collections with a contentField', async () => {
    const payload = makeFakePayload()
    const text = await generateLlmsFullTxt(payload, baseOptions)

    expect(text).toContain('## Cool Project')
    expect(text).toContain('Source: https://example.com/projects/cool-project')
    expect(text).toContain('MARKDOWN(')
  })

  it('falls back to the description field when no contentField is configured', async () => {
    const payload = makeFakePayload()
    const text = await generateLlmsFullTxt(payload, baseOptions)

    expect(text).toContain('## First Post')
    expect(text).toContain('About the first post')
  })
})
