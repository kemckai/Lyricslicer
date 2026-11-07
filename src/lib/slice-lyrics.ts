export type SliceMode = 'line' | 'phrase' | 'word';

export const SLICE_MODES: readonly SliceMode[] = ['line', 'phrase', 'word'];

export const SLICE_MODE_LABELS: Record<SliceMode, string> = {
  line: 'Line',
  phrase: 'Phrase',
  word: 'Word',
};

export const SLICE_MODE_HINTS: Record<SliceMode, string> = {
  line: 'Shuffle whole lines.',
  phrase: 'Cut on commas, semicolons, dashes, and line breaks, then shuffle.',
  word: 'Shuffle individual words. Contractions and hyphenated words stay together.',
};

export const SLICE_MODE_RESULTS: Record<SliceMode, string> = {
  line: 'Shuffled lines. Edit them freely.',
  phrase: 'Shuffled phrases. Edit them freely.',
  word: 'Shuffled words, one per line. Edit them freely.',
};

/**
 * Phrase breaks: line breaks, commas, semicolons, colons, sentence punctuation,
 * ellipses, em/en dashes, spaced hyphens, and double hyphens.
 * A single hyphen inside a word (well-known) is not a break.
 */
const PHRASE_DELIMITER = /\r?\n+|[,;:]+|(?:\.{3}|…+)|[.!?]+|\s+-\s+|--+|[–—]+/g;

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function splitLyrics(lyrics: string, mode: SliceMode): string[] {
  switch (mode) {
    case 'line':
      return lyrics.split('\n').filter(line => line.trim() !== '');
    case 'phrase':
      return lyrics
        .split(PHRASE_DELIMITER)
        .map(part => part.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '').trim())
        .filter(part => part.length > 0);
    case 'word':
      return lyrics.match(WORD) ?? [];
  }
}

export function shuffleItems<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

/** Shuffle the slices for a mode. Returns null when there is nothing to remix. */
export function remixLyrics(
  lyrics: string,
  mode: SliceMode,
  random: () => number = Math.random,
): string | null {
  const slices = splitLyrics(lyrics, mode);
  if (slices.length === 0) return null;
  return shuffleItems(slices, random).join('\n');
}
