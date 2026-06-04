import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  ClipboardCopy,
  Database,
  Download,
  FileJson,
  FileText,
  Globe,
  History,
  Info,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { kanjiData, radicalData, vocabularyData } from "../data/kanjiData";
import {
  type LearningAnalytics,
  type LearningProfile,
  type MasteryData,
  type StudyState,
  computeAnalytics,
  computeLearningProfile,
  exportLearningProfile,
  generateHumanReadableReport,
  importLearningProfile,
  loadMasteryData,
} from "../lib/masteryEngine";
import {
  type QuizSession,
  getQuizHistory,
  getQuizStatistics,
  importQuizHistory,
} from "../lib/quizHistory";
import {
  fetchAndParseN5Data,
  fetchAndParseRadicalData,
} from "../lib/radicalDataFetcher";

interface BackupData {
  version: string;
  timestamp: string;
  metadata: {
    totalKanji: number;
    totalVocabulary: number;
    totalRadicals: number;
    jlptLevels: string[];
    quizSessions: number;
    totalQuestionsAnswered: number;
    averageScore: number;
  };
  data: {
    kanji: typeof kanjiData;
    vocabulary: typeof vocabularyData;
    radicals: typeof radicalData;
    quizHistory: QuizSession[];
  };
}

const DEFAULT_STUDY_STATE: StudyState = {
  currentLevel: "JLPT N4",
  currentFocus: ["kanji", "vocabulary"],
  currentReadingLevel: 1,
};

