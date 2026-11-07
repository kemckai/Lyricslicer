import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {remixLyrics, splitLyrics} from './slice-lyrics';

const verse = [
  'In a town of quiet streets, a silent heart still beats',
  'The moonlight — pale and thin — paints the window',
  "Hold on - don't let go; well-known roads",
].join('\n');

describe('splitLyrics line mode', () => {
  it('keeps the existing line split, including surrounding spaces', () => {
    assert.deepEqual(splitLyrics('alpha\n\n  beta  \n', 'line'), ['alpha', '  beta  ']);
  });

  it('drops lines that are only whitespace', () => {
    assert.deepEqual(splitLyrics('\n   \n', 'line'), []);
  });
});

describe('splitLyrics phrase mode', () => {
  it('cuts on commas, semicolons, dashes, and line breaks', () => {
    assert.deepEqual(splitLyrics(verse, 'phrase'), [
      'In a town of quiet streets',
      'a silent heart still beats',
      'The moonlight',
      'pale and thin',
      'paints the window',
      'Hold on',
      "don't let go",
      'well-known roads',
    ]);
  });

  it('cuts on sentence punctuation and ellipses without splitting hyphenated words', () => {
    assert.deepEqual(
      splitLyrics('Wait...\nAre you there? Yes. A well-known late-night train.', 'phrase'),
      ['Wait', 'Are you there', 'Yes', 'A well-known late-night train'],
    );
  });

  it('treats en dashes and double hyphens as breaks', () => {
    assert.deepEqual(splitLyrics('one – two--three', 'phrase'), ['one', 'two', 'three']);
  });

  it('drops punctuation-only input', () => {
    assert.deepEqual(splitLyrics(' , ; — ', 'phrase'), []);
  });
});

describe('splitLyrics word mode', () => {
  it('shuffles pieces that are individual words, keeping contractions and hyphens', () => {
    assert.deepEqual(splitLyrics("don't stop, well-known friend!", 'word'), [
      "don't",
      'stop',
      'well-known',
      'friend',
    ]);
  });

  it('keeps accented words intact', () => {
    assert.deepEqual(splitLyrics('café au lait', 'word'), ['café', 'au', 'lait']);
  });
});

describe('remixLyrics', () => {
  it('joins a deterministic shuffle with newlines', () => {
    const result = remixLyrics('a\nb\nc\nd', 'line', () => 0);
    assert.equal(result, 'b\nc\nd\na');
  });

  it('returns null when a mode finds nothing to slice', () => {
    assert.equal(remixLyrics('   \n  ', 'line'), null);
    assert.equal(remixLyrics('... ---', 'word'), null);
  });

  it('keeps a single slice unchanged', () => {
    assert.equal(remixLyrics('only one line here', 'line', () => 0), 'only one line here');
  });
});
