export interface LlmsTxtCollectionConfig {
  /** Collection slug, e.g. 'posts' */
  slug: string
  /** Field to use as the entry title. @default 'title' */
  titleField?: string
  /** Dot-path field to use as the entry description in the index (e.g. 'meta.description'). */
  descriptionField?: string
  /**
   * Name of a richText field to convert to Markdown for llms-full.txt.
   * Omit for collections without a single richText field (e.g. block-based layouts) —
   * those entries still appear in the index, just without full-text content.
   */
  contentField?: string
  /** Build the public URL for a document. */
  urlPath: (doc: Record<string, unknown>) => string
  /**
   * Only include documents with `_status: 'published'`.
   * Set to false for collections without drafts/versions enabled.
   * @default true
   */
  publishedOnly?: boolean
  /** Label used for this collection's section heading. Defaults to a capitalized slug. */
  label?: string
}

export interface LlmsTxtPluginOptions {
  collections: LlmsTxtCollectionConfig[]
  siteName: string
  siteDescription?: string
  siteURL: string
  /** Also generate llms-full.txt with full Markdown content inline. @default false */
  enableFullText?: boolean
  /**
   * Add an admin-editable Global for the intro copy and per-collection toggles.
   * Pass a string to customize the Global's slug. @default false
   */
  addSettingsGlobal?: boolean | string
  /** Max documents fetched per collection. @default 1000 */
  limitPerCollection?: number
}

export interface LlmsTxtSettingsData {
  enabled?: boolean | null
  introOverride?: string | null
}
