/**
 * readingEngineTests.ts
 * Automated tests for Reading Engine V3.
 * Tests: tokenizer, morphology deInflect, vocabulary lookup.
 */
import { vocabularyData } from "@/data/kanjiData";
import { deInflect } from "@/lib/morphology";
import { tokenize } from "@/lib/tokenizer";

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface AllTestResults {
  tokenizer: TestResult[];
  morphology: TestResult[];
  lookup: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

// ============================================================================
// LOOKUP HELPER (mirrors VocabPopover 6-level chain)
// ============================================================================

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function normalizeForMatch(str: string): string {
  return katakanaToHiragana(str.trim().toLowerCase());
}

function getConjugationCandidates(word: string): string[] {
  const candidates: string[] = [];
  const add = (base: string) => {
    if (base && !candidates.includes(base)) {
      candidates.push(base);
      const withMasu = `${base}ます`;
      if (!candidates.includes(withMasu)) candidates.push(withMasu);
    }
  };
  if (word.endsWith("ませんでした")) add(word.slice(0, -6));
  if (word.endsWith("ました")) add(`${word.slice(0, -3)}ます`);
  if (word.endsWith("ません")) add(`${word.slice(0, -3)}ます`);
  if (word.endsWith("なかった")) {
    add(`${word.slice(0, -4)}ない`);
    add(`${word.slice(0, -4)}ます`);
  }
  if (word.endsWith("かった")) add(`${word.slice(0, -3)}い`);
  if (word.endsWith("くない")) add(`${word.slice(0, -3)}い`);
  if (word.endsWith("ている")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("ていた")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("ています")) {
    add(`${word.slice(0, -4)}ます`);
    add(`${word.slice(0, -4)}る`);
  }
  if (word.endsWith("ていました")) {
    add(`${word.slice(0, -5)}ます`);
    add(`${word.slice(0, -5)}る`);
  }
  if (word.endsWith("んでいます")) {
    add(`${word.slice(0, -5)}にます`);
    add(`${word.slice(0, -5)}びます`);
    add(`${word.slice(0, -5)}みます`);
  }
  if (word.endsWith("んでいる")) {
    add(`${word.slice(0, -4)}にます`);
    add(`${word.slice(0, -4)}びます`);
    add(`${word.slice(0, -4)}みます`);
  }
  if (word.endsWith("った")) {
    const s = word.slice(0, -2);
    candidates.push(`${s}ります`, `${s}います`, `${s}ます`);
  }
  if (word.endsWith("いた")) add(word.slice(0, -2));
  if (word.endsWith("いた")) candidates.push(`${word.slice(0, -2)}きます`);
  if (word.endsWith("んだ")) {
    const s = word.slice(0, -2);
    candidates.push(`${s}にます`, `${s}びます`, `${s}みます`);
  }
  if (word.endsWith("した")) {
    const s = word.slice(0, -2);
    candidates.push(`${s}します`, `${s}する`);
  }
  if (
    word.endsWith("た") &&
    !word.endsWith("った") &&
    !word.endsWith("いた") &&
    !word.endsWith("した") &&
    !word.endsWith("かった") &&
    !word.endsWith("ました")
  ) {
    add(`${word.slice(0, -1)}ます`);
    add(`${word.slice(0, -1)}る`);
  }
  return candidates;
}

function lookupWord(word: string): boolean {
  if (!word.trim()) return false;
  const normalWord = normalizeForMatch(word);
  const all = vocabularyData;

  if (all.find((e) => e.vocabulary === word)) return true;
  if (all.find((e) => normalizeForMatch(e.vocabulary) === normalWord))
    return true;
  if (all.find((e) => (e.romaji ?? "").toLowerCase().trim() === normalWord))
    return true;

  const candidates = getConjugationCandidates(word);
  for (const c of candidates) {
    const nc = normalizeForMatch(c);
    if (all.find((e) => e.vocabulary === c)) return true;
    if (all.find((e) => normalizeForMatch(e.vocabulary) === nc)) return true;
  }

  // deInflect-based lookup
  const deInflected = deInflect(word);
  for (const r of deInflected) {
    const df = r.dictionaryForm;
    const ndf = normalizeForMatch(df);
    if (all.find((e) => e.vocabulary === df)) return true;
    if (all.find((e) => normalizeForMatch(e.vocabulary) === ndf)) return true;
  }

  if (
    all.find((e) => e.vocabulary.length >= 2 && word.startsWith(e.vocabulary))
  )
    return true;
  if (
    word.length >= 2 &&
    all.find(
      (e) =>
        e.vocabulary.length >= 2 &&
        (e.vocabulary.includes(word) || word.includes(e.vocabulary)),
    )
  )
    return true;

  return false;
}

// ============================================================================
// TOKENIZER TESTS
// ============================================================================

function runTokenizerTests(): TestResult[] {
  const cases = [
    {
      input: "昨日学校で友達と食べました。",
      expectedContains: ["学校", "で", "友達", "と"],
    },
    {
      input: "会議の前に資料を準備しました。",
      expectedContains: ["会議", "の", "資料", "を"],
    },
    { input: "野菜と肉を買いました。", expectedContains: ["野菜", "と"] },
    { input: "田中さんは会社へ行きました。", expectedContains: ["会社", "へ"] },
  ];

  return cases.map(({ input, expectedContains }) => {
    const tokens = tokenize(input, vocabularyData);
    const allFound = expectedContains.every((e) => tokens.includes(e));
    return {
      input,
      expected: `Contains: [${expectedContains.join(", ")}]`,
      actual: `Tokens: [${tokens.join(", ")}]`,
      passed: allFound,
    };
  });
}

// ============================================================================
// MORPHOLOGY TESTS
// ============================================================================

function runMorphologyTests(): TestResult[] {
  const cases: Array<{
    input: string;
    expectedDf: string;
    expectedPattern: string;
  }> = [
    {
      input: "食べました",
      expectedDf: "食べます",
      expectedPattern: "Past Tense (ました)",
    },
    {
      input: "食べています",
      expectedDf: "食べます",
      expectedPattern: "～ています",
    },
    {
      input: "食べていました",
      expectedDf: "食べます",
      expectedPattern: "～ていました",
    },
    {
      input: "行った",
      expectedDf: "行きます",
      expectedPattern: "Past Casual (た)",
    },
    {
      input: "行っています",
      expectedDf: "行きます",
      expectedPattern: "～ています",
    },
    {
      input: "飲んでいる",
      expectedDf: "飲みます",
      expectedPattern: "～ている",
    },
    {
      input: "読んだ",
      expectedDf: "読みます",
      expectedPattern: "Past Casual (た)",
    },
    {
      input: "書いた",
      expectedDf: "書きます",
      expectedPattern: "Past Casual (た)",
    },
    {
      input: "高かった",
      expectedDf: "高い",
      expectedPattern: "I-Adjective Past (かった)",
    },
    {
      input: "高くない",
      expectedDf: "高い",
      expectedPattern: "I-Adjective Negative (くない)",
    },
  ];

  return cases.map(({ input, expectedDf, expectedPattern }) => {
    const results = deInflect(input);
    const match = results.find(
      (r) =>
        r.dictionaryForm === expectedDf && r.grammarPattern === expectedPattern,
    );
    return {
      input,
      expected: `${expectedDf} / ${expectedPattern}`,
      actual:
        results.length > 0
          ? results
              .map((r) => `${r.dictionaryForm} / ${r.grammarPattern}`)
              .join(" | ")
          : "(no results)",
      passed: !!match,
    };
  });
}

// ============================================================================
// LOOKUP TESTS
// ============================================================================

function runLookupTests(): TestResult[] {
  const words = [
    "会議",
    "資料",
    "発表",
    "野菜",
    "食べます",
    "飲みます",
    "高い",
    "勉強",
    "電車",
    "病院",
  ];
  return words.map((word) => {
    const found = lookupWord(word);
    return {
      input: word,
      expected: "found in database",
      actual: found ? "found" : "NOT FOUND",
      passed: found,
    };
  });
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

export function runAllTests(): AllTestResults {
  const tokenizer = runTokenizerTests();
  const morphology = runMorphologyTests();
  const lookup = runLookupTests();

  const all = [...tokenizer, ...morphology, ...lookup];
  const passed = all.filter((t) => t.passed).length;

  return {
    tokenizer,
    morphology,
    lookup,
    summary: {
      total: all.length,
      passed,
      failed: all.length - passed,
      successRate: all.length > 0 ? Math.round((passed / all.length) * 100) : 0,
    },
  };
}
