'use server';

import { z } from 'zod';
import { analyzeLyrics } from '@/ai/flows/analyze-lyrics';

const actionSchema = z.object({
  lyrics: z.string(),
});

export async function handleAnalyze(formData: FormData) {
  try {
    const parsed = actionSchema.parse(Object.fromEntries(formData));
    const result = await analyzeLyrics({ lyrics: parsed.lyrics });
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    return { error: 'Failed to analyze lyrics. Please try again.' };
  }
}
