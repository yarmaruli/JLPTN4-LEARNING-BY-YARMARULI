// Quiz History Management Utility
export interface QuizSession {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: {
    kanji: string;
    type: "meaning" | "reading";
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface QuizStatistics {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number;
  bestScore: number;
  recentSessions: QuizSession[];
}

const QUIZ_HISTORY_KEY = "kanji-n4-quiz-history";
const MAX_STORED_SESSIONS = 50;

export function saveQuizSession(session: QuizSession): void {
  try {
    const history = getQuizHistory();
    history.unshift(session);

    // Keep only the most recent sessions
    const trimmedHistory = history.slice(0, MAX_STORED_SESSIONS);

    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to save quiz session:", error);
  }
}

export function getQuizHistory(): QuizSession[] {
  try {
    const stored = localStorage.getItem(QUIZ_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load quiz history:", error);
    return [];
  }
}

export function getQuizStatistics(): QuizStatistics {
  const history = getQuizHistory();

  if (history.length === 0) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      averageScore: 0,
      bestScore: 0,
      recentSessions: [],
    };
  }

  const totalSessions = history.length;
  const totalQuestions = history.reduce(
    (sum, session) => sum + session.totalQuestions,
    0,
  );
  const totalCorrect = history.reduce((sum, session) => sum + session.score, 0);
  const averageScore =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const bestScore = Math.max(...history.map((s) => s.percentage));

  return {
    totalSessions,
    totalQuestions,
    totalCorrect,
    averageScore,
    bestScore,
    recentSessions: history.slice(0, 10),
  };
}

export function clearQuizHistory(): void {
  try {
    localStorage.removeItem(QUIZ_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear quiz history:", error);
  }
}

export function importQuizHistory(sessions: QuizSession[]): void {
  try {
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to import quiz history:", error);
    throw error;
  }
}
