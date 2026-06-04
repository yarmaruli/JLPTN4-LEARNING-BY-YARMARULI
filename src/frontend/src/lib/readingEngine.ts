/**
 * readingEngine.ts
 * Core engine for Reading feature — passages, sessions, analytics, word lookups.
 * Offline-first: all state persisted to localStorage.
 * NEVER throws — all errors caught and safe defaults returned.
 */

import type { VocabularyEntry } from "@/data/kanjiData";
import { vocabularyData } from "@/data/kanjiData";

// ============================================================================
// INTERFACES
// ============================================================================

export type ReadingMode = "learning" | "jlpt" | "adaptive";
export type ReadingLevel = 1 | 2 | 3 | 4;

export type ReadingTheme =
  | "office"
  | "school"
  | "family"
  | "shopping"
  | "travel"
  | "restaurant"
  | "health"
  | "daily_life"
  | "technology";

export interface ReadingQuestion {
  question: string;
  options: string[];
  answer: number;
  hint?: string;
}

export interface ReadingPassage {
  id: string;
  mode: ReadingMode;
  level: ReadingLevel;
  theme: ReadingTheme;
  title: string;
  sentences: string[];
  targetVocabulary: string[];
  questions: ReadingQuestion[];
  jlptType?: string; // for JLPT mode: "poster" | "schedule" | "email" etc.
}

export interface ReadingSession {
  passageId: string;
  mode: ReadingMode;
  level: ReadingLevel;
  score: number;
  timeSeconds: number;
  clickedWords: string[];
  date: string;
}

export interface ReadingAnalytics {
  totalSessions: number;
  totalScore: number;
  totalTime: number;
  currentLevelLearning: ReadingLevel;
  currentLevelJlpt: ReadingLevel;
  sessions: ReadingSession[];
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const ANALYTICS_KEY = "readingAnalytics";
const LOOKUPS_KEY = "readingWordLookups";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_ANALYTICS: ReadingAnalytics = {
  totalSessions: 0,
  totalScore: 0,
  totalTime: 0,
  currentLevelLearning: 1,
  currentLevelJlpt: 1,
  sessions: [],
};

// ============================================================================
// ANALYTICS STORAGE
// ============================================================================

export function loadReadingAnalytics(): ReadingAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (!stored) return { ...DEFAULT_ANALYTICS };
    const parsed = JSON.parse(stored) as Partial<ReadingAnalytics>;
    return {
      ...DEFAULT_ANALYTICS,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { ...DEFAULT_ANALYTICS };
  }
}

