import {syllable} from 'syllable';

export type LyricAnalysis = {
  syllableAnalysis: string;
  rhymeAnalysis: string;
};

/**
 * Words that are not useful end-rhyme anchors. They would otherwise collapse
 * onto a single vowel and match unrelated lines.
 */
const NON_RHYMING_WORDS = new Set(['a', 'an', 'the', 'of', 'to', 'and', 'or']);

const PHONETIC_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/ght/g, 't'],
  [/ph/g, 'f'],
  [/^kn/g, 'n'],
  [/^wr/g, 'r'],
  [/^wh/g, 'w'],
  [/qu/g, 'kw'],
  [/ck/g, 'k'],
  [/eigh/g, 'a'],
  [/igh/g, 'i'],
  [/ee|ea(?!r)/g, 'i'],
  [/oo|ou|ue|ew/g, 'u'],
  [/ai|ay|ey/g, 'a'],
  [/oa|ow/g, 'o'],
  [/y/g, 'i'],
];

/** Last word of a lyric line, ignoring punctuation. */
export function lastWord(line: string): string {
  const words = line.match(/[A-Za-z0-9']+/g);
  return words?.[words.length - 1] ?? '';
}

/**
 * Phonetic tail used to compare end rhymes: the last vowel sound plus any
 * following consonants. "streets" and "beats" both reduce to "its".
 * Returns null when the word should not participate in the rhyme scheme.
 */
export function rhymeSignature(word: string): string | null {
  const raw = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!raw || NON_RHYMING_WORDS.has(raw)) return null;

  let phonetic = raw;
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    phonetic = phonetic.replace(pattern, replacement);
  }

  if (phonetic.length > 2 && phonetic.endsWith('e') && /[aeiou]/.test(phonetic.slice(0, -1))) {
    phonetic = phonetic.slice(0, -1);
  }

  const tail = phonetic.match(/[aeiou][^aeiou]*$/);
  return tail?.[0] ?? phonetic;
}

function schemeLetter(index: number): string {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function joinLabels(indexes: number[]): string {
  const numbers = indexes.map(index => String(index + 1));
  if (numbers.length === 1) return numbers[0];
  if (numbers.length === 2) return `${numbers[0]} and ${numbers[1]}`;
  return `${numbers.slice(0, -1).join(', ')}, and ${numbers[numbers.length - 1]}`;
}

export function analyzeLyricsText(lyrics: string): LyricAnalysis {
  const lines = lyrics
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /[A-Za-z0-9]/.test(line));

  if (lines.length === 0) {
    return {
      syllableAnalysis: 'No lyrics to analyze.',
      rhymeAnalysis: 'No lyrics to analyze.',
    };
  }

  const counts = lines.map(line => syllable(line));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const average = total / lines.length;
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  const syllableAnalysis = [
    `${lines.length} line${lines.length === 1 ? '' : 's'}, ${total} syllable${total === 1 ? '' : 's'}.`,
    `Average ${formatNumber(average)} per line (range ${min}–${max}).`,
    '',
    ...lines.map((line, index) => `${index + 1}. (${counts[index]}) ${line}`),
  ].join('\n');

  const signatures = lines.map(line => rhymeSignature(lastWord(line)));
  const labels: string[] = [];
  const labelForSignature = new Map<string, string>();
  let nextLabel = 0;

  for (const signature of signatures) {
    if (!signature) {
      labels.push(schemeLetter(nextLabel));
      nextLabel += 1;
      continue;
    }
    const existing = labelForSignature.get(signature);
    if (existing) {
      labels.push(existing);
      continue;
    }
    const label = schemeLetter(nextLabel);
    nextLabel += 1;
    labelForSignature.set(signature, label);
    labels.push(label);
  }

  const grouped = new Map<string, number[]>();
  labels.forEach((label, index) => {
    const linesWithLabel = grouped.get(label) ?? [];
    linesWithLabel.push(index);
    grouped.set(label, linesWithLabel);
  });

  const rhymes = [...grouped.entries()].filter(([, indexes]) => indexes.length > 1);
  const rhymeLines = rhymes.map(([label, indexes]) => {
    const words = indexes.map(index => `"${lastWord(lines[index])}"`).join(' / ');
    return `${label} — lines ${joinLabels(indexes)} (${words})`;
  });

  const rhymeAnalysis = [
    `Rhyme scheme: ${labels.join(' ')}`,
    '',
    rhymes.length > 0 ? `End rhymes:\n${rhymeLines.join('\n')}` : 'No repeated end rhymes found.',
  ].join('\n');

  return {syllableAnalysis, rhymeAnalysis};
}
