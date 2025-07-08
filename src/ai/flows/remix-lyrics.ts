'use server';

/**
 * @fileOverview A lyric remixing AI agent.
 *
 * - remixLyrics - A function that handles the lyric remixing process.
 * - RemixLyricsInput - The input type for the remixLyrics function.
 * - RemixLyricsOutput - The return type for the remixLyrics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RemixLyricsInputSchema = z.object({
  lyrics: z.string().describe('The lyrics to remix.'),
  numRemixes: z.number().default(3).describe('The number of remixed versions to generate.'),
});
export type RemixLyricsInput = z.infer<typeof RemixLyricsInputSchema>;

const RemixLyricsOutputSchema = z.object({
  remixes: z.array(z.string()).describe('An array of remixed lyric versions.'),
});
export type RemixLyricsOutput = z.infer<typeof RemixLyricsOutputSchema>;

export async function remixLyrics(input: RemixLyricsInput): Promise<RemixLyricsOutput> {
  return remixLyricsFlow(input);
}

const remixLyricsPrompt = ai.definePrompt({
  name: 'remixLyricsPrompt',
  input: {schema: RemixLyricsInputSchema},
  output: {schema: RemixLyricsOutputSchema},
  prompt: `You are a professional songwriter. You are given lyrics and must remix them in
  multiple different versions while attempting to keep the same structure and keywords.
  Here are the original lyrics:
  \n
  {{{lyrics}}}
  \n
  Generate {{{numRemixes}}} remixed versions of the lyrics. Return the remixes as a JSON array.
  `, // Added explicit instruction for JSON array output
});

const remixLyricsFlow = ai.defineFlow(
  {
    name: 'remixLyricsFlow',
    inputSchema: RemixLyricsInputSchema,
    outputSchema: RemixLyricsOutputSchema,
  },
  async input => {
    const {output} = await remixLyricsPrompt(input);
    return output!;
  }
);
