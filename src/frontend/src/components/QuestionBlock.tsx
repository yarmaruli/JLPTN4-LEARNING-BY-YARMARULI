/**
 * QuestionBlock.tsx
 * Displays comprehension questions all at once with radio button options.
 * On submit: shows results (correct = green, wrong = red), then 'Lanjut' button.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronRight, XCircle } from "lucide-react";
import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  answer: number;
  hint?: string;
}

interface QuestionBlockProps {
  questions: Question[];
  onComplete: (score: number, timeSeconds: number) => void;
  startTime: Date;
}

type Phase = "answering" | "reviewing";

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuestionBlock({
  questions,
  onComplete,
  startTime,
}: QuestionBlockProps) {
  const [selected, setSelected] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [phase, setPhase] = useState<Phase>("answering");
  const [score, setScore] = useState(0);

  const allAnswered = selected.every((s) => s !== null);

  const handleSelect = (qi: number, oi: number) => {
    if (phase === "reviewing") return;
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = selected.filter((s, i) => s === questions[i].answer).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setPhase("reviewing");
  };

  const handleContinue = () => {
    const elapsed = Math.round((Date.now() - startTime.getTime()) / 1000);
    onComplete(score, elapsed);
  };

  const answeredCount = selected.filter((s) => s !== null).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="space-y-6" data-ocid="question_block">
      {/* Progress header */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {questions.length} soal dijawab
        </span>
        <div className="flex-1 max-w-xs">
          <Progress value={progressPct} className="h-2" />
        </div>
        {phase === "reviewing" && (
          <Badge
            className={
              score >= 80
                ? "bg-primary"
                : score >= 60
                  ? "bg-accent"
                  : "bg-destructive"
            }
          >
            Skor: {score}%
          </Badge>
        )}
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const userChoice = selected[qi];
        const isCorrect = userChoice === q.answer;

        return (
          <Card
            // biome-ignore lint/suspicious/noArrayIndexKey: static question list
            key={`q-${qi}`}
            className={`transition-all ${
              phase === "reviewing"
                ? isCorrect
                  ? "border-green-500/60 bg-green-50/30 dark:bg-green-900/10"
                  : userChoice !== null
                    ? "border-destructive/60 bg-red-50/30 dark:bg-red-900/10"
                    : ""
                : ""
            }`}
            data-ocid={`question_block.item.${qi + 1}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-start gap-3">
                <span className="text-muted-foreground text-sm mt-0.5 shrink-0">
                  {qi + 1}.
                </span>
                <span>{q.question}</span>
                {phase === "reviewing" && (
                  <span className="ml-auto shrink-0">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : userChoice !== null ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : null}
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = userChoice === oi;
                const isAnswer = oi === q.answer;

                let optClass =
                  "flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-all cursor-pointer text-sm ";

                if (phase === "answering") {
                  optClass += isSelected
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-muted/50";
                } else {
                  if (isAnswer) {
                    optClass +=
                      "border-green-500 bg-green-50/60 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium";
                  } else if (isSelected && !isAnswer) {
                    optClass +=
                      "border-destructive bg-red-50/60 dark:bg-red-900/20 text-destructive font-medium";
                  } else {
                    optClass += "border-border opacity-50 cursor-default";
                  }
                }

                return (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: static options list
                    key={`opt-${qi}-${oi}`}
                    type="button"
                    className={optClass}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={phase === "reviewing"}
                    data-ocid={`question_block.option.${qi + 1}.${oi + 1}`}
                  >
                    <span className="font-bold text-muted-foreground shrink-0 w-5">
                      {OPTION_LABELS[oi]}.
                    </span>
                    <span>{opt}</span>
                    {phase === "reviewing" && isAnswer && (
                      <CheckCircle className="ml-auto w-4 h-4 text-green-500 shrink-0" />
                    )}
                    {phase === "reviewing" && isSelected && !isAnswer && (
                      <XCircle className="ml-auto w-4 h-4 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}

              {phase === "reviewing" && !isCorrect && q.hint && (
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Petunjuk: {q.hint}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Action buttons */}
      {phase === "answering" ? (
        <Button
          type="button"
          className="w-full"
          disabled={!allAnswered}
          onClick={handleSubmit}
          data-ocid="question_block.submit_button"
        >
          Periksa Jawaban
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/40 p-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">Hasil</p>
            <p
              className={`text-3xl font-bold ${
                score >= 80
                  ? "text-green-600 dark:text-green-400"
                  : score >= 60
                    ? "text-accent"
                    : "text-destructive"
              }`}
            >
              {score}%
            </p>
            <p className="text-xs text-muted-foreground">
              {score >= 80
                ? "Bagus! Level kamu mungkin naik."
                : score >= 60
                  ? "Lumayan! Terus berlatih."
                  : "Perlu lebih banyak latihan."}
            </p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={handleContinue}
            data-ocid="question_block.continue_button"
          >
            Lanjut <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
