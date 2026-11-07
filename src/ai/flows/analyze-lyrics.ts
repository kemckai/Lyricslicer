'use server';

/**
 * @fileOverview Analyzes lyrics for syllable count and end-rhyme scheme.
 *
 * Syllables and end rhymes are computed in-process. Analyze does not call
 * Gemini and does not need GEMINI_API_KEY or GOOGLE_API_KEY. See README.md.
 */

import {z} from 'zod';

import {analyzeLyricsText} from '@/lib/lyric-analysis';

const AnalyzeLyricsInputSchema = z.object({
  lyrics: z.string(),
});
export type AnalyzeLyricsInput = z.infer<typeof AnalyzeLyricsInputSchema>;

const AnalyzeLyricsOutputSchema = z.object({
  syllableAnalysis: z.string(),
  rhymeAnalysis: z.string(),
});
export type AnalyzeLyricsOutput = z.infer<typeof AnalyzeLyricsOutputSchema>;

export async function analyzeLyrics(input: AnalyzeLyricsInput): Promise<AnalyzeLyricsOutput> {
  const parsed = AnalyzeLyricsInputSchema.parse(input);
  return AnalyzeLyricsOutputSchema.parse(analyzeLyricsText(parsed.lyrics));
}