export function BackupManager() {
  const [backupStatus, setBackupStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isFetchingRadicals, setIsFetchingRadicals] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [isFetchingN5, setIsFetchingN5] = useState(false);
  const [n5Progress, setN5Progress] = useState(0);

  // ── Profil Belajar state ──
  const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [_profile, setProfile] = useState<LearningProfile | null>(null);
  const [reportText, setReportText] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [profileToast, setProfileToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showImportArea, setShowImportArea] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load mastery data and compute analytics on mount
  useEffect(() => {
    try {
      const mastery = loadMasteryData();
      const history = getQuizHistory() as unknown as Parameters<
        typeof computeAnalytics
      >[1];
      const computed = computeAnalytics(mastery, history);
      const computedProfile = computeLearningProfile(mastery, history);
      setMasteryData(mastery);
      setAnalytics(computed);
      setProfile(computedProfile);
    } catch (e) {
      console.warn("[BackupManager] Failed to load mastery/analytics:", e);
    }
  }, []);

  const showProfileToast = (type: "success" | "error", message: string) => {
    setProfileToast({ type, message });
    setTimeout(() => setProfileToast(null), 5000);
  };

  const handleExportProfile = () => {
    try {
      const history = getQuizHistory() as unknown as Parameters<
        typeof computeAnalytics
      >[1];
      const currentAnalytics = computeAnalytics(masteryData, history);
      const currentProfile = computeLearningProfile(masteryData, history);
      const jsonStr = exportLearningProfile(
        masteryData,
        DEFAULT_STUDY_STATE,
        currentAnalytics,
        [],
        currentProfile,
      );
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learning-profile-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showProfileToast("success", "Profil belajar berhasil diekspor!");
    } catch (_e) {
      showProfileToast("error", "Gagal mengekspor profil belajar. Coba lagi.");
    }
  };

  const handleImportProfile = () => {
    try {
      const result = importLearningProfile(importJsonText);
      if (!result) {
        showProfileToast(
          "error",
          "Format JSON tidak valid atau data tidak lengkap.",
        );
        return;
      }
      const history = getQuizHistory() as unknown as Parameters<
        typeof computeAnalytics
      >[1];
      const newAnalytics = computeAnalytics(result.masteryData, history);
      const newProfile = computeLearningProfile(result.masteryData, history);
      setMasteryData(result.masteryData);
      setAnalytics(newAnalytics);
      setProfile(newProfile);
      setImportJsonText("");
      setShowImportArea(false);
      showProfileToast(
        "success",
        `Profil berhasil diimpor! ${result.masteryData.length} item mastery dimuat.`,
      );
    } catch (_e) {
      showProfileToast("error", "Gagal mengimpor profil. Pastikan JSON valid.");
    }
  };

  const handleGenerateReport = () => {
    try {
      const history = getQuizHistory() as unknown as Parameters<
        typeof computeAnalytics
      >[1];
      const currentAnalytics = computeAnalytics(masteryData, history);
      const currentProfile = computeLearningProfile(masteryData, history);
      const report = generateHumanReadableReport(
        DEFAULT_STUDY_STATE,
        currentAnalytics,
        masteryData,
        currentProfile,
      );
      setReportText(report);
    } catch (_e) {
      setReportText("Gagal membuat laporan. Silakan coba lagi.");
    }
  };

  const handleCopyReport = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const el = document.createElement("textarea");
        el.value = reportText;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (_e) {
      showProfileToast("error", "Gagal menyalin teks ke clipboard.");
    }
  };

  const quizStats = getQuizStatistics();

  // Get unique JLPT levels from current data
  const jlptLevels = Array.from(
    new Set([
      ...kanjiData.map((k) => k.jlptLevel),
      ...vocabularyData.map((v) => v.jlptLevel),
    ]),
  ).sort();

  // Check if N5 data is available
  const hasN5Data = jlptLevels.includes("N5");
  const n5KanjiCount = kanjiData.filter((k) => k.jlptLevel === "N5").length;
  const n5VocabCount = vocabularyData.filter(
    (v) => v.jlptLevel === "N5",
  ).length;

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);

      // Gather all data
      const quizHistory = getQuizHistory();
      setExportProgress(30);

      const backupData: BackupData = {
        version: "2.1",
        timestamp: new Date().toISOString(),
        metadata: {
          totalKanji: kanjiData.length,
          totalVocabulary: vocabularyData.length,
          totalRadicals: radicalData.length,
          jlptLevels: jlptLevels,
          quizSessions: quizStats.totalSessions,
          totalQuestionsAnswered: quizStats.totalQuestions,
          averageScore: quizStats.averageScore,
        },
        data: {
          kanji: kanjiData,
          vocabulary: vocabularyData,
          radicals: radicalData,
          quizHistory: quizHistory,
        },
      };

      setExportProgress(60);

      // Create JSON blob
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      setExportProgress(80);

      // Download file
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `kanji-jlpt-backup-full-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(100);

      setBackupStatus("success");
      setStatusMessage(
        `Backup berhasil diunduh!\n\n📊 Data yang dibackup:\n• ${kanjiData.length} kanji\n• ${vocabularyData.length} kosakata\n• ${radicalData.length} radikal\n• ${quizHistory.length} sesi quiz\n• Level JLPT: ${jlptLevels.join(", ")}`,
      );

      setTimeout(() => {
        setBackupStatus("idle");
        setIsExporting(false);
        setExportProgress(0);
      }, 5000);
    } catch (_error) {
      setBackupStatus("error");
      setStatusMessage("Gagal membuat backup. Silakan coba lagi.");
      setIsExporting(false);
      setExportProgress(0);
      setTimeout(() => setBackupStatus("idle"), 5000);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData: BackupData = JSON.parse(content);

        // Validate backup structure
        if (
          !backupData.data ||
          !backupData.data.kanji ||
          !backupData.data.radicals
        ) {
          throw new Error(
            "Format backup tidak valid - data kanji atau radikal tidak ditemukan",
          );
        }

        // Validate version
        if (!backupData.version) {
          throw new Error("Format backup tidak valid - versi tidak ditemukan");
        }

        // Import quiz history if available
        if (
          backupData.data.quizHistory &&
          Array.isArray(backupData.data.quizHistory)
        ) {
          importQuizHistory(backupData.data.quizHistory);
        }

        const quizHistoryCount = backupData.data.quizHistory?.length || 0;
        const jlptLevelsStr =
          backupData.metadata.jlptLevels?.join(", ") || "N4";

        setBackupStatus("success");
        setStatusMessage(
          `Backup valid dan berhasil diimpor!\n\n📊 Data yang diimpor:\n• ${backupData.metadata.totalKanji} kanji\n• ${backupData.metadata.totalVocabulary || 0} kosakata\n• ${backupData.metadata.totalRadicals} radikal\n• ${quizHistoryCount} sesi quiz\n• Level JLPT: ${jlptLevelsStr}\n• Versi: ${backupData.version}\n• Tanggal backup: ${new Date(backupData.timestamp).toLocaleDateString("id-ID")}\n\n✅ Riwayat quiz telah dipulihkan!\nℹ️ Untuk menerapkan data kanji/kosakata/radikal, refresh aplikasi setelah mengganti file kanjiData.ts`,
        );

        setTimeout(() => setBackupStatus("idle"), 12000);
      } catch (error) {
        setBackupStatus("error");
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setStatusMessage(
          `File backup tidak valid atau rusak: ${errorMessage}. Pastikan Anda menggunakan file backup yang benar.`,
        );
        setTimeout(() => setBackupStatus("idle"), 5000);
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  const handleFetchRadicalData = async () => {
    try {
      setIsFetchingRadicals(true);
      setFetchProgress(0);
      setBackupStatus("idle");

      const result = await fetchAndParseRadicalData((progress) => {
        setFetchProgress(progress);
      });

      setFetchProgress(100);

      // Create downloadable file with the new data
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `radical-kanji-data-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus("success");
      setStatusMessage(
        `✅ Data berhasil diambil dari kanjikana.com!\n\n📊 Ringkasan:\n• Total radikal baru: ${result.newRadicals.length}\n• Total kanji baru: ${result.newKanji.length}\n• Halaman yang diproses: ${result.pagesProcessed}\n\n📥 File JSON telah diunduh dengan data lengkap.\n\n${result.newRadicals.length > 0 ? `🆕 Radikal baru:\n${result.newRadicals.map((r) => `• ${r.name} - ${r.meaning}`).join("\n")}` : "✓ Tidak ada radikal baru"}\n\n${result.newKanji.length > 0 ? `🆕 ${result.newKanji.length} kanji baru ditambahkan` : "✓ Tidak ada kanji baru"}\n\nℹ️ Lihat console browser untuk detail lengkap.`,
      );

      // Log to console for development
      console.log("=== RADICAL DATA FETCH SUMMARY ===");
      console.log("Pages processed:", result.pagesProcessed);
      console.log("New radicals:", result.newRadicals.length);
      console.log("New kanji:", result.newKanji.length);
      console.log("\n=== NEW RADICALS ===");
      for (const r of result.newRadicals) {
        console.log(`${r.name} - ${r.meaning}`);
        console.log(`  Origin: ${r.origin}`);
        console.log(`  Kanji count: ${r.kanjiList.length}`);
      }
      console.log("\n=== NEW KANJI ===");
      for (const k of result.newKanji) {
        console.log(`${k.character} (${k.romaji}) - ${k.meaning}`);
      }

      setTimeout(() => {
        setBackupStatus("idle");
        setIsFetchingRadicals(false);
        setFetchProgress(0);
      }, 15000);
    } catch (error) {
      setBackupStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatusMessage(
        `Gagal mengambil data: ${errorMessage}\n\nPastikan Anda terhubung ke internet dan coba lagi.`,
      );
      setIsFetchingRadicals(false);
      setFetchProgress(0);
      setTimeout(() => setBackupStatus("idle"), 5000);
    }
  };

  const handleFetchN5Data = async () => {
    try {
      setIsFetchingN5(true);
      setN5Progress(0);
      setBackupStatus("idle");

      const result = await fetchAndParseN5Data((progress) => {
        setN5Progress(progress);
      });

      setN5Progress(100);

      // Create downloadable file with the new data
      const downloadData = {
        summary: {
          totalKanji: result.allKanji.length,
          totalVocabulary: result.allVocabulary.length,
          newKanji: result.newKanji.length,
          newVocabulary: result.newVocabulary.length,
          timestamp: new Date().toISOString(),
        },
        newData: {
          kanji: result.newKanji,
          vocabulary: result.newVocabulary,
        },
        allData: {
          kanji: result.allKanji,
          vocabulary: result.allVocabulary,
        },
      };

      const dataStr = JSON.stringify(downloadData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `jlpt-n5-data-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus("success");
      setStatusMessage(
        `✅ Data JLPT N5 berhasil diambil dari kanjikana.com!\n\n📊 Ringkasan:\n• Total kanji N5: ${result.allKanji.length}\n• Total kosakata N5: ${result.allVocabulary.length}\n• Kanji baru: ${result.newKanji.length}\n• Kosakata baru: ${result.newVocabulary.length}\n\n📥 File JSON telah diunduh dengan data lengkap N5.\n\n${result.newKanji.length > 0 ? `🆕 ${result.newKanji.length} kanji N5 baru ditemukan` : "✓ Semua kanji N5 sudah ada"}\n${result.newVocabulary.length > 0 ? `🆕 ${result.newVocabulary.length} kosakata N5 baru ditemukan` : "✓ Semua kosakata N5 sudah ada"}\n\n📝 Langkah selanjutnya:\n1. Buka file JSON yang diunduh\n2. Salin data dari "allData.kanji" dan "allData.vocabulary"\n3. Tambahkan ke file kanjiData.ts\n4. Refresh aplikasi untuk melihat data N5\n\nℹ️ Lihat console browser untuk detail lengkap semua entri N5.`,
      );

      // Log to console for development
      console.log("=== JLPT N5 DATA FETCH SUMMARY ===");
      console.log("Total entries processed:", result.totalEntries);
      console.log("Total kanji:", result.allKanji.length);
      console.log("Total vocabulary:", result.allVocabulary.length);
      console.log("New kanji:", result.newKanji.length);
      console.log("New vocabulary:", result.newVocabulary.length);

      console.log("\n=== ALL N5 KANJI (for integration) ===");
      console.log("Copy this array to kanjiData.ts:");
      console.log(JSON.stringify(result.allKanji, null, 2));

      console.log("\n=== ALL N5 VOCABULARY (for integration) ===");
      console.log("Copy this array to kanjiData.ts:");
      console.log(JSON.stringify(result.allVocabulary, null, 2));

      if (result.newKanji.length > 0) {
        console.log("\n=== NEW N5 KANJI ===");
        for (const k of result.newKanji) {
          console.log(`${k.character} (${k.romaji}) - ${k.meaning}`);
          console.log(`  Radical: ${k.radical}`);
          console.log(`  Type: ${k.wordType}`);
        }
      }

      if (result.newVocabulary.length > 0) {
        console.log("\n=== NEW N5 VOCABULARY ===");
        for (const v of result.newVocabulary) {
          console.log(`${v.vocabulary} (${v.romaji}) - ${v.meaning}`);
          console.log(`  Radical: ${v.radical}`);
          console.log(`  Type: ${v.wordType}`);
        }
      }

      setTimeout(() => {
        setBackupStatus("idle");
        setIsFetchingN5(false);
        setN5Progress(0);
      }, 15000);
    } catch (error) {
      setBackupStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatusMessage(
        `Gagal mengambil data N5: ${errorMessage}\n\nPastikan Anda terhubung ke internet dan coba lagi.`,
      );
      setIsFetchingN5(false);
      setN5Progress(0);
      setTimeout(() => setBackupStatus("idle"), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Manajemen Backup Data</CardTitle>
              <CardDescription>
                Kelola backup data kanji, kosakata, radikal, dan riwayat belajar
                JLPT Anda
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          {backupStatus !== "idle" && (
            <Alert
              variant={backupStatus === "success" ? "default" : "destructive"}
            >
              {backupStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {backupStatus === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
              </AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Membuat backup...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Fetch Progress */}
          {isFetchingRadicals && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mengambil data radikal dari kanjikana.com...</span>
                <span>{fetchProgress}%</span>
              </div>
              <Progress value={fetchProgress} className="h-2" />
            </div>
          )}

          {/* N5 Fetch Progress */}
          {isFetchingN5 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mengambil data JLPT N5 dari kanjikana.com...</span>
                <span>{n5Progress}%</span>
              </div>
              <Progress value={n5Progress} className="h-2" />
            </div>
          )}

          {/* N5 Data Status Badge */}
          {hasN5Data && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Data JLPT N5 Tersedia!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Aplikasi ini sudah memiliki data JLPT N5 lengkap: {n5KanjiCount}{" "}
                kanji dan {n5VocabCount} kosakata. Anda dapat melihatnya dengan
                memfilter level "N5" di tab Kanji atau Kosakata.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Data Info */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Informasi Data Saat Ini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Kanji
                </p>
                <p className="text-3xl font-bold text-primary">
                  {kanjiData.length}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Kosakata
                </p>
                <p className="text-3xl font-bold text-accent">
                  {vocabularyData.length}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Radikal
                </p>
                <p className="text-3xl font-bold">{radicalData.length}</p>
              </div>
            </div>

            {/* Quiz Statistics */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                Statistik Belajar
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Sesi Quiz
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {quizStats.totalSessions}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Soal
                  </p>
                  <p className="text-2xl font-bold">
                    {quizStats.totalQuestions}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Rata-rata
                  </p>
                  <p className="text-2xl font-bold text-accent">
                    {quizStats.averageScore.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Skor Terbaik
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {quizStats.bestScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <Badge variant="outline">Mode Offline</Badge>
              <Badge variant="outline">Data Lokal</Badge>
              {jlptLevels.map((level) => (
                <Badge
                  key={level}
                  variant={level === "N5" ? "default" : "outline"}
                >
                  Level {level}
                  {level === "N5" && hasN5Data && " ✓"}
                </Badge>
              ))}
              {quizStats.totalSessions > 0 && (
                <Badge variant="outline" className="gap-1">
                  <History className="w-3 h-3" />
                  {quizStats.totalSessions} Riwayat
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Fetch N5 Data from Web */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Tambahkan Data JLPT N5
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ambil data kanji dan kosakata JLPT N5 lengkap dari
                kanjikana.com. Sistem akan membandingkan dengan data yang ada
                dan menampilkan entri baru yang ditemukan. Data akan diunduh
                sebagai file JSON yang dapat Anda integrasikan ke aplikasi.
              </p>
              <Button
                onClick={handleFetchN5Data}
                size="lg"
                className="w-full md:w-auto"
                disabled={isFetchingN5}
                variant="default"
              >
                <Sparkles
                  className={`w-4 h-4 mr-2 ${isFetchingN5 ? "animate-pulse" : ""}`}
                />
                {isFetchingN5 ? "Mengambil Data N5..." : "Ambil Data JLPT N5"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Fitur ini memerlukan koneksi internet. Data N5 akan
                ditambahkan ke dataset yang ada.
              </p>
            </div>
          </div>

          <Separator />

          {/* Fetch Radical Data from Web */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Perbarui Data Radikal dari Web
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ambil data radikal dan kanji terbaru dari kanjikana.com (halaman
                2-14). Sistem akan membandingkan dengan data yang ada dan
                menampilkan entri baru yang ditemukan. Data akan diunduh sebagai
                file JSON yang dapat Anda integrasikan ke aplikasi.
              </p>
              <Button
                onClick={handleFetchRadicalData}
                size="lg"
                className="w-full md:w-auto"
                disabled={isFetchingRadicals}
                variant="secondary"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isFetchingRadicals ? "animate-spin" : ""}`}
                />
                {isFetchingRadicals
                  ? "Mengambil Data..."
                  : "Ambil Data Radikal"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Fitur ini memerlukan koneksi internet dan mungkin memakan
                waktu beberapa menit
              </p>
            </div>
          </div>

          <Separator />

          {/* Export Backup */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Ekspor Backup Lengkap
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unduh semua data kanji, kosakata, radikal, dan riwayat belajar
                Anda sebagai file JSON. File ini mencakup statistik quiz dan
                dapat digunakan untuk memulihkan data atau dipindahkan ke
                perangkat lain.
              </p>
              <Button
                onClick={handleExportBackup}
                size="lg"
                className="w-full md:w-auto"
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Membuat Backup..." : "Unduh Backup Data"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Import Backup */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Impor & Pulihkan Backup
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pulihkan data dari file backup yang telah Anda unduh sebelumnya.
                Riwayat quiz akan langsung dipulihkan, sedangkan data
                kanji/kosakata/radikal memerlukan refresh aplikasi.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={() =>
                    document.getElementById("backup-file-input")?.click()
                  }
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih File Backup
                </Button>
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ================================================================ */}
          {/*  PROFIL BELAJAR                                                    */}
          {/* ================================================================ */}
          <Separator />

          <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Profil Belajar</h3>
                <p className="text-sm text-muted-foreground">
                  Analitik mastery, ekspor/impor profil, dan laporan belajar
                </p>
              </div>
            </div>

            {/* Profile toast */}
            {profileToast && (
              <Alert
                variant={
                  profileToast.type === "error" ? "destructive" : "default"
                }
              >
                {profileToast.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{profileToast.message}</AlertDescription>
              </Alert>
            )}

            {/* ── SECTION 1: Analytics Dashboard ── */}
            <div className="bg-muted/50 rounded-lg p-5 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Analitik Belajar
              </h4>

              {masteryData.length === 0 ? (
                <div
                  data-ocid="analytics.empty_state"
                  className="text-center py-6 text-muted-foreground"
                >
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">Belum ada data mastery.</p>
                  <p className="text-sm">Mulai kuis dulu!</p>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div
                    className="bg-background rounded-lg p-3 border"
                    data-ocid="analytics.total_questions"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Pertanyaan
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {analytics.totalQuestions}
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border"
                    data-ocid="analytics.total_correct"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Benar
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.totalCorrect}
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border"
                    data-ocid="analytics.total_wrong"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Salah
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {analytics.totalWrong}
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border"
                    data-ocid="analytics.accuracy"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Akurasi
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {analytics.accuracyRate.toFixed(1)}%
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border col-span-1"
                    data-ocid="analytics.strongest"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Kategori Terkuat
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      {analytics.strongestCategory}
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border col-span-1"
                    data-ocid="analytics.weakest"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Kategori Terlemah
                    </p>
                    <p className="text-sm font-semibold text-destructive">
                      {analytics.weakestCategory}
                    </p>
                  </div>
                  <div
                    className="bg-background rounded-lg p-3 border col-span-2"
                    data-ocid="analytics.avg_session"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Rata-rata Panjang Sesi
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.averageSessionLength.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        soal/sesi
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── SECTION 2: Export / Import Profile ── */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Ekspor / Impor Profil Belajar
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  data-ocid="profile.export_button"
                  variant="default"
                  onClick={handleExportProfile}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Profil Belajar
                </Button>
                <Button
                  data-ocid="profile.import_open_modal_button"
                  variant="outline"
                  onClick={() => setShowImportArea((v) => !v)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Profil Belajar
                </Button>
              </div>

              {showImportArea && (
                <div className="space-y-3" data-ocid="profile.import_panel">
                  <textarea
                    data-ocid="profile.import_textarea"
                    className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tempel JSON profil belajar di sini..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      data-ocid="profile.import_confirm_button"
                      onClick={handleImportProfile}
                      disabled={!importJsonText.trim()}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Impor
                    </Button>
                    <Button
                      data-ocid="profile.import_cancel_button"
                      variant="ghost"
                      onClick={() => {
                        setShowImportArea(false);
                        setImportJsonText("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 3: Learning Report ── */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileJson className="w-4 h-4 text-primary" />
                Laporan Belajar
              </h4>
              <Button
                data-ocid="report.generate_button"
                variant="secondary"
                onClick={handleGenerateReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Laporan Belajar
              </Button>

              {reportText && (
                <div className="space-y-2" data-ocid="report.panel">
                  <pre
                    className="w-full max-h-80 overflow-y-auto rounded-md border border-input bg-muted/40 px-4 py-3 text-sm font-mono whitespace-pre-wrap break-words"
                    data-ocid="report.output"
                  >
                    {reportText}
                  </pre>
                  <Button
                    data-ocid="report.copy_button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReport}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-4 h-4 mr-2" />
                        Salin ke Clipboard
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <FileJson className="h-4 w-4" />
            <AlertTitle>Cara Menggunakan Backup</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p>
                <strong>Untuk Tambah Data N5:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Klik tombol "Ambil Data JLPT N5"</li>
                <li>Tunggu proses pengambilan data selesai</li>
                <li>File JSON dengan data N5 lengkap akan diunduh otomatis</li>
                <li>
                  Buka file JSON dan salin array dari "allData.kanji" dan
                  "allData.vocabulary"
                </li>
                <li>
                  Tambahkan data tersebut ke file{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    frontend/src/data/kanjiData.ts
                  </code>
                </li>
                <li>Refresh aplikasi untuk melihat data N5</li>
              </ul>
              <p className="mt-3">
                <strong>Untuk Ekspor:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Klik tombol "Unduh Backup Data"</li>
                <li>File JSON lengkap akan diunduh ke perangkat Anda</li>
                <li>
                  File berisi semua data kanji, kosakata, radikal, dan riwayat
                  quiz
                </li>
                <li>Simpan file ini di tempat yang aman</li>
              </ul>
              <p className="mt-3">
                <strong>Untuk Impor:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Klik tombol "Pilih File Backup"</li>
                <li>Pilih file backup JSON yang valid</li>
                <li>Sistem akan memvalidasi dan mengimpor data</li>
                <li>Riwayat quiz akan langsung dipulihkan</li>
                <li>
                  Untuk data kanji/kosakata/radikal: ganti konten file{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    frontend/src/data/kanjiData.ts
                  </code>{" "}
                  dengan data dari backup
                </li>
              </ul>
              <p className="mt-3">
                <strong>Untuk Perbarui Data Radikal:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Klik tombol "Ambil Data Radikal"</li>
                <li>Tunggu proses pengambilan data selesai (beberapa menit)</li>
                <li>File JSON dengan data baru akan diunduh otomatis</li>
                <li>
                  Lihat console browser untuk detail radikal dan kanji baru
                </li>
                <li>
                  Integrasikan data baru ke{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    kanjiData.ts
                  </code>{" "}
                  jika diperlukan
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tentang Sistem Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Aplikasi ini menggunakan sistem penyimpanan data offline yang
            tersimpan langsung di kode aplikasi dan browser. Semua data kanji,
            kosakata, dan radikal disimpan dalam file{" "}
            <code className="bg-muted px-1 py-0.5 rounded">kanjiData.ts</code>,
            sedangkan riwayat quiz disimpan di localStorage browser.
          </p>
          <p>
            <strong>
              Fitur backup yang disempurnakan memungkinkan Anda untuk:
            </strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Menambahkan data JLPT N5 lengkap dari kanjikana.com</li>
            <li>Menyimpan salinan lengkap semua data sebagai file JSON</li>
            <li>Mengekspor riwayat quiz dan statistik belajar</li>
            <li>Memvalidasi integritas file backup dengan metadata</li>
            <li>Memulihkan riwayat quiz secara otomatis</li>
            <li>Memindahkan data antar perangkat dengan mudah</li>
            <li>Melacak progress belajar dari waktu ke waktu</li>
            <li>Mengambil data terbaru dari kanjikana.com</li>
            <li>Membandingkan dan menambahkan radikal/kanji/kosakata baru</li>
          </ul>
          <p className="pt-2">
            <strong>Metadata Backup:</strong> Setiap file backup mencakup
            tanggal pembuatan, versi aplikasi, jumlah data, level JLPT yang
            tersedia, dan statistik belajar untuk memudahkan identifikasi dan
            verifikasi.
          </p>
          {hasN5Data && (
            <p className="pt-2 text-green-600 dark:text-green-400 font-semibold">
              ✅ Data JLPT N5 sudah tersedia di aplikasi ini! Gunakan filter
              level "N5" untuk melihat semua kanji dan kosakata N5.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
