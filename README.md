# payload-plugin-llms-txt

Generate [`llms.txt`](https://llmstxt.org/) (and optionally `llms-full.txt`) for a [Payload CMS](https://payloadcms.com) site, straight from your collections.

## Install

```bash
npm install payload-plugin-llms-txt
```

## Usage

Register the plugin in `payload.config.ts` to (optionally) add an admin-editable settings Global:

```ts
import { llmsTxtPlugin } from 'payload-plugin-llms-txt'

export default buildConfig({
  plugins: [
    llmsTxtPlugin({
      siteName: 'My Site',
      siteDescription: 'A site about things.',
      siteURL: 'https://example.com',
      enableFullText: true,
      addSettingsGlobal: true, // adds an "LLMs.txt Settings" admin global
      collections: [
        {
          slug: 'posts',
          // Tries `llmsDescription` first, falls back to the SEO field when empty —
          // useful when you're rolling out a dedicated LLM-facing description field
          // without having to backfill every existing document immediately.
          descriptionField: ['llmsDescription', 'meta.description'],
          contentField: 'content', // richText field, converted to Markdown for llms-full.txt
          urlPath: (doc) => `/posts/${doc.slug}`,
        },
        {
          slug: 'pages',
          urlPath: (doc) => `/${doc.slug}`,
          // no contentField for block-based layouts — the page still appears in the
          // index, just without full-text content in llms-full.txt
        },
      ],
    }),
  ],
})
```

`llms.txt` should be served from your site's **root**, not under `/api`, so in Next.js apps add route handlers using the `/next` export instead of relying on the Payload-native endpoint:

```ts
// app/llms.txt/route.ts
import config from '@payload-config'
import { createLlmsTxtRouteHandler } from 'payload-plugin-llms-txt/next'

export const GET = createLlmsTxtRouteHandler(config, {
  /* same options object as above */
})
```

```ts
// app/llms-full.txt/route.ts
import config from '@payload-config'
import { createLlmsFullTxtRouteHandler } from 'payload-plugin-llms-txt/next'

export const GET = createLlmsFullTxtRouteHandler(config, {
  /* same options object as above */
})
```

For non-Next.js consumers, the plugin also registers `GET /llms.txt` and `GET /llms-full.txt` under Payload's configured API route (e.g. `/api/llms.txt`) automatically.

## Options

| Option               | Type                                 | Default  | Description                                                              |
| -------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------- |
| `collections`         | `LlmsTxtCollectionConfig[]`          | —        | Which collections to include, and how to read/link each document.        |
| `siteName`            | `string`                             | —        | Heading at the top of the generated file.                                |
| `siteDescription`     | `string`                             | —        | Intro blurb, unless overridden by the settings Global.                   |
| `siteURL`             | `string`                             | —        | Base URL used to build absolute links.                                   |
| `enableFullText`      | `boolean`                            | `false`  | Also generate `llms-full.txt` with full Markdown content inline.         |
| `addSettingsGlobal`   | `boolean \| string`                  | `false`  | Adds an admin-editable Global (enable toggle + intro override). Pass a string to customize its slug. |
| `limitPerCollection`  | `number`                             | `1000`   | Max documents fetched per collection.                                    |

### `LlmsTxtCollectionConfig`

| Option              | Type                                | Default        | Description                                                        |
| ------------------- | ----------------------------------- | -------------- | -------------------------------------------------------------------- |
| `slug`               | `string`                            | —              | Collection slug.                                                   |
| `titleField`         | `string`                            | `'title'`      | Field used as the entry title.                                     |
| `descriptionField`   | `string \| string[]`                | —              | Dot-path field used as the index description (e.g. `'meta.description'`), or an ordered array of fallback fields — the first one with a non-empty value wins (e.g. `['llmsDescription', 'meta.description']`). |
| `contentField`       | `string`                            | —              | richText field name to convert to Markdown for `llms-full.txt`. Omit for block-based layouts (e.g. Payload's block-based Pages) — those entries stay index-only. |
| `urlPath`            | `(doc) => string`                   | —              | Builds the document's public path.                                 |
| `publishedOnly`      | `boolean`                           | `true`         | Filter to `_status: 'published'`. Set `false` for collections without drafts/versions. |
| `label`              | `string`                            | Capitalized slug | Section heading in the index.                                    |

## Limitations

- Block-based layout fields (e.g. Payload's Pages template with a `layout` array of blocks) aren't flattened to Markdown in v1 — configure `contentField` only for collections with a single richText field.
- `llms-full.txt` uses `editorConfigFactory.default()` for Markdown conversion; highly custom per-field Lexical features may not fully round-trip.

## License

MIT
