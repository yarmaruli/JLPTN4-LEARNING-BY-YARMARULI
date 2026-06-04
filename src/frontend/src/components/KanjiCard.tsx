import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Languages, Sparkles } from "lucide-react";
import { useState } from "react";
import type { KanjiEntry } from "../data/kanjiData";

interface KanjiCardProps {
  kanji: KanjiEntry;
}

export function KanjiCard({ kanji }: KanjiCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-6xl font-bold text-primary group-hover:scale-110 transition-transform">
              {kanji.character}
            </div>

            <div className="text-center space-y-2 w-full">
              <p className="text-sm text-muted-foreground font-medium">
                {kanji.romaji}
              </p>
              <p className="text-base font-semibold">{kanji.meaning}</p>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant="secondary" className="text-xs">
                {kanji.radical}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {kanji.jlptLevel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-6xl font-bold text-primary">
                {kanji.character}
              </DialogTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{kanji.radical}</Badge>
                <Badge variant="outline">{kanji.jlptLevel}</Badge>
              </div>
            </div>
            <DialogDescription className="text-base">
              {kanji.meaning}
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
              <p className="text-lg font-semibold">{kanji.romaji}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Jenis Kata
                </p>
              </div>
              <p className="text-base">{kanji.wordType}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Penjelasan
                </p>
              </div>
              <p className="text-sm leading-relaxed">{kanji.explanation}</p>
            </div>

            {kanji.similarKanji && kanji.similarKanji.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Kanji Serupa
                </p>
                <div className="flex gap-3 flex-wrap">
                  {kanji.similarKanji.map((similar) => (
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
        </DialogContent>
      </Dialog>
    </>
  );
}
