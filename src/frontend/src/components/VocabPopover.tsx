/**
 * VocabPopover.tsx
 * Smart Vocabulary Link - wraps any Japanese word and shows lookup info from vocabularyData.
 * First click: quick meaning popover.
 * Second click (or 'Lihat Detail' button): full Dialog card.
 * Records every lookup via updateWordLookup from readingEngine.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { type VocabularyEntry, vocabularyData } from "@/data/kanjiData";
import { findExampleSentences } from "@/lib/exampleSentences";
import { recordKanjiLookup } from "@/lib/masteryEngine";
import { deInflect } from "@/lib/morphology";
import { updateKanjiAnalytics, updateWordLookup } from "@/lib/readingEngine";
import { BookOpen, Flag, HelpCircle, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

interface VocabPopoverProps {
  word: string;
  children: React.ReactNode;
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function normalizeForMatch(str: string): string {
  return katakanaToHiragana(str.trim().toLowerCase());
}

/**
 * Returns all candidate base-forms by stripping common Japanese conjugation suffixes.
 * Tries longest suffixes first. Returns an array of candidates to try.
 */
function getConjugationCandidates(word: string): string[] {
  const candidates: string[] = [];
  const add = (base: string) => {
    if (base && base.length > 0 && !candidates.includes(base)) {
      candidates.push(base);
      // Also try stem+ます for verb lookup
      const withMasu = `${base}ます`;
      if (!candidates.includes(withMasu)) candidates.push(withMasu);
    }
  };

  // ---- longest suffixes first ----
  if (word.endsWith("ませんでした")) add(word.slice(0, -6));
  if (word.endsWith("てしまいました")) add(word.slice(0, -7));
  if (word.endsWith("てしまった")) add(word.slice(0, -5));
  if (word.endsWith("てしまう")) add(word.slice(0, -4));
  if (word.endsWith("てあげます")) add(word.slice(0, -5));
  if (word.endsWith("てくれます")) add(word.slice(0, -5));
  if (word.endsWith("ておいた")) add(word.slice(0, -4));
  if (word.endsWith("ておく")) add(word.slice(0, -3));
  if (word.endsWith("てみた")) add(word.slice(0, -3));
  if (word.endsWith("てみる")) add(word.slice(0, -3));
  if (word.endsWith("てから")) add(word.slice(0, -3));
  if (word.endsWith("てあげる")) add(word.slice(0, -4));
  if (word.endsWith("てくれる")) add(word.slice(0, -4));
  if (word.endsWith("させられる")) add(word.slice(0, -5));
  if (word.endsWith("させられた")) add(word.slice(0, -5));
  if (word.endsWith("させてもらう")) add(word.slice(0, -6));
  if (word.endsWith("なかった")) {
    add(`${word.slice(0, -4)}ない`);
    add(`${word.slice(0, -4)}ます`);
  }
  if (word.endsWith("くなかった")) add(`${word.slice(0, -5)}い`);
  if (word.endsWith("ましたか")) add(`${word.slice(0, -4)}ます`);
  if (word.endsWith("ましょう")) add(`${word.slice(0, -4)}ます`);
  if (word.endsWith("ませんか")) add(`${word.slice(0, -4)}ます`);
  if (word.endsWith("ました")) add(`${word.slice(0, -3)}ます`);
  if (word.endsWith("ません")) add(`${word.slice(0, -3)}ます`);
  if (word.endsWith("ないで")) add(`${word.slice(0, -3)}ます`);
  if (word.endsWith("られる")) add(word.slice(0, -3));
  if (word.endsWith("られた")) add(word.slice(0, -3));
  if (word.endsWith("させる")) add(word.slice(0, -3));
  if (word.endsWith("させた")) add(word.slice(0, -3));
  if (word.endsWith("すぎる")) add(word.slice(0, -3));
  if (word.endsWith("すぎた")) add(word.slice(0, -3));
  if (word.endsWith("がります")) add(word.slice(0, -4));
  if (word.endsWith("がった")) add(word.slice(0, -3));
  if (word.endsWith("くない")) add(`${word.slice(0, -3)}い`);
  if (word.endsWith("かった")) add(`${word.slice(0, -3)}い`);
  if (word.endsWith("ている")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("でいる")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("ていた")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("でいた")) add(`${word.slice(0, -3)}る`);
  if (word.endsWith("いた")) add(word.slice(0, -2));
  if (word.endsWith("いで")) add(word.slice(0, -2));
  if (word.endsWith("んだ")) add(word.slice(0, -2));
  if (word.endsWith("んで")) add(word.slice(0, -2));
  if (word.endsWith("って")) {
    const stem = word.slice(0, -2);
    // casual past of -u verbs
    candidates.push(`${stem}ります`);
    candidates.push(`${stem}います`);
    candidates.push(`${stem}ます`);
  }
  if (word.endsWith("った")) {
    const stem = word.slice(0, -2);
    candidates.push(`${stem}ります`);
    candidates.push(`${stem}く`);
    candidates.push(`${stem}ぐ`);
    candidates.push(`${stem}る`);
    candidates.push(`${stem}います`);
    candidates.push(`${stem}ます`);
  }
  if (word.endsWith("ず")) add(word.slice(0, -1));
  if (word.endsWith("て")) add(`${word.slice(0, -1)}ます`);
  if (word.endsWith("で")) add(`${word.slice(0, -1)}ます`);

  return candidates;
}

