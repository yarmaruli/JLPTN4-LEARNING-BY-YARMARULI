import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BookX, WifiOff } from "lucide-react";
import { useGetAllKanji } from "../hooks/useQueries";
import { KanjiCard } from "./KanjiCard";

interface KanjiListProps {
  searchTerm: string;
  jlptLevel: string | null;
  wordType: string | null;
  radical: string | null;
}

export function KanjiList({
  searchTerm,
  jlptLevel,
  wordType,
  radical,
}: KanjiListProps) {
  const { data: kanjiList } = useGetAllKanji(
    searchTerm,
    jlptLevel,
    wordType,
    radical,
  );

  if (!kanjiList || kanjiList.length === 0) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <BookX className="h-5 w-5" />
        <AlertDescription className="ml-2">
          Tidak ada kanji yang ditemukan. Coba ubah filter atau kata kunci
          pencarian Anda.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {kanjiList.length}
          </span>{" "}
          kanji
        </p>
        <Badge variant="outline" className="gap-2">
          <WifiOff className="h-3 w-3" />
          Mode Offline
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kanjiList.map((kanji) => (
          <KanjiCard key={kanji.character} kanji={kanji} />
        ))}
      </div>
    </div>
  );
}
