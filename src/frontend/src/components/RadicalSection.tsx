import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Languages, Sparkles, WifiOff } from "lucide-react";
import { useState } from "react";
import {
  useGetAllRadicals,
  useGetKanjiByCharacter,
  useGetRadicalInfo,
  useGetVocabularyByWord,
} from "../hooks/useQueries";

interface RadicalSectionProps {
  onRadicalSelect: (radical: string) => void;
  onRadicalSelectForVocab: (radical: string) => void;
}

export function RadicalSection({
  onRadicalSelect,
  onRadicalSelectForVocab,
}: RadicalSectionProps) {
  const { data: radicals = [] } = useGetAllRadicals();
  const [selectedRadicalName, setSelectedRadicalName] = useState<string | null>(
    null,
  );
  const { data: radicalInfo } = useGetRadicalInfo(selectedRadicalName || "");
  const [selectedKanjiChar, setSelectedKanjiChar] = useState<string | null>(
    null,
  );
  const [selectedVocabWord, setSelectedVocabWord] = useState<string | null>(
    null,
  );
  const { data: selectedKanji } = useGetKanjiByCharacter(
    selectedKanjiChar || "",
  );
  const { data: selectedVocab } = useGetVocabularyByWord(
    selectedVocabWord || "",
  );

  if (radicals.length === 0) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <BookOpen className="h-5 w-5" />
        <AlertDescription className="ml-2">
          Belum ada data radikal yang tersedia.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Badge variant="outline" className="gap-2">
          <WifiOff className="h-3 w-3" />
          Mode Offline
        </Badge>
      </div>

      {/* Radical Explanation Section */}
      {selectedRadicalName && radicalInfo && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-5xl mb-3">
                  {radicalInfo.name}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-sm">
                    {radicalInfo.kanjiList.length} kanji
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {radicalInfo.vocabularyList.length} kosakata
                  </Badge>
                </div>
              </div>
              <img
                src="/assets/generated/radical-icon-transparent.dim_48x48.png"
                alt="Radical"
                className="w-12 h-12"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Asal Usul
              </p>
              <p className="text-sm leading-relaxed">{radicalInfo.origin}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Makna
              </p>
              <p className="text-sm leading-relaxed">{radicalInfo.meaning}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Konsep Terkait
              </p>
              <p className="text-sm leading-relaxed">
                {radicalInfo.relatedConcepts}
              </p>
            </div>

            <Tabs defaultValue="kanji" className="pt-4 border-t">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kanji">
                  Kanji ({radicalInfo.kanjiList.length})
                </TabsTrigger>
                <TabsTrigger value="vocabulary">
                  Kosakata ({radicalInfo.vocabularyList.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanji" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Kanji yang menggunakan radikal{" "}
                    <span className="font-semibold text-foreground text-lg">
                      {radicalInfo.name}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRadicalSelect(radicalInfo.name);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Lihat di Daftar Kanji
                  </Button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {radicalInfo.kanjiList.map((kanji) => (
                    <button
                      type="button"
                      key={kanji}
                      onClick={() => setSelectedKanjiChar(kanji)}
                      className="aspect-square flex items-center justify-center bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                    >
                      <span className="text-3xl font-bold group-hover:scale-110 transition-transform">
                        {kanji}
                      </span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vocabulary" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Kosakata yang menggunakan radikal{" "}
                    <span className="font-semibold text-foreground text-lg">
                      {radicalInfo.name}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRadicalSelectForVocab(radicalInfo.name);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Lihat di Daftar Kosakata
                  </Button>
                </div>

                {radicalInfo.vocabularyList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {radicalInfo.vocabularyList.map((vocab) => (
                      <button
                        type="button"
                        key={vocab}
                        onClick={() => setSelectedVocabWord(vocab)}
                        className="p-3 flex items-center justify-center bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                      >
                        <span className="text-xl font-bold group-hover:scale-110 transition-transform">
                          {vocab}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada kosakata untuk radikal ini
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Radical Selection List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src="/assets/generated/radical-icon-transparent.dim_48x48.png"
              alt="Radical"
              className="w-6 h-6"
            />
            Pilih Radikal untuk Melihat Penjelasan
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {radicals.length} radikal tersedia - Klik untuk melihat detail
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {radicals.map((radical) => (
                <button
                  type="button"
                  key={radical.name}
                  onClick={() => {
                    setSelectedRadicalName(radical.name);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`p-5 rounded-lg border transition-all ${
                    selectedRadicalName === radical.name
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-card hover:bg-accent border-border hover:border-primary/50 hover:scale-105"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-bold text-4xl">{radical.name}</p>
                    <div className="flex gap-1 text-xs opacity-80">
                      <span>{radical.kanjiList.length}K</span>
                      <span>•</span>
                      <span>{radical.vocabularyList.length}V</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {!selectedRadicalName && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4 p-8">
              <img
                src="/assets/generated/radical-icon-transparent.dim_48x48.png"
                alt="Radical"
                className="w-16 h-16 mx-auto opacity-50"
              />
              <div>
                <p className="text-lg font-medium mb-2">Pilih Radikal</p>
                <p className="text-sm text-muted-foreground">
                  Pilih radikal dari daftar di atas untuk melihat informasi
                  detail, asal usul, dan daftar kanji serta kosakata terkait
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanji Detail Modal */}
      <Dialog
        open={!!selectedKanjiChar}
        onOpenChange={(open) => !open && setSelectedKanjiChar(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedKanji && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-6xl font-bold text-primary">
                    {selectedKanji.character}
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedKanji.radical}</Badge>
                    <Badge variant="outline">{selectedKanji.jlptLevel}</Badge>
                  </div>
                </div>
                <DialogDescription className="text-base">
                  {selectedKanji.meaning}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Romaji
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedKanji.romaji}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Jenis Kata
                    </p>
                  </div>
                  <p className="text-base">{selectedKanji.wordType}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Penjelasan
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {selectedKanji.explanation}
                  </p>
                </div>

                {selectedKanji.similarKanji &&
                  selectedKanji.similarKanji.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Kanji Serupa
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {selectedKanji.similarKanji.map((similar) => (
                          <div
                            key={similar}
                            className="w-12 h-12 flex items-center justify-center bg-background border border-border rounded-lg text-2xl font-bold hover:border-primary transition-colors"
                          >
                            {similar}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Vocabulary Detail Modal */}
      <Dialog
        open={!!selectedVocabWord}
        onOpenChange={(open) => !open && setSelectedVocabWord(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVocab && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-6xl font-bold text-primary">
                    {selectedVocab.vocabulary}
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedVocab.radical}</Badge>
                    <Badge variant="outline">{selectedVocab.jlptLevel}</Badge>
                  </div>
                </div>
                <DialogDescription className="text-base">
                  {selectedVocab.meaning}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Romaji
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedVocab.romaji}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Jenis Kata
                    </p>
                  </div>
                  <p className="text-base">{selectedVocab.wordType}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Penjelasan
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {selectedVocab.explanation}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
