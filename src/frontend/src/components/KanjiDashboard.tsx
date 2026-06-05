import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kanjiData, radicalData, vocabularyData } from "@/data/kanjiData";
import type {
  KanjiEntry,
  RadicalInfo,
  VocabularyEntry,
} from "@/data/kanjiData";
import {
  type KanjiMasteryRecord,
  type RadicalMasteryRecord,
  type ReadingSessionRecord,
  type VocabularyMasteryRecord,
  computeOverallN4Readiness,
  computeReadingScore,
  getKanjiScore,
  getRadicalScore,
  getVocabScore,
  getWeakKanji,
  getWeakRadicals,
  getWeakVocab,
  loadKanjiTracking,
  loadRadicalTracking,
  loadReadingAnalytics,
  loadVocabTracking,
} from "@/lib/masteryEngine";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookText,
  Brain,
  Clock,
  Eye,
  GraduationCap,
  Languages,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

type AnalyticsTab =
  | "kanji-lemah"
  | "kanji-kuat"
  | "kanji-untouched"
  | "vocab-lemah"
  | "vocab-kuat"
  | "vocab-untouched"
  | "radikal-lemah"
  | "radikal-kuat"
  | "radikal-untouched";

type StatusKey =
  | "Belum Tersentuh"
  | "Sedang Belajar"
  | "Cukup Paham"
  | "Dikuasai";

interface StatusCardConfig {
  label: StatusKey;
  color: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIGS: StatusCardConfig[] = [
  {
    label: "Belum Tersentuh",
    color: "gray",
    badgeClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted/30",
    borderClass: "border-border",
  },
  {
    label: "Sedang Belajar",
    color: "yellow",
    badgeClass: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    textClass: "text-yellow-700 dark:text-yellow-400",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-400/40",
  },
  {
    label: "Cukup Paham",
    color: "blue",
    badgeClass: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    textClass: "text-blue-700 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-400/40",
  },
  {
    label: "Dikuasai",
    color: "green",
    badgeClass: "bg-green-500/20 text-green-700 dark:text-green-400",
    textClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-400/40",
  },
];

const ANALYTICS_TABS: { id: AnalyticsTab; label: string }[] = [
  { id: "kanji-lemah", label: "Kanji Lemah" },
  { id: "kanji-kuat", label: "Kanji Kuat" },
  { id: "kanji-untouched", label: "Kanji Belum Tersentuh" },
  { id: "vocab-lemah", label: "Kosakata Lemah" },
  { id: "vocab-kuat", label: "Kosakata Kuat" },
  { id: "vocab-untouched", label: "Kosakata Belum Tersentuh" },
  { id: "radikal-lemah", label: "Radikal Lemah" },
  { id: "radikal-kuat", label: "Radikal Kuat" },
  { id: "radikal-untouched", label: "Radikal Belum Tersentuh" },
];

// ============================================================================
// HELPERS
// ============================================================================

function getRadicalSymbol(radical: RadicalInfo): string {
  // Extract first character from name like "水 (mizu)" → "水"
  return radical.name.charAt(0);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "-";
  }
}

function normalizeScore(rawScore: number): number {
  // getKanjiScore returns (correct*10 + mastery*5) / (correct+wrong+1)
  // Max: (∞*10 + 5*5)/(∞+1) → approaches 10. Normalize to 0-100 by capping at 10
  return Math.min(100, Math.round(rawScore * 10));
}

function computeOverallScore(
  tracking: Record<
    string,
    KanjiMasteryRecord | RadicalMasteryRecord | VocabularyMasteryRecord
  >,
  scorer: (
    r: KanjiMasteryRecord | RadicalMasteryRecord | VocabularyMasteryRecord,
  ) => number,
): number {
  const records = Object.values(tracking);
  if (records.length === 0) return 0;
  const total = records.reduce((sum, r) => sum + scorer(r), 0);
  return normalizeScore(total / records.length);
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "border-green-400 bg-green-500/10";
  if (score >= 60) return "border-yellow-400 bg-yellow-500/10";
  return "border-red-400 bg-red-500/10";
}

