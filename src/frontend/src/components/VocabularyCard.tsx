import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpen, Languages, Sparkles } from "lucide-react";
import type { VocabularyEntry } from "../data/kanjiData";

interface VocabularyCardProps {
  vocabulary: VocabularyEntry;
}

export function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-4xl font-bold text-primary mb-2">
              {vocabulary.vocabulary}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="w-4 h-4" />
              <span className="font-medium">{vocabulary.romaji}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {vocabulary.radical}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {vocabulary.jlptLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-base font-semibold text-foreground">
            {vocabulary.meaning}
          </p>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground">{vocabulary.wordType}</span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            {vocabulary.explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
