import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookX, Upload, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import type { VocabularyEntry } from "../data/kanjiData";
import { useGetAllVocabulary } from "../hooks/useQueries";
import { loadMasteryData } from "../lib/masteryEngine";
import { BatchImportModal } from "./BatchImportModal";
import { VocabularyCard } from "./VocabularyCard";

interface VocabularyListProps {
  searchTerm: string;
  jlptLevel: string | null;
  wordType: string | null;
  radical: string | null;
}

/** Parse batchCode like "N4_B28" → "Bab 28", "N5_B01" → "Bab 1" */
function batchCodeToLabel(code: string): string {
  const parts = code.split("_B");
  if (parts.length >= 2) {
    const num = Number.parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(num)) return `Bab ${num}`;
  }
  return code;
}

/** Get sorted unique batchCodes (excluding UNKNOWN_BATCH) from a list */
function getUniqueBatchCodes(items: VocabularyEntry[]): string[] {
  const codes = new Set<string>();
  for (const v of items) {
    const code = v.batchCode ?? "UNKNOWN_BATCH";
    if (code !== "UNKNOWN_BATCH") codes.add(code);
  }
  return Array.from(codes).sort();
}

export function VocabularyList({
  searchTerm,
  jlptLevel,
  wordType,
  radical,
}: VocabularyListProps) {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // All vocabulary without batchCode filter to compute available batch codes
  const { data: allVocab } = useGetAllVocabulary(
    searchTerm,
    jlptLevel,
    wordType,
    radical,
    null,
    refreshKey,
  );

  // Filtered vocabulary with batchCode applied
  const { data: vocabularyList } = useGetAllVocabulary(
    searchTerm,
    jlptLevel,
    wordType,
    radical,
    selectedBatch,
    refreshKey,
  );

  // Batch codes derived from merged data (not just base)
  const batchCodes = useMemo(
    () => getUniqueBatchCodes(allVocab ?? []),
    [allVocab],
  );

  // Batch statistics when a specific bab is selected
  const batchStats = useMemo(() => {
    if (!selectedBatch) return null;
    const inBatch = (allVocab ?? []).filter(
      (v) => (v.batchCode ?? "UNKNOWN_BATCH") === selectedBatch,
    );
    let learned = 0;
    try {
      const masteryList = loadMasteryData();
      const masteryMap = new Map(
        masteryList.map((m) => [m.itemId, m.masteryLevel]),
      );
      for (const v of inBatch) {
        const key = `vocab_${v.vocabulary}`;
        const level = masteryMap.get(key) ?? 0;
        if (level >= 1) learned++;
      }
    } catch {
      learned = 0;
    }
    return {
      label: batchCodeToLabel(selectedBatch),
      total: inBatch.length,
      learned,
      remaining: inBatch.length - learned,
    };
  }, [selectedBatch, allVocab]);

  const handleImportDone = () => {
    // Bump refreshKey to bust the useMemo in useGetAllVocabulary
    setRefreshKey((k) => k + 1);
  };

  const hasFiltered = !vocabularyList || vocabularyList.length === 0;

  return (
    <div className="space-y-4">
      {/* Header row: count + import button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {vocabularyList?.length ?? 0}
          </span>{" "}
          kosakata
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <WifiOff className="h-3 w-3" />
            Mode Offline
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setImportOpen(true)}
            data-ocid="vocabulary.import_batch_button"
          >
            <Upload className="h-4 w-4" />
            Import Batch
          </Button>
        </div>
      </div>

      {/* Batch filter tabs */}
      {batchCodes.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          data-ocid="vocabulary.batch_filter"
        >
          <button
            type="button"
            onClick={() => setSelectedBatch(null)}
            data-ocid="vocabulary.batch_tab.semua"
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedBatch === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua
          </button>
          {batchCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedBatch(code)}
              data-ocid={`vocabulary.batch_tab.${code.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedBatch === code
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {batchCodeToLabel(code)}
            </button>
          ))}
        </div>
      )}

      {/* Batch statistics panel */}
      {batchStats && (
        <div
          className="bg-card border rounded-xl p-4 flex flex-wrap gap-6"
          data-ocid="vocabulary.batch_stats"
        >
          <div>
            <p className="text-xs text-muted-foreground">
              Kosakata {batchStats.label}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {batchStats.total} kata
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dipelajari</p>
            <p className="text-2xl font-bold text-primary">
              {batchStats.learned}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Belum</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {batchStats.remaining}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {hasFiltered ? (
        <Alert className="max-w-2xl mx-auto">
          <BookX className="h-5 w-5" />
          <AlertDescription className="ml-2">
            Tidak ada kosakata yang ditemukan. Coba ubah filter atau kata kunci
            pencarian Anda.
          </AlertDescription>
        </Alert>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="vocabulary.list"
        >
          {(vocabularyList ?? []).map((vocab, index) => (
            <VocabularyCard
              key={`${vocab.vocabulary}-${vocab.batchCode ?? ""}-${index}`}
              vocabulary={vocab}
            />
          ))}
        </div>
      )}

      {/* Batch Import Modal */}
      <BatchImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportDone={handleImportDone}
      />
    </div>
  );
}
