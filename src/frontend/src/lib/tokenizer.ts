/**
 * tokenizer.ts
 * Rule-based Japanese tokenizer — no external dependencies.
 * Priority: (1) vocabulary dict longest-match, (2) particle detection,
 * (3) conjugation suffix detection, (4) individual kanji fallback,
 * (5) kana sequence fallback.
 */
import type { VocabularyEntry } from "@/data/kanjiData";

// Japanese character range checks
const isKanji = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return code >= 0x4e00 && code <= 0x9fff;
};

const isHiragana = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return code >= 0x3041 && code <= 0x309f;
};

const isKatakana = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x30a0 && code <= 0x30ff) || (code >= 0xff66 && code <= 0xff9f)
  );
};

const isJapanese = (ch: string): boolean =>
  isKanji(ch) || isHiragana(ch) || isKatakana(ch);

const isPunctuation = (ch: string): boolean => {
  const PUNCT = new Set([
    "。",
    "、",
    "！",
    "？",
    "…",
    "・",
    "「",
    "」",
    "【",
    "】",
    "（",
    "）",
    "〜",
    "：",
    "；",
  ]);
  return PUNCT.has(ch);
};

// Particles — ordered by length (longest first for greedy match)
const PARTICLES = [
  "から",
  "まで",
  "より",
  "でも",
  "では",
  "には",
  "へも",
  "への",
  "は",
  "が",
  "を",
  "に",
  "で",
  "と",
  "へ",
  "の",
  "も",
  "や",
  "か",
  "ね",
  "よ",
  "わ",
  "し",
  "て",
];

// Common conjugation endings (longest first)
const _CONJUGATION_ENDINGS = [
  "ませんでした",
  "てしまいました",
  "ていただきます",
  "ていただく",
  "させていただく",
  "ていただきました",
  "ましたか",
  "ましょう",
  "ませんか",
  "なかった",
  "くなかった",
  "ていました",
  "ていたい",
  "ている",
  "ていた",
  "でいます",
  "でいた",
  "させます",
  "させた",
  "られます",
  "られた",
  "すぎる",
  "すぎた",
  "がります",
  "がった",
  "します",
  "しました",
  "しない",
  "しなかった",
  "ました",
  "ません",
  "ないで",
  "なくて",
  "なかった",
  "いました",
  "います",
  "いない",
  "いた",
  "かった",
  "くない",
  "くて",
  "ます",
  "ない",
  "た",
  "て",
  "で",
];

/**
 * Build a vocab set sorted by word length (longest first) for greedy dict match.
 */
function buildVocabSet(vocab: VocabularyEntry[]): string[] {
  return vocab
    .map((e) => e.vocabulary ?? "")
    .filter((w) => w.length > 0)
    .sort((a, b) => b.length - a.length);
}

/**
 * Try to match a vocab word at the start of `text`.
 * Returns matched word string or null.
 */
function tryVocabMatch(text: string, sortedVocab: string[]): string | null {
  for (const word of sortedVocab) {
    if (text.startsWith(word)) return word;
  }
  return null;
}

/**
 * Try to match a particle at the start of `text`.
 */
function tryParticleMatch(text: string): string | null {
  for (const p of PARTICLES) {
    if (text.startsWith(p)) return p;
  }
  return null;
}

/**
 * Scan forward to find the largest chunk that ends before a particle or
 * punctuation, then treat it as one token (kanji+kana compound with conjugation).
 */
function greedyJapaneseToken(text: string, sortedVocab: string[]): string {
  // Try vocab match first
  const vm = tryVocabMatch(text, sortedVocab);
  if (vm) return vm;

  // Scan forward character by character.
  // We want to grab a morphologically plausible chunk:
  // kanji/kana run followed by conjugation suffix.
  // Simple heuristic: advance while chars are Japanese, stop at punctuation.
  let end = 0;
  while (
    end < text.length &&
    isJapanese(text[end]) &&
    !isPunctuation(text[end])
  ) {
    end++;
  }
  if (end === 0) return text[0]; // fallback: single char

  // Try to find the longest conjugation ending within this run
  const chunk = text.slice(0, end);

  // If chunk starts with kanji, try to split at a particle boundary within it
  for (let i = 1; i < chunk.length; i++) {
    const rest = chunk.slice(i);
    if (tryParticleMatch(rest) !== null) {
      // The part before the particle is one token
      return chunk.slice(0, i);
    }
  }

  return chunk;
}

/**
 * Main tokenize function.
 * Splits Japanese text into meaningful tokens.
 */
export function tokenize(text: string, vocab: VocabularyEntry[]): string[] {
  if (!text) return [];
  const sortedVocab = buildVocabSet(vocab);
  const tokens: string[] = [];
  let pos = 0;

  while (pos < text.length) {
    const ch = text[pos];

    // Punctuation → single token
    if (isPunctuation(ch)) {
      tokens.push(ch);
      pos++;
      continue;
    }

    // Non-Japanese → accumulate as latin/ascii token
    if (!isJapanese(ch)) {
      let end = pos + 1;
      while (
        end < text.length &&
        !isJapanese(text[end]) &&
        !isPunctuation(text[end])
      ) {
        end++;
      }
      const latin = text.slice(pos, end).trim();
      if (latin) tokens.push(latin);
      pos = end;
      continue;
    }

    // Japanese character — run tokenizer pipeline
    const remaining = text.slice(pos);

    // 1. Vocabulary longest-match
    const vocabMatch = tryVocabMatch(remaining, sortedVocab);
    if (vocabMatch) {
      tokens.push(vocabMatch);
      pos += vocabMatch.length;
      continue;
    }

    // 2. Particle match
    const particleMatch = tryParticleMatch(remaining);
    if (particleMatch) {
      tokens.push(particleMatch);
      pos += particleMatch.length;
      continue;
    }

    // 3. Greedy compound / conjugation token
    const compound = greedyJapaneseToken(remaining, sortedVocab);
    tokens.push(compound);
    pos += compound.length;
  }

  // Filter empty strings
  return tokens.filter((t) => t.trim().length > 0);
}

// ============================================================================
// BUILT-IN TEST RUNNER
// ============================================================================

export interface TokenizerTestCase {
  input: string;
  output: string[];
  expected: string[];
}

export function runTokenizerTests(
  vocab: VocabularyEntry[],
): TokenizerTestCase[] {
  const cases: Array<{ input: string; expected: string[] }> = [
    {
      input: "昨日学校で友達と食べました。",
      expected: ["昨日", "学校", "で", "友達", "と", "食べました", "。"],
    },
    {
      input: "会議の前に資料を準備しました。",
      expected: ["会議", "の", "前", "に", "資料", "を", "準備しました", "。"],
    },
    {
      input: "田中さんは会社へ行きました。",
      expected: ["田中", "さん", "は", "会社", "へ", "行きました", "。"],
    },
    {
      input: "野菜と肉を買いました。",
      expected: ["野菜", "と", "肉", "を", "買いました", "。"],
    },
  ];

  return cases.map(({ input, expected }) => ({
    input,
    output: tokenize(input, vocab),
    expected,
  }));
}
