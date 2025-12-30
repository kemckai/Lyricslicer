/**
 * Client-side lyric analyzer - works without a server
 * FREE implementation - no API keys required!
 */

export type AnalyzeLyricsOutput = {
  syllableAnalysis: string;
  rhymeAnalysis: string;
};

/**
 * Simple syllable counter using vowel counting heuristic
 */
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  
  // Count vowel groups (consecutive vowels count as one syllable)
  const vowelGroups = cleanWord.match(/[aeiouy]+/g);
  let syllableCount = vowelGroups ? vowelGroups.length : 0;
  
  // Handle silent 'e' at the end
  if (cleanWord.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }
  
  // Handle words with no vowels (like 'why' or single consonants)
  if (syllableCount === 0 && cleanWord.length > 0) {
    syllableCount = 1;
  }
  
  // Minimum 1 syllable for any word
  return Math.max(1, syllableCount);
}

/**
 * Extracts the last word from a line for rhyme detection
 */
function getLastWord(line: string): string {
  const words = line.trim().split(/\s+/);
  const lastWord = words[words.length - 1] || '';
  // Remove punctuation
  return lastWord.toLowerCase().replace(/[^\w]/g, '');
}

/**
 * Simple rhyme detection based on word endings
 * Checks if two words rhyme by comparing their last 2-4 characters
 */
function wordsRhyme(word1: string, word2: string): boolean {
  if (!word1 || !word2 || word1 === word2) return false;
  
  // Check last 2, 3, and 4 characters
  for (let len = 4; len >= 2; len--) {
    const ending1 = word1.slice(-len);
    const ending2 = word2.slice(-len);
    if (ending1 === ending2 && ending1.length >= 2) {
      return true;
    }
  }
  return false;
}

/**
 * Counts syllables in a line
 */
function countSyllablesInLine(line: string): number {
  const words = line.trim().split(/\s+/).filter(w => w.length > 0);
  return words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);
}

/**
 * Analyzes lyrics for syllable counts and rhyme patterns
 * Works entirely client-side - perfect for static sites like GitHub Pages!
 */
export function analyzeLyrics(lyrics: string): AnalyzeLyricsOutput {
  try {
    if (!lyrics || typeof lyrics !== 'string') {
      throw new Error('Invalid lyrics input: lyrics must be a string');
    }
    
    if (lyrics.trim().length === 0) {
      return {
        syllableAnalysis: 'No lyrics provided.',
        rhymeAnalysis: 'No lyrics provided.',
      };
    }
    
    const lines = lyrics.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return {
        syllableAnalysis: 'No lyrics provided.',
        rhymeAnalysis: 'No lyrics provided.',
      };
    }

    // Syllable Analysis
    const syllableData = lines.map((line, index) => {
      const count = countSyllablesInLine(line);
      return {line: index + 1, text: line, syllables: count};
    });

    const totalSyllables = syllableData.reduce((sum, data) => sum + data.syllables, 0);
    const avgSyllables = (totalSyllables / lines.length).toFixed(1);
    const minSyllables = Math.min(...syllableData.map(d => d.syllables));
    const maxSyllables = Math.max(...syllableData.map(d => d.syllables));

    let syllableAnalysis = `Total Lines: ${lines.length}\n`;
    syllableAnalysis += `Total Syllables: ${totalSyllables}\n`;
    syllableAnalysis += `Average Syllables per Line: ${avgSyllables}\n`;
    syllableAnalysis += `Range: ${minSyllables} - ${maxSyllables} syllables\n\n`;
    syllableAnalysis += `Line-by-Line Breakdown:\n`;
    syllableAnalysis += syllableData.map(d => 
      `Line ${d.line}: ${d.syllables} syllable${d.syllables !== 1 ? 's' : ''} - "${d.text.substring(0, 50)}${d.text.length > 50 ? '...' : ''}"`
    ).join('\n');

    // Rhyme Analysis
    const lastWords = lines.map(line => getLastWord(line));
    const rhymeScheme: string[] = [];
    let rhymeLabel = 'A';
    const usedLabels: {[key: string]: string} = {};

    lines.forEach((line, index) => {
      const lastWord = lastWords[index];
      if (!lastWord) {
        rhymeScheme.push('-');
        return;
      }

      // Check if this word rhymes with any previous line
      let foundMatch = false;
      for (let i = 0; i < index; i++) {
        const prevWord = lastWords[i];
        if (prevWord && wordsRhyme(lastWord, prevWord)) {
          const prevLabel = rhymeScheme[i];
          rhymeScheme.push(prevLabel);
          usedLabels[lastWord] = prevLabel;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Check if we've seen this exact word before
        if (usedLabels[lastWord]) {
          rhymeScheme.push(usedLabels[lastWord]);
        } else {
          rhymeScheme.push(rhymeLabel);
          usedLabels[lastWord] = rhymeLabel;
          // Move to next letter (A-Z, then AA, AB, etc.)
          if (rhymeLabel === 'Z') {
            rhymeLabel = 'AA';
          } else if (rhymeLabel.length === 1) {
            rhymeLabel = String.fromCharCode(rhymeLabel.charCodeAt(0) + 1);
          } else {
            // Handle AA, AB, etc.
            const lastChar = rhymeLabel[rhymeLabel.length - 1];
            if (lastChar === 'Z') {
              rhymeLabel = rhymeLabel.slice(0, -1) + 'A' + 'A';
            } else {
              rhymeLabel = rhymeLabel.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
            }
          }
        }
      }
    });

    let rhymeAnalysis = `Rhyme Scheme: ${rhymeScheme.join(' ')}\n\n`;
    
    // Group lines by rhyme
    const rhymeMap: {[key: string]: number[]} = {};
    rhymeScheme.forEach((label, index) => {
      if (label !== '-') {
        if (!rhymeMap[label]) rhymeMap[label] = [];
        rhymeMap[label].push(index + 1);
      }
    });

    const rhymeGroupsList = Object.entries(rhymeMap)
      .filter(([_, lines]) => lines.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (rhymeGroupsList.length > 0) {
      rhymeAnalysis += `Rhyming Patterns Found:\n`;
      rhymeGroupsList.forEach(([label, lineNumbers]) => {
        rhymeAnalysis += `  ${label}: Lines ${lineNumbers.join(', ')} (${lineNumbers.length} lines)\n`;
      });
    } else {
      rhymeAnalysis += `No clear rhyming patterns detected.\n`;
    }

    rhymeAnalysis += `\nDetailed Rhyme Mapping:\n`;
    lines.forEach((line, index) => {
      const label = rhymeScheme[index];
      const lastWord = lastWords[index];
      rhymeAnalysis += `Line ${index + 1} (${label}): "${line}" - ending: "${lastWord}"\n`;
    });

    return {
      syllableAnalysis,
      rhymeAnalysis,
    };
  } catch (error) {
    console.error('Error in analyzeLyrics:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Analysis failed: ${errorMessage}`);
  }
}

