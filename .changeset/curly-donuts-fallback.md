---
"payload-plugin-llms-txt": minor
---

`descriptionField` now accepts an ordered array of fallback fields in addition to a single field path. The first field with a non-empty value wins — e.g. `descriptionField: ['llmsDescription', 'meta.description']` tries a dedicated LLM-facing description first and falls back to an SEO description field when it's empty.
