# V10 output language contract

The US market describes the audience and story world; it does not set the language of the creator's development documents.

Unless the creator explicitly requests another language, write every creator-facing development artifact in **简体中文**: Project Brief, direction comparison, adaptation decision table, complete story outline, character and relationship arcs, Story Package reading view, episode map, diagnostic report, review findings, gate summary, and exported document body. Keep section headings and explanations in Chinese.

For machine-readable JSON, keep contract property names, IDs, enum values, status codes, hashes, and source locators exactly as required by the schema. Write human-readable string values in Chinese, including `story_promise`, `full_story_outline`, episode beats, review `evidence` and `required_action`, and `next_step_for_user`. Preserve original titles, exact source quotations, and established English character or place names when needed; explain their dramatic meaning in Chinese. Do not turn a Chinese source outline into an English treatment just because the characters and setting are American.

At the later screenplay stage, only character dialogue and story-world text that must appear in the final US-facing video default to natural American English. Scene headings, action, performance notes, and production annotations stay in Chinese for creator review. If the creator explicitly requests English or bilingual development documents, follow that request and record the override in the Brief; bilingual means a deliberate parallel presentation, not accidental English prose.

Before delivery, scan the human-readable artifact: English should appear only in the allowed names, quotations, identifiers, and later screenplay dialogue. If headings or explanatory paragraphs are in English without a user request, rewrite them in Chinese before handing over the artifact. A line saying `Chinese development documents` while the actual document is English is a failed language check.

For a short formatting model, see [the Chinese development sample](../examples/chinese-development-sample.md). It shows Chinese brief, outline, episode and review prose while preserving machine field names and codes.