interface LookupResult {
  entry: VocabularyEntry;
  grammarPattern?: string;
  grammarExplanation?: string;
  dictionaryForm?: string;
}

/** 7-level lookup chain. Returns matched entry with optional grammar info. */
function lookupEntryFull(word: string): LookupResult | null {
  if (!word || word.trim() === "") return null;
  const normalWord = normalizeForMatch(word);
  const all = vocabularyData;

  // Level 1: exact match
  let found = all.find((e) => e.vocabulary === word);
  if (found) return { entry: found };

  // Level 2: normalized match (katakana→hiragana, lowercase)
  found = all.find((e) => normalizeForMatch(e.vocabulary) === normalWord);
  if (found) return { entry: found };

  // Level 3: romaji match
  found = all.find((e) => (e.romaji ?? "").toLowerCase().trim() === normalWord);
  if (found) return { entry: found };

  // Level 4: conjugation stripping
  const candidates = getConjugationCandidates(word);
  for (const candidate of candidates) {
    const nc = normalizeForMatch(candidate);
    found =
      all.find((e) => e.vocabulary === candidate) ??
      all.find((e) => normalizeForMatch(e.vocabulary) === nc) ??
      all.find((e) => (e.romaji ?? "").toLowerCase().trim() === nc);
    if (found) return { entry: found };
  }

  // Level 5: morphology engine V2 deInflect
  const deInflected = deInflect(word);
  for (const result of deInflected) {
    const df = result.dictionaryForm;
    const ndf = normalizeForMatch(df);
    found =
      all.find((e) => e.vocabulary === df) ??
      all.find((e) => normalizeForMatch(e.vocabulary) === ndf) ??
      all.find((e) => (e.romaji ?? "").toLowerCase().trim() === ndf);
    if (found) {
      return {
        entry: found,
        grammarPattern: result.grammarPattern,
        grammarExplanation: result.grammarExplanation,
        dictionaryForm: df,
      };
    }
  }

  // Level 6: prefix match
  found = all.find(
    (e) => e.vocabulary.length >= 2 && word.startsWith(e.vocabulary),
  );
  if (found) return { entry: found };

  // Level 7: fuzzy containment
  if (word.length >= 2) {
    found = all.find(
      (e) =>
        e.vocabulary.length >= 2 &&
        (e.vocabulary.includes(word) || word.includes(e.vocabulary)),
    );
    if (found) return { entry: found };
  }

  return null;
}

/** Backwards-compat wrapper returning just the entry */
function _lookupEntry(word: string): VocabularyEntry | null {
  return lookupEntryFull(word)?.entry ?? null;
}

/** Appends word to localStorage 'vocabAuditList' (deduplicated). */
/** Audit list item shape (new). Old entries may still be plain strings. */
interface AuditItem {
  word: string;
  timestamp: number;
  context: string;
  occurrences?: number;
}

