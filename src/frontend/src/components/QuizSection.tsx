import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Target,
  Trophy,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { kanjiData, vocabularyData } from "../data/kanjiData";
import {
  type AdaptiveQuestion,
  type DifficultyLevel,
  type JlptLevelMode,
  type QuizMode,
  generateQuizSession,
  getMasteryItem,
  getWeakItems,
  loadMasteryData,
  maybeRequeueQuestion,
  recordQuizAnswer,
  updateMasteryItem,
} from "../lib/masteryEngine";
import { type QuizSession, saveQuizSession } from "../lib/quizHistory";

// ── types ──────────────────────────────────────────────────────────────────

type Phase = "select" | "quiz" | "result";
type JlptFilter = "Semua" | "N5" | "N4";

interface ModeConfig {
  id: QuizMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  questionCount: string;
}

interface AnswerRecord {
  question: AdaptiveQuestion;
  userAnswerIndex: number;
  isCorrect: boolean;
  masteryBefore: number;
  masteryAfter: number;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const MASTERY_LABELS: Record<number, string> = {
  0: "Baru",
  1: "Sering Salah",
  2: "Mulai Kenal",
  3: "Cukup Paham",
  4: "Hampir Hafal",
  5: "Mastered",
};

const DIFFICULTY_ID_LABELS: Record<DifficultyLevel, string> = {
  easy: "Mudah",
  normal: "Normal",
  hard: "Sulit",
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: "bg-green-500/10 text-green-700 border-green-400/40",
  normal: "bg-yellow-500/10 text-yellow-700 border-yellow-400/40",
  hard: "bg-red-500/10 text-red-700 border-red-400/40",
};

function MasteryStars({ level }: { level: number }) {
  const filled = Math.min(5, Math.max(0, level));
  return (
    <span
      className="text-xs tracking-tighter"
      aria-label={`Mastery level ${level}`}
    >
      {"⭐".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: "quick",
    label: "Quick Quiz",
    description:
      "5 soal pilihan ganda. Cocok untuk review cepat di sela waktu luang.",
    icon: <Zap className="w-5 h-5" />,
    questionCount: "5 soal",
  },
  {
    id: "study",
    label: "Study Session",
    description:
      "15 soal campuran kanji dan kosakata. Belajar mendalam dan menyeluruh.",
    icon: <BookOpen className="w-5 h-5" />,
    questionCount: "15 soal",
  },
  {
    id: "weakness",
    label: "Weakness Training",
    description:
      "Fokus pada item yang sering salah. Latih titik lemah sampai kuat.",
    icon: <Target className="w-5 h-5" />,
    questionCount: "Adaptif",
  },
];

// ── component ────────────────────────────────────────────────────────────────

export function QuizSection() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedMode, setSelectedMode] = useState<QuizMode | null>(null);
  const [selectedJlptLevel, setSelectedJlptLevel] = useState<JlptFilter>("N4");

  // Derive jlptLevelMode from the JLPT filter selection
  const jlptLevelMode: JlptLevelMode =
    selectedJlptLevel === "N4"
      ? "n4focus"
      : selectedJlptLevel === "N5"
        ? "n5only"
        : "all";

