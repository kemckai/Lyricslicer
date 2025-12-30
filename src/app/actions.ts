'use server';

import { z } from 'zod';
import { analyzeLyrics, type AnalyzeLyricsOutput } from '@/ai/flows/analyze-lyrics';

const actionSchema = z.object({
  lyrics: z.string(),
});

export async function handleAnalyze(formData: FormData): Promise<AnalyzeLyricsOutput | { error: string }> {
  try {
    const rawData = Object.fromEntries(formData);
    console.log('Raw form data keys:', Object.keys(rawData));
    
    const parsed = actionSchema.parse(rawData);
    console.log('Parsed lyrics, length:', parsed.lyrics?.length || 0);
    
    if (!parsed.lyrics || parsed.lyrics.trim().length === 0) {
      return { error: 'Please provide lyrics to analyze.' };
    }
    
    const result = await analyzeLyrics({ lyrics: parsed.lyrics });
    
    // Validate result structure
    if (!result || typeof result !== 'object') {
      throw new Error('Analysis returned invalid result');
    }
    
    if (!result.syllableAnalysis || !result.rhymeAnalysis) {
      throw new Error('Analysis result missing required fields');
    }
    
    console.log('Analysis successful');
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = String(error);
    }
    
    return { error: `Failed to analyze lyrics: ${errorMessage}` };
  }
}