function masteryDots(level: number): ReactElement {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`h-2 w-2 rounded-full ${
            n <= Math.round(level) ? "bg-primary" : "bg-muted-foreground/25"
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusCard({
  config,
  count,
  total,
}: {
  config: StatusCardConfig;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={`rounded-lg border p-4 ${config.bgClass} ${config.borderClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${config.textClass}`}>
          {config.label}
        </span>
        <Badge className={`text-xs font-mono ${config.badgeClass}`}>
          {count}
        </Badge>
      </div>
      <div className="text-2xl font-bold font-mono mb-2">{count}</div>
      {/* Percentage bar */}
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            config.color === "green"
              ? "bg-green-500"
              : config.color === "blue"
                ? "bg-blue-500"
                : config.color === "yellow"
                  ? "bg-yellow-500"
                  : "bg-muted-foreground/50"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-xs mt-1 ${config.textClass} opacity-75`}>
        {pct}%
      </div>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-24 h-24 rounded-full border-4 flex items-center justify-center font-bold text-2xl font-mono ${scoreBg(score)} ${scoreColor(score)} border-current`}
        data-ocid="dashboard.score_badge"
      >
        {score}
      </div>
      <span className="text-sm font-medium text-muted-foreground text-center">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// ANALYTICS ROWS
// ============================================================================

function KanjiWeakRow({
  record,
  kanji,
  idx,
  onQuiz,
}: {
  record: KanjiMasteryRecord;
  kanji: KanjiEntry | undefined;
  idx: number;
  onQuiz: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-destructive/40 transition-colors"
      data-ocid={`dashboard.kanji_weak.item.${idx}`}
    >
      <span className="text-3xl font-bold text-destructive w-10 text-center shrink-0">
        {record.kanjiId.replace("kanji_", "")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {kanji?.meaning ?? "-"}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {masteryDots(record.masteryLevel)}
          <span className="text-xs text-muted-foreground">
            {record.masteryLevel.toFixed(1)}/5
          </span>
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-xs text-destructive font-medium">
          {record.wrongCount}× salah
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(record.lastWrong)}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 text-xs"
        onClick={() => onQuiz(record.kanjiId)}
        data-ocid={`dashboard.kanji_weak.quiz_button.${idx}`}
      >
        Quiz Lagi
      </Button>
    </div>
  );
}

function KanjiStrongRow({
  record,
  kanji,
  idx,
}: {
  record: KanjiMasteryRecord;
  kanji: KanjiEntry | undefined;
  idx: number;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-green-400/40 transition-colors"
      data-ocid={`dashboard.kanji_strong.item.${idx}`}
    >
      <span className="text-3xl font-bold text-green-600 dark:text-green-400 w-10 text-center shrink-0">
        {record.kanjiId.replace("kanji_", "")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {kanji?.meaning ?? "-"}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {masteryDots(record.masteryLevel)}
          <span className="text-xs text-muted-foreground">
            {record.masteryLevel.toFixed(1)}/5
          </span>
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          {record.correctCount}× benar
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(record.lastCorrect)}
        </div>
      </div>
    </div>
  );
}

function RadicalWeakRow({
  record,
  radical,
  idx,
  onQuiz,
}: {
  record: RadicalMasteryRecord;
  radical: RadicalInfo | undefined;
  idx: number;
  onQuiz: (id: string) => void;
}) {
  const symbol = radical
    ? getRadicalSymbol(radical)
    : record.radicalId.replace("radical_", "").charAt(0);
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-destructive/40 transition-colors"
      data-ocid={`dashboard.radical_weak.item.${idx}`}
    >
      <span className="text-3xl font-bold text-destructive w-10 text-center shrink-0">
        {symbol}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {radical?.meaning ?? "-"}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {masteryDots(record.masteryLevel)}
          <span className="text-xs text-muted-foreground">
            {record.masteryLevel.toFixed(1)}/5
          </span>
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-xs text-destructive font-medium">
          {record.wrongCount}× salah
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 text-xs"
        onClick={() => onQuiz(record.radicalId)}
        data-ocid={`dashboard.radical_weak.quiz_button.${idx}`}
      >
        Quiz Lagi
      </Button>
    </div>
  );
}

function RadicalStrongRow({
  record,
  radical,
  idx,
}: {
  record: RadicalMasteryRecord;
  radical: RadicalInfo | undefined;
  idx: number;
}) {
  const symbol = radical
    ? getRadicalSymbol(radical)
    : record.radicalId.replace("radical_", "").charAt(0);
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-green-400/40 transition-colors"
      data-ocid={`dashboard.radical_strong.item.${idx}`}
    >
      <span className="text-3xl font-bold text-green-600 dark:text-green-400 w-10 text-center shrink-0">
        {symbol}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {radical?.meaning ?? "-"}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {masteryDots(record.masteryLevel)}
          <span className="text-xs text-muted-foreground">
            {record.masteryLevel.toFixed(1)}/5
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          {record.correctCount}× benar
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface KanjiDashboardProps {
  onQuizKanji?: () => void;
  onQuizRadical?: () => void;
}

export default function KanjiDashboard({
  onQuizKanji,
  onQuizRadical,
}: KanjiDashboardProps) {
  const [kanjiTracking, setKanjiTracking] = useState<
    Record<string, KanjiMasteryRecord>
  >({});
  const [vocabTracking, setVocabTracking] = useState<
    Record<string, VocabularyMasteryRecord>
  >({});
  const [radicalTracking, setRadicalTracking] = useState<
    Record<string, RadicalMasteryRecord>
  >({});
  const [readingSessions, setReadingSessions] = useState<
    ReadingSessionRecord[]
  >([]);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("kanji-lemah");

  const refresh = () => {
    setKanjiTracking(loadKanjiTracking());
    setVocabTracking(loadVocabTracking());
    setRadicalTracking(loadRadicalTracking());
    setReadingSessions(loadReadingAnalytics());
  };

  useEffect(() => {
    setKanjiTracking(loadKanjiTracking());
    setVocabTracking(loadVocabTracking());
    setRadicalTracking(loadRadicalTracking());
    setReadingSessions(loadReadingAnalytics());
  }, []); // run only on mount — no external deps

  // ---- Kanji Stats ----
  const kanjiStats = useMemo(() => {
    const total = kanjiData.length;
    const tracked = kanjiTracking;
    const counts: Record<StatusKey, number> = {
      "Belum Tersentuh": 0,
      "Sedang Belajar": 0,
      "Cukup Paham": 0,
      Dikuasai: 0,
    };
    // Start: all untouched
    counts["Belum Tersentuh"] = total;
    for (const record of Object.values(tracked)) {
      const status = record.status ?? "Belum Tersentuh";
      counts[status] = (counts[status] ?? 0) + 1;
      // Remove from untouched
      if (record.seenCount > 0) counts["Belum Tersentuh"] -= 1;
    }
    // Clamp
    counts["Belum Tersentuh"] = Math.max(0, counts["Belum Tersentuh"]);
    return { total, counts };
  }, [kanjiTracking]);

  // ---- Vocabulary Stats ----
  const vocabStats = useMemo(() => {
    const total = vocabularyData.length;
    const tracked = vocabTracking;
    const counts: Record<StatusKey, number> = {
      "Belum Tersentuh": 0,
      "Sedang Belajar": 0,
      "Cukup Paham": 0,
      Dikuasai: 0,
    };
    counts["Belum Tersentuh"] = total;
    for (const record of Object.values(tracked)) {
      const status = record.status ?? "Belum Tersentuh";
      counts[status] = (counts[status] ?? 0) + 1;
      if (record.seenCount > 0) counts["Belum Tersentuh"] -= 1;
    }
    counts["Belum Tersentuh"] = Math.max(0, counts["Belum Tersentuh"]);
    return { total, counts };
  }, [vocabTracking]);

  // ---- Radical Stats ----
  const radicalStats = useMemo(() => {
    const total = radicalData.length;
    const tracked = radicalTracking;
    const counts: Record<StatusKey, number> = {
      "Belum Tersentuh": 0,
      "Sedang Belajar": 0,
      "Cukup Paham": 0,
      Dikuasai: 0,
    };
    counts["Belum Tersentuh"] = total;
    for (const record of Object.values(tracked)) {
      const status = record.status ?? "Belum Tersentuh";
      counts[status] = (counts[status] ?? 0) + 1;
      if (record.seenCount > 0) counts["Belum Tersentuh"] -= 1;
    }
    counts["Belum Tersentuh"] = Math.max(0, counts["Belum Tersentuh"]);
    return { total, counts };
  }, [radicalTracking]);

  // ---- Scores ----
  const kanjiOverallScore = useMemo(
    () =>
      computeOverallScore(kanjiTracking, (r) =>
        getKanjiScore(r as KanjiMasteryRecord),
      ),
    [kanjiTracking],
  );
  const vocabOverallScore = useMemo(
    () =>
      computeOverallScore(vocabTracking, (r) =>
        getVocabScore(r as VocabularyMasteryRecord),
      ),
    [vocabTracking],
  );
  const readingScore = useMemo(() => computeReadingScore(), []);
  const overallN4Readiness = useMemo(() => computeOverallN4Readiness(), []);

  const radicalOverallScore = useMemo(
    () =>
      computeOverallScore(radicalTracking, (r) =>
        getRadicalScore(r as RadicalMasteryRecord),
      ),
    [radicalTracking],
  );

  // ---- Analytics Data ----
  const kanjiMap = useMemo(
    () => new Map(kanjiData.map((k) => [k.character, k])),
    [],
  );
  const vocabMap = useMemo(
    () => new Map(vocabularyData.map((v) => [v.vocabulary, v])),
    [],
  );
  const radicalMap = useMemo(
    () => new Map(radicalData.map((r) => [r.name, r])),
    [],
  );

  const weakKanjiList = useMemo(
    () => getWeakKanji(kanjiTracking),
    [kanjiTracking],
  );
  const strongKanjiList = useMemo(
    () =>
      Object.values(kanjiTracking)
        .filter((r) => r.masteryLevel >= 4)
        .sort((a, b) => b.correctCount - a.correctCount),
    [kanjiTracking],
  );
  const untouchedKanji = useMemo(
    () =>
      kanjiData.filter(
        (k) =>
          !kanjiTracking[`kanji_${k.character}`] ||
          kanjiTracking[`kanji_${k.character}`].seenCount === 0,
      ),
    [kanjiTracking],
  );

  const weakVocabList = useMemo(
    () => getWeakVocab(vocabTracking),
    [vocabTracking],
  );
  const strongVocabList = useMemo(
    () =>
      Object.values(vocabTracking)
        .filter((r) => r.masteryLevel >= 4)
        .sort((a, b) => b.correctCount - a.correctCount),
    [vocabTracking],
  );
  const untouchedVocab = useMemo(
    () =>
      vocabularyData.filter(
        (v) =>
          !vocabTracking[`vocab_${v.vocabulary}`] ||
          vocabTracking[`vocab_${v.vocabulary}`].seenCount === 0,
      ),
    [vocabTracking],
  );

  const weakRadicalList = useMemo(
    () => getWeakRadicals(radicalTracking),
    [radicalTracking],
  );
  const strongRadicalList = useMemo(
    () =>
      Object.values(radicalTracking)
        .filter((r) => r.masteryLevel >= 4)
        .sort((a, b) => b.correctCount - a.correctCount),
    [radicalTracking],
  );
  const untouchedRadicals = useMemo(
    () =>
      radicalData.filter(
        (r) =>
          !radicalTracking[`radical_${r.name}`] ||
          radicalTracking[`radical_${r.name}`].seenCount === 0,
      ),
    [radicalTracking],
  );

  const _recentReadingSessions = useMemo(() => {
    return [...readingSessions].reverse().slice(0, 5);
  }, [readingSessions]);

  const handleKanjiQuiz = (_kanjiId: string) => {
    onQuizKanji?.();
  };
  const handleRadicalQuiz = (_radicalId: string) => {
    onQuizRadical?.();
  };

  return (
    <div className="space-y-8" data-ocid="dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Dashboard Progress
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau perkembangan belajar Kanji & Radikal JLPT N4/N5
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          className="flex items-center gap-2"
          data-ocid="dashboard.refresh_button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Dashboard Grid: Kanji + Vocab + Radikal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KANJI DASHBOARD */}
        <Card className="border-border" data-ocid="dashboard.kanji.section">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Kanji
              </span>
              <Badge
                variant="secondary"
                className="text-base font-bold font-mono px-3"
              >
                {kanjiStats.total}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total {kanjiStats.total} kanji JLPT N4/N5
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_CONFIGS.map((cfg) => (
              <StatusCard
                key={cfg.label}
                config={cfg}
                count={kanjiStats.counts[cfg.label]}
                total={kanjiStats.total}
              />
            ))}
          </CardContent>
        </Card>

        {/* VOCABULARY DASHBOARD */}
        <Card className="border-border" data-ocid="dashboard.vocab.section">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                Kosakata
              </span>
              <Badge
                variant="secondary"
                className="text-base font-bold font-mono px-3"
              >
                {vocabStats.total}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total {vocabStats.total} kosakata JLPT N4/N5
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_CONFIGS.map((cfg) => (
              <StatusCard
                key={cfg.label}
                config={cfg}
                count={vocabStats.counts[cfg.label]}
                total={vocabStats.total}
              />
            ))}
          </CardContent>
        </Card>

        {/* RADICAL DASHBOARD */}
        <Card className="border-border" data-ocid="dashboard.radical.section">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Radikal
              </span>
              <Badge
                variant="secondary"
                className="text-base font-bold font-mono px-3"
              >
                {radicalStats.total}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total {radicalStats.total} radikal penting N4/N5
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_CONFIGS.map((cfg) => (
              <StatusCard
                key={cfg.label}
                config={cfg}
                count={radicalStats.counts[cfg.label]}
                total={radicalStats.total}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SCORING SECTION */}
      <Card data-ocid="dashboard.scoring.section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Skor Penguasaan
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Dihitung dari akurasi quiz dan tingkat mastery (0–100)
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-8 py-4">
            <ScoreBadge score={kanjiOverallScore} label="Kanji Score" />
            <ScoreBadge score={vocabOverallScore} label="Vocabulary Score" />
            <ScoreBadge score={readingScore} label="Reading Score" />
            <ScoreBadge score={radicalOverallScore} label="Radical Score" />
            <ScoreBadge score={overallN4Readiness} label="N4 Readiness" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <div
                className={`text-3xl font-bold font-mono ${scoreColor(kanjiOverallScore)}`}
              >
                {kanjiOverallScore}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.values(kanjiTracking).length} kanji dilacak
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-3xl font-bold font-mono ${scoreColor(vocabOverallScore)}`}
              >
                {vocabOverallScore}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.values(vocabTracking).length} kosakata dilacak
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-3xl font-bold font-mono ${scoreColor(readingScore)}`}
              >
                {readingScore}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {readingSessions.length} sesi membaca
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-3xl font-bold font-mono ${scoreColor(radicalOverallScore)}`}
              >
                {radicalOverallScore}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.values(radicalTracking).length} radikal dilacak
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-3xl font-bold font-mono ${scoreColor(overallN4Readiness)}`}
              >
                {overallN4Readiness}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Keseluruhan N4
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ANALYTICS PANEL */}
      <div data-ocid="dashboard.analytics.section">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Analitik Detail</h2>
        </div>

        {/* Tab Row */}
        <div
          className="flex flex-wrap gap-2 mb-6"
          role="tablist"
          data-ocid="dashboard.analytics.tabs"
        >
          {ANALYTICS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              data-ocid={`dashboard.analytics.tab.${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div data-ocid={`dashboard.analytics.panel.${activeTab}`}>
          {/* Kanji Lemah */}
          {activeTab === "kanji-lemah" && (
            <div className="space-y-2">
              {weakKanjiList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.kanji_weak.empty_state"
                >
                  <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada kanji yang lemah. Mulai quiz untuk melihat data!
                </div>
              ) : (
                weakKanjiList.map((r, i) => (
                  <KanjiWeakRow
                    key={r.kanjiId}
                    record={r}
                    kanji={kanjiMap.get(r.kanjiId.replace("kanji_", ""))}
                    idx={i + 1}
                    onQuiz={handleKanjiQuiz}
                  />
                ))
              )}
            </div>
          )}

          {/* Kanji Kuat */}
          {activeTab === "kanji-kuat" && (
            <div className="space-y-2">
              {strongKanjiList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.kanji_strong.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada kanji yang dikuasai. Terus berlatih!
                </div>
              ) : (
                strongKanjiList.map((r, i) => (
                  <KanjiStrongRow
                    key={r.kanjiId}
                    record={r}
                    kanji={kanjiMap.get(r.kanjiId.replace("kanji_", ""))}
                    idx={i + 1}
                  />
                ))
              )}
            </div>
          )}

          {/* Kanji Belum Tersentuh */}
          {activeTab === "kanji-untouched" && (
            <div>
              {untouchedKanji.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.kanji_untouched.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Semua kanji sudah pernah dipelajari!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {untouchedKanji.map((k, i) => (
                    <div
                      key={k.character}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-colors"
                      data-ocid={`dashboard.kanji_untouched.item.${i + 1}`}
                    >
                      <span className="text-2xl font-bold text-muted-foreground">
                        {k.character}
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight">
                        {k.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Radikal Lemah */}
          {activeTab === "radikal-lemah" && (
            <div className="space-y-2">
              {weakRadicalList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.radical_weak.empty_state"
                >
                  <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada radikal yang lemah. Mulai quiz radikal!
                </div>
              ) : (
                weakRadicalList.map((r, i) => (
                  <RadicalWeakRow
                    key={r.radicalId}
                    record={r}
                    radical={radicalMap.get(
                      r.radicalId.replace("radical_", ""),
                    )}
                    idx={i + 1}
                    onQuiz={handleRadicalQuiz}
                  />
                ))
              )}
            </div>
          )}

          {/* Radikal Kuat */}
          {activeTab === "radikal-kuat" && (
            <div className="space-y-2">
              {strongRadicalList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.radical_strong.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada radikal yang dikuasai. Terus berlatih!
                </div>
              ) : (
                strongRadicalList.map((r, i) => (
                  <RadicalStrongRow
                    key={r.radicalId}
                    record={r}
                    radical={radicalMap.get(
                      r.radicalId.replace("radical_", ""),
                    )}
                    idx={i + 1}
                  />
                ))
              )}
            </div>
          )}

          {/* Radikal Belum Tersentuh */}
          {activeTab === "radikal-untouched" && (
            <div>
              {untouchedRadicals.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.radical_untouched.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Semua radikal sudah pernah dipelajari!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {untouchedRadicals.map((r, i) => (
                    <div
                      key={r.name}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-colors"
                      data-ocid={`dashboard.radical_untouched.item.${i + 1}`}
                    >
                      <span className="text-2xl font-bold text-muted-foreground">
                        {getRadicalSymbol(r)}
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight">
                        {r.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kosakata Lemah */}
          {activeTab === "vocab-lemah" && (
            <div className="space-y-2">
              {weakVocabList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.vocab_weak.empty_state"
                >
                  <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada kosakata yang lemah. Mulai quiz untuk melihat data!
                </div>
              ) : (
                weakVocabList.map((r, i) => (
                  <div
                    key={r.vocabId}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-destructive/40 transition-colors"
                    data-ocid={`dashboard.vocab_weak.item.${i + 1}`}
                  >
                    <span className="text-xl font-bold text-destructive w-24 text-center shrink-0 truncate">
                      {r.vocabId.replace("vocab_", "")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {vocabMap.get(r.vocabId.replace("vocab_", ""))
                          ?.meaning ?? "-"}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {masteryDots(r.masteryLevel)}
                        <span className="text-xs text-muted-foreground">
                          {r.masteryLevel.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="text-xs text-destructive font-medium">
                        {r.wrongCount}× salah
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(r.lastWrong)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Kosakata Kuat */}
          {activeTab === "vocab-kuat" && (
            <div className="space-y-2">
              {strongVocabList.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.vocab_strong.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Belum ada kosakata yang dikuasai. Terus berlatih!
                </div>
              ) : (
                strongVocabList.map((r, i) => (
                  <div
                    key={r.vocabId}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border hover:border-green-400/40 transition-colors"
                    data-ocid={`dashboard.vocab_strong.item.${i + 1}`}
                  >
                    <span className="text-xl font-bold text-green-600 dark:text-green-400 w-24 text-center shrink-0 truncate">
                      {r.vocabId.replace("vocab_", "")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {vocabMap.get(r.vocabId.replace("vocab_", ""))
                          ?.meaning ?? "-"}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {masteryDots(r.masteryLevel)}
                        <span className="text-xs text-muted-foreground">
                          {r.masteryLevel.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {r.correctCount}× benar
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(r.lastCorrect)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Kosakata Belum Tersentuh */}
          {activeTab === "vocab-untouched" && (
            <div>
              {untouchedVocab.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground text-sm"
                  data-ocid="dashboard.vocab_untouched.empty_state"
                >
                  <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  Semua kosakata sudah pernah dipelajari!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {untouchedVocab.slice(0, 64).map((v, i) => (
                    <div
                      key={v.vocabulary}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-colors"
                      data-ocid={`dashboard.vocab_untouched.item.${i + 1}`}
                    >
                      <span className="text-lg font-bold text-muted-foreground truncate w-full text-center">
                        {v.vocabulary}
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight">
                        {v.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
