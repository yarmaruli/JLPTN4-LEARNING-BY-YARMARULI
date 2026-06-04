import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import type { VocabularyEntry } from "../data/kanjiData";

interface BatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportDone: () => void;
}

interface ImportResult {
  added: number;
  duplicates: number;
  errors: string[];
}

/** Load existing batch vocabulary from localStorage */
function loadBatchVocabulary(): VocabularyEntry[] {
  try {
    const stored = localStorage.getItem("batchVocabulary");
    if (!stored) return [];
    const parsed = JSON.parse(stored) as VocabularyEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save batch vocabulary to localStorage */
function saveBatchVocabulary(data: VocabularyEntry[]): void {
  try {
    localStorage.setItem("batchVocabulary", JSON.stringify(data));
  } catch (e) {
    console.warn("[BatchImport] saveBatchVocabulary failed:", e);
  }
}

/** Parse and validate a raw JSON input, returning normalized VocabularyEntry[] */
function parseImportInput(raw: string): {
  entries: VocabularyEntry[];
  parseError: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { entries: [], parseError: "Input kosong." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      entries: [],
      parseError:
        "Format JSON tidak valid. Pastikan input berupa array JSON yang valid.",
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      entries: [],
      parseError:
        "Input harus berupa array JSON (dimulai dengan '[' dan diakhiri ']').",
    };
  }

  const entries: VocabularyEntry[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;
    if (typeof item !== "object" || item === null) continue;

    // Accept both "word" and "vocabulary" field names
    const vocabWord =
      (typeof item.vocabulary === "string" ? item.vocabulary : null) ??
      (typeof item.word === "string" ? item.word : null);
    const romaji = typeof item.romaji === "string" ? item.romaji : "";
    const meaning = typeof item.meaning === "string" ? item.meaning : "";

    if (!vocabWord || !romaji || !meaning) continue; // skip invalid rows

    const batchCode =
      typeof item.batchCode === "string" && item.batchCode.trim()
        ? item.batchCode.trim()
        : "UNKNOWN_BATCH";
    const jlptLevel =
      typeof item.jlptLevel === "string" ? item.jlptLevel : "N4";
    const wordType =
      typeof item.wordType === "string" ? item.wordType : "kata benda";
    const radical = typeof item.radical === "string" ? item.radical : "";
    const explanation =
      typeof item.explanation === "string" ? item.explanation : "";
    const category =
      typeof item.category === "string" ? item.category : undefined;

    // Auto-generate id if missing
    const seqStr = String(i + 1).padStart(3, "0");
    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `${jlptLevel}_${batchCode}_${seqStr}`;

    entries.push({
      id,
      vocabulary: vocabWord,
      romaji,
      meaning,
      radical,
      wordType,
      explanation,
      jlptLevel,
      batchCode,
      category,
    });
  }

  return { entries, parseError: null };
}

export function BatchImportModal({
  open,
  onClose,
  onImportDone,
}: BatchImportModalProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleClose = () => {
    setInputText("");
    setResult(null);
    setParseError(null);
    onClose();
  };

  const handleImport = () => {
    setIsImporting(true);
    setResult(null);
    setParseError(null);

    const { entries, parseError: err } = parseImportInput(inputText);
    if (err) {
      setParseError(err);
      setIsImporting(false);
      return;
    }

    if (entries.length === 0) {
      setParseError(
        "Tidak ada entri valid yang ditemukan. Pastikan setiap entri memiliki kolom vocabulary/word, romaji, dan meaning.",
      );
      setIsImporting(false);
      return;
    }

    const existing = loadBatchVocabulary();

    // Build duplicate-detection sets
    const existingIds = new Set(
      existing.map((v) => v.id ?? "").filter(Boolean),
    );
    const existingPairs = new Set(
      existing.map((v) => `${v.vocabulary}||${v.batchCode ?? "UNKNOWN_BATCH"}`),
    );

    let added = 0;
    let duplicates = 0;
    const merged = [...existing];

    for (const entry of entries) {
      const pairKey = `${entry.vocabulary}||${entry.batchCode ?? "UNKNOWN_BATCH"}`;
      const isDuplicate =
        (entry.id && existingIds.has(entry.id)) || existingPairs.has(pairKey);

      if (isDuplicate) {
        duplicates++;
      } else {
        merged.push(entry);
        if (entry.id) existingIds.add(entry.id);
        existingPairs.add(pairKey);
        added++;
      }
    }

    saveBatchVocabulary(merged);
    setResult({ added, duplicates, errors: [] });
    setIsImporting(false);
    if (added > 0) onImportDone();
  };

  const exampleJson = JSON.stringify(
    [
      {
        vocabulary: "学校",
        romaji: "gakkou",
        meaning: "sekolah",
        wordType: "kata benda",
        jlptLevel: "N4",
        batchCode: "N4_B28",
        explanation: "Tempat belajar formal",
      },
    ],
    null,
    2,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-xl w-full"
        data-ocid="vocabulary.batch_import_dialog"
      >
        <DialogHeader>
          <DialogTitle>Import Kosakata Batch</DialogTitle>
          <DialogDescription>
            Tempel array JSON kosakata. Setiap entri harus memiliki kolom{" "}
            <code className="text-xs bg-muted px-1 rounded">vocabulary</code>{" "}
            (atau <code className="text-xs bg-muted px-1 rounded">word</code>),{" "}
            <code className="text-xs bg-muted px-1 rounded">romaji</code>, dan{" "}
            <code className="text-xs bg-muted px-1 rounded">meaning</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-input">Data JSON Kosakata</Label>
            <Textarea
              id="batch-input"
              data-ocid="vocabulary.batch_import_textarea"
              placeholder={exampleJson}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setResult(null);
                setParseError(null);
              }}
              className="font-mono text-xs min-h-[200px] resize-y"
              spellCheck={false}
            />
          </div>

          {parseError && (
            <Alert
              variant="destructive"
              data-ocid="vocabulary.batch_import_error_state"
            >
              <XCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{parseError}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert
              className="border-primary/40 bg-primary/5"
              data-ocid="vocabulary.batch_import_success_state"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">
                Berhasil import{" "}
                <span className="font-semibold">
                  {result.added} kosakata baru
                </span>
                {result.duplicates > 0 && (
                  <>
                    ,{" "}
                    <span className="font-semibold">
                      {result.duplicates} duplikat
                    </span>{" "}
                    dilewati
                  </>
                )}
                .
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="vocabulary.batch_import_cancel_button"
          >
            Tutup
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !inputText.trim()}
            data-ocid="vocabulary.batch_import_submit_button"
          >
            {isImporting ? "Mengimpor..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
