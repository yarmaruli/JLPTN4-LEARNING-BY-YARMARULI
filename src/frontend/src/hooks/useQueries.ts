import { useMemo } from "react";
import {
  type KanjiEntry,
  type RadicalInfo,
  type VocabularyEntry,
  kanjiData,
  radicalData,
  vocabularyData,
} from "../data/kanjiData";
import { normalizeText } from "../lib/textNormalize";

// Hook to get all kanji with optional filters
export function useGetAllKanji(
  searchTerm?: string,
  jlptLevel?: string | null,
  wordType?: string | null,
  radical?: string | null,
) {
  const filteredData = useMemo(() => {
    let result = [...kanjiData];

    if (searchTerm?.trim()) {
      const normalizedTerm = normalizeText(searchTerm);
      result = result.filter(
        (kanji) =>
          normalizeText(kanji.character).includes(normalizedTerm) ||
          normalizeText(kanji.romaji).includes(normalizedTerm) ||
          normalizeText(kanji.meaning).includes(normalizedTerm),
      );
    }

    if (jlptLevel) {
      result = result.filter((kanji) => kanji.jlptLevel === jlptLevel);
    }

    if (wordType) {
      result = result.filter((kanji) => kanji.wordType === wordType);
    }

    if (radical) {
      result = result.filter((kanji) => kanji.radical === radical);
    }

    return result;
  }, [searchTerm, jlptLevel, wordType, radical]);

  return {
    data: filteredData,
    isLoading: false,
    error: null,
  };
}

// Hook to get all vocabulary with optional filters
export function useGetAllVocabulary(
  searchTerm?: string,
  jlptLevel?: string | null,
  wordType?: string | null,
  radical?: string | null,
  batchCode?: string | null,
  refreshKey?: number,
) {
  const filteredData = useMemo(() => {
    // refreshKey is a cache-busting signal — referencing it keeps the dep valid
    void refreshKey;
    // Merge base data with localStorage batch vocabulary
    let batchVocab: VocabularyEntry[] = [];
    try {
      const stored = localStorage.getItem("batchVocabulary");
      if (stored) {
        const parsed = JSON.parse(stored) as VocabularyEntry[];
        if (Array.isArray(parsed)) batchVocab = parsed;
      }
    } catch {
      batchVocab = [];
    }

    // Deduplicate: base vocabulary takes precedence; batch entries with same vocabulary string are merged
    const baseWords = new Set(vocabularyData.map((v) => v.vocabulary));
    const uniqueBatch = batchVocab.filter((v) => !baseWords.has(v.vocabulary));
    let result = [...vocabularyData, ...uniqueBatch];

    if (searchTerm?.trim()) {
      const normalizedTerm = normalizeText(searchTerm);
      result = result.filter(
        (vocab) =>
          normalizeText(vocab.vocabulary).includes(normalizedTerm) ||
          normalizeText(vocab.romaji).includes(normalizedTerm) ||
          normalizeText(vocab.meaning).includes(normalizedTerm) ||
          // Also search by batchCode
          normalizeText(vocab.batchCode ?? "").includes(normalizedTerm),
      );
    }

    if (jlptLevel) {
      result = result.filter((vocab) => vocab.jlptLevel === jlptLevel);
    }

    if (wordType) {
      result = result.filter((vocab) => vocab.wordType === wordType);
    }

    if (radical) {
      result = result.filter((vocab) => vocab.radical === radical);
    }

    if (batchCode) {
      result = result.filter(
        (vocab) => (vocab.batchCode ?? "UNKNOWN_BATCH") === batchCode,
      );
    }

    return result;
  }, [searchTerm, jlptLevel, wordType, radical, batchCode, refreshKey]);

  return {
    data: filteredData,
    isLoading: false,
    error: null,
  };
}

// Hook to get a single kanji by character
export function useGetKanjiByCharacter(character: string) {
  const kanji = useMemo(() => {
    if (!character) return null;
    return kanjiData.find((k) => k.character === character) || null;
  }, [character]);

  return {
    data: kanji,
    isLoading: false,
    error: null,
  };
}

// Hook to get a single vocabulary by word
export function useGetVocabularyByWord(word: string) {
  const vocab = useMemo(() => {
    if (!word) return null;
    return vocabularyData.find((v) => v.vocabulary === word) || null;
  }, [word]);

  return {
    data: vocab,
    isLoading: false,
    error: null,
  };
}

// Hook to get all radicals
export function useGetAllRadicals() {
  return {
    data: radicalData,
    isLoading: false,
    error: null,
  };
}

// Hook to get radical info by name
export function useGetRadicalInfo(radicalName: string) {
  const radical = useMemo(() => {
    if (!radicalName) return null;
    return radicalData.find((r) => r.name === radicalName) || null;
  }, [radicalName]);

  return {
    data: radical,
    isLoading: false,
    error: null,
  };
}

// Hook to get random kanji for quiz
export function useGetRandomKanji(count = 10) {
  const randomKanji = useMemo(() => {
    const shuffled = [...kanjiData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, [count]);

  return {
    data: randomKanji,
    isLoading: false,
    error: null,
  };
}

// Hook to get random vocabulary for quiz
export function useGetRandomVocabulary(count = 10) {
  const randomVocab = useMemo(() => {
    const shuffled = [...vocabularyData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, [count]);

  return {
    data: randomVocab,
    isLoading: false,
    error: null,
  };
}