export function saveReadingSession(
  session: ReadingSession,
  passed: boolean,
): void {
  try {
    const analytics = loadReadingAnalytics();
    analytics.totalSessions += 1;
    analytics.totalScore += session.score;
    analytics.totalTime += session.timeSeconds;
    analytics.sessions = [session, ...analytics.sessions].slice(0, 50);

    // Level progression: score >= 80 means level up
    if (passed && session.score >= 80) {
      if (session.mode === "learning") {
        analytics.currentLevelLearning = Math.min(
          4,
          analytics.currentLevelLearning + 1,
        ) as ReadingLevel;
      } else if (session.mode === "jlpt") {
        analytics.currentLevelJlpt = Math.min(
          4,
          analytics.currentLevelJlpt + 1,
        ) as ReadingLevel;
      }
    }
    // Regression: score < 50 drops level
    if (session.score < 50) {
      if (session.mode === "learning") {
        analytics.currentLevelLearning = Math.max(
          1,
          analytics.currentLevelLearning - 1,
        ) as ReadingLevel;
      }
    }

    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (e) {
    console.warn("[readingEngine] saveReadingSession failed:", e);
  }
}

// ============================================================================
// WORD LOOKUP TRACKING
// ============================================================================

export function loadWordLookups(): Record<string, number> {
  try {
    const stored = localStorage.getItem(LOOKUPS_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

export function updateWordLookup(
  word: string,
  _flag?: "understood" | "confused",
): void {
  try {
    const lookups = loadWordLookups();
    lookups[word] = (lookups[word] ?? 0) + 1;
    localStorage.setItem(LOOKUPS_KEY, JSON.stringify(lookups));
  } catch (e) {
    console.warn("[readingEngine] updateWordLookup failed:", e);
  }
}

export function getWeakReadingVocabulary(threshold = 3): VocabularyEntry[] {
  try {
    const lookups = loadWordLookups();
    return vocabularyData.filter(
      (v) => (lookups[v.vocabulary] ?? 0) >= threshold,
    );
  } catch {
    return [];
  }
}
// ============================================================================
// KANJI ANALYTICS
// ============================================================================

const KANJI_STATS_KEY = "kanjiLookupStats";

export interface KanjiStatEntry {
  lookupCount: number;
  lastSeen: number;
  wordContexts: string[];
}

export function updateKanjiAnalytics(word: string): void {
  try {
    const raw = localStorage.getItem(KANJI_STATS_KEY);
    const stats: Record<string, KanjiStatEntry> = raw
      ? (JSON.parse(raw) as Record<string, KanjiStatEntry>)
      : {};
    // Extract kanji characters from the word
    const kanjiChars = [...word].filter(
      (ch) => ch.charCodeAt(0) >= 0x4e00 && ch.charCodeAt(0) <= 0x9fff,
    );
    for (const kanji of kanjiChars) {
      const existing = stats[kanji] ?? {
        lookupCount: 0,
        lastSeen: 0,
        wordContexts: [],
      };
      existing.lookupCount += 1;
      existing.lastSeen = Date.now();
      if (!existing.wordContexts.includes(word)) {
        existing.wordContexts = [...existing.wordContexts, word].slice(-5);
      }
      stats[kanji] = existing;
    }
    localStorage.setItem(KANJI_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("[readingEngine] updateKanjiAnalytics failed:", e);
  }
}

// ============================================================================
// COVERAGE VALIDATION
// ============================================================================

/**
 * Calculate what percentage of tokens in a passage can be found in
 * the vocabulary database using a simplified 3-level lookup.
 */
export function calculateCoverage(
  passageText: string,
  vocab: VocabularyEntry[],
): { coverage: number; knownWords: string[]; unknownWords: string[] } {
  try {
    // Inline a minimal tokenizer (avoid circular imports — tokenizer imports kanjiData)
    const JAPANESE_RE = /[\u3041-\u9FFF\uFF66-\uFF9F\u30A0-\u30FF]+/g;
    const matches = passageText.match(JAPANESE_RE) ?? [];
    // Split on particles for a rough token list
    const PARTICLES = [
      "は",
      "が",
      "を",
      "に",
      "で",
      "と",
      "へ",
      "の",
      "も",
      "か",
    ];
    const rawTokens: string[] = [];
    for (const m of matches) {
      let rem = m;
      while (rem.length > 0) {
        let found = false;
        for (const p of PARTICLES) {
          if (rem.startsWith(p)) {
            rawTokens.push(p);
            rem = rem.slice(p.length);
            found = true;
            break;
          }
        }
        if (!found) {
          // Grab up to next particle
          let cutAt = rem.length;
          for (const p of PARTICLES) {
            const idx = rem.indexOf(p, 1);
            if (idx !== -1 && idx < cutAt) cutAt = idx;
          }
          rawTokens.push(rem.slice(0, cutAt));
          rem = rem.slice(cutAt);
        }
      }
    }

    const tokens = rawTokens.filter(
      (t) => t.length > 0 && !/^[\u3041-\u3096]+$/.test(t),
    );
    if (tokens.length === 0)
      return { coverage: 100, knownWords: [], unknownWords: [] };

    const knownWords: string[] = [];
    const unknownWords: string[] = [];

    for (const token of tokens) {
      const nm = token.toLowerCase();
      const found =
        vocab.find((e) => e.vocabulary === token) ??
        vocab.find((e) => e.vocabulary.toLowerCase() === nm) ??
        vocab.find((e) => (e.romaji ?? "").toLowerCase() === nm);
      if (found) {
        knownWords.push(token);
      } else {
        unknownWords.push(token);
      }
    }

    const coverage = Math.round((knownWords.length / tokens.length) * 100);
    return { coverage, knownWords, unknownWords };
  } catch {
    return { coverage: 0, knownWords: [], unknownWords: [] };
  }
}

// ============================================================================
// PASSAGE LIBRARY
// ============================================================================

// Each passage is hand-crafted with natural, coherent Japanese content.
// Theme-word clusters ensure contextually related vocabulary appears together.

export const LEARNING_PASSAGES: ReadingPassage[] = [
  // ─── Level 1: Single Sentence ─────────────────────────────────────────
  {
    id: "lrn-l1-office-1",
    mode: "learning",
    level: 1,
    theme: "office",
    title: "会社への出勤",
    sentences: ["田中さんは毎朝会社へ行きます。"],
    targetVocabulary: ["田中", "毎朝", "会社"],
    questions: [
      {
        question: "誰が会社へ行きますか？",
        options: ["田中さん", "山田さん", "鈴木さん", "先生"],
        answer: 0,
        hint: "文章の主語を探してください。",
      },
      {
        question: "田中さんはいつ会社へ行きますか？",
        options: ["毎朝", "毎晩", "毎週", "昨日"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l1-daily-1",
    mode: "learning",
    level: 1,
    theme: "daily_life",
    title: "朝の日課",
    sentences: ["鈴木さんは7時に起きます。"],
    targetVocabulary: ["鈴木", "起きます"],
    questions: [
      {
        question: "鈴木さんは何時に起きますか？",
        options: ["7時", "6時", "8時", "9時"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l1-school-1",
    mode: "learning",
    level: 1,
    theme: "school",
    title: "図書館で勉強",
    sentences: ["山田さんは図書館で勉強します。"],
    targetVocabulary: ["図書館", "勉強"],
    questions: [
      {
        question: "山田さんはどこで勉強しますか？",
        options: ["図書館", "学校", "家", "公園"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l1-family-1",
    mode: "learning",
    level: 1,
    theme: "family",
    title: "家族の夕食",
    sentences: ["母は毎日夕食を作ります。"],
    targetVocabulary: ["母", "毎日", "夕食"],
    questions: [
      {
        question: "誰が夕食を作りますか？",
        options: ["母", "父", "姉", "弟"],
        answer: 0,
      },
    ],
  },
  // ─── Level 2: 2–3 Sentences ───────────────────────────────────────────
  {
    id: "lrn-l2-weather-1",
    mode: "learning",
    level: 2,
    theme: "daily_life",
    title: "雨の日",
    sentences: [
      "昨日は雨でした。",
      "だから家にいました。",
      "テレビを見ました。",
    ],
    targetVocabulary: ["昨日", "雨", "家", "テレビ"],
    questions: [
      {
        question: "なぜ家にいましたか？",
        options: [
          "雨だったから",
          "仕事があったから",
          "疲れたから",
          "友達がいたから",
        ],
        answer: 0,
      },
      {
        question: "家で何をしましたか？",
        options: ["テレビを見た", "本を読んだ", "料理した", "寝た"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l2-shopping-1",
    mode: "learning",
    level: 2,
    theme: "shopping",
    title: "買い物の後",
    sentences: [
      "スーパーへ行きました。",
      "野菜と肉を買いました。",
      "とても安かったです。",
    ],
    targetVocabulary: ["スーパー", "野菜", "肉", "安い"],
    questions: [
      {
        question: "何を買いましたか？",
        options: ["野菜と肉", "魚と野菜", "果物と肉", "パンと野菜"],
        answer: 0,
      },
      {
        question: "値段はどうでしたか？",
        options: ["安かった", "高かった", "普通だった", "わからない"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l2-restaurant-1",
    mode: "learning",
    level: 2,
    theme: "restaurant",
    title: "昼ご飯",
    sentences: [
      "今日は友達とレストランに行きました。",
      "ラーメンを食べました。",
      "おいしかったです。",
    ],
    targetVocabulary: ["友達", "レストラン", "ラーメン", "おいしい"],
    questions: [
      {
        question: "誰と行きましたか？",
        options: ["友達", "家族", "同僚", "一人"],
        answer: 0,
      },
      {
        question: "ラーメンはどうでしたか？",
        options: ["おいしかった", "まずかった", "普通だった", "辛かった"],
        answer: 0,
      },
    ],
  },
  // ─── Level 3: Short Paragraph ─────────────────────────────────────────
  {
    id: "lrn-l3-commute-1",
    mode: "learning",
    level: 3,
    theme: "office",
    title: "毎朝の通勤",
    sentences: [
      "私は毎朝6時に起きます。",
      "朝ご飯を食べてから会社へ行きます。",
      "会社まで電車で30分かかります。",
    ],
    targetVocabulary: ["起きます", "朝ご飯", "会社", "電車"],
    questions: [
      {
        question: "会社まで何分かかりますか？",
        options: ["30分", "20分", "45分", "1時間"],
        answer: 0,
      },
      {
        question: "何で会社に行きますか？",
        options: ["電車", "バス", "自転車", "車"],
        answer: 0,
      },
      {
        question: "出発する前に何をしますか？",
        options: [
          "朝ご飯を食べる",
          "シャワーを浴びる",
          "新聞を読む",
          "運動する",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l3-school-1",
    mode: "learning",
    level: 3,
    theme: "school",
    title: "大学生活",
    sentences: [
      "山田さんは大学で経済学を勉強しています。",
      "毎週火曜日に図書館でレポートを書きます。",
      "来月は試験があります。",
    ],
    targetVocabulary: ["大学", "勉強", "図書館", "試験"],
    questions: [
      {
        question: "何を勉強していますか？",
        options: ["経済学", "英語", "歴史", "医学"],
        answer: 0,
      },
      {
        question: "いつ図書館へ行きますか？",
        options: ["毎週火曜日", "毎日", "週末", "月曜日"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l3-health-1",
    mode: "learning",
    level: 3,
    theme: "health",
    title: "体の調子",
    sentences: [
      "昨日から頭が痛いです。",
      "熱も少しあります。",
      "今日は病院に行くつもりです。",
    ],
    targetVocabulary: ["昨日", "頭", "熱", "病院"],
    questions: [
      {
        question: "何が痛いですか？",
        options: ["頭", "足", "腹", "腕"],
        answer: 0,
      },
      {
        question: "今日どこに行きますか？",
        options: ["病院", "薬局", "学校", "会社"],
        answer: 0,
      },
    ],
  },
  // ─── Level 4: N4 Paragraph ────────────────────────────────────────────
  {
    id: "lrn-l4-work-1",
    mode: "learning",
    level: 4,
    theme: "office",
    title: "新しい仕事",
    sentences: [
      "田中さんは新しい会社に入りました。",
      "最初は仕事が難しかったですが、今は慣れました。",
      "毎日残業がありますが、やりがいを感じています。",
    ],
    targetVocabulary: ["会社", "仕事", "残業"],
    questions: [
      {
        question: "最初、仕事はどうでしたか？",
        options: ["難しかった", "簡単だった", "楽しかった", "つまらなかった"],
        answer: 0,
      },
      {
        question: "今、仕事はどうですか？",
        options: ["慣れた", "難しい", "楽しくない", "つらい"],
        answer: 0,
      },
      {
        question: "毎日何がありますか？",
        options: ["残業", "会議", "出張", "研修"],
        answer: 0,
      },
    ],
  },
  {
    id: "lrn-l4-travel-1",
    mode: "learning",
    level: 4,
    theme: "travel",
    title: "旅行の計画",
    sentences: [
      "来月、家族と北海道へ旅行する予定です。",
      "飛行機のチケットはもう予約しました。",
      "現地では温泉に入ったり、海鮮料理を食べたりするつもりです。",
    ],
    targetVocabulary: ["旅行", "家族", "飛行機", "温泉"],
    questions: [
      {
        question: "誰と旅行しますか？",
        options: ["家族", "友達", "同僚", "一人"],
        answer: 0,
      },
      {
        question: "チケットはどうしましたか？",
        options: [
          "もう予約した",
          "まだ予約していない",
          "キャンセルした",
          "高すぎた",
        ],
        answer: 0,
      },
    ],
  },
];

export const JLPT_PASSAGES: ReadingPassage[] = [
  {
    id: "jlpt-poster-1",
    mode: "jlpt",
    level: 1,
    theme: "school",
    title: "お知らせ — 図書館",
    jlptType: "poster",
    sentences: [
      "【図書館からのお知らせ】",
      "来週の月曜日から金曜日まで、図書館の改修工事のため休館します。",
      "再開は来月1日（火）の予定です。",
      "ご不便をおかけして、申し訳ありません。",
    ],
    targetVocabulary: ["図書館", "工事", "再開", "申し訳"],
    questions: [
      {
        question: "なぜ図書館は休みますか？",
        options: ["工事のため", "祝日のため", "試験のため", "清掃のため"],
        answer: 0,
      },
      {
        question: "図書館はいつ再開しますか？",
        options: ["来月1日", "来週月曜日", "来週金曜日", "今週中"],
        answer: 0,
      },
      {
        question: "このお知らせは何ですか？",
        options: [
          "休館のお知らせ",
          "新しい本のお知らせ",
          "勉強会のお知らせ",
          "イベントのお知らせ",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "jlpt-schedule-1",
    mode: "jlpt",
    level: 1,
    theme: "school",
    title: "授業スケジュール",
    jlptType: "schedule",
    sentences: [
      "【日本語クラス スケジュール】",
      "月曜日・水曜日：午前10時〜12時（文法・読解）",
      "火曜日・木曜日：午後2時〜4時（会話・リスニング）",
      "土曜日：午前9時〜11時（テスト対策）",
      "授業に遅れる場合は、必ず連絡してください。",
    ],
    targetVocabulary: ["授業", "文法", "会話", "連絡"],
    questions: [
      {
        question: "文法の授業はいつですか？",
        options: ["月曜日・水曜日", "火曜日・木曜日", "土曜日", "金曜日"],
        answer: 0,
      },
      {
        question: "テスト対策はいつですか？",
        options: ["土曜日", "日曜日", "月曜日", "金曜日"],
        answer: 0,
      },
      {
        question: "遅れる場合はどうしますか？",
        options: ["連絡する", "授業を休む", "後で来る", "何もしない"],
        answer: 0,
      },
    ],
  },
  {
    id: "jlpt-email-1",
    mode: "jlpt",
    level: 2,
    theme: "office",
    title: "メール — 会議の変更",
    jlptType: "email",
    sentences: [
      "件名：来週の会議について",
      "田中様、",
      "来週火曜日の会議ですが、都合が悪くなりましたので、木曜日に変更させていただけませんか？",
      "時間は同じく午後3時からでお願いします。",
      "ご確認のほど、よろしくお願いいたします。",
      "山田",
    ],
    targetVocabulary: ["会議", "変更", "確認"],
    questions: [
      {
        question: "山田さんはなぜメールを送りましたか？",
        options: [
          "会議の日程を変えたいから",
          "会議をキャンセルしたいから",
          "新しい会議を追加したいから",
          "会議の場所を変えたいから",
        ],
        answer: 0,
      },
      {
        question: "まず何をしなければなりませんか？",
        options: [
          "田中さんに確認する",
          "会議室を予約する",
          "資料を準備する",
          "参加者に連絡する",
        ],
        answer: 0,
      },
      {
        question: "何時から会議がありますか？",
        options: ["午後3時", "午前10時", "午後2時", "午後4時"],
        answer: 0,
      },
    ],
  },
  {
    id: "jlpt-announcement-1",
    mode: "jlpt",
    level: 2,
    theme: "daily_life",
    title: "マンションのお知らせ",
    jlptType: "announcement",
    sentences: [
      "【住民のみなさまへ】",
      "来月15日（土）に建物の定期点検を行います。",
      "点検時間は午前9時から12時までです。",
      "点検中は水道が一時的に使えなくなる場合があります。",
      "ご協力をお願いいたします。",
      "管理組合",
    ],
    targetVocabulary: ["定期", "点検", "水道", "協力"],
    questions: [
      {
        question: "点検はいつですか？",
        options: ["来月15日", "今月15日", "来週土曜日", "今日"],
        answer: 0,
      },
      {
        question: "点検中、何が使えなくなりますか？",
        options: ["水道", "電気", "エレベーター", "駐車場"],
        answer: 0,
      },
      {
        question: "このお知らせは誰のためですか？",
        options: ["住民", "管理会社", "工事業者", "来客"],
        answer: 0,
      },
    ],
  },
  {
    id: "jlpt-brochure-1",
    mode: "jlpt",
    level: 3,
    theme: "health",
    title: "健康診断のご案内",
    jlptType: "brochure",
    sentences: [
      "【健康診断のご案内】",
      "対象：25歳以上の市民の方",
      "日時：毎月第1・第3土曜日　午前9時〜11時",
      "場所：市民センター2階",
      "内容：血圧測定・血液検査・体重測定",
      "費用：無料",
      "予約は不要です。直接お越しください。",
    ],
    targetVocabulary: ["健康", "費用", "予約"],
    questions: [
      {
        question: "この健康診断はいくらですか？",
        options: ["無料", "500円", "1000円", "2000円"],
        answer: 0,
      },
      {
        question: "予約はどうすればいいですか？",
        options: [
          "予約不要、直接行く",
          "電話で予約する",
          "インターネットで予約する",
          "病院で予約する",
        ],
        answer: 0,
      },
      {
        question: "誰が受けられますか？",
        options: ["25歳以上の市民", "全員", "子供だけ", "65歳以上"],
        answer: 0,
      },
    ],
  },
];

export const ADAPTIVE_PASSAGES: ReadingPassage[] = [
  {
    id: "adp-keigo-1",
    mode: "adaptive",
    level: 3,
    theme: "office",
    title: "丁寧な電話",
    sentences: [
      "田中様でいらっしゃいますか？",
      "山田と申します。",
      "本日はご連絡いただきまして、ありがとうございます。",
      "後ほど改めてお電話いたします。",
    ],
    targetVocabulary: ["申します", "連絡", "改めて"],
    questions: [
      {
        question: "山田さんは今何をしていますか？",
        options: ["電話している", "メールを送っている", "会議中", "出張中"],
        answer: 0,
      },
      {
        question: "次に山田さんは何をしますか？",
        options: ["また電話する", "メールを送る", "訪問する", "何もしない"],
        answer: 0,
      },
    ],
  },
  {
    id: "adp-daily-1",
    mode: "adaptive",
    level: 2,
    theme: "daily_life",
    title: "目覚まし時計",
    sentences: [
      "鈴木さんは毎朝7時に目覚まし時計をセットします。",
      "でも、目が覚めても、すぐには起きません。",
      "もう一度だけ寝ようとして、いつも遅刻します。",
    ],
    targetVocabulary: ["目覚まし時計", "目が覚めます", "遅刻"],
    questions: [
      {
        question: "鈴木さんの問題は何ですか？",
        options: [
          "いつも遅刻する",
          "時計が壊れた",
          "起きすぎる",
          "早く寝すぎる",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "adp-emotion-1",
    mode: "adaptive",
    level: 3,
    theme: "family",
    title: "心配な気持ち",
    sentences: [
      "息子は最近、悩みがあるようです。",
      "話しかけても、あまり話しません。",
      "母として、急に何が起きたか心配です。",
    ],
    targetVocabulary: ["悩み", "急に", "心配"],
    questions: [
      {
        question: "母は何を心配していますか？",
        options: ["息子のこと", "仕事のこと", "お金のこと", "健康のこと"],
        answer: 0,
      },
      {
        question: "息子の様子はどうですか？",
        options: ["あまり話さない", "よく話す", "元気がある", "楽しそう"],
        answer: 0,
      },
    ],
  },
];

const ALL_PASSAGES: ReadingPassage[] = [
  ...LEARNING_PASSAGES,
  ...JLPT_PASSAGES,
  ...ADAPTIVE_PASSAGES,
];

// ============================================================================
// PASSAGE RETRIEVAL
// ============================================================================

export function getReadingPassage(
  level: ReadingLevel,
  excludeIds: string[] = [],
): ReadingPassage | null {
  try {
    const candidates = LEARNING_PASSAGES.filter(
      (p) => p.level === level && !excludeIds.includes(p.id),
    );
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  } catch {
    return null;
  }
}

export function getJlptPassage(
  level: ReadingLevel,
  excludeIds: string[] = [],
): ReadingPassage | null {
  try {
    const candidates = JLPT_PASSAGES.filter(
      (p) => p.level === level && !excludeIds.includes(p.id),
    );
    if (candidates.length === 0) {
      // fallback: same level without exclude filter
      const fallback = JLPT_PASSAGES.filter((p) => p.level === level);
      return fallback.length > 0
        ? fallback[Math.floor(Math.random() * fallback.length)]
        : null;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  } catch {
    return null;
  }
}

export function getAdaptivePassage(
  weakWords: string[],
  excludeIds: string[] = [],
): ReadingPassage | null {
  try {
    if (weakWords.length === 0) {
      // no weakness data yet — pick any adaptive passage
      const pool = ALL_PASSAGES.filter((p) => !excludeIds.includes(p.id));
      return pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : null;
    }

    // Score passages by how many weak words they contain
    const scored = ALL_PASSAGES.filter((p) => !excludeIds.includes(p.id))
      .map((p) => ({
        passage: p,
        score: p.targetVocabulary.filter((w) => weakWords.includes(w)).length,
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;
    return scored[0].passage;
  } catch {
    return null;
  }
}
