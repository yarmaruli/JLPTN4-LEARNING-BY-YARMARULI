import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { kanjiData, vocabularyData } from "@/data/kanjiData";
import type { KanjiEntry, VocabularyEntry } from "@/data/kanjiData";
import type { MasteryData } from "@/lib/masteryEngine";
import type { KanjiStatEntry } from "@/lib/readingEngine";
import { BookOpen, ChevronDown, Dumbbell, Eye, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

interface WeakKanjiInfo {
  character: string;
  lookupCount: number;
  lastSeen: number;
  meaning: string;
  jlptLevel: string;
  relatedVocab: VocabularyEntry[];
  wrongCount: number;
  masteryLevel: number;
}

function loadKanjiStats(): Record<string, KanjiStatEntry> {
  try {
    const raw = localStorage.getItem("kanjiLookupStats");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, KanjiStatEntry>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function loadMasteryData(): MasteryData[] {
  try {
    const raw = localStorage.getItem("masteryData");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MasteryData[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getKanjiMeaning(character: string): {
  meaning: string;
  jlptLevel: string;
} {
  const entry = kanjiData.find((k) => k.character === character);
  return {
    meaning: entry?.meaning ?? "-",
    jlptLevel: entry?.jlptLevel ?? "N4",
  };
}

function getRelatedVocabulary(character: string, limit = 5): VocabularyEntry[] {
  return vocabularyData
    .filter((v) => v.vocabulary.includes(character))
    .slice(0, limit);
}

function extractKanjiFromWord(word: string): string[] {
  return [...word].filter(
    (ch) => ch.charCodeAt(0) >= 0x4e00 && ch.charCodeAt(0) <= 0x9fff,
  );
}

export function KanjiWeaknessAnalyzer() {
  const [isOpen, setIsOpen] = useState(true);

  const { topLookups, weakKanji, hasData } = useMemo(() => {
    const stats = loadKanjiStats();
    const mastery = loadMasteryData();

    // Build lookup-sorted list
    const lookupEntries = Object.entries(stats)
      .map(([character, stat]) => {
        const { meaning, jlptLevel } = getKanjiMeaning(character);
        return {
          character,
          lookupCount: stat.lookupCount ?? 0,
          lastSeen: stat.lastSeen ?? 0,
          meaning,
          jlptLevel,
          relatedVocab: getRelatedVocabulary(character, 5),
          wrongCount: 0,
          masteryLevel: 0,
        };
      })
      .sort((a, b) => b.lookupCount - a.lookupCount)
      .slice(0, 10);

    // Build weak kanji from mastery data
    const masteryMap = new Map<string, MasteryData>();
    for (const m of mastery) {
      masteryMap.set(m.itemId, m);
    }

    const weakKanjiMap = new Map<string, WeakKanjiInfo>();

    for (const vocab of vocabularyData) {
      const itemId = `vocab_${vocab.vocabulary}`;
      const m = masteryMap.get(itemId);
      if (!m) continue;
      // Weak if wrongCount > correctCount OR masteryLevel < 3 with at least 1 wrong
      const isWeak =
        m.wrongCount > m.correctCount ||
        (m.masteryLevel < 3 && m.wrongCount > 0);
      if (!isWeak) continue;

      const kanjis = extractKanjiFromWord(vocab.vocabulary);
      for (const character of kanjis) {
        const existing = weakKanjiMap.get(character);
        const { meaning, jlptLevel } = getKanjiMeaning(character);
        if (existing) {
          existing.wrongCount += m.wrongCount;
          existing.masteryLevel = Math.min(
            existing.masteryLevel,
            m.masteryLevel,
          );
        } else {
          const stat = stats[character];
          weakKanjiMap.set(character, {
            character,
            lookupCount: stat?.lookupCount ?? 0,
            lastSeen: stat?.lastSeen ?? 0,
            meaning,
            jlptLevel,
            relatedVocab: getRelatedVocabulary(character, 5),
            wrongCount: m.wrongCount,
            masteryLevel: m.masteryLevel,
          });
        }
      }
    }

    // Also include kanji with high lookup counts as weak if they have low mastery
    for (const [character, stat] of Object.entries(stats)) {
      if ((stat.lookupCount ?? 0) >= 5) {
        const existing = weakKanjiMap.get(character);
        if (!existing) {
          const { meaning, jlptLevel } = getKanjiMeaning(character);
          weakKanjiMap.set(character, {
            character,
            lookupCount: stat.lookupCount,
            lastSeen: stat.lastSeen ?? 0,
            meaning,
            jlptLevel,
            relatedVocab: getRelatedVocabulary(character, 5),
            wrongCount: 0,
            masteryLevel: 0,
          });
        }
      }
    }

    const weakList = Array.from(weakKanjiMap.values()).sort(
      (a, b) => b.wrongCount - a.wrongCount || b.lookupCount - a.lookupCount,
    );

    const hasData = lookupEntries.length > 0 || weakList.length > 0;

    return { topLookups: lookupEntries, weakKanji: weakList, hasData };
  }, []);

  const handlePractice = (character: string) => {
    // Filter vocabulary containing this kanji and alert for now
    const related = vocabularyData.filter((v) =>
      v.vocabulary.includes(character),
    );
    if (related.length > 0) {
      alert(
        `Latih kanji 「${character}」 dengan ${related.length} kosakata terkait. Fitur quiz filter akan segera hadir!`,
      );
    } else {
      alert(`Tidak ada kosakata terkait untuk 「${character}」.`);
    }
  };

  if (!hasData) {
    return (
      <Alert
        className="max-w-3xl mx-auto mt-8"
        data-ocid="kanji.weakness.empty_state"
      >
        <BookOpen className="h-5 w-5" />
        <AlertDescription className="ml-2">
          Mulai membaca dan mengerjakan quiz untuk melihat analisis kanji Anda.
          Data akan muncul setelah Anda mengklik kosakata saat membaca atau
          menjawab quiz.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mt-8 space-y-6"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2"
          data-ocid="kanji.weakness.toggle_button"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Analisis Kanji Lemah
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-8">
        {/* Top Lookups */}
        {topLookups.length > 0 && (
          <section data-ocid="kanji.weakness.top_lookups.section">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Kanji Sering Dibuka</h2>
              <Badge variant="secondary">{topLookups.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topLookups.map((k, idx) => (
                <Card
                  key={k.character}
                  className="hover:shadow-md transition-shadow"
                  data-ocid={`kanji.weakness.top_lookup.item.${idx + 1}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-4xl font-bold text-primary">
                        {k.character}
                      </CardTitle>
                      <Badge variant="outline">{k.jlptLevel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm font-medium">{k.meaning}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      Dibuka {k.lookupCount} kali
                    </div>
                    {k.relatedVocab.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          Kosakata terkait:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {k.relatedVocab.map((v) => (
                            <Badge
                              key={v.vocabulary}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {v.vocabulary}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Weak Kanji */}
        {weakKanji.length > 0 && (
          <section data-ocid="kanji.weakness.weak_kanji.section">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-bold">Kanji Perlu Latihan</h2>
              <Badge variant="secondary">{weakKanji.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weakKanji.map((k, idx) => (
                <Card
                  key={k.character}
                  className="hover:shadow-md transition-shadow border-destructive/30"
                  data-ocid={`kanji.weakness.weak_kanji.item.${idx + 1}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-4xl font-bold text-destructive">
                        {k.character}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{k.jlptLevel}</Badge>
                        {k.wrongCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {k.wrongCount} salah
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm font-medium">{k.meaning}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {k.lookupCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {k.lookupCount}x dibuka
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Mastery {k.masteryLevel}/5
                      </span>
                    </div>
                    {k.relatedVocab.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          Kosakata terkait:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {k.relatedVocab.map((v) => (
                            <Badge
                              key={v.vocabulary}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {v.vocabulary}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handlePractice(k.character)}
                      data-ocid={`kanji.weakness.practice_button.${idx + 1}`}
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Latih Sekarang
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
