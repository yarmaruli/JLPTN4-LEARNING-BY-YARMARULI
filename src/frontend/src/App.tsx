import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2 } from "lucide-react";
import { useState } from "react";
import { BackupManager } from "./components/BackupManager";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import KanjiDashboard from "./components/KanjiDashboard";
import { KanjiList } from "./components/KanjiList";
import KanjiQuizSection from "./components/KanjiQuizSection";
import { KanjiWeaknessAnalyzer } from "./components/KanjiWeaknessAnalyzer";
import { QuizSection } from "./components/QuizSection";
import { RadicalGuidedQuiz } from "./components/RadicalGuidedQuiz";
import { RadicalSection } from "./components/RadicalSection";
import { ReadingSection } from "./components/ReadingSection";
import { SearchFilters } from "./components/SearchFilters";
import { VocabularyList } from "./components/VocabularyList";
import { getDataStatistics } from "./data/kanjiData";

function App() {
  const [activeTab, setActiveTab] = useState<string>("kanji");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJlptLevel, setSelectedJlptLevel] = useState<string | null>(
    null,
  );
  const [selectedWordType, setSelectedWordType] = useState<string | null>(null);
  const [selectedRadical, setSelectedRadical] = useState<string | null>(null);

  const stats = getDataStatistics();

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedJlptLevel(null);
    setSelectedWordType(null);
    setSelectedRadical(null);
  };

  const handleRadicalSelect = (radical: string) => {
    setSelectedRadical(radical);
    setActiveTab("kanji");
  };

  const handleRadicalSelectForVocab = (radical: string) => {
    setSelectedRadical(radical);
    setActiveTab("vocabulary");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-display">
            Kan-Ji-Kan
          </h1>
          <p className="text-center text-muted-foreground text-lg mb-4">
            Kuasai Kanji &amp; Kosakata JLPT N4 — Mode Offline Penuh
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {stats.totalKanji} Kanji
            </Badge>
            <Badge variant="outline" className="text-sm">
              {stats.totalVocabulary} Kosakata
            </Badge>
            <Badge variant="outline" className="text-sm">
              {stats.totalRadicals} Radikal
            </Badge>
            {stats.jlptLevels.map((level) => (
              <Badge key={level} variant="secondary" className="text-sm">
                {level}: {stats.kanjiByLevel[level]} kanji,{" "}
                {stats.vocabularyByLevel[level]} kosakata
              </Badge>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 h-auto p-2 mb-8">
            <TabsTrigger value="kanji-quiz" className="text-base py-3 px-4">
              Kanji Quiz
            </TabsTrigger>
            <TabsTrigger value="radical-quiz" className="text-base py-3 px-4">
              Radical Quiz
            </TabsTrigger>
            <TabsTrigger value="kanji" className="text-base py-3 px-4">
              Daftar Kanji
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="text-base py-3 px-4">
              Daftar Kosakata
            </TabsTrigger>
            <TabsTrigger value="radicals" className="text-base py-3 px-4">
              Info Radikal
            </TabsTrigger>
            <TabsTrigger value="reading" className="text-base py-3 px-4">
              Membaca
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-base py-3 px-4">
              Quiz
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-base py-3 px-4">
              Backup Data
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="text-base py-3 px-4 flex items-center gap-1.5"
            >
              <BarChart2 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanji" className="space-y-6">
            <SearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedJlptLevel={selectedJlptLevel}
              setSelectedJlptLevel={setSelectedJlptLevel}
              selectedWordType={selectedWordType}
              setSelectedWordType={setSelectedWordType}
              selectedRadical={selectedRadical}
              setSelectedRadical={setSelectedRadical}
              onReset={handleResetFilters}
            />

            <KanjiList
              searchTerm={searchTerm}
              jlptLevel={selectedJlptLevel}
              wordType={selectedWordType}
              radical={selectedRadical}
            />
            <KanjiWeaknessAnalyzer />
          </TabsContent>

          <TabsContent value="vocabulary" className="space-y-6">
            <SearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedJlptLevel={selectedJlptLevel}
              setSelectedJlptLevel={setSelectedJlptLevel}
              selectedWordType={selectedWordType}
              setSelectedWordType={setSelectedWordType}
              selectedRadical={selectedRadical}
              setSelectedRadical={setSelectedRadical}
              onReset={handleResetFilters}
            />

            <VocabularyList
              searchTerm={searchTerm}
              jlptLevel={selectedJlptLevel}
              wordType={selectedWordType}
              radical={selectedRadical}
            />
          </TabsContent>

          <TabsContent value="radicals">
            <RadicalSection
              onRadicalSelect={handleRadicalSelect}
              onRadicalSelectForVocab={handleRadicalSelectForVocab}
            />
          </TabsContent>
          <TabsContent value="reading">
            <ReadingSection />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizSection />
          </TabsContent>

          <TabsContent value="backup">
            <BackupManager />
          </TabsContent>

          <TabsContent value="dashboard">
            <KanjiDashboard
              onQuizKanji={() => setActiveTab("kanji-quiz")}
              onQuizRadical={() => setActiveTab("radical-quiz")}
            />
          </TabsContent>

          <TabsContent value="kanji-quiz">
            <KanjiQuizSection onClose={() => setActiveTab("kanji")} />
          </TabsContent>

          <TabsContent value="radical-quiz">
            <RadicalGuidedQuiz onViewRadical={() => setActiveTab("radicals")} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

export default App;
