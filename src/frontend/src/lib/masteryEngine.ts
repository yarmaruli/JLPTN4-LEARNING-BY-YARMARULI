/**
 * masteryEngine.ts
 * Adaptive quiz engine with mastery tracking, analytics, and learning profile.
 * Offline-first: all state persisted to localStorage.
 * NEVER throws — all errors are caught and safe defaults returned.
 */

import type { KanjiEntry, VocabularyEntry } from "@/data/kanjiData";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface MasteryData {
  itemId: string;
  masteryLevel: number; // 0=Baru, 1=Sering Salah, 2=Mulai Kenal, 3=Cukup Paham, 4=Hampir Hafal, 5=Mastered
  correctCount: number;
  wrongCount: number;
  lastSeen: string; // ISO date string
}

export interface LearningAnalytics {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number; // 0-100
  strongestCategory: string;
  weakestCategory: string;
  averageSessionLength: number;
}

export interface LearningProfile {
  strength: string[];
  weakness: string[];
  preferredLearningStyle: string[];
}

export interface StudyState {
  currentLevel: string; // e.g. 'JLPT N4'
  currentFocus: string[]; // e.g. ['kanji', 'vocabulary']
  currentReadingLevel: number; // 1–3
}

export type QuizMode = "quick" | "study" | "weakness";
export type DifficultyLevel = "easy" | "normal" | "hard";
export type JlptLevelMode = "n4focus" | "n5only" | "all";

