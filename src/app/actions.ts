'use server';

import { z } from 'zod';
import { analyzeLyrics, type AnalyzeLyricsOutput } from '@/ai/flows/analyze-lyrics';

const actionSchema = z.object({
  lyrics: z.string(),
});

export async function handleAnalyze(formData: FormData): Promise<AnalyzeLyricsOutput | { error: string }> {
  try {
    const parsed = actionSchema.parse(Object.fromEntries(formData));
    console.log('Analyzing lyrics, length:', parsed.lyrics.length);
    const result = analyzeLyrics({ lyrics: parsed.lyrics });
    console.log('Analysis successful, result keys:', Object.keys(result));
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to analyze lyrics: ${errorMessage}` };
  }
}
