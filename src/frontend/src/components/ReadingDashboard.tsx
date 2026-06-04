/**
 * ReadingDashboard.tsx
 * Analytics dashboard showing reading history.
 * Reads directly from localStorage 'readingAnalytics' and 'readingWordLookups'.
 */
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadReadingAnalytics, loadWordLookups } from "@/lib/readingEngine";
import { BarChart3, BookOpen, Clock, Star, TrendingUp } from "lucide-react";

const MODE_LABELS: Record<string, string> = {
  learning: "Belajar Membaca",
  jlpt: "JLPT Reading",
  adaptive: "Adaptif",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}d`;
  return `${m}m ${s}d`;
}

export function ReadingDashboard() {
  const analytics = loadReadingAnalytics();
  const lookups = loadWordLookups();

  const avgScore =
    analytics.totalSessions > 0
      ? Math.round(analytics.totalScore / analytics.totalSessions)
      : 0;
  const avgTime =
    analytics.totalSessions > 0
      ? Math.round(analytics.totalTime / analytics.totalSessions)
      : 0;

  const topWords = Object.entries(lookups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const recentSessions = analytics.sessions.slice(0, 5);

  if (analytics.totalSessions === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center space-y-4"
        data-ocid="reading_dashboard.empty_state"
      >
        <div className="rounded-full bg-muted/60 p-6">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-lg text-foreground">
            Belum ada sesi membaca
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai salah satu mode membaca untuk melihat statistik kamu di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="reading_dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card data-ocid="reading_dashboard.total_sessions">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Sesi</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {analytics.totalSessions}
            </p>
          </CardContent>
        </Card>

        <Card data-ocid="reading_dashboard.avg_score">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">
                Skor Rata-rata
              </span>
            </div>
            <p className="text-2xl font-bold text-accent">{avgScore}%</p>
          </CardContent>
        </Card>

        <Card data-ocid="reading_dashboard.avg_time">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Waktu Rata-rata
              </span>
            </div>
            <p className="text-2xl font-bold">{formatTime(avgTime)}</p>
          </CardContent>
        </Card>

        <Card data-ocid="reading_dashboard.level">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Level</span>
            </div>
            <p className="text-base font-bold">
              Belajar: L{analytics.currentLevelLearning}
            </p>
            <p className="text-xs text-muted-foreground">
              JLPT: L{analytics.currentLevelJlpt}
            </p>
          </CardContent>
        </Card>
      </div>

      {topWords.length > 0 && (
        <Card data-ocid="reading_dashboard.word_lookups">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Kosakata Paling Sering Dicari
            </CardTitle>
            <CardDescription className="text-xs">
              Kata yang sering dicari mungkin belum dikuasai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topWords.map(([word, count], i) => (
                <div
                  key={word}
                  className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1"
                  data-ocid={`reading_dashboard.word.${i + 1}`}
                >
                  <span className="text-sm font-semibold text-primary">
                    {word}
                  </span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {count}x
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentSessions.length > 0 && (
        <Card data-ocid="reading_dashboard.recent_sessions">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sesi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.map((session, i) => (
              <div key={`${session.passageId}-${session.date}`}>
                {i > 0 && <Separator className="mb-3" />}
                <div
                  className="flex items-center justify-between gap-4"
                  data-ocid={`reading_dashboard.session.${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted/60 p-2">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {MODE_LABELS[session.mode] ?? session.mode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {session.level} &bull; {formatDate(session.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        session.score >= 80
                          ? "text-green-600 dark:text-green-400"
                          : session.score >= 60
                            ? "text-accent"
                            : "text-destructive"
                      }`}
                    >
                      {session.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(session.timeSeconds)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
