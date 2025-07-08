'use server';

import { z } from 'zod';
import { analyzeLyrics } from '@/ai/flows/analyze-lyrics';
import { remixLyrics } from '@/ai/flows/remix-lyrics';

const actionSchema = z.object({
  lyrics: z.string(),
  numRemixes: z.coerce.number().optional(),
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

export async function handleRemix(formData: FormData) {
  try {
    const parsed = actionSchema.parse(Object.fromEntries(formData));
    const result = await remixLyrics({ lyrics: parsed.lyrics, numRemixes: parsed.numRemixes || 3 });
    return result;
  } catch (error) {
    console.error('Remixing error:', error);
    return { error: 'Failed to remix lyrics. Please try again.' };
  }
}