/** Appends word to localStorage 'vocabAuditList' (deduplicated). Increments occurrences if exists. */
function addToAuditList(word: string): void {
  try {
    const raw = localStorage.getItem("vocabAuditList");
    const list: (AuditItem | string)[] = raw
      ? (JSON.parse(raw) as (AuditItem | string)[])
      : [];
    const existingIdx = list.findIndex((item) => {
      const w = typeof item === "string" ? item : item.word;
      return w === word;
    });
    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      if (typeof existing === "string") {
        list[existingIdx] = {
          word,
          timestamp: Date.now(),
          context: "reading",
          occurrences: 2,
        };
      } else {
        existing.occurrences = (existing.occurrences ?? 1) + 1;
      }
    } else {
      list.push({
        word,
        timestamp: Date.now(),
        context: "reading",
        occurrences: 1,
      });
    }
    localStorage.setItem("vocabAuditList", JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function VocabPopover({ word, children }: VocabPopoverProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [examples, setExamples] = useState<string[]>([]);
  const clickCountRef = useRef(0);

  const lookupResult = useMemo(() => lookupEntryFull(word), [word]);
  const entry = lookupResult?.entry ?? null;
  const grammarPattern = lookupResult?.grammarPattern;
  const grammarExplanation = lookupResult?.grammarExplanation;
  const dictionaryForm = lookupResult?.dictionaryForm;

  // Load example sentences when entry changes
  useMemo(() => {
    if (entry) {
      setExamples(findExampleSentences(entry.vocabulary || word, 2));
    } else {
      setExamples([]);
    }
  }, [entry, word]);

  const handleTriggerClick = useCallback(() => {
    clickCountRef.current += 1;
    updateWordLookup(word);
    if (entry) updateKanjiAnalytics(word);
    const kanjiChars = word.match(/[\u4e00-\u9fff]/g) ?? [];
    for (const ch of kanjiChars) {
      try {
        recordKanjiLookup(ch);
      } catch (_e) {}
    }
    if (clickCountRef.current === 1) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
      setDialogOpen(true);
      clickCountRef.current = 0;
    }
  }, [word, entry]);

  const handleUnderstood = useCallback(() => {
    updateWordLookup(word, "understood");
    setDialogOpen(false);
    clickCountRef.current = 0;
  }, [word]);

  const handleConfused = useCallback(() => {
    updateWordLookup(word, "confused");
    setDialogOpen(false);
    clickCountRef.current = 0;
  }, [word]);

  const handleReport = useCallback(() => {
    addToAuditList(word);
    setReported(true);
  }, [word]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="cursor-pointer underline underline-offset-4 decoration-dotted decoration-primary hover:text-primary transition-colors duration-150 rounded-sm bg-transparent border-0 p-0 font-inherit"
            onClick={handleTriggerClick}
            data-ocid="vocab.link"
          >
            {children}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3 shadow-lg"
          side="top"
          align="center"
        >
          {entry ? (
            <div className="space-y-2">
              <p className="text-lg font-bold text-primary">
                {entry.vocabulary}
              </p>
              <p className="text-sm text-foreground">{entry.meaning}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <Badge variant="outline" className="text-xs">
                  {entry.jlptLevel}
                </Badge>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => {
                    setPopoverOpen(false);
                    setDialogOpen(true);
                    clickCountRef.current = 0;
                  }}
                  data-ocid="vocab.detail_button"
                >
                  Lihat Detail &rarr;
                </Button>
              </div>
              {examples.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Contoh Kalimat:</p>
                  {examples.map((sentence) => (
                    <p key={sentence} className="text-sm text-gray-200 mb-1">
                      {sentence}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Kata belum tersedia.
              </p>
              <p className="text-xs italic text-muted-foreground">
                (kata: {word})
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs gap-1"
                onClick={() => {
                  handleReport();
                  setPopoverOpen(false);
                }}
                disabled={reported}
                data-ocid="vocab.report_button"
              >
                <Flag className="w-3 h-3" />
                {reported ? "Sudah Dilaporkan" : "Laporkan Kata"}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" data-ocid="vocab.dialog">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="text-2xl font-bold text-primary">
                {word}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mt-1 -mr-2"
                onClick={() => setDialogOpen(false)}
                aria-label="Tutup"
                data-ocid="vocab.close_button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {entry ? (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                    Kanji
                  </span>
                  <span className="text-xl font-bold">{entry.vocabulary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                    Romaji
                  </span>
                  <span className="text-base italic">{entry.romaji}</span>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                    Arti
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {entry.meaning}
                  </span>
                </div>
              </div>

              {grammarPattern && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Deteksi Grammar
                  </p>
                  {dictionaryForm && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">
                        Bentuk Dasar:
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {dictionaryForm}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      Grammar:
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {grammarPattern}
                    </span>
                  </div>
                  {grammarExplanation && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">
                        Penjelasan:
                      </span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {grammarExplanation}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{entry.jlptLevel}</Badge>
                <Badge variant="outline">{entry.wordType}</Badge>
                {entry.batchCode && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    {entry.batchCode}
                  </Badge>
                )}
              </div>

              {entry.explanation && (
                <div className="flex items-start gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">
                    {entry.explanation}
                  </p>
                </div>
              )}

              {examples.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Contoh Kalimat:</p>
                  {examples.map((sentence) => (
                    <p key={sentence} className="text-sm text-gray-200 mb-1">
                      {sentence}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  className="flex-1"
                  variant="default"
                  onClick={handleUnderstood}
                  data-ocid="vocab.understood_button"
                >
                  Sudah Paham
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant="outline"
                  onClick={handleConfused}
                  data-ocid="vocab.confused_button"
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  Masih Bingung
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-3xl">&#128218;</p>
              <p className="text-sm font-medium text-foreground">
                Kata belum tersedia.
              </p>
              <p className="text-xs italic text-muted-foreground">
                (kata: {word})
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleReport}
                disabled={reported}
                data-ocid="vocab.dialog_report_button"
              >
                <Flag className="w-3 h-3" />
                {reported ? "Sudah Dilaporkan" : "Laporkan Kata"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
