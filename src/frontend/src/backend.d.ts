import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RadicalMasteryPublic {
    status: MasteryStatus;
    wrongCount: bigint;
    radicalId: string;
    masteryLevel: bigint;
    seenCount: bigint;
    correctCount: bigint;
    lastSeen: bigint;
}
export interface KanjiMasteryPublic {
    status: MasteryStatus;
    wrongCount: bigint;
    lastCorrect: bigint;
    lastWrong: bigint;
    masteryLevel: bigint;
    seenCount: bigint;
    correctCount: bigint;
    lookupCount: bigint;
    kanjiId: string;
    lastSeen: bigint;
}
export interface RadicalMastery {
    wrongCount: bigint;
    radical: string;
    masteryLevel: bigint;
    seenCount: bigint;
    correctCount: bigint;
}
export interface WeakItem {
    itemId: string;
    wrongCount: bigint;
    masteryLevel: bigint;
    itemType: string;
    correctCount: bigint;
    accuracy: bigint;
}
export interface VocabDashboardStats {
    total: bigint;
    intermediate: bigint;
    strongItems: Array<WeakItem>;
    mastered: bigint;
    learning: bigint;
    weakItems: Array<WeakItem>;
    highFrequency: bigint;
    untouched: bigint;
}
export interface RadicalDashboardStats {
    total: bigint;
    intermediate: bigint;
    mastered: bigint;
    learning: bigint;
    weakItems: Array<WeakItem>;
    untouched: bigint;
}
export interface QuizAnalytics {
    totalCorrect: bigint;
    totalQuizzes: bigint;
    totalWrong: bigint;
    accuracy: number;
}
export interface KanjiDashboardStats {
    total: bigint;
    intermediate: bigint;
    strongItems: Array<WeakItem>;
    mastered: bigint;
    learning: bigint;
    weakItems: Array<WeakItem>;
    highFrequency: bigint;
    untouched: bigint;
}
export interface AdaptiveQuizRatio {
    kanjiPercent: bigint;
    vocabularyPercent: bigint;
    radicalPercent: bigint;
}
export interface KanjiMastery {
    wrongCount: bigint;
    lastCorrect: bigint;
    lastWrong: bigint;
    masteryLevel: bigint;
    seenCount: bigint;
    correctCount: bigint;
    kanji: string;
    lastSeen: bigint;
}
export interface AdaptiveQuizSessionPublic {
    completedAt?: bigint;
    totalQuestions: bigint;
    correctAnswers: bigint;
    sessionId: string;
    ratio: AdaptiveQuizRatio;
}
export interface ScoreSummary {
    overallN4ReadinessScore: bigint;
    kanjiScore: bigint;
    vocabularyScore: bigint;
    radicalScore: bigint;
    readingScore: bigint;
}
export interface ReadingSessionPublic {
    kanjiFailures: Array<string>;
    wordsLookedUp: Array<string>;
    score: bigint;
    durationSeconds: bigint;
    timestamp: bigint;
    sessionId: string;
    unknownWords: Array<string>;
}
export interface VocabMasteryPublic {
    status: MasteryStatus;
    wrongCount: bigint;
    lastCorrect: bigint;
    lastWrong: bigint;
    masteryLevel: bigint;
    seenCount: bigint;
    correctCount: bigint;
    lookupCount: bigint;
    vocabId: string;
    lastSeen: bigint;
}
export enum MasteryStatus {
    Learning = "Learning",
    Untouched = "Untouched",
    Intermediate = "Intermediate",
    Mastered = "Mastered"
}
export interface backendInterface {
    completeAdaptiveSession(sessionId: string, totalQuestions: bigint, correctAnswers: bigint): Promise<void>;
    getAllKanjiMastery(): Promise<Array<KanjiMastery>>;
    getAllRadicalMastery(): Promise<Array<RadicalMastery>>;
    getDokkaiPriorityKanji(dokkaiKanji: Array<string>): Promise<Array<string>>;
    getKanjiDashboard(): Promise<KanjiDashboardStats>;
    getKanjiMastery(kanjiId: string): Promise<KanjiMasteryPublic | null>;
    getKanjiMasteryByChar(kanji: string): Promise<KanjiMastery | null>;
    getQuizAnalytics(): Promise<QuizAnalytics>;
    getRadicalDashboard(): Promise<RadicalDashboardStats>;
    getRadicalMastery(radicalId: string): Promise<RadicalMasteryPublic | null>;
    getRadicalMasteryByChar(radical: string): Promise<RadicalMastery | null>;
    getScoreSummary(): Promise<ScoreSummary>;
    getUntouchedKanji(allKanji: Array<string>): Promise<Array<string>>;
    getVocabDashboard(): Promise<VocabDashboardStats>;
    getVocabMastery(vocabId: string): Promise<VocabMasteryPublic | null>;
    getWeakKanji(topN: bigint): Promise<Array<WeakItem>>;
    getWeakKanjiByThreshold(threshold: bigint): Promise<Array<KanjiMastery>>;
    getWeakRadicals(topN: bigint): Promise<Array<WeakItem>>;
    getWeakVocab(topN: bigint): Promise<Array<WeakItem>>;
    listKanjiMastery(offset: bigint, limit: bigint): Promise<Array<KanjiMasteryPublic>>;
    listReadingSessions(limit: bigint): Promise<Array<ReadingSessionPublic>>;
    recordQuizResult(itemId: string, itemType: string, isCorrect: boolean, quizMode: string): Promise<void>;
    saveReadingSession(sessionId: string, score: bigint, durationSeconds: bigint, wordsLookedUp: Array<string>, unknownWords: Array<string>, kanjiFailures: Array<string>): Promise<void>;
    startAdaptiveSession(sessionId: string, kanjiPercent: bigint, vocabPercent: bigint, radicalPercent: bigint): Promise<AdaptiveQuizSessionPublic>;
    trackKanjiCorrect(kanjiId: string): Promise<void>;
    trackKanjiLookup(kanjiId: string): Promise<void>;
    trackKanjiSeen(kanjiId: string): Promise<void>;
    trackKanjiWrong(kanjiId: string): Promise<void>;
    trackRadicalCorrect(radicalId: string): Promise<void>;
    trackRadicalSeen(radicalId: string): Promise<void>;
    trackRadicalWrong(radicalId: string): Promise<void>;
    trackVocabCorrect(vocabId: string): Promise<void>;
    trackVocabLookup(vocabId: string): Promise<void>;
    trackVocabSeen(vocabId: string): Promise<void>;
    trackVocabWrong(vocabId: string): Promise<void>;
    updateKanjiMastery(kanji: string, isCorrect: boolean): Promise<KanjiMastery>;
    updateRadicalMastery(radical: string, isCorrect: boolean): Promise<RadicalMastery>;
}
