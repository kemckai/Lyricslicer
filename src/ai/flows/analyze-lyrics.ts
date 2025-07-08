'use server';

/**
 * @fileOverview Analyzes lyrics for syllable count and rhyme patterns.
 *
 * - analyzeLyrics - A function that analyzes the lyrics and returns the analysis.
 * - AnalyzeLyricsInput - The input type for the analyzeLyrics function.
 * - AnalyzeLyricsOutput - The return type for the analyzeLyrics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLyricsInputSchema = z.object({
  lyrics: z.string().describe('The lyrics to analyze.'),
});
export type AnalyzeLyricsInput = z.infer<typeof AnalyzeLyricsInputSchema>;

const AnalyzeLyricsOutputSchema = z.object({
  syllableAnalysis: z
    .string()
    .describe('Analysis of syllable counts in each line.'),
  rhymeAnalysis: z.string().describe('Analysis of rhyme patterns in the lyrics.'),
});
export type AnalyzeLyricsOutput = z.infer<typeof AnalyzeLyricsOutputSchema>;

export async function analyzeLyrics(input: AnalyzeLyricsInput): Promise<AnalyzeLyricsOutput> {
  return analyzeLyricsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLyricsPrompt',
  input: {schema: AnalyzeLyricsInputSchema},
  output: {schema: AnalyzeLyricsOutputSchema},
  prompt: `You are a professional lyric analyzer. Analyze the following lyrics for syllable count and rhyme patterns. Provide detailed analysis.

Lyrics: {{{lyrics}}}`,
});

const analyzeLyricsFlow = ai.defineFlow(
  {
    name: 'analyzeLyricsFlow',
    inputSchema: AnalyzeLyricsInputSchema,
    outputSchema: AnalyzeLyricsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
