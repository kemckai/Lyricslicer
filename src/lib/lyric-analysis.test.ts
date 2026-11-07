import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {analyzeLyricsText, rhymeSignature} from './lyric-analysis';

describe('rhymeSignature', () => {
  it('matches common perfect rhymes', () => {
    const pairs = [
      ['streets', 'beats'],
      ['heart', 'start'],
      ['night', 'light'],
      ['love', 'above'],
      ['time', 'rhyme'],
      ['fire', 'desire'],
      ['glow', 'below'],
      ['day', 'away'],
      ['go', 'know'],
      ['moon', 'soon'],
    ];
    for (const [left, right] of pairs) {
      assert.equal(rhymeSignature(left), rhymeSignature(right), `${left}/${right}`);
    }
  });

  it('does not treat unrelated endings as rhymes', () => {
    assert.notEqual(rhymeSignature('cat'), rhymeSignature('car'));
    assert.notEqual(rhymeSignature('quiet'), rhymeSignature('street'));
    assert.notEqual(rhymeSignature('love'), rhymeSignature('live'));
  });

  it('ignores function words that would collapse to a bare vowel', () => {
    assert.equal(rhymeSignature('the'), null);
    assert.equal(rhymeSignature('and'), null);
  });
});

describe('analyzeLyricsText', () => {
  const verse = [
    'I walked along the quiet street',
    'And heard the rhythm of my feet',
    'The city lights began to glow',
    'On every window down below',
  ].join('\n');

  it('counts syllables per line and reports an AABB scheme', () => {
    const result = analyzeLyricsText(verse);
    assert.match(result.syllableAnalysis, /^4 lines, \d+ syllables\./);
    assert.match(result.syllableAnalysis, /1\. \(\d+\) I walked along the quiet street/);
    assert.match(result.syllableAnalysis, /4\. \(\d+\) On every window down below/);
    assert.match(result.rhymeAnalysis, /^Rhyme scheme: A A B B/);
    assert.match(result.rhymeAnalysis, /A — lines 1 and 2 \("street" \/ "feet"\)/);
    assert.match(result.rhymeAnalysis, /B — lines 3 and 4 \("glow" \/ "below"\)/);
  });

  it('skips blank lines and still rhymes the remaining ones', () => {
    const result = analyzeLyricsText('heart of the night\n\nwaiting for the light\n');
    assert.match(result.syllableAnalysis, /^2 lines,/);
    assert.match(result.rhymeAnalysis, /^Rhyme scheme: A A/);
  });

  it('reports when nothing repeats', () => {
    const result = analyzeLyricsText('one lonely line of lyrics here\nanother line that does not match it');
    assert.match(result.rhymeAnalysis, /No repeated end rhymes found/);
    assert.match(result.rhymeAnalysis, /^Rhyme scheme: A B/);
  });

  it('returns a clear result for empty input', () => {
    assert.deepEqual(analyzeLyricsText('   \n\n  '), {
      syllableAnalysis: 'No lyrics to analyze.',
      rhymeAnalysis: 'No lyrics to analyze.',
    });
  });
});
