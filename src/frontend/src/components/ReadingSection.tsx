/**
 * ReadingSection.tsx
 * Main Reading feature orchestrator — Belajar Membaca, JLPT Reading,
 * Bacaan Adaptif, Statistik sub-tabs.
 * Offline-first, reuses existing Radix UI + OKLCH tokens.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vocabularyData } from "@/data/kanjiData";
import { getWeakKanji, loadKanjiTracking } from "@/lib/masteryEngine";
import {
  calculateCoverage,
  getAdaptivePassage,
  getJlptPassage,
  getReadingPassage,
  getWeakReadingVocabulary,
  saveReadingSession,
} from "@/lib/readingEngine";
import type { ReadingLevel, ReadingPassage } from "@/lib/readingEngine";
import type { AllTestResults } from "@/lib/readingEngineTests";
import { runAllTests } from "@/lib/readingEngineTests";
import {
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  RotateCcw,
} from "lucide-react";
import React from "react";
import { useCallback, useEffect, useState } from "react";
import { QuestionBlock } from "./QuestionBlock";
import { ReadingDashboard } from "./ReadingDashboard";
import { ReadingText } from "./ReadingText";

// ============================================================================
// COVERAGE BANNER
// ============================================================================

function CoverageBanner({ sentences }: { sentences: string[] }) {
  const text = sentences.join(" ");
  const { coverage } = calculateCoverage(text, vocabularyData);
  if (coverage >= 90) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-amber-400/60 bg-amber-50/80 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-600/40 mb-3"
      data-ocid="reading.coverage_banner"
    >
      <span className="shrink-0">⚠️</span>
      <span>
        Cakupan kosakata: <strong>{Math.round(coverage)}%</strong> — beberapa
        kata mungkin belum tersedia
      </span>
    </div>
  );
}

// ============================================================================
// LEVEL METADATA
// ============================================================================

const LEVEL_INFO: Record<
  number,
  { label: string; description: string; example: string }
> = {
  1: {
    label: "Level 1",
    description: "Kalimat tunggal",
    example: "昨日、田中さんは会社へ行きました。",
  },
  2: {
    label: "Level 2",
    description: "2–3 kalimat",
    example: "昨日は雨でした。だから家にいました。",
  },
  3: {
    label: "Level 3",
    description: "Paragraf pendek",
    example: "私は毎朝6時に起きます。朝ご飯を食べてから会社へ行きます。",
  },
  4: {
    label: "Level 4",
    description: "Paragraf N4",
    example: "田中さんは新しい会社に入りました。最初は仕事が難しかったですが…",
  },
};

// ============================================================================
// JLPT DOCUMENT TYPES
// ============================================================================

const JLPT_DOC_TYPES = [
  { label: "Poster", icon: "📌" },
  { label: "Jadwal", icon: "📅" },
  { label: "Pengumuman", icon: "📢" },
  { label: "Email", icon: "✉️" },
  { label: "Brosur", icon: "📄" },
  { label: "Info Acara", icon: "🎌" },
  { label: "Tabel", icon: "📊" },
];

// ============================================================================
// SCORE DISPLAY HELPER
// ============================================================================

function ScoreResult({
  score,
  onNext,
  onReset,
  nextLabel,
  resetLabel,
}: {
  score: number;
  onNext: () => void;
  onReset: () => void;
  nextLabel: string;
  resetLabel: string;
}) {
  const isPass = score >= 60;
  return (
    <Card
      className="max-w-md mx-auto text-center mt-6"
      data-ocid="reading.result_card"
    >
      <CardHeader>
        <CardTitle className={isPass ? "text-primary" : "text-destructive"}>
          {isPass ? "✅ Bagus!" : "❌ Perlu Latihan"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-4xl font-bold text-foreground">{score}%</p>
        <p className="text-muted-foreground">
          {isPass
            ? "Kamu berhasil memahami bacaan ini."
            : "Coba baca lagi dengan lebih teliti."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onNext} data-ocid="reading.next_button">
            <ChevronRight className="w-4 h-4 mr-1" />
            {nextLabel}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            data-ocid="reading.reset_button"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {resetLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-TAB: BELAJAR MEMBACA
// ============================================================================

function BelajarMembaca() {
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel>(1);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    const p = getReadingPassage(selectedLevel, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    }
    setLoading(false);
  };

  const handleComplete = (score: number, timeSeconds: number) => {
    if (!passage) return;
    const session = {
      passageId: passage.id,
      mode: passage.mode,
      level: passage.level,
      score,
      timeSeconds,
      clickedWords: [],
      date: new Date().toISOString(),
    };
    saveReadingSession(session, score >= 60);
    setLastScore(score);
    setShowResult(true);
  };

  const handleNext = () => {
    const p = getReadingPassage(selectedLevel, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    } else {
      // All passages seen at this level — reset seen list and retry
      setSeenIds([]);
      const fresh = getReadingPassage(selectedLevel, []);
      if (fresh) {
        setPassage(fresh);
        setSessionStartTime(new Date());
        setShowResult(false);
        setLastScore(null);
        setSeenIds([fresh.id]);
      }
    }
  };

  const handleChangeLevel = () => {
    setPassage(null);
    setShowResult(false);
    setLastScore(null);
    setSessionStartTime(null);
  };

  // Level selector
  if (!passage) {
    return (
      <div className="space-y-6" data-ocid="reading.learning_section">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Pilih Level Membaca
          </h2>
          <p className="text-muted-foreground text-sm">
            Mulai dari Level 1 dan naik secara bertahap sesuai kemampuan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([1, 2, 3, 4] as ReadingLevel[]).map((lvl) => {
            const info = LEVEL_INFO[lvl];
            const isSelected = selectedLevel === lvl;
            return (
              <Card
                key={lvl}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedLevel(lvl)}
                data-ocid={`reading.level_card.${lvl}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{info.label}</CardTitle>
                    {isSelected && <Badge className="text-xs">Dipilih</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {info.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm font-jp leading-relaxed line-clamp-2">
                    {info.example}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={loading}
          className="w-full sm:w-auto"
          data-ocid="reading.start_button"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Mulai Membaca — {LEVEL_INFO[selectedLevel].label}
        </Button>
      </div>
    );
  }

  // Result screen
  if (showResult && lastScore !== null) {
    return (
      <ScoreResult
        score={lastScore}
        onNext={handleNext}
        onReset={handleChangeLevel}
        nextLabel="Lanjut"
        resetLabel="Ganti Level"
      />
    );
  }

  // Reading + questions
  return (
    <div className="space-y-6" data-ocid="reading.learning_passage">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{LEVEL_INFO[passage.level].label}</Badge>
          <Badge variant="secondary" className="capitalize">
            {passage.theme}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChangeLevel}
          data-ocid="reading.change_level_button"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Ganti Level
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{passage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CoverageBanner sentences={passage.sentences} />
          <ReadingText
            sentences={passage.sentences}
            targetVocabulary={passage.targetVocabulary}
          />
        </CardContent>
      </Card>

      {sessionStartTime && (
        <QuestionBlock
          questions={passage.questions}
          onComplete={handleComplete}
          startTime={sessionStartTime}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-TAB: JLPT READING
// ============================================================================

function JlptReading() {
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel>(1);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  const handleSelectDocType = (docType: string) => {
    setSelectedDocType(docType);
    const p = getJlptPassage(selectedLevel, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    }
  };

  const handleComplete = (score: number, timeSeconds: number) => {
    if (!passage) return;
    const session = {
      passageId: passage.id,
      mode: passage.mode,
      level: passage.level,
      score,
      timeSeconds,
      clickedWords: [],
      date: new Date().toISOString(),
    };
    saveReadingSession(session, score >= 60);
    setLastScore(score);
    setShowResult(true);
  };

  const handleNext = () => {
    const p = getJlptPassage(selectedLevel, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    } else {
      setSeenIds([]);
      const fresh = getJlptPassage(selectedLevel, []);
      if (fresh) {
        setPassage(fresh);
        setSessionStartTime(new Date());
        setShowResult(false);
        setLastScore(null);
        setSeenIds([fresh.id]);
      }
    }
  };

  const handleReset = () => {
    setPassage(null);
    setSelectedDocType(null);
    setShowResult(false);
    setLastScore(null);
    setSessionStartTime(null);
  };

  // Level selector row
  const LevelRow = (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-sm text-muted-foreground self-center">Level:</span>
      {([1, 2, 3, 4] as ReadingLevel[]).map((lvl) => (
        <Button
          key={lvl}
          size="sm"
          variant={selectedLevel === lvl ? "default" : "outline"}
          onClick={() => setSelectedLevel(lvl)}
          data-ocid={`reading.jlpt_level.${lvl}`}
        >
          {lvl}
        </Button>
      ))}
    </div>
  );

  // Doc type grid
  if (!passage) {
    return (
      <div className="space-y-6" data-ocid="reading.jlpt_section">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            JLPT Reading
          </h2>
          <p className="text-muted-foreground text-sm">
            Latih kemampuan dokkai dengan format soal JLPT asli.
          </p>
        </div>

        {LevelRow}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {JLPT_DOC_TYPES.map(({ label, icon }) => (
            <Card
              key={label}
              className={`cursor-pointer transition-all border-2 hover:border-primary/60 ${
                selectedDocType === label
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              onClick={() => handleSelectDocType(label)}
              data-ocid={`reading.doctype_card.${label.toLowerCase().replace(/\s/g, "_")}`}
            >
              <CardContent className="pt-5 pb-4 text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="text-sm font-medium text-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Result
  if (showResult && lastScore !== null) {
    return (
      <ScoreResult
        score={lastScore}
        onNext={handleNext}
        onReset={handleReset}
        nextLabel="Bacaan Berikutnya"
        resetLabel="Pilih Jenis Teks"
      />
    );
  }

  // Reading + questions
  return (
    <div className="space-y-6" data-ocid="reading.jlpt_passage">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {selectedDocType && (
            <Badge variant="outline">{selectedDocType}</Badge>
          )}
          {passage.jlptType && (
            <Badge variant="secondary">{passage.jlptType}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          data-ocid="reading.jlpt_back_button"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Pilih Jenis Teks
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{passage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingText
            sentences={passage.sentences}
            targetVocabulary={passage.targetVocabulary}
          />
        </CardContent>
      </Card>

      {sessionStartTime && (
        <QuestionBlock
          questions={passage.questions}
          onComplete={handleComplete}
          startTime={sessionStartTime}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-TAB: BACAAN ADAPTIF
// ============================================================================

function BacaanAdaptif() {
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [weakWordCount, setWeakWordCount] = useState(0);

  const handleStart = () => {
    setLoading(true);
    const weakEntries = getWeakReadingVocabulary(3);
    const weakWords = weakEntries.map((e) => e.vocabulary);
    const kanjiTracking = loadKanjiTracking();
    const weakKanjiList = getWeakKanji(kanjiTracking).map((r) => r.kanjiId);
    const kanjiWeakVocab = vocabularyData
      .filter((v) =>
        weakKanjiList.some((k) => (v.vocabulary ?? "").includes(k)),
      )
      .map((v) => v.vocabulary ?? "");
    const mergedWeak = [...new Set([...weakWords, ...kanjiWeakVocab])];
    setWeakWordCount(mergedWeak.length);
    const p = getAdaptivePassage(mergedWeak, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    }
    setLoading(false);
  };

  const handleComplete = (score: number, timeSeconds: number) => {
    if (!passage) return;
    const session = {
      passageId: passage.id,
      mode: passage.mode,
      level: passage.level,
      score,
      timeSeconds,
      clickedWords: [],
      date: new Date().toISOString(),
    };
    saveReadingSession(session, score >= 60);
    setLastScore(score);
    setShowResult(true);
  };

  const handleNext = () => {
    const weakEntries = getWeakReadingVocabulary(3);
    const weakWords = weakEntries.map((e) => e.vocabulary);
    const kanjiTracking = loadKanjiTracking();
    const weakKanjiList = getWeakKanji(kanjiTracking).map((r) => r.kanjiId);
    const kanjiWeakVocab = vocabularyData
      .filter((v) =>
        weakKanjiList.some((k) => (v.vocabulary ?? "").includes(k)),
      )
      .map((v) => v.vocabulary ?? "");
    const mergedWeak = [...new Set([...weakWords, ...kanjiWeakVocab])];
    const p = getAdaptivePassage(mergedWeak, seenIds);
    if (p) {
      setPassage(p);
      setSessionStartTime(new Date());
      setShowResult(false);
      setLastScore(null);
      setSeenIds((prev) => [...prev, p.id]);
    } else {
      setSeenIds([]);
      handleStart();
    }
    // (mergedWeak used via handleStart fallback path)
  };

  const handleReset = () => {
    setPassage(null);
    setShowResult(false);
    setLastScore(null);
    setSessionStartTime(null);
  };

  // Intro card
  if (!passage) {
    return (
      <div className="space-y-6" data-ocid="reading.adaptive_section">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Mode Adaptif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              Mode ini menyesuaikan bacaan dengan kelemahan Anda.
            </p>
            <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
              <li>Kosakata yang sering dicari akan muncul lebih sering</li>
              <li>Bacaan dipilih berdasarkan kata-kata yang belum dikuasai</li>
              <li>Semakin sering pakai, semakin akurat rekomendasinya</li>
            </ul>
          </CardContent>
        </Card>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={loading}
          className="w-full sm:w-auto"
          data-ocid="reading.adaptive_start_button"
        >
          <Brain className="w-5 h-5 mr-2" />
          Mulai Adaptif
        </Button>
      </div>
    );
  }

  // Result
  if (showResult && lastScore !== null) {
    return (
      <ScoreResult
        score={lastScore}
        onNext={handleNext}
        onReset={handleReset}
        nextLabel="Bacaan Berikutnya"
        resetLabel="Kembali"
      />
    );
  }

  // Reading
  return (
    <div className="space-y-6" data-ocid="reading.adaptive_passage">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Adaptif</Badge>
          {weakWordCount > 0 && (
            <Badge variant="secondary">
              {weakWordCount} kata lemah terdeteksi
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          data-ocid="reading.adaptive_back_button"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Kembali
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{passage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingText
            sentences={passage.sentences}
            targetVocabulary={passage.targetVocabulary}
          />
        </CardContent>
      </Card>

      {sessionStartTime && (
        <QuestionBlock
          questions={passage.questions}
          onComplete={handleComplete}
          startTime={sessionStartTime}
        />
      )}
    </div>
  );
}

// ============================================================================
// AUDIT REPORT DIALOG
// ============================================================================

function AuditReportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [auditList, setAuditList] = useState<
    Array<string | { word: string; timestamp?: string; context?: string }>
  >([]);
  const [lookupSuccess, setLookupSuccess] = useState(0);
  const [testResults, setTestResults] = useState<AllTestResults | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const handleRunTests = () => {
    setTestRunning(true);
    // Run in next tick so UI can show loading state
    setTimeout(() => {
      try {
        const results = runAllTests();
        setTestResults(results);
      } catch {
        setTestResults(null);
      }
      setTestRunning(false);
    }, 50);
  };

  const reload = useCallback(() => {
    try {
      const rawAudit = localStorage.getItem("vocabAuditList");
      setAuditList(rawAudit ? JSON.parse(rawAudit) : []);
    } catch {
      setAuditList([]);
    }
    try {
      const rawLookups = localStorage.getItem("readingWordLookups");
      if (rawLookups) {
        const lookups = JSON.parse(rawLookups) as Record<
          string,
          { lookupCount: number }
        >;
        const successCount = Object.values(lookups).filter(
          (v) => v.lookupCount > 0,
        ).length;
        setLookupSuccess(successCount);
      } else {
        setLookupSuccess(0);
      }
    } catch {
      setLookupSuccess(0);
    }
  }, []);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  const handleClear = useCallback(() => {
    localStorage.removeItem("vocabAuditList");
    setAuditList([]);
    reload();
  }, [reload]);

  const totalFail = auditList.length;
  const total = lookupSuccess + totalFail;
  const pct = total > 0 ? ((lookupSuccess / total) * 100).toFixed(1) : "0.0";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md" data-ocid="reading.audit_dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Laporan Audit Kosakata
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {vocabularyData.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total kata di database
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {lookupSuccess}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total lookup berhasil
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{totalFail}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total lookup gagal
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{pct}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Persentase keberhasilan
              </p>
            </div>
          </div>
          {auditList.length === 0 ? (
            <div
              className="py-8 text-center text-muted-foreground text-sm"
              data-ocid="reading.audit_empty_state"
            >
              Belum ada kata yang dilaporkan. Klik "Laporkan Kata" saat kosakata
              tidak ditemukan.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Kata yang belum tersedia (max 50):
              </p>
              <div
                className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2 flex flex-wrap gap-2"
                data-ocid="reading.audit_list"
              >
                {auditList.slice(0, 50).map((item, i) => {
                  const displayWord =
                    typeof item === "string"
                      ? item
                      : (item as { word: string }).word;
                  return (
                    <span
                      key={`audit-${i}-${displayWord}`}
                      className="inline-block bg-destructive/10 text-destructive border border-destructive/20 rounded px-2 py-0.5 text-sm font-medium"
                    >
                      {displayWord}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {/* ---- Testing Engine V3 ---- */}
          <div
            className="border border-border rounded-lg p-3 space-y-3"
            data-ocid="reading.test_engine_section"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold text-foreground">
                🧪 Testing Engine V3
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={testRunning}
                onClick={handleRunTests}
                data-ocid="reading.run_tests_button"
              >
                {testRunning ? "Menjalankan…" : "Jalankan Test"}
              </Button>
            </div>

            {testResults && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-muted/40 rounded p-2">
                    <p className="text-lg font-bold text-foreground">
                      {testResults.summary.total}
                    </p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2">
                    <p className="text-lg font-bold text-green-600">
                      {testResults.summary.passed}
                    </p>
                    <p className="text-muted-foreground">Lulus</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2">
                    <p className="text-lg font-bold text-destructive">
                      {testResults.summary.failed}
                    </p>
                    <p className="text-muted-foreground">Gagal</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2">
                    <p className="text-lg font-bold text-primary">
                      {testResults.summary.successRate}%
                    </p>
                    <p className="text-muted-foreground">Sukses</p>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          Input
                        </th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          Expected
                        </th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          Actual
                        </th>
                        <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...testResults.tokenizer,
                        ...testResults.morphology,
                        ...testResults.lookup,
                      ].map((r, i) => (
                        <tr
                          key={`test-row-${r.input}-${i}`}
                          className={`border-t border-border ${
                            r.passed ? "" : "bg-destructive/5"
                          }`}
                        >
                          <td className="px-2 py-1 font-jp max-w-[80px] truncate">
                            {r.input}
                          </td>
                          <td className="px-2 py-1 text-muted-foreground max-w-[100px] truncate">
                            {r.expected}
                          </td>
                          <td className="px-2 py-1 max-w-[100px] truncate">
                            {r.actual}
                          </td>
                          <td className="px-2 py-1 text-center">
                            {r.passed ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-destructive">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {auditList.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClear}
                data-ocid="reading.audit_clear_button"
              >
                Bersihkan Daftar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              data-ocid="reading.audit_close_button"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export function ReadingSection() {
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <div className="w-full" data-ocid="reading.section">
      <AuditReportDialog open={auditOpen} onClose={() => setAuditOpen(false)} />

      <Tabs defaultValue="learning" className="w-full">
        <div className="flex items-start justify-between gap-2 max-w-2xl mx-auto mb-6 flex-wrap">
          <TabsList className="grid w-full max-w-xl grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger
              value="learning"
              className="text-sm py-2 px-3 flex items-center gap-1"
              data-ocid="reading.tab.learning"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Belajar Membaca</span>
              <span className="sm:hidden">Belajar</span>
            </TabsTrigger>
            <TabsTrigger
              value="jlpt"
              className="text-sm py-2 px-3 flex items-center gap-1"
              data-ocid="reading.tab.jlpt"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">JLPT Reading</span>
              <span className="sm:hidden">JLPT</span>
            </TabsTrigger>
            <TabsTrigger
              value="adaptive"
              className="text-sm py-2 px-3 flex items-center gap-1"
              data-ocid="reading.tab.adaptive"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Bacaan Adaptif</span>
              <span className="sm:hidden">Adaptif</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="text-sm py-2 px-3 flex items-center gap-1"
              data-ocid="reading.tab.stats"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistik</span>
              <span className="sm:hidden">Statistik</span>
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1 text-xs"
            onClick={() => setAuditOpen(true)}
            data-ocid="reading.audit_open_button"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Lihat Laporan Audit
          </Button>
        </div>

        <TabsContent value="learning">
          <BelajarMembaca />
        </TabsContent>

        <TabsContent value="jlpt">
          <JlptReading />
        </TabsContent>

        <TabsContent value="adaptive">
          <BacaanAdaptif />
        </TabsContent>

        <TabsContent value="stats">
          <ReadingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