export interface AdaptiveQuestion {
  id: string;
  type:
    | "kanji-meaning"
    | "meaning-kanji"
    | "kanji-reading"
    | "vocab-meaning"
    | "meaning-vocab";
  question: string;
  options: string[]; // always 4 options
  correctIndex: number;
  itemId: string;
  category: "kanji" | "vocabulary";
  difficulty: DifficultyLevel;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const MASTERY_KEY = "masteryData";
const VOCAB_TRACKING_KEY = "vocabTracking";
const READING_ANALYTICS_KEY = "readingAnalytics";
const ANALYTICS_KEY = "learningAnalytics";
const CONSECUTIVE_N5_KEY = "kanjikan_consecutive_n5";
const N4_BOOST_REMAINING_KEY = "kanjikan_n4_boost_remaining";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_ANALYTICS: LearningAnalytics = {
  totalQuestions: 0,
  totalCorrect: 0,
  totalWrong: 0,
  accuracyRate: 0,
  strongestCategory: "kanji",
  weakestCategory: "vocabulary",
  averageSessionLength: 10,
};

const DEFAULT_STUDY_STATE: StudyState = {
  currentLevel: "JLPT N4",
  currentFocus: ["kanji", "vocabulary"],
  currentReadingLevel: 1,
};

const DEFAULT_PROFILE: LearningProfile = {
  strength: [],
  weakness: [],
  preferredLearningStyle: [],
};

// ============================================================================
// MASTERY STORAGE
// ============================================================================

export function loadMasteryData(): MasteryData[] {
  try {
    const stored = localStorage.getItem(MASTERY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as MasteryData[];
  } catch (e) {
    console.warn("[masteryEngine] loadMasteryData failed:", e);
    return [];
  }
}

export function saveMasteryData(data: MasteryData[]): void {
  try {
    if (!Array.isArray(data)) return;
    localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[masteryEngine] saveMasteryData failed:", e);
  }
}

export function getMasteryItem(itemId: string): MasteryData {
  try {
    const all = loadMasteryData();
    return (
      all.find((d) => d.itemId === itemId) ?? {
        itemId,
        masteryLevel: 0,
        correctCount: 0,
        wrongCount: 0,
        lastSeen: new Date().toISOString(),
      }
    );
  } catch (e) {
    console.warn("[masteryEngine] getMasteryItem failed:", e);
    return {
      itemId,
      masteryLevel: 0,
      correctCount: 0,
      wrongCount: 0,
      lastSeen: new Date().toISOString(),
    };
  }
}

export function updateMasteryItem(itemId: string, correct: boolean): void {
  try {
    const all = loadMasteryData();
    const idx = all.findIndex((d) => d.itemId === itemId);
    const now = new Date().toISOString();

    if (idx === -1) {
      // Create new entry
      const newEntry: MasteryData = {
        itemId,
        masteryLevel: correct ? 1 : 0,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1,
        lastSeen: now,
      };
      all.push(newEntry);
    } else {
      const entry = all[idx];
      if (correct) {
        entry.correctCount += 1;
        entry.masteryLevel = Math.min(5, entry.masteryLevel + 1);
      } else {
        entry.wrongCount += 1;
        entry.masteryLevel = Math.max(0, entry.masteryLevel - 1);
      }
      entry.lastSeen = now;
      all[idx] = entry;
    }

    saveMasteryData(all);
  } catch (e) {
    console.warn("[masteryEngine] updateMasteryItem failed:", e);
  }
}

// ============================================================================
// MASTERY QUERIES
// ============================================================================

export function getWeakItems(
  allItems: (KanjiEntry | VocabularyEntry)[],
  minWrong = 1,
): (KanjiEntry | VocabularyEntry)[] {
  try {
    if (!allItems || allItems.length === 0) return [];
    const mastery = loadMasteryData();
    const masteryMap = new Map<string, MasteryData>(
      mastery.map((m) => [m.itemId, m]),
    );

    const weak = allItems.filter((item) => {
      const id = getItemId(item);
      const m = masteryMap.get(id);
      if (!m) return false; // never seen = not a "known weak"
      return m.masteryLevel < 3 || m.wrongCount > m.correctCount;
    });

    // Sort by wrongCount descending
    weak.sort((a, b) => {
      const mA = masteryMap.get(getItemId(a));
      const mB = masteryMap.get(getItemId(b));
      return (mB?.wrongCount ?? 0) - (mA?.wrongCount ?? 0);
    });

    // Apply minWrong filter
    return weak.filter((item) => {
      const m = masteryMap.get(getItemId(item));
      return (m?.wrongCount ?? 0) >= minWrong;
    });
  } catch (e) {
    console.warn("[masteryEngine] getWeakItems failed:", e);
    return [];
  }
}

// ============================================================================
// HELPERS
// ============================================================================

// ============================================================================
// WEIGHTED ITEM SELECTION (N4 Priority)
// ============================================================================

/** 30 high-priority N4 vocabulary words — get 3x extra weight */
const PRIORITY_N4_WORDS = new Set([
  "経験",
  "経済",
  "経歴",
  "発表",
  "説明",
  "準備",
  "利用",
  "連絡",
  "約束",
  "確認",
  "必要",
  "研究",
  "運転",
  "受付",
  "相談",
  "卒業",
  "入学",
  "旅行",
  "予定",
  "特別",
  "原因",
  "安全",
  "交通",
  "予約",
  "文化",
  "生活",
  "試験",
  "選ぶ",
  "続ける",
  "増える",
]);

function loadConsecutiveN5(): number {
  try {
    const v = localStorage.getItem(CONSECUTIVE_N5_KEY);
    return v ? Number.parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

function saveConsecutiveN5(n: number): void {
  try {
    localStorage.setItem(CONSECUTIVE_N5_KEY, String(n));
  } catch {
    /* noop */
  }
}

function loadN4BoostRemaining(): number {
  try {
    const v = sessionStorage.getItem(N4_BOOST_REMAINING_KEY);
    return v ? Number.parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

function saveN4BoostRemaining(n: number): void {
  try {
    sessionStorage.setItem(N4_BOOST_REMAINING_KEY, String(Math.max(0, n)));
  } catch {
    /* noop */
  }
}

/**
 * Call after each answer to update the consecutive N5 streak and N4 boost.
 * Returns the updated consecutiveN5 count.
 */
export function recordQuizAnswer(jlptLevel: string, isCorrect: boolean): void {
  try {
    const isN5 = jlptLevel === "N5";
    const consecutive = loadConsecutiveN5();
    const boost = loadN4BoostRemaining();

    if (boost > 0) {
      // We're in boost mode — decrement on each answer
      saveN4BoostRemaining(boost - 1);
      // Reset consecutive counter while boosting
      saveConsecutiveN5(0);
      return;
    }

    if (isN5 && isCorrect) {
      const next = consecutive + 1;
      saveConsecutiveN5(next);
      if (next >= 3) {
        // Activate boost: next 5 questions all N4
        saveN4BoostRemaining(5);
        saveConsecutiveN5(0);
      }
    } else {
      saveConsecutiveN5(0);
    }
  } catch {
    /* noop */
  }
}

/**
 * Weighted selection of quiz items based on JLPT level mode.
 *
 * Weights:
 * - n4focus: N4 items = 4x, N5 items = 1x, priority N4 vocab = additional 3x (total 7x vs 1x)
 * - n5only:  only N5 items
 * - all:     equal weight (1x each)
 *
 * If N4 boost is active (after 3 consecutive N5 correct), all picks are N4 only.
 */
export function selectQuizItems(
  allKanji: KanjiEntry[],
  allVocab: VocabularyEntry[],
  mode: JlptLevelMode,
  count: number,
): { kanji: KanjiEntry[]; vocab: VocabularyEntry[] } {
  try {
    const boostActive = loadN4BoostRemaining() > 0;
    const effectiveMode = boostActive ? "n4focus" : mode;

    // Build weighted pools
    type WeightedKanji = { item: KanjiEntry; weight: number };
    type WeightedVocab = { item: VocabularyEntry; weight: number };

    const wKanji: WeightedKanji[] = allKanji
      .filter((k) => {
        if (effectiveMode === "n5only") return k.jlptLevel === "N5";
        if (effectiveMode === "n4focus" && boostActive)
          return k.jlptLevel === "N4";
        return true;
      })
      .map((k) => {
        let w = 1;
        if (effectiveMode === "n4focus") {
          if (k.jlptLevel === "N4") w = 4;
        }
        return { item: k, weight: w };
      });

    const wVocab: WeightedVocab[] = allVocab
      .filter((v) => {
        if (effectiveMode === "n5only") return v.jlptLevel === "N5";
        if (effectiveMode === "n4focus" && boostActive)
          return v.jlptLevel === "N4";
        return true;
      })
      .map((v) => {
        let w = 1;
        if (effectiveMode === "n4focus") {
          if (v.jlptLevel === "N4") w = 4;
          if (PRIORITY_N4_WORDS.has(v.vocabulary)) w += 3; // priority boost on top
        }
        return { item: v, weight: w };
      });

    // Expand by weight then shuffle — simple weighted sampling
    function expandAndShuffle<T>(weighted: { item: T; weight: number }[]): T[] {
      const expanded: T[] = [];
      for (const { item, weight } of weighted) {
        for (let i = 0; i < weight; i++) expanded.push(item);
      }
      return shuffle(expanded);
    }

    const expandedKanji = expandAndShuffle(wKanji);
    const expandedVocab = expandAndShuffle(wVocab);

    // 55% kanji / 45% vocab split (same as existing session generator)
    const kanjiCount = Math.round(count * 0.55);
    const vocabCount = count - kanjiCount;

    // De-duplicate after weighted expansion
    const seenKanji = new Set<string>();
    const selectedKanji: KanjiEntry[] = [];
    for (const k of expandedKanji) {
      if (!seenKanji.has(k.character)) {
        seenKanji.add(k.character);
        selectedKanji.push(k);
        if (selectedKanji.length >= kanjiCount) break;
      }
    }

    const seenVocab = new Set<string>();
    const selectedVocab: VocabularyEntry[] = [];
    for (const v of expandedVocab) {
      if (!seenVocab.has(v.vocabulary)) {
        seenVocab.add(v.vocabulary);
        selectedVocab.push(v);
        if (selectedVocab.length >= vocabCount) break;
      }
    }

    return { kanji: selectedKanji, vocab: selectedVocab };
  } catch (e) {
    console.warn("[masteryEngine] selectQuizItems failed:", e);
    // Safe fallback — equal distribution
    const k = Math.round(count * 0.55);
    return {
      kanji: allKanji.slice(0, k),
      vocab: allVocab.slice(0, count - k),
    };
  }
}

function getItemId(item: KanjiEntry | VocabularyEntry): string {
  if ("character" in item) return `kanji_${item.character}`;
  return `vocab_${item.vocabulary}`;
}

function isKanjiEntry(item: KanjiEntry | VocabularyEntry): item is KanjiEntry {
  return "character" in item;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns 3 wrong options from the pool based on difficulty.
 * Easy   → pick most dissimilar (different length / different category)
 * Normal → 2 similar + 1 different
 * Hard   → all similar (same length, similar readings)
 */
export function generateOptions(
  correct: string,
  pool: string[],
  difficulty: DifficultyLevel,
  count = 3,
): string[] {
  try {
    const available = pool.filter((p) => p !== correct);
    if (available.length === 0) return [];
    if (available.length <= count) return [...available];

    // Categorise by similarity to correct answer
    const similar = available.filter(
      (p) =>
        Math.abs(p.length - correct.length) <= 1 ||
        p.slice(0, 1) === correct.slice(0, 1),
    );
    const dissimilar = available.filter((p) => !similar.includes(p));

    const fillFrom = (
      primary: string[],
      secondary: string[],
      needed: number,
    ): string[] => {
      const picked: string[] = [];
      const src1 = shuffle(primary);
      const src2 = shuffle(secondary);
      for (const s of [...src1, ...src2]) {
        if (picked.length >= needed) break;
        picked.push(s);
      }
      return picked;
    };

    if (difficulty === "easy") {
      return fillFrom(dissimilar, similar, count);
    }
    if (difficulty === "normal") {
      const simPart = fillFrom(similar, dissimilar, 2);
      const difPart = fillFrom(
        dissimilar.filter((d) => !simPart.includes(d)),
        similar.filter((s) => !simPart.includes(s)),
        1,
      );
      return [...simPart, ...difPart].slice(0, count);
    }
    // hard
    return fillFrom(similar, dissimilar, count);
  } catch (e) {
    console.warn("[masteryEngine] generateOptions failed:", e);
    return pool.filter((p) => p !== correct).slice(0, count);
  }
}

// ============================================================================
// QUESTION GENERATION
// ============================================================================

export function generateKanjiQuestion(
  entry: KanjiEntry,
  allKanji: KanjiEntry[],
  type: "kanji-meaning" | "meaning-kanji" | "kanji-reading",
  difficulty: DifficultyLevel,
): AdaptiveQuestion | null {
  try {
    const itemId = `kanji_${entry.character}`;
    let question: string;
    let correctAnswer: string;
    let pool: string[];

    if (type === "kanji-meaning") {
      question = entry.character;
      correctAnswer = entry.meaning;
      pool = allKanji.map((k) => k.meaning).filter(Boolean);
    } else if (type === "meaning-kanji") {
      question = entry.meaning;
      correctAnswer = entry.character;
      pool = allKanji.map((k) => k.character).filter(Boolean);
    } else {
      // kanji-reading
      question = entry.character;
      correctAnswer = entry.romaji;
      pool = allKanji.map((k) => k.romaji).filter(Boolean);
    }

    const wrongOptions = generateOptions(correctAnswer, pool, difficulty, 3);
    if (wrongOptions.length < 1) return null;

    const allOptions = shuffle([correctAnswer, ...wrongOptions]);
    // Pad to exactly 4 if needed
    while (allOptions.length < 4) allOptions.push("-");
    const options = allOptions.slice(0, 4);
    const correctIndex = options.indexOf(correctAnswer);
    if (correctIndex === -1) return null;

    return {
      id: `${itemId}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      question,
      options,
      correctIndex,
      itemId,
      category: "kanji",
      difficulty,
    };
  } catch (e) {
    console.warn("[masteryEngine] generateKanjiQuestion failed:", e);
    return null;
  }
}

export function generateVocabQuestion(
  entry: VocabularyEntry,
  allVocab: VocabularyEntry[],
  type: "vocab-meaning" | "meaning-vocab",
  difficulty: DifficultyLevel,
): AdaptiveQuestion | null {
  try {
    const itemId = `vocab_${entry.vocabulary}`;
    let question: string;
    let correctAnswer: string;
    let pool: string[];

    if (type === "vocab-meaning") {
      question = entry.vocabulary;
      correctAnswer = entry.meaning;
      pool = allVocab.map((v) => v.meaning).filter(Boolean);
    } else {
      // meaning-vocab
      question = entry.meaning;
      correctAnswer = entry.vocabulary;
      pool = allVocab.map((v) => v.vocabulary).filter(Boolean);
    }

    const wrongOptions = generateOptions(correctAnswer, pool, difficulty, 3);
    if (wrongOptions.length < 1) return null;

    const allOptions = shuffle([correctAnswer, ...wrongOptions]);
    while (allOptions.length < 4) allOptions.push("-");
    const options = allOptions.slice(0, 4);
    const correctIndex = options.indexOf(correctAnswer);
    if (correctIndex === -1) return null;

    return {
      id: `${itemId}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      question,
      options,
      correctIndex,
      itemId,
      category: "vocabulary",
      difficulty,
    };
  } catch (e) {
    console.warn("[masteryEngine] generateVocabQuestion failed:", e);
    return null;
  }
}

// ============================================================================
// DIFFICULTY FROM MASTERY LEVEL
// ============================================================================

function difficultyFromMastery(level: number): DifficultyLevel {
  if (level <= 1) return "easy";
  if (level <= 3) return "normal";
  return "hard";
}

// ============================================================================
// QUIZ SESSION GENERATION
// ============================================================================

/**
 * Generates an array of AdaptiveQuestion for the given mode.
 * Quick   = 5 questions
 * Study   = 15 questions
 * Weakness = up to 20 questions from weak items, falls back to Quick if no weak items
 *
 * Distribution (grammar dataset absent):
 *   55% kanji-type questions, 45% vocab-type questions (split ~30/15 meaning/reading)
 */
export function generateQuizSession(
  mode: QuizMode,
  kanjiData: KanjiEntry[],
  vocabularyData: VocabularyEntry[],
  masteryData: MasteryData[],
  levelMode: JlptLevelMode = "n4focus",
): AdaptiveQuestion[] {
  try {
    const safeKanji = Array.isArray(kanjiData) ? kanjiData : [];
    const safeVocab = Array.isArray(vocabularyData) ? vocabularyData : [];
    const safeMastery = Array.isArray(masteryData) ? masteryData : [];
    const masteryMap = new Map<string, MasteryData>(
      safeMastery.map((m) => [m.itemId, m]),
    );

    const targetCount = mode === "quick" ? 5 : mode === "study" ? 15 : 20;

    // ---------- Determine source items via selectQuizItems ----------
    let selectedKanji: KanjiEntry[];
    let selectedVocab: VocabularyEntry[];

    if (mode === "weakness") {
      const allItems: (KanjiEntry | VocabularyEntry)[] = [
        ...safeKanji,
        ...safeVocab,
      ];
      const weakItems = getWeakItems(allItems, 1);

      if (weakItems.length === 0) {
        // Fall back: use selectQuizItems for the fallback pool
        const selected = selectQuizItems(safeKanji, safeVocab, levelMode, 5);
        selectedKanji = selected.kanji;
        selectedVocab = selected.vocab;
      } else {
        const weakKanji = weakItems.filter(isKanjiEntry) as KanjiEntry[];
        const weakVocab = weakItems.filter(
          (i) => !isKanjiEntry(i),
        ) as VocabularyEntry[];
        // Apply level-mode weighting even on weakness pool
        const kCount = Math.round(targetCount * 0.55);
        const vCount = targetCount - kCount;
        selectedKanji = weakKanji.slice(0, kCount);
        selectedVocab = weakVocab.slice(0, vCount);
      }
    } else {
      const selected = selectQuizItems(
        safeKanji,
        safeVocab,
        levelMode,
        targetCount,
      );
      selectedKanji = selected.kanji;
      selectedVocab = selected.vocab;
    }

    const questions: AdaptiveQuestion[] = [];

    // ---------- Generate kanji questions ----------
    const kanjiTypes: ("kanji-meaning" | "meaning-kanji" | "kanji-reading")[] =
      ["kanji-meaning", "meaning-kanji", "kanji-reading"];

    for (const entry of selectedKanji) {
      if (safeKanji.length < 4) continue; // not enough pool for options
      const id = `kanji_${entry.character}`;
      const level = masteryMap.get(id)?.masteryLevel ?? 0;
      const difficulty = difficultyFromMastery(level);
      const type = kanjiTypes[Math.floor(Math.random() * kanjiTypes.length)];
      const q = generateKanjiQuestion(entry, safeKanji, type, difficulty);
      if (q) questions.push(q);
    }

    // ---------- Generate vocab questions ----------
    const vocabTypes: ("vocab-meaning" | "meaning-vocab")[] = [
      "vocab-meaning",
      "meaning-vocab",
    ];

    for (const entry of selectedVocab) {
      if (safeVocab.length < 4) continue;
      const id = `vocab_${entry.vocabulary}`;
      const level = masteryMap.get(id)?.masteryLevel ?? 0;
      const difficulty = difficultyFromMastery(level);
      const type = vocabTypes[Math.floor(Math.random() * vocabTypes.length)];
      const q = generateVocabQuestion(entry, safeVocab, type, difficulty);
      if (q) questions.push(q);
    }

    return shuffle(questions);
  } catch (e) {
    console.warn("[masteryEngine] generateQuizSession failed:", e);
    return [];
  }
}

// ============================================================================
// REVIEW QUEUE LOGIC  (state managed by caller component)
// ============================================================================

/**
 * Determines whether a wrongly-answered question should be re-inserted into
 * the remaining question list for the current session.
 *
 * Rules:
 * - Only re-queue if the question was answered at position 0–6 (first 7 questions)
 * - Insert at a random position between index 7 and 11 of the remaining queue
 * - Only re-queue each itemId once per session (tracked via reviewedItems)
 * - Never produces infinite loops
 *
 * @param currentIndex 0-based index of the question just answered
 * @param question     the question that was answered wrong
 * @param remaining    remaining questions (after currentIndex)
 * @param reviewedItems mutable Set of itemIds already re-queued this session
 * @returns new remaining array with the question inserted, or same array if not applicable
 */
export function maybeRequeueQuestion(
  currentIndex: number,
  question: AdaptiveQuestion,
  remaining: AdaptiveQuestion[],
  reviewedItems: Set<string>,
): AdaptiveQuestion[] {
  try {
    if (currentIndex > 6) return remaining; // only re-queue early mistakes
    if (reviewedItems.has(question.itemId)) return remaining; // already re-queued

    reviewedItems.add(question.itemId);

    const insertPos = Math.max(
      0,
      Math.min(
        remaining.length,
        Math.floor(Math.random() * 5) + 7 - currentIndex - 1, // target absolute pos 8-12
      ),
    );

    // Build a clone of the question with a fresh id to avoid key conflicts
    const clone: AdaptiveQuestion = {
      ...question,
      id: `${question.id}_review`,
    };

    const newRemaining = [...remaining];
    newRemaining.splice(insertPos, 0, clone);
    return newRemaining;
  } catch (e) {
    console.warn("[masteryEngine] maybeRequeueQuestion failed:", e);
    return remaining;
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

export function loadAnalytics(): LearningAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (!stored) return { ...DEFAULT_ANALYTICS };
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_ANALYTICS,
      ...parsed,
    };
  } catch (e) {
    console.warn("[masteryEngine] loadAnalytics failed:", e);
    return { ...DEFAULT_ANALYTICS };
  }
}

export function saveAnalytics(analytics: LearningAnalytics): void {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (e) {
    console.warn("[masteryEngine] saveAnalytics failed:", e);
  }
}

export function computeAnalytics(
  masteryData: MasteryData[],
  quizHistory: QuizSession[],
): LearningAnalytics {
  try {
    const safe = Array.isArray(masteryData) ? masteryData : [];
    const safeHistory = Array.isArray(quizHistory) ? quizHistory : [];

    const totalQuestions = safe.reduce(
      (s, m) => s + m.correctCount + m.wrongCount,
      0,
    );
    const totalCorrect = safe.reduce((s, m) => s + m.correctCount, 0);
    const totalWrong = safe.reduce((s, m) => s + m.wrongCount, 0);
    const accuracyRate =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Separate kanji items and vocab items by itemId prefix
    const kanjiItems = safe.filter((m) => m.itemId.startsWith("kanji_"));
    const vocabItems = safe.filter((m) => m.itemId.startsWith("vocab_"));

    const avgMastery = (items: MasteryData[]) =>
      items.length > 0
        ? items.reduce((s, m) => s + m.masteryLevel, 0) / items.length
        : 0;

    const kanjiAvg = avgMastery(kanjiItems);
    const vocabAvg = avgMastery(vocabItems);

    const strongestCategory = kanjiAvg >= vocabAvg ? "Kanji" : "Vocabulary";
    const weakestCategory = kanjiAvg < vocabAvg ? "Kanji" : "Vocabulary";

    const averageSessionLength =
      safeHistory.length > 0
        ? safeHistory.reduce((s, h) => s + (h.totalQuestions ?? 0), 0) /
          safeHistory.length
        : 10;

    return {
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      strongestCategory,
      weakestCategory,
      averageSessionLength: Math.round(averageSessionLength * 10) / 10,
    };
  } catch (e) {
    console.warn("[masteryEngine] computeAnalytics failed:", e);
    return { ...DEFAULT_ANALYTICS };
  }
}

// QuizSession type for analytics (compatible with quizHistory.ts)
interface QuizSession {
  totalQuestions: number;
  score?: number;
  percentage?: number;
  [key: string]: unknown;
}

// ============================================================================
// LEARNING PROFILE
// ============================================================================

export function computeLearningProfile(
  masteryData: MasteryData[],
  quizHistory: QuizSession[],
): LearningProfile {
  try {
    const safe = Array.isArray(masteryData) ? masteryData : [];
    const safeHistory = Array.isArray(quizHistory) ? quizHistory : [];

    if (safe.length === 0) return { ...DEFAULT_PROFILE };

    // Compute per-category accuracy
    const kanjiItems = safe.filter((m) => m.itemId.startsWith("kanji_"));
    const vocabItems = safe.filter((m) => m.itemId.startsWith("vocab_"));

    const categoryAccuracy = (items: MasteryData[]): number => {
      const total = items.reduce(
        (s, m) => s + m.correctCount + m.wrongCount,
        0,
      );
      const correct = items.reduce((s, m) => s + m.correctCount, 0);
      return total > 0 ? (correct / total) * 100 : 0;
    };

    const kanjiAcc = categoryAccuracy(kanjiItems);
    const vocabAcc = categoryAccuracy(vocabItems);

    const strength: string[] = [];
    const weakness: string[] = [];

    if (kanjiAcc > 75) strength.push("Kanji");
    else if (kanjiAcc < 50) weakness.push("Kanji");

    if (vocabAcc > 75) strength.push("Vocabulary");
    else if (vocabAcc < 50) weakness.push("Vocabulary");

    // Preferred learning style from session patterns
    const avgLen =
      safeHistory.length > 0
        ? safeHistory.reduce((s, h) => s + (h.totalQuestions ?? 0), 0) /
          safeHistory.length
        : 0;

    const preferredLearningStyle: string[] = [];
    if (safeHistory.length > 10 && avgLen < 8) {
      preferredLearningStyle.push("Quick Learner (sesi pendek berulang)");
    } else if (avgLen >= 12) {
      preferredLearningStyle.push("Detail Learner (sesi panjang mendalam)");
    } else if (safeHistory.length > 0) {
      preferredLearningStyle.push("Balanced Learner");
    }

    // Pattern recognition if many kanji strength
    if (kanjiItems.length > vocabItems.length && kanjiAcc > 70) {
      preferredLearningStyle.push("Pattern Recognition");
    }

    // Repeated review if high wrongCount average
    const avgWrong =
      safe.reduce((s, m) => s + m.wrongCount, 0) / Math.max(safe.length, 1);
    if (avgWrong > 2) {
      preferredLearningStyle.push("Repeated Review");
    }

    return { strength, weakness, preferredLearningStyle };
  } catch (e) {
    console.warn("[masteryEngine] computeLearningProfile failed:", e);
    return { ...DEFAULT_PROFILE };
  }
}

// ============================================================================
// EXPORT / IMPORT LEARNING PROFILE
// ============================================================================

export function exportLearningProfile(
  masteryData: MasteryData[],
  studyState: StudyState,
  analytics: LearningAnalytics,
  reviewQueue: string[],
  learningProfile: LearningProfile,
): string {
  try {
    const payload = {
      appVersion: "2.0",
      exportDate: new Date().toISOString(),
      studyState: studyState ?? DEFAULT_STUDY_STATE,
      analytics: analytics ?? DEFAULT_ANALYTICS,
      masteryData: Array.isArray(masteryData) ? masteryData : [],
      reviewQueue: Array.isArray(reviewQueue) ? reviewQueue : [],
      learningProfile: learningProfile ?? DEFAULT_PROFILE,
    };
    return JSON.stringify(payload, null, 2);
  } catch (e) {
    console.warn("[masteryEngine] exportLearningProfile failed:", e);
    return "{}";
  }
}

export function importLearningProfile(jsonStr: string): {
  masteryData: MasteryData[];
  studyState: StudyState;
  analytics: LearningAnalytics;
  reviewQueue: string[];
  learningProfile: LearningProfile;
} | null {
  try {
    if (!jsonStr || typeof jsonStr !== "string") return null;
    const parsed = JSON.parse(jsonStr);

    // Schema validation
    if (typeof parsed !== "object" || parsed === null) return null;
    if (!parsed.masteryData || !Array.isArray(parsed.masteryData)) return null;

    // Merge: keep higher masteryLevel if itemId exists in both
    const local = loadMasteryData();
    const localMap = new Map<string, MasteryData>(
      local.map((m) => [m.itemId, m]),
    );

    const imported: MasteryData[] = parsed.masteryData
      .map(
        (m: Partial<MasteryData>): MasteryData => ({
          itemId: m.itemId ?? "",
          masteryLevel: Math.max(0, Math.min(5, m.masteryLevel ?? 0)),
          correctCount: m.correctCount ?? 0,
          wrongCount: m.wrongCount ?? 0,
          lastSeen: m.lastSeen ?? new Date().toISOString(),
        }),
      )
      .filter((m: MasteryData) => m.itemId !== "");

    const merged: MasteryData[] = [...local];
    for (const imp of imported) {
      const existing = localMap.get(imp.itemId);
      if (!existing) {
        merged.push(imp);
      } else if (imp.masteryLevel > existing.masteryLevel) {
        const idx = merged.findIndex((m) => m.itemId === imp.itemId);
        if (idx !== -1) merged[idx] = imp;
      }
    }

    const studyState: StudyState = {
      currentLevel:
        parsed.studyState?.currentLevel ?? DEFAULT_STUDY_STATE.currentLevel,
      currentFocus: Array.isArray(parsed.studyState?.currentFocus)
        ? parsed.studyState.currentFocus
        : DEFAULT_STUDY_STATE.currentFocus,
      currentReadingLevel: parsed.studyState?.currentReadingLevel ?? 1,
    };

    const analytics: LearningAnalytics = {
      ...DEFAULT_ANALYTICS,
      ...(typeof parsed.analytics === "object" && parsed.analytics !== null
        ? parsed.analytics
        : {}),
    };

    const reviewQueue: string[] = Array.isArray(parsed.reviewQueue)
      ? parsed.reviewQueue
      : [];

    const learningProfile: LearningProfile = {
      strength: Array.isArray(parsed.learningProfile?.strength)
        ? parsed.learningProfile.strength
        : [],
      weakness: Array.isArray(parsed.learningProfile?.weakness)
        ? parsed.learningProfile.weakness
        : [],
      preferredLearningStyle: Array.isArray(
        parsed.learningProfile?.preferredLearningStyle,
      )
        ? parsed.learningProfile.preferredLearningStyle
        : [],
    };

    return {
      masteryData: merged,
      studyState,
      analytics,
      reviewQueue,
      learningProfile,
    };
  } catch (e) {
    console.warn("[masteryEngine] importLearningProfile failed:", e);
    return null;
  }
}

// ============================================================================
// HUMAN-READABLE REPORT
// ============================================================================

export function generateHumanReadableReport(
  studyState: StudyState,
  analytics: LearningAnalytics,
  masteryData: MasteryData[],
  profile: LearningProfile,
): string {
  try {
    const safe = Array.isArray(masteryData) ? masteryData : [];
    const safeAnalytics = analytics ?? DEFAULT_ANALYTICS;
    const safeState = studyState ?? DEFAULT_STUDY_STATE;
    const safeProfile = profile ?? DEFAULT_PROFILE;

    const accuracy =
      safeAnalytics.totalQuestions > 0
        ? Math.round(safeAnalytics.accuracyRate)
        : 0;

    const masteredCount = safe.filter((m) => m.masteryLevel >= 5).length;
    const totalSeen = safe.length;

    const recommendedFocus: string[] = [];
    if (safeProfile.weakness.length > 0) {
      recommendedFocus.push(...safeProfile.weakness);
    } else {
      if (safeAnalytics.weakestCategory)
        recommendedFocus.push(safeAnalytics.weakestCategory);
    }
    if (recommendedFocus.length === 0)
      recommendedFocus.push("Kanji", "Vocabulary");

    const lines: string[] = [
      "=== LEARNING REPORT ===",
      "",
      "Level:",
      safeState.currentLevel,
      "",
      "Accuracy:",
      `${accuracy}%`,
      "",
      "Total Quiz:",
      `${safeAnalytics.totalQuestions}`,
      "",
      "Items Mastered:",
      `${masteredCount} / ${totalSeen}`,
      "",
      "Strong:",
      safeProfile.strength.length > 0 ? safeProfile.strength.join("\n") : "-",
      "",
      "Weak:",
      safeProfile.weakness.length > 0 ? safeProfile.weakness.join("\n") : "-",
      "",
      "Recommended Focus:",
      recommendedFocus.join("\n"),
      "",
      "Current Focus:",
      safeState.currentFocus.length > 0
        ? safeState.currentFocus.join("\n")
        : "-",
      "",
      "Preferred Learning Style:",
      safeProfile.preferredLearningStyle.length > 0
        ? safeProfile.preferredLearningStyle.join("\n")
        : "Belum ada data cukup",
      "",
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
    ];

    return lines.join("\n");
  } catch (e) {
    console.warn("[masteryEngine] generateHumanReadableReport failed:", e);
    return "=== LEARNING REPORT ===\n\nTidak dapat membuat laporan saat ini.\n";
  }
}

// ============================================================================
// KANJI MASTERY TRACKING
// ============================================================================

export interface VocabularyMasteryRecord {
  vocabId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  lookupCount: number;
  masteryLevel: number; // 0–5
  lastSeen: string | null;
  lastCorrect: string | null;
  lastWrong: string | null;
  status: "Belum Tersentuh" | "Sedang Belajar" | "Cukup Paham" | "Dikuasai";
}

export interface ReadingSessionRecord {
  sessionId: string;
  date: string;
  totalWords: number;
  knownWords: number;
  unknownWords: number;
  accuracy: number; // 0-100
  durationSeconds: number;
  lookupCount: number;
  weakKanjiEncountered: string[];
  weakVocabEncountered: string[];
}

export interface KanjiMasteryRecord {
  kanjiId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  lookupCount: number;
  masteryLevel: number; // 0–5, increments +0.5 correct / -1 wrong
  lastSeen: string | null;
  lastCorrect: string | null;
  lastWrong: string | null;
  status: "Belum Tersentuh" | "Sedang Belajar" | "Cukup Paham" | "Dikuasai";
}

// ============================================================================
// VOCABULARY MASTERY TRACKING
// ============================================================================

export function loadVocabTracking(): Record<string, VocabularyMasteryRecord> {
  try {
    const stored = localStorage.getItem(VOCAB_TRACKING_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, VocabularyMasteryRecord>;
  } catch (e) {
    console.warn("[masteryEngine] loadVocabTracking failed:", e);
    return {};
  }
}

export function saveVocabTracking(
  data: Record<string, VocabularyMasteryRecord>,
): void {
  try {
    if (typeof data !== "object" || data === null) return;
    localStorage.setItem(VOCAB_TRACKING_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[masteryEngine] saveVocabTracking failed:", e);
  }
}

function getOrCreateVocabRecord(vocabId: string): {
  all: Record<string, VocabularyMasteryRecord>;
  record: VocabularyMasteryRecord;
} {
  const all = loadVocabTracking();
  const record: VocabularyMasteryRecord = all[vocabId] ?? {
    vocabId,
    seenCount: 0,
    correctCount: 0,
    wrongCount: 0,
    lookupCount: 0,
    masteryLevel: 0,
    lastSeen: null,
    lastCorrect: null,
    lastWrong: null,
    status: "Belum Tersentuh",
  };
  return { all, record };
}

export function getVocabStatus(
  tracking: VocabularyMasteryRecord,
): VocabularyMasteryRecord["status"] {
  if (tracking.seenCount === 0) return "Belum Tersentuh";
  if (tracking.seenCount > 0 && tracking.masteryLevel < 2)
    return "Sedang Belajar";
  if (tracking.masteryLevel >= 2 && tracking.masteryLevel < 4)
    return "Cukup Paham";
  return "Dikuasai";
}

export function recordVocabSeen(vocabId: string): void {
  try {
    const { all, record } = getOrCreateVocabRecord(vocabId);
    record.seenCount += 1;
    record.lastSeen = new Date().toISOString();
    record.status = getVocabStatus(record);
    all[vocabId] = record;
    saveVocabTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordVocabSeen failed:", e);
  }
}

export function recordVocabCorrect(vocabId: string): void {
  try {
    const { all, record } = getOrCreateVocabRecord(vocabId);
    record.correctCount += 1;
    record.masteryLevel = Math.min(5, record.masteryLevel + 0.5);
    const now = new Date().toISOString();
    record.lastCorrect = now;
    record.lastSeen = now;
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getVocabStatus(record);
    all[vocabId] = record;
    saveVocabTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordVocabCorrect failed:", e);
  }
}

export function recordVocabWrong(vocabId: string): void {
  try {
    const { all, record } = getOrCreateVocabRecord(vocabId);
    record.wrongCount += 1;
    record.masteryLevel = Math.max(0, record.masteryLevel - 1);
    const now = new Date().toISOString();
    record.lastWrong = now;
    record.lastSeen = now;
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getVocabStatus(record);
    all[vocabId] = record;
    saveVocabTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordVocabWrong failed:", e);
  }
}

export function recordVocabLookup(vocabId: string): void {
  try {
    const { all, record } = getOrCreateVocabRecord(vocabId);
    record.lookupCount += 1;
    record.lastSeen = new Date().toISOString();
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getVocabStatus(record);
    all[vocabId] = record;
    saveVocabTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordVocabLookup failed:", e);
  }
}

export function getVocabScore(tracking: VocabularyMasteryRecord): number {
  try {
    return (
      (tracking.correctCount * 10 + tracking.masteryLevel * 5) /
      (tracking.correctCount + tracking.wrongCount + 1)
    );
  } catch (_e) {
    return 0;
  }
}

export function getWeakVocab(
  allTracking: Record<string, VocabularyMasteryRecord>,
): VocabularyMasteryRecord[] {
  try {
    return Object.values(allTracking)
      .filter((r) => r.masteryLevel < 2 && r.wrongCount > 3)
      .sort((a, b) => b.wrongCount - a.wrongCount);
  } catch (e) {
    console.warn("[masteryEngine] getWeakVocab failed:", e);
    return [];
  }
}

// ============================================================================
// READING ANALYTICS
// ============================================================================

export function loadReadingAnalytics(): ReadingSessionRecord[] {
  try {
    const stored = localStorage.getItem(READING_ANALYTICS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as ReadingSessionRecord[];
  } catch (e) {
    console.warn("[masteryEngine] loadReadingAnalytics failed:", e);
    return [];
  }
}

export function saveReadingAnalytics(sessions: ReadingSessionRecord[]): void {
  try {
    if (!Array.isArray(sessions)) return;
    localStorage.setItem(READING_ANALYTICS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn("[masteryEngine] saveReadingAnalytics failed:", e);
  }
}

export function recordReadingSession(
  session: Omit<ReadingSessionRecord, "sessionId" | "date">,
): void {
  try {
    const all = loadReadingAnalytics();
    const newSession: ReadingSessionRecord = {
      ...session,
      sessionId: `reading_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
    };
    all.push(newSession);
    // Keep last 100 sessions
    if (all.length > 100) all.shift();
    saveReadingAnalytics(all);
  } catch (e) {
    console.warn("[masteryEngine] recordReadingSession failed:", e);
  }
}

export function computeReadingScore(): number {
  try {
    const sessions = loadReadingAnalytics();
    if (sessions.length === 0) return 0;
    // Weighted: 40% accuracy, 30% speed (faster = better), 30% coverage
    const recent = sessions.slice(-10);
    const avgAccuracy =
      recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;
    const avgDuration =
      recent.reduce((s, r) => s + r.durationSeconds, 0) / recent.length;
    const avgCoverage =
      recent.reduce((s, r) => s + r.knownWords / Math.max(r.totalWords, 1), 0) /
      recent.length;
    // Speed score: ideal 60s per session, faster = higher score up to 100
    const speedScore = Math.min(100, Math.max(0, 120 - avgDuration));
    return Math.round(
      avgAccuracy * 0.4 + speedScore * 0.3 + avgCoverage * 100 * 0.3,
    );
  } catch (e) {
    console.warn("[masteryEngine] computeReadingScore failed:", e);
    return 0;
  }
}

// ============================================================================
// OVERALL N4 READINESS SCORE
// ============================================================================

export function computeOverallN4Readiness(): number {
  try {
    const kanjiTracking = loadKanjiTracking();
    const vocabTracking = loadVocabTracking();
    const radicalTracking = loadRadicalTracking();

    const kanjiRecords = Object.values(kanjiTracking);
    const vocabRecords = Object.values(vocabTracking);
    const radicalRecords = Object.values(radicalTracking);

    const kanjiScore =
      kanjiRecords.length > 0
        ? kanjiRecords.reduce((s, r) => s + getKanjiScore(r), 0) /
          kanjiRecords.length
        : 0;

    const vocabScore =
      vocabRecords.length > 0
        ? vocabRecords.reduce((s, r) => s + getVocabScore(r), 0) /
          vocabRecords.length
        : 0;

    const radicalScore =
      radicalRecords.length > 0
        ? radicalRecords.reduce((s, r) => s + getRadicalScore(r), 0) /
          radicalRecords.length
        : 0;

    const readingScore = computeReadingScore() / 10; // normalize 0-100 to 0-10

    // Weighted formula: 50% Kanji + 30% Vocabulary + 20% Radical
    // Reading score is a bonus modifier (up to +10%)
    const baseScore = kanjiScore * 0.5 + vocabScore * 0.3 + radicalScore * 0.2;
    const bonus = Math.min(10, readingScore * 0.1);

    return Math.min(100, Math.round((baseScore + bonus) * 10));
  } catch (e) {
    console.warn("[masteryEngine] computeOverallN4Readiness failed:", e);
    return 0;
  }
}

const KANJI_TRACKING_KEY = "kanjiTracking";

export function loadKanjiTracking(): Record<string, KanjiMasteryRecord> {
  try {
    const stored = localStorage.getItem(KANJI_TRACKING_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, KanjiMasteryRecord>;
  } catch (e) {
    console.warn("[masteryEngine] loadKanjiTracking failed:", e);
    return {};
  }
}

export function saveKanjiTracking(
  data: Record<string, KanjiMasteryRecord>,
): void {
  try {
    if (typeof data !== "object" || data === null) return;
    localStorage.setItem(KANJI_TRACKING_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[masteryEngine] saveKanjiTracking failed:", e);
  }
}

function getOrCreateKanjiRecord(kanjiId: string): {
  all: Record<string, KanjiMasteryRecord>;
  record: KanjiMasteryRecord;
} {
  const all = loadKanjiTracking();
  const record: KanjiMasteryRecord = all[kanjiId] ?? {
    kanjiId,
    seenCount: 0,
    correctCount: 0,
    wrongCount: 0,
    lookupCount: 0,
    masteryLevel: 0,
    lastSeen: null,
    lastCorrect: null,
    lastWrong: null,
    status: "Belum Tersentuh",
  };
  return { all, record };
}

export function getKanjiStatus(
  tracking: KanjiMasteryRecord,
): KanjiMasteryRecord["status"] {
  if (tracking.seenCount === 0) return "Belum Tersentuh";
  if (tracking.seenCount > 0 && tracking.masteryLevel < 2)
    return "Sedang Belajar";
  if (tracking.masteryLevel >= 2 && tracking.masteryLevel < 4)
    return "Cukup Paham";
  return "Dikuasai";
}

export function recordKanjiSeen(kanjiId: string): void {
  try {
    const { all, record } = getOrCreateKanjiRecord(kanjiId);
    record.seenCount += 1;
    record.lastSeen = new Date().toISOString();
    record.status = getKanjiStatus(record);
    all[kanjiId] = record;
    saveKanjiTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordKanjiSeen failed:", e);
  }
}

export function recordKanjiCorrect(kanjiId: string): void {
  try {
    const { all, record } = getOrCreateKanjiRecord(kanjiId);
    record.correctCount += 1;
    record.masteryLevel = Math.min(5, record.masteryLevel + 0.5);
    const now = new Date().toISOString();
    record.lastCorrect = now;
    record.lastSeen = now;
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getKanjiStatus(record);
    all[kanjiId] = record;
    saveKanjiTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordKanjiCorrect failed:", e);
  }
}

export function recordKanjiWrong(kanjiId: string): void {
  try {
    const { all, record } = getOrCreateKanjiRecord(kanjiId);
    record.wrongCount += 1;
    record.masteryLevel = Math.max(0, record.masteryLevel - 1);
    const now = new Date().toISOString();
    record.lastWrong = now;
    record.lastSeen = now;
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getKanjiStatus(record);
    all[kanjiId] = record;
    saveKanjiTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordKanjiWrong failed:", e);
  }
}

export function recordKanjiLookup(kanjiId: string): void {
  try {
    const { all, record } = getOrCreateKanjiRecord(kanjiId);
    record.lookupCount += 1;
    record.lastSeen = new Date().toISOString();
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getKanjiStatus(record);
    all[kanjiId] = record;
    saveKanjiTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordKanjiLookup failed:", e);
  }
}

export function getKanjiScore(tracking: KanjiMasteryRecord): number {
  try {
    return (
      (tracking.correctCount * 10 + tracking.masteryLevel * 5) /
      (tracking.correctCount + tracking.wrongCount + 1)
    );
  } catch (_e) {
    return 0;
  }
}

export function getWeakKanji(
  allTracking: Record<string, KanjiMasteryRecord>,
): KanjiMasteryRecord[] {
  try {
    return Object.values(allTracking)
      .filter((r) => r.masteryLevel < 2 && r.wrongCount > 3)
      .sort((a, b) => b.wrongCount - a.wrongCount);
  } catch (e) {
    console.warn("[masteryEngine] getWeakKanji failed:", e);
    return [];
  }
}

// ============================================================================
// RADICAL MASTERY TRACKING
// ============================================================================

export interface RadicalMasteryRecord {
  radicalId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  masteryLevel: number; // 0–5
  status: "Belum Tersentuh" | "Sedang Belajar" | "Cukup Paham" | "Dikuasai";
}

const RADICAL_TRACKING_KEY = "radicalTracking";

export function loadRadicalTracking(): Record<string, RadicalMasteryRecord> {
  try {
    const stored = localStorage.getItem(RADICAL_TRACKING_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, RadicalMasteryRecord>;
  } catch (e) {
    console.warn("[masteryEngine] loadRadicalTracking failed:", e);
    return {};
  }
}

export function saveRadicalTracking(
  data: Record<string, RadicalMasteryRecord>,
): void {
  try {
    if (typeof data !== "object" || data === null) return;
    localStorage.setItem(RADICAL_TRACKING_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[masteryEngine] saveRadicalTracking failed:", e);
  }
}

function getOrCreateRadicalRecord(radicalId: string): {
  all: Record<string, RadicalMasteryRecord>;
  record: RadicalMasteryRecord;
} {
  const all = loadRadicalTracking();
  const record: RadicalMasteryRecord = all[radicalId] ?? {
    radicalId,
    seenCount: 0,
    correctCount: 0,
    wrongCount: 0,
    masteryLevel: 0,
    status: "Belum Tersentuh",
  };
  return { all, record };
}

export function getRadicalStatus(
  tracking: RadicalMasteryRecord,
): RadicalMasteryRecord["status"] {
  if (tracking.seenCount === 0) return "Belum Tersentuh";
  if (tracking.seenCount > 0 && tracking.masteryLevel < 2)
    return "Sedang Belajar";
  if (tracking.masteryLevel >= 2 && tracking.masteryLevel < 4)
    return "Cukup Paham";
  return "Dikuasai";
}

export function recordRadicalSeen(radicalId: string): void {
  try {
    const { all, record } = getOrCreateRadicalRecord(radicalId);
    record.seenCount += 1;
    record.status = getRadicalStatus(record);
    all[radicalId] = record;
    saveRadicalTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordRadicalSeen failed:", e);
  }
}

export function recordRadicalCorrect(radicalId: string): void {
  try {
    const { all, record } = getOrCreateRadicalRecord(radicalId);
    record.correctCount += 1;
    record.masteryLevel = Math.min(5, record.masteryLevel + 0.5);
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getRadicalStatus(record);
    all[radicalId] = record;
    saveRadicalTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordRadicalCorrect failed:", e);
  }
}

export function recordRadicalWrong(radicalId: string): void {
  try {
    const { all, record } = getOrCreateRadicalRecord(radicalId);
    record.wrongCount += 1;
    record.masteryLevel = Math.max(0, record.masteryLevel - 1);
    if (record.seenCount === 0) record.seenCount = 1;
    record.status = getRadicalStatus(record);
    all[radicalId] = record;
    saveRadicalTracking(all);
  } catch (e) {
    console.warn("[masteryEngine] recordRadicalWrong failed:", e);
  }
}

export function getRadicalScore(tracking: RadicalMasteryRecord): number {
  try {
    return (
      (tracking.correctCount * 10 + tracking.masteryLevel * 5) /
      (tracking.correctCount + tracking.wrongCount + 1)
    );
  } catch (_e) {
    return 0;
  }
}

export function getWeakRadicals(
  allTracking: Record<string, RadicalMasteryRecord>,
): RadicalMasteryRecord[] {
  try {
    return Object.values(allTracking)
      .filter((r) => r.masteryLevel < 2 && r.wrongCount > 2)
      .sort((a, b) => b.wrongCount - a.wrongCount);
  } catch (e) {
    console.warn("[masteryEngine] getWeakRadicals failed:", e);
    return [];
  }
}
