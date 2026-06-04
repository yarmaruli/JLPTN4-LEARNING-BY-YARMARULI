/**
 * exampleSentences.ts
 * Helper to find example sentences from reading passages
 * that contain a given vocabulary word.
 */

import {
  ADAPTIVE_PASSAGES,
  JLPT_PASSAGES,
  LEARNING_PASSAGES,
} from "@/lib/readingEngine";

/**
 * Find up to `maxCount` example sentences from reading passages
 * that contain the given word (exact substring match).
 */
export function findExampleSentences(word: string, maxCount = 2): string[] {
  try {
    const allPassages = [
      ...LEARNING_PASSAGES,
      ...JLPT_PASSAGES,
      ...ADAPTIVE_PASSAGES,
    ];
    const sentences: string[] = [];
    const seen = new Set<string>();

    for (const passage of allPassages) {
      if (sentences.length >= maxCount) break;
      for (const sentence of passage.sentences) {
        if (sentences.length >= maxCount) break;
        if (seen.has(sentence)) continue;

        // Skip empty lines and metadata lines
        if (sentence.trim().length === 0) continue;
        if (
          sentence.startsWith("【") ||
          sentence.startsWith("◆") ||
          sentence.startsWith("★")
        )
          continue;
        if (sentence.includes("|") || sentence.includes("---")) continue; // table lines
        if (/^\d+[:：]/.test(sentence)) continue; // time/number prefixes
        if (sentence.length < 5) continue; // too short

        // Check if word appears in the sentence
        if (sentence.includes(word)) {
          sentences.push(sentence);
          seen.add(sentence);
        }
      }
    }

    return sentences;
  } catch {
    return [];
  }
}
