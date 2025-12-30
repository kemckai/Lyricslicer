'use server';

import { z } from 'zod';
import { analyzeLyrics, type AnalyzeLyricsOutput } from '@/ai/flows/analyze-lyrics';

const actionSchema = z.object({
  lyrics: z.string(),
});

export async function handleAnalyze(formData: FormData): Promise<AnalyzeLyricsOutput | { error: string }> {
  try {
    const parsed = actionSchema.parse(Object.fromEntries(formData));
    const result = await analyzeLyrics({ lyrics: parsed.lyrics });
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to analyze lyrics: ${errorMessage}` };
  }
}