  // quiz state
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [remaining, setRemaining] = useState<AdaptiveQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(
    null,
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [dataError, setDataError] = useState(false);
  const [noWeakItems, setNoWeakItems] = useState(false);

  // review queue: track which itemIds have been re-queued this session
  const reviewedItems = useRef<Set<string>>(new Set());

  // ── data validation ──────────────────────────────────────────────────────

  const safeKanji = Array.isArray(kanjiData) ? kanjiData : [];
  const safeVocab = Array.isArray(vocabularyData) ? vocabularyData : [];

  // Apply JLPT level filter
  const filteredKanji =
    selectedJlptLevel === "Semua"
      ? safeKanji
      : safeKanji.filter((k) => k.jlptLevel === selectedJlptLevel);
  const filteredVocab =
    selectedJlptLevel === "Semua"
      ? safeVocab
      : safeVocab.filter((v) => v.jlptLevel === selectedJlptLevel);

  const hasData = filteredKanji.length > 0 || filteredVocab.length > 0;

  // ── start quiz ────────────────────────────────────────────────────────────

  const startQuiz = useCallback(
    (mode: QuizMode) => {
      if (!hasData) {
        setDataError(true);
        return;
      }

      // Check weakness mode — warn if no weak items
      if (mode === "weakness") {
        const allItems = [...filteredKanji, ...filteredVocab];
        const weak = getWeakItems(allItems, 1);
        if (weak.length === 0) {
          setNoWeakItems(true);
          setSelectedMode(mode);
          setPhase("quiz");
          setQuestions([]);
          setRemaining([]);
          return;
        }
      }

      setNoWeakItems(false);
      setDataError(false);

      const mastery = loadMasteryData();
      const generated = generateQuizSession(
        mode,
        filteredKanji,
        filteredVocab,
        mastery,
        jlptLevelMode,
      );

      if (generated.length === 0) {
        setDataError(true);
        return;
      }

      reviewedItems.current = new Set();
      setSelectedMode(mode);
      setQuestions(generated);
      setRemaining(generated.slice(1));
      setCurrentIndex(0);
      setSelectedAnswerIdx(null);
      setIsAnswered(false);
      setScore(0);
      setAnswers([]);
      setPhase("quiz");
    },
    [hasData, filteredKanji, filteredVocab, jlptLevelMode],
  );

  // ── answer handling ───────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex] ?? null;

  const handleAnswerSelect = useCallback(
    (optionIdx: number) => {
      if (isAnswered || !currentQuestion) return;

      const isCorrect = optionIdx === currentQuestion.correctIndex;
      const masteryBefore = getMasteryItem(currentQuestion.itemId).masteryLevel;

      updateMasteryItem(currentQuestion.itemId, isCorrect);
      const masteryAfter = getMasteryItem(currentQuestion.itemId).masteryLevel;

      // Record for N4 adaptive difficulty tracking
      const itemJlptLevel =
        currentQuestion.category === "kanji"
          ? (filteredKanji.find(
              (k) => `kanji_${k.character}` === currentQuestion.itemId,
            )?.jlptLevel ?? "N4")
          : (filteredVocab.find(
              (v) => `vocab_${v.vocabulary}` === currentQuestion.itemId,
            )?.jlptLevel ?? "N4");
      recordQuizAnswer(itemJlptLevel, isCorrect);

      setSelectedAnswerIdx(optionIdx);
      setIsAnswered(true);
      if (isCorrect) setScore((prev) => prev + 1);

      setAnswers((prev) => [
        ...prev,
        {
          question: currentQuestion,
          userAnswerIndex: optionIdx,
          isCorrect,
          masteryBefore,
          masteryAfter,
        },
      ]);

      // maybe requeue on wrong answer
      if (!isCorrect) {
        setRemaining((prev) =>
          maybeRequeueQuestion(
            currentIndex,
            currentQuestion,
            prev,
            reviewedItems.current,
          ),
        );
      }
    },
    [isAnswered, currentQuestion, currentIndex, filteredKanji, filteredVocab],
  );

  const handleNext = useCallback(() => {
    if (remaining.length === 0) {
      // quiz done — build session history record
      const totalQ = answers.length;
      const finalScore = score;
      const session: QuizSession = {
        id: `quiz-${Date.now()}`,
        date: new Date().toISOString(),
        score: finalScore,
        totalQuestions: totalQ,
        percentage: totalQ > 0 ? (finalScore / totalQ) * 100 : 0,
        questions: answers.map((a) => ({
          kanji: a.question.question,
          type: a.question.type.includes("reading") ? "reading" : "meaning",
          userAnswer: a.question.options[a.userAnswerIndex] ?? "",
          correctAnswer: a.question.options[a.question.correctIndex] ?? "",
          isCorrect: a.isCorrect,
        })),
      };
      saveQuizSession(session);
      setPhase("result");
    } else {
      const [next, ...rest] = remaining;
      setCurrentIndex((prev) => prev + 1);
      setQuestions((prev) => [...prev, next]);
      setRemaining(rest);
      setSelectedAnswerIdx(null);
      setIsAnswered(false);
    }
  }, [remaining, answers, score]);

  const backToModeSelect = useCallback(() => {
    setPhase("select");
    setSelectedMode(null);
    setQuestions([]);
    setRemaining([]);
    setAnswers([]);
    setScore(0);
    setCurrentIndex(0);
    setNoWeakItems(false);
    setDataError(false);
    reviewedItems.current = new Set();
  }, []);

  // ── explanation data ─────────────────────────────────────────────────────

  const getExplanationData = useCallback(
    (question: AdaptiveQuestion) => {
      if (question.category === "kanji") {
        const entry = filteredKanji.find(
          (k) => `kanji_${k.character}` === question.itemId,
        );
        return entry
          ? {
              correctAnswer: question.options[question.correctIndex] ?? "",
              hiragana: null as string | null,
              romaji: entry.romaji || null,
              meaning: entry.meaning || null,
              explanation: entry.explanation || null,
              exampleSentence: null as string | null,
              grammarNote: null as string | null,
              radical: entry.radical || null,
            }
          : null;
      }
      const entry = filteredVocab.find(
        (v) => `vocab_${v.vocabulary}` === question.itemId,
      );
      return entry
        ? {
            correctAnswer: question.options[question.correctIndex] ?? "",
            hiragana: null as string | null,
            romaji: entry.romaji || null,
            meaning: entry.meaning || null,
            explanation: entry.explanation || null,
            exampleSentence: null as string | null,
            grammarNote: null as string | null,
            radical: entry.radical || null,
          }
        : null;
    },
    [filteredKanji, filteredVocab],
  );

  // ── render helpers ───────────────────────────────────────────────────────

  const progressPct =
    currentIndex + 1 + remaining.length > 0
      ? ((currentIndex + 1) / (currentIndex + 1 + remaining.length)) * 100
      : 0;

  // ── PHASE: select ─────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="quiz.select_screen"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Quiz Adaptif</h2>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">
          Pilih mode belajar yang sesuai dengan waktu dan tujuanmu.
        </p>

        {/* JLPT Level Selector */}
        <div className="space-y-2" data-ocid="quiz.level_selector">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Level JLPT
          </p>
          <div className="flex gap-2">
            {(["Semua", "N5", "N4"] as JlptFilter[]).map((level) => (
              <button
                key={level}
                type="button"
                data-ocid={`quiz.level_${level.toLowerCase()}_button`}
                onClick={() => setSelectedJlptLevel(level)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                  selectedJlptLevel === level
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredKanji.length} kanji · {filteredVocab.length} kosakata
            dipilih
          </p>
        </div>

        {!hasData && (
          <Alert className="border-destructive/50">
            <AlertDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Data tidak tersedia. Silakan muat ulang halaman.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {MODE_CONFIGS.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              disabled={!hasData}
              data-ocid={`quiz.mode_${cfg.id}_button`}
              onClick={() => startQuiz(cfg.id)}
              className="w-full text-left p-5 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{cfg.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {cfg.questionCount}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cfg.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-0.5 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PHASE: quiz — no-weak-items guard ─────────────────────────────────────

  if (phase === "quiz" && noWeakItems) {
    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="quiz.no_weak_items"
      >
        <div className="flex justify-end">
          <Badge variant="outline" className="gap-1.5">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </div>
        <Card className="border-primary/40 shadow-lg">
          <CardContent className="py-12 text-center space-y-6">
            <div className="text-6xl">💪</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Semua item sudah kuat! 💪</h3>
              <p className="text-muted-foreground">
                Belum ada item yang butuh latihan ulang. Lanjutkan berlatih
                untuk menemukan titik lemah baru.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                data-ocid="quiz.no_weak_quick_button"
                onClick={() => startQuiz("quick")}
              >
                <Zap className="w-4 h-4 mr-2" />
                Mulai Quick Quiz
              </Button>
              <Button
                variant="outline"
                data-ocid="quiz.no_weak_back_button"
                onClick={backToModeSelect}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Kembali ke Pilihan Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── PHASE: quiz — data error guard ───────────────────────────────────────

  if (phase === "quiz" && dataError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" data-ocid="quiz.error_state">
        <Card className="border-destructive/40 shadow-lg">
          <CardContent className="py-12 text-center space-y-6">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Data tidak tersedia</h3>
              <p className="text-muted-foreground text-sm">
                Tidak ada data kanji atau kosakata yang dapat dimuat.
              </p>
            </div>
            <Button
              data-ocid="quiz.error_retry_button"
              onClick={backToModeSelect}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── PHASE: result ─────────────────────────────────────────────────────────

  if (phase === "result") {
    const total = answers.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const isPerfect = score === total && total > 0;
    const isGood = percentage >= 70;
    const improved = answers.filter(
      (a) => a.masteryAfter > a.masteryBefore,
    ).length;

    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="quiz.result_screen"
      >
        <div className="flex justify-end">
          <Badge variant="outline" className="gap-1.5">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </div>

        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Trophy
                className={`w-16 h-16 ${isPerfect ? "text-yellow-500" : isGood ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <CardTitle className="text-center text-3xl">
              {isPerfect
                ? "Sempurna! 🎉"
                : isGood
                  ? "Bagus Sekali! 👏"
                  : "Terus Berlatih! 💪"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-5xl font-bold text-primary">
                {score}/{total}
              </p>
              <p className="text-muted-foreground">Jawaban Benar</p>
              <p className="text-2xl font-semibold">{percentage.toFixed(0)}%</p>
            </div>

            {/* mastery progress summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-center">
                Perkembangan Mastery
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{improved}</p>
                  <p className="text-xs text-muted-foreground">
                    Item meningkat
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{total - improved}</p>
                  <p className="text-xs text-muted-foreground">
                    Item belum berubah
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Hasil quiz telah disimpan ke riwayat belajar
              </p>
            </div>

            {/* per-item summary (last 5 answers) */}
            {answers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ringkasan Terakhir
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {answers.slice(-5).map((a, i) => (
                    <div
                      key={`${a.question.id}_${i}`}
                      className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                        a.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {a.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="font-medium truncate">
                        {a.question.question}
                      </span>
                      <MasteryStars level={a.masteryAfter} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                data-ocid="quiz.restart_button"
                onClick={() => selectedMode && startQuiz(selectedMode)}
                className="flex-1"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ulangi Mode Ini
              </Button>
              <Button
                type="button"
                variant="outline"
                data-ocid="quiz.back_to_mode_button"
                onClick={backToModeSelect}
                className="flex-1"
                size="lg"
              >
                Kembali ke Pilihan Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── PHASE: quiz ───────────────────────────────────────────────────────────

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Memuat quiz...</p>
      </div>
    );
  }

  const currentMastery = getMasteryItem(currentQuestion.itemId);
  const diffLabel = DIFFICULTY_ID_LABELS[currentQuestion.difficulty];
  const diffColor = DIFFICULTY_COLORS[currentQuestion.difficulty];

  const questionLabel = (() => {
    switch (currentQuestion.type) {
      case "kanji-meaning":
        return "Apa arti kanji ini?";
      case "meaning-kanji":
        return "Pilih kanji yang tepat:";
      case "kanji-reading":
        return "Bagaimana cara membaca kanji ini?";
      case "vocab-meaning":
        return "Apa arti kata ini?";
      case "meaning-vocab":
        return "Pilih kata yang tepat:";
      default:
        return "Pilih jawaban yang benar:";
    }
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-5" data-ocid="quiz.quiz_screen">
      {/* header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5">
          <Brain className="h-3 w-3" />
          {selectedMode === "quick"
            ? "Quick Quiz"
            : selectedMode === "study"
              ? "Study Session"
              : "Weakness Training"}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      </div>

      {/* progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Soal {currentIndex + 1} / {currentIndex + 1 + remaining.length}
          </span>
          <span data-ocid="quiz.score_display">{score} benar</span>
        </div>
        <Progress
          value={progressPct}
          className="h-2"
          data-ocid="quiz.progress_bar"
        />
      </div>

      {/* question card */}
      <Card className="shadow-lg" data-ocid="quiz.question_card">
        <CardHeader>
          <div className="text-center space-y-3">
            {/* difficulty + mastery badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 border ${diffColor}`}
                data-ocid="quiz.difficulty_badge"
              >
                {diffLabel}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs gap-1"
                data-ocid="quiz.mastery_badge"
              >
                <MasteryStars level={currentMastery.masteryLevel} />
                <span className="ml-1">
                  {MASTERY_LABELS[currentMastery.masteryLevel] ?? "Baru"}
                </span>
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {currentQuestion.category === "kanji" ? "Kanji" : "Kosakata"}
              </Badge>
            </div>

            {/* question text */}
            <div
              className="text-7xl font-bold text-primary py-2"
              data-ocid="quiz.question_text"
            >
              {currentQuestion.question}
            </div>
            <CardTitle className="text-lg font-medium text-muted-foreground">
              {questionLabel}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* answer options */}
          <div className="grid grid-cols-1 gap-3" data-ocid="quiz.options_list">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswerIdx === idx;
              const isCorrectOpt = idx === currentQuestion.correctIndex;
              const showResult = isAnswered;

              let cls =
                "w-full p-4 text-left border-2 rounded-lg transition-all ";
              if (showResult) {
                if (isCorrectOpt)
                  cls += "border-green-500 bg-green-50 dark:bg-green-950/30 ";
                else if (isSelected)
                  cls += "border-red-500 bg-red-50 dark:bg-red-950/30 ";
                else cls += "border-border opacity-50 ";
              } else {
                cls += isSelected
                  ? "border-primary bg-primary/10 "
                  : "border-border hover:border-primary hover:bg-accent ";
              }

              return (
                <button
                  key={`opt_${option}`}
                  type="button"
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={isAnswered}
                  className={cls}
                  data-ocid={`quiz.option.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <span className="text-base font-medium whitespace-normal break-words leading-snug min-w-0 flex-1">
                      {option}
                    </span>
                    {showResult && isCorrectOpt && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    )}
                    {showResult && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* feedback alert */}
          {isAnswered && (
            <Alert
              className={
                selectedAnswerIdx === currentQuestion.correctIndex
                  ? "border-green-500"
                  : "border-red-500"
              }
              data-ocid={
                selectedAnswerIdx === currentQuestion.correctIndex
                  ? "quiz.correct_feedback"
                  : "quiz.wrong_feedback"
              }
            >
              <AlertDescription className="flex items-center gap-2">
                {selectedAnswerIdx === currentQuestion.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-medium">
                      Benar! Jawaban yang tepat.
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="font-medium">
                      Salah. Jawaban yang benar adalah:{" "}
                      <strong>
                        {currentQuestion.options[currentQuestion.correctIndex]}
                      </strong>
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* explanation panel — shown after answering */}
          {isAnswered &&
            currentQuestion &&
            (() => {
              const expl = getExplanationData(currentQuestion);
              if (!expl) return null;
              const isCorrectAnswer =
                selectedAnswerIdx === currentQuestion.correctIndex;
              return (
                <div
                  className={`rounded-xl border-l-4 bg-card shadow-md p-5 space-y-3 ${
                    isCorrectAnswer ? "border-l-green-500" : "border-l-red-500"
                  }`}
                  data-ocid="quiz.explanation_panel"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    📖 Penjelasan
                  </p>

                  {/* 1. Jawaban Benar */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                    <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                      Jawaban Benar
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {expl.correctAnswer}
                    </span>
                  </div>

                  {/* 2. Hiragana */}
                  {expl.hiragana && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                        Hiragana
                      </span>
                      <span className="text-base font-medium">
                        {expl.hiragana}
                      </span>
                    </div>
                  )}

                  {/* 3. Romaji */}
                  {expl.romaji && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                        Romaji
                      </span>
                      <span className="text-base italic text-foreground/80">
                        {expl.romaji}
                      </span>
                    </div>
                  )}

                  {/* 4. Arti Indonesia */}
                  {expl.meaning && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                        Arti Indonesia
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {expl.meaning}
                      </span>
                    </div>
                  )}

                  {/* 5. Penjelasan */}
                  {expl.explanation && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                        Penjelasan
                      </span>
                      <span className="text-sm text-muted-foreground flex-1">
                        {expl.explanation}
                      </span>
                    </div>
                  )}

                  {/* 6. Contoh Kalimat */}
                  {expl.exampleSentence && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                        Contoh Kalimat
                      </span>
                      <span className="text-sm italic text-foreground/80 flex-1">
                        {expl.exampleSentence}
                      </span>
                    </div>
                  )}

                  {/* 7. Grammar terkait */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                    <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                      Grammar terkait
                    </span>
                    <span className="text-sm text-foreground/70">
                      {expl.grammarNote ?? "-"}
                    </span>
                  </div>

                  {/* 8. Radikal terkait */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                    <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">
                      Radikal terkait
                    </span>
                    <span className="text-sm font-medium">
                      {expl.radical ?? "-"}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* next button */}
          {isAnswered && (
            <Button
              type="button"
              onClick={handleNext}
              className="w-full"
              size="lg"
              data-ocid="quiz.next_button"
            >
              {remaining.length === 0 ? "Lihat Hasil" : "Lanjut ›"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
