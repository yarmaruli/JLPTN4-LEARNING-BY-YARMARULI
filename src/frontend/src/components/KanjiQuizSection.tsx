/**
 * KanjiQuizSection.tsx
 * Dedicated Kanji Quiz — 5 types: K→かな, かな→K, K→Arti, Arti→K, Konteks
 * 10 questions per session, 4 choices A/B/C/D, mastery tracking, answer panel.
 */

import KanjiAnswerPanel from "@/components/KanjiAnswerPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { kanjiData, vocabularyData } from "@/data/kanjiData";
import type { KanjiEntry, VocabularyEntry } from "@/data/kanjiData";
import {
  loadKanjiTracking,
  recordKanjiCorrect,
  recordKanjiSeen,
  recordKanjiWrong,
} from "@/lib/masteryEngine";
import {
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
import { type ReactElement, useCallback, useMemo, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

type QuizType = "k-kana" | "kana-k" | "k-arti" | "arti-k" | "konteks";
type KanjiFilter = "all" | "n5" | "n4" | "weak" | "unmastered" | "dokkai";

interface QuizQuestion {
  type: QuizType;
  entry: KanjiEntry;
  /** Text displayed as the prompt */
  prompt: string;
  /** 4 choices */
  options: string[];
  /** Index 0-3 of the correct option */
  correctIndex: number;
}

type Phase = "select" | "quiz" | "result";

const TAB_LABELS: Record<QuizType, string> = {
  "k-kana": "K→かな",
  "kana-k": "かな→K",
  "k-arti": "K→Arti",
  "arti-k": "Arti→K",
  konteks: "Konteks",
};

const DOKKAI_PRIORITY_KANJI = new Set([
  "経",
  "験",
  "発",
  "表",
  "説",
  "明",
  "準",
  "備",
  "利",
  "用",
  "連",
  "絡",
  "約",
  "束",
  "必",
  "要",
  "相",
  "談",
  "卒",
  "業",
  "入",
  "学",
  "予",
  "定",
  "特",
  "別",
  "原",
  "因",
  "運",
  "転",
  "研",
  "究",
  "文",
  "化",
  "生",
  "活",
  "交",
  "通",
  "確",
  "認",
  "安",
  "全",
]);

const FILTER_LABELS: Record<KanjiFilter, string> = {
  all: "Semua Kanji",
  n5: "N5 Saja",
  n4: "N4 Saja",
  weak: "Kanji Lemah",
  unmastered: "Belum Dikuasai",
  dokkai: "Prioritas Dokkai",
};

const CHOICE_LABELS = ["A", "B", "C", "D"];
const SESSION_SIZE = 10;

// ============================================================================
// HELPERS
// ============================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  pool: KanjiEntry[],
  exclude: KanjiEntry,
  count: number,
): KanjiEntry[] {
  const candidates = pool.filter((e) => e.character !== exclude.character);
  return shuffle(candidates).slice(0, count);
}

function buildQuestion(
  entry: KanjiEntry,
  type: QuizType,
  pool: KanjiEntry[],
): QuizQuestion {
  const distractors = pickDistractors(pool, entry, 3);

  switch (type) {
    case "k-kana": {
      // Show kanji, pick correct romaji/reading
      const correct = entry.romaji;
      const opts = shuffle([correct, ...distractors.map((d) => d.romaji)]);
      return {
        type,
        entry,
        prompt: entry.character,
        options: opts,
        correctIndex: opts.indexOf(correct),
      };
    }
    case "kana-k": {
      // Show romaji/hiragana, pick correct kanji
      const correct = entry.character;
      const opts = shuffle([correct, ...distractors.map((d) => d.character)]);
      return {
        type,
        entry,
        prompt: entry.romaji,
        options: opts,
        correctIndex: opts.indexOf(correct),
      };
    }
    case "k-arti": {
      // Show kanji, pick correct Indonesian meaning
      const correct = entry.meaning;
      const opts = shuffle([correct, ...distractors.map((d) => d.meaning)]);
      return {
        type,
        entry,
        prompt: entry.character,
        options: opts,
        correctIndex: opts.indexOf(correct),
      };
    }
    case "arti-k": {
      // Show meaning, pick correct kanji
      const correct = entry.character;
      const opts = shuffle([correct, ...distractors.map((d) => d.character)]);
      return {
        type,
        entry,
        prompt: entry.meaning,
        options: opts,
        correctIndex: opts.indexOf(correct),
      };
    }
    case "konteks": {
      // Show sentence with kanji blanked, pick correct kanji
      const blank = "___";
      const sentence = `この${blank}は「${entry.meaning}」です。`;
      const correct = entry.character;
      const opts = shuffle([correct, ...distractors.map((d) => d.character)]);
      return {
        type,
        entry,
        prompt: sentence,
        options: opts,
        correctIndex: opts.indexOf(correct),
      };
    }
  }
}

function generateSession(
  type: QuizType,
  pool: KanjiEntry[],
  _filter: KanjiFilter,
  allKanji: KanjiEntry[],
): QuizQuestion[] {
  if (pool.length < 4) return [];
  // Prioritize N4 (80%) over N5 (20%) per app goal
  const n4 = pool.filter((e) => e.jlptLevel === "N4");
  const n5 = pool.filter((e) => e.jlptLevel === "N5");
  const rest = pool.filter((e) => e.jlptLevel !== "N5" && e.jlptLevel !== "N4");
  const n4Count = Math.ceil(SESSION_SIZE * 0.8);
  const n5Count = SESSION_SIZE - n4Count;
  const n4picks = shuffle(n4).slice(0, n4Count);
  const n5picks = shuffle(n5).slice(0, n5Count);
  const fills = shuffle(rest);
  const needed = SESSION_SIZE - n4picks.length - n5picks.length;
  const ordered = [...n4picks, ...n5picks, ...fills.slice(0, needed)];
  const picks = ordered.slice(0, SESSION_SIZE);
  // distractor pool: always use all kanji so choices are meaningful
  const distractorPool = allKanji.length >= 4 ? allKanji : pool;
  return picks.map((entry) => buildQuestion(entry, type, distractorPool));
}

function findExampleVocab(
  kanji: string,
  vocab: VocabularyEntry[],
): VocabularyEntry | null {
  return (
    vocab.find((v) => {
      const w =
        (v as VocabularyEntry & { word?: string }).word ?? v.vocabulary ?? "";
      return w.includes(kanji);
    }) ?? null
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  onClose?: () => void;
  onViewRadical?: () => void;
}

export default function KanjiQuizSection({
  onClose,
  onViewRadical,
}: Props): ReactElement {
  const [selectedType, setSelectedType] = useState<QuizType>("k-kana");
  const [kanjiFilter, setKanjiFilter] = useState<KanjiFilter>("all");
  const [phase, setPhase] = useState<Phase>("select");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [repeatEntry, setRepeatEntry] = useState<KanjiEntry | null>(null);

  const safeKanji = useMemo(
    () => (Array.isArray(kanjiData) ? kanjiData : []),
    [],
  );

  const filteredKanji = useMemo((): KanjiEntry[] => {
    if (kanjiFilter === "all") return safeKanji;
    if (kanjiFilter === "n5")
      return safeKanji.filter((e) => e.jlptLevel === "N5");
    if (kanjiFilter === "n4")
      return safeKanji.filter((e) => e.jlptLevel === "N4");
    if (kanjiFilter === "dokkai")
      return safeKanji.filter((e) => DOKKAI_PRIORITY_KANJI.has(e.character));
    if (kanjiFilter === "weak" || kanjiFilter === "unmastered") {
      const tracking = loadKanjiTracking();
      if (kanjiFilter === "weak") {
        const weak = safeKanji.filter((e) => {
          const rec = tracking[e.character];
          if (!rec) return false;
          return rec.wrongCount > rec.correctCount || rec.masteryLevel < 2;
        });
        return weak.length >= 4 ? weak : safeKanji;
      }
      // unmastered: seen but masteryLevel < 4
      const unmastered = safeKanji.filter((e) => {
        const rec = tracking[e.character];
        if (!rec) return true; // never seen = unmastered
        return rec.masteryLevel < 4;
      });
      return unmastered.length >= 4 ? unmastered : safeKanji;
    }
    return safeKanji;
  }, [kanjiFilter, safeKanji]);
  const safeVocab = useMemo(
    () => (Array.isArray(vocabularyData) ? vocabularyData : []),
    [],
  );

  // ── start session ──────────────────────────────────────────────────────────

  const startSession = useCallback(
    (type: QuizType, repeatK?: KanjiEntry) => {
      let qs: QuizQuestion[];
      if (repeatK) {
        // Repeat only this entry, same type — use full pool for distractors
        qs = [buildQuestion(repeatK, type, safeKanji)];
      } else {
        qs = generateSession(type, filteredKanji, kanjiFilter, safeKanji);
      }
      if (qs.length === 0) return;
      // Record seen for first question
      recordKanjiSeen(qs[0].entry.character);
      setQuestions(qs);
      setCurrentIdx(0);
      setChosenIdx(null);
      setIsAnswered(false);
      setScore(0);
      setRepeatEntry(null);
      setPhase("quiz");
    },
    [filteredKanji, kanjiFilter, safeKanji],
  );

  const handleTypeSelect = useCallback(
    (t: QuizType) => {
      setSelectedType(t);
      startSession(t);
    },
    [startSession],
  );

  // ── answer ─────────────────────────────────────────────────────────────────

  const currentQ = questions[currentIdx] ?? null;

  const handleAnswer = useCallback(
    (idx: number) => {
      if (isAnswered || !currentQ) return;
      setChosenIdx(idx);
      setIsAnswered(true);
      const correct = idx === currentQ.correctIndex;
      if (correct) {
        recordKanjiCorrect(currentQ.entry.character);
        setScore((prev) => prev + 1);
      } else {
        recordKanjiWrong(currentQ.entry.character);
      }
    },
    [isAnswered, currentQ],
  );

  // ── navigation ─────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!currentQ) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setPhase("result");
      return;
    }
    recordKanjiSeen(questions[nextIdx].entry.character);
    setCurrentIdx(nextIdx);
    setChosenIdx(null);
    setIsAnswered(false);
  }, [currentIdx, currentQ, questions]);

  const handlePelajariLagi = useCallback(() => {
    if (!currentQ) return;
    setRepeatEntry(currentQ.entry);
    startSession(selectedType, currentQ.entry);
  }, [currentQ, selectedType, startSession]);

  const handleRestart = useCallback(() => {
    startSession(selectedType);
  }, [selectedType, startSession]);

  const handleBackToSelect = useCallback(() => {
    setPhase("select");
    setQuestions([]);
    setCurrentIdx(0);
    setChosenIdx(null);
    setIsAnswered(false);
    setScore(0);
    setRepeatEntry(null);
  }, []);

  // ── derived ────────────────────────────────────────────────────────────────

  const progressPct =
    questions.length > 0
      ? ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100
      : 0;

  // example vocab kept for legacy use (unused — KanjiAnswerPanel handles it)
  const _exampleVocab = currentQ
    ? findExampleVocab(currentQ.entry.character, safeVocab)
    : null;
  void _exampleVocab;

  const promptLabel: Record<QuizType, string> = {
    "k-kana": "Bagaimana cara membaca kanji ini?",
    "kana-k": "Pilih kanji yang sesuai dengan bacaan:",
    "k-arti": "Apa arti kanji ini?",
    "arti-k": "Pilih kanji yang artinya:",
    konteks: "Kanji apa yang cocok?",
  };

  // ── PHASE: select ──────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="kanji_quiz.select_screen"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">Quiz Kanji</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              data-ocid="kanji_quiz.close_button"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          Pilih jenis quiz, lalu kerjakan 10 soal pilihan ganda A/B/C/D.
        </p>

        {/* ── Filter kanji ── */}
        <div className="space-y-2" data-ocid="kanji_quiz.filter_section">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filter Kanji
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FILTER_LABELS) as KanjiFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setKanjiFilter(f)}
                data-ocid={`kanji_quiz.filter_${f}_button`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  kanjiFilter === f
                    ? "border-cyan-400 bg-cyan-950/60 text-cyan-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-cyan-600 hover:text-cyan-400"
                }`}
              >
                {FILTER_LABELS[f]}
                {f === "all" && (
                  <span className="ml-1 text-gray-500">
                    ({safeKanji.length})
                  </span>
                )}
                {f === "n4" && (
                  <span className="ml-1 text-gray-500">
                    ({safeKanji.filter((e) => e.jlptLevel === "N4").length})
                  </span>
                )}
                {f === "n5" && (
                  <span className="ml-1 text-gray-500">
                    ({safeKanji.filter((e) => e.jlptLevel === "N5").length})
                  </span>
                )}
                {f === "dokkai" && (
                  <span className="ml-1 text-gray-500">
                    (
                    {
                      safeKanji.filter((e) =>
                        DOKKAI_PRIORITY_KANJI.has(e.character),
                      ).length
                    }
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
          {kanjiFilter !== "all" && (
            <p className="text-xs text-cyan-500">
              {filteredKanji.length} kanji tersedia untuk filter ini.
              {filteredKanji.length < 4 && (
                <span className="text-yellow-400 ml-1">
                  (Terlalu sedikit — akan pakai semua kanji)
                </span>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(TAB_LABELS) as QuizType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeSelect(t)}
              data-ocid={`kanji_quiz.type_${t.replace("-", "_")}_button`}
              className="w-full text-left p-5 rounded-xl border-2 border-gray-700 bg-gray-800 hover:border-cyan-400 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-cyan-400 group-hover:text-cyan-300">
                    {TAB_LABELS[t]}
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {t === "k-kana" && "Lihat kanji → pilih bacaan (romaji)"}
                    {t === "kana-k" && "Lihat bacaan → pilih kanji yang benar"}
                    {t === "k-arti" && "Lihat kanji → pilih arti Indonesia"}
                    {t === "arti-k" && "Lihat arti → pilih kanji yang tepat"}
                    {t === "konteks" &&
                      "Kalimat dengan kanji kosong → pilih kanji yang cocok"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PHASE: result ──────────────────────────────────────────────────────────

  if (phase === "result") {
    const total = questions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const emoji = pct === 100 ? "🎉" : pct >= 70 ? "👏" : "💪";
    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="kanji_quiz.result_screen"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">Hasil Quiz Kanji</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              data-ocid="kanji_quiz.result_close_button"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-6xl">{emoji}</div>
            <div className="text-5xl font-bold text-cyan-400">{pct}%</div>
            <p className="text-gray-300">
              {score} / {total} jawaban benar
            </p>
            <p className="text-gray-400 text-sm">
              {pct >= 80
                ? "Hebat! Terus pertahankan!"
                : pct >= 50
                  ? "Bagus, tapi masih bisa lebih baik."
                  : "Jangan menyerah, latih lagi!"}
            </p>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            onClick={handleRestart}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
            size="lg"
            data-ocid="kanji_quiz.restart_button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Ulangi Quiz
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToSelect}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            size="lg"
            data-ocid="kanji_quiz.back_button"
          >
            Pilih Jenis Lain
          </Button>
        </div>
      </div>
    );
  }

  // ── PHASE: quiz ────────────────────────────────────────────────────────────

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-400">Memuat soal...</p>
      </div>
    );
  }

  const isCorrect = chosenIdx !== null && chosenIdx === currentQ.correctIndex;

  const isLargePrompt =
    currentQ.type === "k-kana" ||
    currentQ.type === "k-arti" ||
    currentQ.type === "konteks";

  return (
    <div
      className="max-w-2xl mx-auto space-y-4"
      data-ocid="kanji_quiz.quiz_screen"
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">
            {TAB_LABELS[currentQ.type]}
          </span>
          {repeatEntry && (
            <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700 text-xs">
              Pelajari Lagi
            </Badge>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            data-ocid="kanji_quiz.quiz_close_button"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* progress bar */}
      <div className="space-y-1" data-ocid="kanji_quiz.progress">
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            Soal {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-cyan-400 font-semibold">{score} benar</span>
        </div>
        <Progress
          value={progressPct}
          className="h-2 bg-gray-700 [&>div]:bg-cyan-500"
          data-ocid="kanji_quiz.progress_bar"
        />
      </div>

      {/* question card */}
      <Card
        className="bg-gray-800 border-gray-700 shadow-lg"
        data-ocid="kanji_quiz.question_card"
      >
        <CardContent className="pt-6 pb-4 space-y-4">
          {/* prompt */}
          <div className="text-center space-y-2">
            <p className="text-gray-400 text-sm">
              {promptLabel[currentQ.type]}
            </p>
            <div
              className={
                isLargePrompt
                  ? "text-7xl font-bold text-white py-3 leading-none"
                  : "text-3xl font-semibold text-cyan-300 py-2"
              }
              data-ocid="kanji_quiz.prompt_text"
            >
              {currentQ.prompt}
            </div>
          </div>

          {/* choices */}
          <div
            className="grid grid-cols-1 gap-2"
            data-ocid="kanji_quiz.options"
          >
            {currentQ.options.map((opt, idx) => {
              const isSelected = chosenIdx === idx;
              const isCorrectOpt = idx === currentQ.correctIndex;
              const revealed = isAnswered;

              let cls =
                "w-full p-3.5 text-left rounded-lg border-2 transition-all flex items-start gap-3 ";
              if (revealed) {
                if (isCorrectOpt)
                  cls += "border-green-500 bg-green-950/40 text-green-300";
                else if (isSelected)
                  cls += "border-red-500 bg-red-950/40 text-red-300";
                else
                  cls +=
                    "border-gray-700 bg-gray-900/30 text-gray-500 opacity-60";
              } else {
                cls += isSelected
                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-200"
                  : "border-gray-700 bg-gray-900 text-gray-200 hover:border-cyan-500 hover:bg-gray-700";
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={cls}
                  data-ocid={`kanji_quiz.option.${idx + 1}`}
                >
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                    {CHOICE_LABELS[idx]}
                  </span>
                  <span className="font-medium text-base flex-1 whitespace-normal break-words leading-snug min-w-0">
                    {opt}
                  </span>
                  {revealed && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  )}
                  {revealed && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* answer panel — rich explanation with radical, vocab examples, example sentence */}
      {isAnswered && (
        <KanjiAnswerPanel
          isCorrect={isCorrect}
          entry={currentQ.entry}
          onNext={handleNext}
          onReviewAgain={handlePelajariLagi}
          onViewRadical={onViewRadical}
          nextLabel={
            currentIdx + 1 >= questions.length ? "Lihat Skor" : "Lanjut →"
          }
        />
      )}
    </div>
  );
}
