# LyricSlice

Paste lyrics, count syllables, see the end-rhyme scheme, and remix by line, phrase, or word.

## Analyze

Analyze runs inside the app. It does not call an external model and does not need an API key.

The previous analyzer called Genkit with `googleai/gemini-2.0-flash`. That fails on the deployed site for two independent reasons:

1. Genkit reads `GEMINI_API_KEY`, then `GOOGLE_API_KEY`, then `GOOGLE_GENAI_API_KEY`. None of these are set on the Vercel project `lyricslicer` (Production, Preview, or Development). With no key, Genkit throws `FAILED_PRECONDITION` before it sends a request, and the server action returns "Failed to analyze lyrics."
2. `gemini-2.0-flash` was shut down on June 1, 2026. Adding a key without changing the model would still fail.

Remix does not use that API. It slices lyrics in the browser, which is why Remix kept working. Line mode shuffles whole lines. Phrase mode cuts on commas, semicolons, dashes, and line breaks before shuffling. Word mode shuffles individual words and keeps contractions and hyphenated words together.

No environment variable is required for the current analyzer. Do not add `GEMINI_API_KEY` or `GOOGLE_API_KEY` unless you intentionally restore a model call, and do not point that call at `gemini-2.0-flash`.
