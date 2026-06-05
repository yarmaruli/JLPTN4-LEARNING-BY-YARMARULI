/**
 * RadicalGuidedQuiz.tsx
 * Radical Guided Kanji Quiz — user picks the correct kanji given a radical.
 * Also exports RadicalQuiz (5-question session tracker).
 */

import { kanjiData, radicalData, vocabularyData } from "@/data/kanjiData";
import type { KanjiEntry, RadicalInfo } from "@/data/kanjiData";
import { updateMasteryItem } from "@/lib/masteryEngine";
import { READING_PASSAGES } from "@/lib/readingPassages";
import { useCallback, useMemo, useState } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract the radical symbol (first character) from names like "水 (mizu)" */
function getRadicalSymbol(radical: RadicalInfo): string {
  return radical.name.charAt(0);
}

/** Shuffle array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Record radical mastery via updateMasteryItem — safe with optional chaining */
function recordRadicalSeen(radicalId: string): void {
  try {
    updateMasteryItem?.(`radical:${radicalId}`, true);
  } catch (_) {
    /* safe */
  }
}

function recordRadicalCorrect(radicalId: string): void {
  try {
    updateMasteryItem?.(`radical:${radicalId}`, true);
  } catch (_) {
    /* safe */
  }
}

function recordRadicalWrong(radicalId: string): void {
  try {
    updateMasteryItem?.(`radical:${radicalId}`, false);
  } catch (_) {
    /* safe */
  }
}

/** Find a KanjiEntry by kanji character */
function findKanjiEntry(char: string): KanjiEntry | undefined {
  return kanjiData.find((k) => k.character === char);
}

/** Find first vocabulary whose word includes this kanji */
function findExampleVocab(kanjiChar: string) {
  return vocabularyData.find((v) => v.vocabulary.includes(kanjiChar)) ?? null;
}

/** Build one quiz question based on current level */
function buildQuestion(
  radical: RadicalInfo,
  allRadicals: RadicalInfo[],
  level: number,
): Question | null {
  const symbol = getRadicalSymbol(radical);

  switch (level) {
    case 1: {
      // Level 1: Radikal → Kanji (existing logic)
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length === 0) return null;
      const correctChar =
        ownCandidates[Math.floor(Math.random() * ownCandidates.length)];
      const correctEntry = findKanjiEntry(correctChar)!;

      const wrongPool = allRadicals
        .filter((r) => getRadicalSymbol(r) !== symbol)
        .flatMap((r) => r.kanjiList)
        .filter((k) => k !== correctChar && findKanjiEntry(k));

      const wrongChars = shuffle(wrongPool).slice(0, 3);
      if (wrongChars.length < 3) return null;

      const choices = shuffle([
        { char: correctChar, isCorrect: true, entry: correctEntry },
        ...wrongChars.map((c) => ({
          char: c,
          isCorrect: false,
          entry: findKanjiEntry(c)!,
        })),
      ]);

      return {
        radical,
        symbol,
        level: 1,
        type: "single",
        correctChar,
        correctEntry,
        choices,
        instruction: "Pilih kanji yang menggunakan radikal di atas:",
      };
    }

    case 2: {
      // Level 2: Kanji → Radikal
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length === 0) return null;
      const correctChar =
        ownCandidates[Math.floor(Math.random() * ownCandidates.length)];
      const correctEntry = findKanjiEntry(correctChar)!;

      const wrongRadicals = shuffle(
        allRadicals.filter((r) => getRadicalSymbol(r) !== symbol),
      ).slice(0, 3);
      if (wrongRadicals.length < 3) return null;

      const choices = shuffle([
        { char: symbol, isCorrect: true, entry: correctEntry },
        ...wrongRadicals.map((r) => ({
          char: getRadicalSymbol(r),
          isCorrect: false,
          entry: findKanjiEntry(r.kanjiList[0]) ?? correctEntry,
        })),
      ]);

      return {
        radical,
        symbol,
        level: 2,
        type: "single",
        correctChar: symbol,
        correctEntry,
        choices,
        instruction: `Kanji "${correctChar}" (${correctEntry.meaning}) menggunakan radikal mana?`,
      };
    }

    case 3: {
      // Level 3: Radikal → Vocabulary
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length === 0) return null;
      const correctChar =
        ownCandidates[Math.floor(Math.random() * ownCandidates.length)];
      const correctEntry = findKanjiEntry(correctChar)!;

      const example = findExampleVocab(correctChar);
      if (!example) return null;

      const wrongPool = allRadicals
        .filter((r) => getRadicalSymbol(r) !== symbol)
        .flatMap((r) => r.kanjiList)
        .filter((k) => k !== correctChar && findKanjiEntry(k));

      const wrongChars = shuffle(wrongPool).slice(0, 3);
      if (wrongChars.length < 3) return null;

      const choices = shuffle([
        { char: example.vocabulary, isCorrect: true, entry: correctEntry },
        ...wrongChars.map((c) => {
          const ex = findExampleVocab(c);
          return {
            char: ex?.vocabulary ?? c,
            isCorrect: false,
            entry: findKanjiEntry(c)!,
          };
        }),
      ]);

      return {
        radical,
        symbol,
        level: 3,
        type: "single",
        correctChar: example.vocabulary,
        correctEntry,
        choices,
        instruction: `Radikal ${symbol} (${radical.meaning}) — pilih kosakata yang paling terkait:`,
      };
    }

    case 4: {
      // Level 4: Odd One Out
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length < 3) return null;
      const shuffledOwn = shuffle(ownCandidates);
      const sameRadicalChars = shuffledOwn.slice(0, 3);
      const correctChar = sameRadicalChars[0];
      const correctEntry = findKanjiEntry(correctChar)!;

      const wrongRadicals = allRadicals.filter(
        (r) => getRadicalSymbol(r) !== symbol,
      );
      if (wrongRadicals.length === 0) return null;
      const wrongRadical =
        wrongRadicals[Math.floor(Math.random() * wrongRadicals.length)];
      const wrongCandidates = wrongRadical.kanjiList.filter((k) =>
        findKanjiEntry(k),
      );
      if (wrongCandidates.length === 0) return null;
      const wrongChar =
        wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)];
      const wrongEntry = findKanjiEntry(wrongChar)!;

      const choices = shuffle([
        { char: correctChar, isCorrect: true, entry: correctEntry },
        ...sameRadicalChars.slice(1).map((c) => ({
          char: c,
          isCorrect: false,
          entry: findKanjiEntry(c)!,
        })),
        { char: wrongChar, isCorrect: false, entry: wrongEntry },
      ]);

      return {
        radical,
        symbol,
        level: 4,
        type: "single",
        correctChar,
        correctEntry,
        choices,
        instruction: `Cari kanji yang BERBEDA — tidak menggunakan radikal ${symbol} (${radical.meaning}):`,
      };
    }

    case 5: {
      // Level 5: Same Radical Vocabulary (multi-select)
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length < 4) return null;
      const shuffledOwn = shuffle(ownCandidates).slice(0, 4);
      const correctChars = shuffledOwn.map((c) => {
        const ex = findExampleVocab(c);
        return ex?.vocabulary ?? c;
      });

      const wrongPool = allRadicals
        .filter((r) => getRadicalSymbol(r) !== symbol)
        .flatMap((r) => r.kanjiList)
        .filter((k) => findKanjiEntry(k));
      const wrongChars = shuffle(wrongPool).slice(0, 4);
      if (wrongChars.length < 4) return null;

      const allOptions = shuffle([
        ...shuffledOwn.map((c) => {
          const ex = findExampleVocab(c);
          return {
            char: ex?.vocabulary ?? c,
            isCorrect: true,
            entry: findKanjiEntry(c)!,
          };
        }),
        ...wrongChars.map((c) => {
          const ex = findExampleVocab(c);
          return {
            char: ex?.vocabulary ?? c,
            isCorrect: false,
            entry: findKanjiEntry(c)!,
          };
        }),
      ]);

      return {
        radical,
        symbol,
        level: 5,
        type: "multi",
        correctChars,
        allOptions,
        instruction: `Pilih 3 kosakata yang memiliki radikal ${symbol} (${radical.meaning}):`,
      };
    }

    case 6: {
      // Level 6: Reading Context
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length === 0) return null;
      const correctChar =
        ownCandidates[Math.floor(Math.random() * ownCandidates.length)];
      const correctEntry = findKanjiEntry(correctChar)!;

      const example = findExampleVocab(correctChar);
      if (!example) return null;

      // Build a simple sentence using the vocabulary
      const sentence = `${example.vocabulary}があります。`;

      const wrongPool = allRadicals
        .filter((r) => getRadicalSymbol(r) !== symbol)
        .flatMap((r) => r.kanjiList)
        .filter((k) => k !== correctChar && findKanjiEntry(k));

      const wrongChars = shuffle(wrongPool).slice(0, 3);
      if (wrongChars.length < 3) return null;

      const choices = shuffle([
        { char: example.vocabulary, isCorrect: true, entry: correctEntry },
        ...wrongChars.map((c) => {
          const ex = findExampleVocab(c);
          return {
            char: ex?.vocabulary ?? c,
            isCorrect: false,
            entry: findKanjiEntry(c)!,
          };
        }),
      ]);

      return {
        radical,
        symbol,
        level: 6,
        type: "sentence",
        correctChar: example.vocabulary,
        correctEntry,
        choices,
        sentence,
        instruction: `Kalimat berikut mengandung radikal ${symbol} (${radical.meaning}). Kata mana yang menggunakan radikal tersebut?`,
      };
    }

    case 7: {
      // Level 7: Dokkai Based
      const ownCandidates = radical.kanjiList.filter((k) => findKanjiEntry(k));
      if (ownCandidates.length === 0) return null;
      const correctChar =
        ownCandidates[Math.floor(Math.random() * ownCandidates.length)];
      const correctEntry = findKanjiEntry(correctChar)!;

      const example = findExampleVocab(correctChar);
      if (!example) return null;

      // Use a reading passage or create a short paragraph
      const passage =
        READING_PASSAGES.length > 0
          ? READING_PASSAGES[
              Math.floor(Math.random() * READING_PASSAGES.length)
            ].sentences.join(" ")
          : `${example.vocabulary}はとても大切です。`;

      const wrongPool = allRadicals
        .filter((r) => getRadicalSymbol(r) !== symbol)
        .flatMap((r) => r.kanjiList)
        .filter((k) => k !== correctChar && findKanjiEntry(k));

      const wrongChars = shuffle(wrongPool).slice(0, 3);
      if (wrongChars.length < 3) return null;

      const choices = shuffle([
        { char: example.vocabulary, isCorrect: true, entry: correctEntry },
        ...wrongChars.map((c) => {
          const ex = findExampleVocab(c);
          return {
            char: ex?.vocabulary ?? c,
            isCorrect: false,
            entry: findKanjiEntry(c)!,
          };
        }),
      ]);

      return {
        radical,
        symbol,
        level: 7,
        type: "sentence",
        correctChar: example.vocabulary,
        correctEntry,
        choices,
        sentence: passage,
        instruction: `Baca paragraf berikut. Kata mana yang mengandung radikal ${symbol} (${radical.meaning})?`,
      };
    }

    default:
      return null;
  }
}

type QuestionType = "single" | "multi" | "sentence";

interface BaseQuestion {
  radical: RadicalInfo;
  symbol: string;
  level: number;
  type: QuestionType;
}

interface SingleChoiceQuestion extends BaseQuestion {
  type: "single";
  correctChar: string;
  correctEntry: KanjiEntry;
  choices: { char: string; isCorrect: boolean; entry: KanjiEntry }[];
  instruction: string;
}

interface MultiSelectQuestion extends BaseQuestion {
  type: "multi";
  correctChars: string[];
  allOptions: { char: string; isCorrect: boolean; entry: KanjiEntry }[];
  instruction: string;
}

interface SentenceQuestion extends BaseQuestion {
  type: "sentence";
  correctChar: string;
  correctEntry: KanjiEntry;
  choices: { char: string; isCorrect: boolean; entry: KanjiEntry }[];
  sentence: string;
  instruction: string;
}

type Question = SingleChoiceQuestion | MultiSelectQuestion | SentenceQuestion;

// ─── Choice Button ───────────────────────────────────────────────────────────

interface ChoiceButtonProps {
  label: string;
  char: string;
  state: "idle" | "correct" | "wrong" | "reveal";
  onClick: () => void;
  disabled: boolean;
  index: number;
}

function ChoiceButton({
  label,
  char,
  state,
  onClick,
  disabled,
  index,
}: ChoiceButtonProps) {
  const letters = ["A", "B", "C", "D"];
  let bg = "bg-gray-800 hover:bg-gray-700 border-gray-600";
  if (state === "correct") bg = "bg-emerald-800 border-emerald-500";
  if (state === "wrong") bg = "bg-red-900 border-red-500";
  if (state === "reveal") bg = "bg-emerald-900/60 border-emerald-600";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-ocid={`radical_quiz.choice.${index + 1}`}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 ${bg} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
        {letters[index]}
      </span>
      <span className="text-3xl font-bold text-white leading-none">{char}</span>
      {state !== "idle" && (
        <span className="ml-auto text-sm text-gray-300">{label}</span>
      )}
    </button>
  );
}

// ─── Multi Choice Button ─────────────────────────────────────────────────────

interface MultiChoiceButtonProps {
  label: string;
  char: string;
  state: "idle" | "correct" | "wrong" | "reveal";
  onClick: () => void;
  disabled: boolean;
  index: number;
  selected: boolean;
}

function MultiChoiceButton({
  label,
  char,
  state,
  onClick,
  disabled,
  index,
  selected,
}: MultiChoiceButtonProps) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  let bg = "bg-gray-800 hover:bg-gray-700 border-gray-600";
  if (state === "correct") bg = "bg-emerald-800 border-emerald-500";
  if (state === "wrong") bg = "bg-red-900 border-red-500";
  if (state === "reveal") bg = "bg-emerald-900/60 border-emerald-600";
  if (selected && state === "idle") bg = "bg-cyan-900/40 border-cyan-500";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-ocid={`radical_quiz.multi_choice.${index + 1}`}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 ${bg} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
        {letters[index] ?? index + 1}
      </span>
      <span className="text-2xl font-bold text-white leading-none">{char}</span>
      {state !== "idle" && (
        <span className="ml-auto text-sm text-gray-300">{label}</span>
      )}
      {selected && state === "idle" && (
        <span className="ml-auto text-xs text-cyan-400">✓ Dipilih</span>
      )}
    </button>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────

interface ResultPanelProps {
  question: Question;
  wasCorrect: boolean;
  onViewRadical: (radicalId: string) => void;
  onNext: () => void;
  isLast: boolean;
}

function ResultPanel({
  question,
  wasCorrect,
  onViewRadical,
  onNext,
  isLast,
}: ResultPanelProps) {
  const { radical, symbol } = question;
  const correctChar =
    question.type === "multi" ? question.correctChars[0] : question.correctChar;
  const correctEntry =
    question.type === "multi"
      ? (question.allOptions.find((o) => o.isCorrect)?.entry ??
        question.allOptions[0].entry)
      : question.correctEntry;
  const example = findExampleVocab(correctChar);
  const reading = correctEntry.romaji ?? "";
  const kanjiMeaning = correctEntry.meaning;
  const radicalMeaning = radical.meaning;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Verdict */}
      <div
        className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg ${
          wasCorrect
            ? "bg-emerald-900/60 text-emerald-300"
            : "bg-red-900/60 text-red-300"
        }`}
      >
        <span>{wasCorrect ? "✅ Benar!" : "❌ Kurang tepat"}</span>
      </div>

      {/* Kanji hero */}
      <div className="bg-gray-800 rounded-xl p-5 text-center space-y-1">
        <div className="text-6xl font-bold text-white leading-none mb-2">
          {correctChar}
        </div>
        <div className="text-cyan-400 text-lg font-medium">{reading}</div>
        <div className="text-gray-300 text-base">{kanjiMeaning}</div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-800/80 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Penjelasan Radikal
        </p>
        <div className="flex items-start gap-3">
          <span className="text-4xl leading-none text-cyan-300 mt-1">
            {symbol}
          </span>
          <div className="space-y-1">
            <p className="text-sm text-gray-200">
              Radikal <span className="font-bold text-cyan-300">{symbol}</span>{" "}
              berarti{" "}
              <span className="font-bold text-white">{radicalMeaning}</span>.
            </p>
            <p className="text-sm text-gray-200">
              Kanji <span className="font-bold text-white">{correctChar}</span>{" "}
              berarti{" "}
              <span className="font-bold text-white">{kanjiMeaning}</span>.
            </p>
            <p className="text-sm text-gray-300">
              Karena <span className="italic">{kanjiMeaning}</span> berhubungan
              dengan{" "}
              <span className="italic">{radicalMeaning.toLowerCase()}</span>,
              kanji ini menggunakan radikal{" "}
              <span className="font-bold text-cyan-300">{symbol}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Example sentence */}
      {example && (
        <div className="bg-gray-800/60 rounded-xl p-4 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Contoh Penggunaan
          </p>
          <p className="text-lg text-white">
            {example.vocabulary.split("").map((ch, i) => {
              const k = `char-${i}`;
              return ch === correctChar ? (
                <mark
                  key={k}
                  className="bg-cyan-500/30 text-cyan-200 px-0.5 rounded not-italic"
                >
                  {ch}
                </mark>
              ) : (
                <span key={k}>{ch}</span>
              );
            })}
          </p>
          <p className="text-sm text-gray-400">{example.romaji}</p>
          <p className="text-sm text-gray-300">{example.meaning}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          data-ocid="radical_quiz.view_radical_button"
          onClick={() => onViewRadical(radical.name)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-cyan-600 text-cyan-300 text-sm font-medium hover:bg-cyan-900/40 transition-colors"
        >
          Lihat Radikal
        </button>
        <button
          type="button"
          data-ocid="radical_quiz.next_button"
          onClick={onNext}
          className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
        >
          {isLast ? "Lihat Hasil" : "Lanjut"}
        </button>
      </div>
    </div>
  );
}

// ─── Single Quiz Question ────────────────────────────────────────────────────

interface QuizQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (correct: boolean) => void;
  onViewRadical: (radicalId: string) => void;
  onNext: () => void;
  isLast: boolean;
}

function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onViewRadical,
  onNext,
  isLast,
}: QuizQuestionProps) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<number>>(new Set());

  const handleChoice = useCallback(
    (idx: number, isCorrect: boolean) => {
      if (answered !== null) return;
      setSelectedIndex(idx);
      setAnswered(isCorrect);
      onAnswer(isCorrect);
      if (isCorrect) {
        recordRadicalCorrect(question.radical.name);
      } else {
        recordRadicalWrong(question.radical.name);
      }
    },
    [answered, onAnswer, question.radical.name],
  );

  const handleMultiToggle = useCallback((idx: number) => {
    setSelectedMulti((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const handleMultiSubmit = useCallback(() => {
    if (answered !== null) return;
    if (question.type !== "multi") return;

    const correctIndices = new Set(
      question.allOptions
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((i) => i !== -1),
    );

    const isCorrect =
      selectedMulti.size === correctIndices.size &&
      [...selectedMulti].every((i) => correctIndices.has(i));

    setAnswered(isCorrect);
    onAnswer(isCorrect);
    if (isCorrect) {
      recordRadicalCorrect(question.radical.name);
    } else {
      recordRadicalWrong(question.radical.name);
    }
  }, [answered, onAnswer, question, selectedMulti]);

  const getChoiceState = (
    idx: number,
    isCorrect: boolean,
  ): "idle" | "correct" | "wrong" | "reveal" => {
    if (answered === null) return "idle";
    if (question.type === "multi") {
      if (isCorrect) return "reveal";
      if (selectedMulti.has(idx)) return "wrong";
      return "idle";
    }
    if (idx === selectedIndex) return isCorrect ? "correct" : "wrong";
    if (isCorrect) return "reveal";
    return "idle";
  };

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span data-ocid="radical_quiz.progress">
          Soal {questionIndex + 1} / {totalQuestions}
        </span>
        <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
          Level {question.level}
        </span>
      </div>

      {/* Radical display */}
      <div className="bg-gray-800 rounded-2xl p-8 text-center space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          Radikal
        </p>
        <div
          data-ocid="radical_quiz.radical_symbol"
          className="text-8xl font-bold text-cyan-300 leading-none"
        >
          {question.symbol}
        </div>
        <p className="text-gray-300 text-base mt-2">
          {question.radical.meaning}
        </p>
        <p className="text-xs text-gray-500 mt-1">{question.radical.name}</p>
      </div>

      {/* Sentence display for levels 6-7 */}
      {question.type === "sentence" && (
        <div className="bg-gray-800/60 rounded-xl p-4 text-center">
          <p className="text-lg text-white leading-relaxed">
            {question.sentence}
          </p>
        </div>
      )}

      {/* Instruction */}
      <p className="text-sm text-gray-400 text-center">
        {question.instruction}
      </p>

      {/* Choices */}
      <div className="space-y-2" data-ocid="radical_quiz.choices">
        {question.type === "multi"
          ? question.allOptions.map((option, idx) => (
              <MultiChoiceButton
                key={`${option.char}-${option.entry.meaning}`}
                label={option.entry.meaning}
                char={option.char}
                state={getChoiceState(idx, option.isCorrect)}
                onClick={() => handleMultiToggle(idx)}
                disabled={answered !== null}
                index={idx}
                selected={selectedMulti.has(idx)}
              />
            ))
          : question.choices.map((choice, idx) => (
              <ChoiceButton
                key={`${choice.char}-${choice.entry.meaning}`}
                label={choice.entry.meaning}
                char={choice.char}
                state={getChoiceState(idx, choice.isCorrect)}
                onClick={() => handleChoice(idx, choice.isCorrect)}
                disabled={answered !== null}
                index={idx}
              />
            ))}
      </div>

      {/* Multi-select submit button */}
      {question.type === "multi" && answered === null && (
        <button
          type="button"
          data-ocid="radical_quiz.submit_button"
          onClick={handleMultiSubmit}
          disabled={selectedMulti.size === 0}
          className="w-full px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold transition-colors"
        >
          Kirim Jawaban ({selectedMulti.size} dipilih)
        </button>
      )}

      {/* Result panel after answering */}
      {answered !== null && (
        <ResultPanel
          question={question}
          wasCorrect={answered}
          onViewRadical={onViewRadical}
          onNext={onNext}
          isLast={isLast}
        />
      )}
    </div>
  );
}

// ─── Score Screen ─────────────────────────────────────────────────────────────

interface ScoreScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
}

function ScoreScreen({ score, total, onRestart }: ScoreScreenProps) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚";
  const label =
    pct >= 80
      ? "Luar Biasa!"
      : pct >= 60
        ? "Bagus! Terus berlatih."
        : "Perlu lebih banyak latihan.";

  return (
    <div
      className="text-center space-y-6 py-6"
      data-ocid="radical_quiz.score_screen"
    >
      <div className="text-6xl">{emoji}</div>
      <div>
        <p className="text-4xl font-bold text-white">
          {score} / {total}
        </p>
        <p className="text-lg text-cyan-400 mt-1">{pct}% Benar</p>
        <p className="text-gray-400 mt-2">{label}</p>
      </div>
      <button
        type="button"
        data-ocid="radical_quiz.restart_button"
        onClick={onRestart}
        className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
      >
        Main Lagi
      </button>
    </div>
  );
}

// ─── RadicalGuidedQuiz ────────────────────────────────────────────────────────

export interface RadicalGuidedQuizProps {
  /** Called when user taps [Lihat Radikal] — receives radical.name as ID */
  onViewRadical: (radicalId: string) => void;
  /** Number of questions per session (default: 5) */
  sessionLength?: number;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Radikal → Kanji",
  2: "Kanji → Radikal",
  3: "Radikal → Kosakata",
  4: "Cari yang Berbeda",
  5: "Kosakata Sama Radikal",
  6: "Konteks Kalimat",
  7: "Bacaan Dokkai",
};

export function RadicalGuidedQuiz({
  onViewRadical,
  sessionLength = 5,
}: RadicalGuidedQuizProps) {
  const [currentLevel, setCurrentLevel] = useState(1);

  const buildSession = useCallback(
    (level: number) => {
      const usableRadicals = radicalData.filter((r) => r.kanjiList.length > 0);
      const shuffled = shuffle(usableRadicals).slice(0, sessionLength);
      return shuffled
        .map((r) => buildQuestion(r, radicalData, level))
        .filter((q): q is Question => q !== null)
        .slice(0, sessionLength);
    },
    [sessionLength],
  );

  const [questions, setQuestions] = useState<Question[]>(() => buildSession(1));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Record seen when question displayed
  useMemo(() => {
    if (questions[currentIdx]) {
      recordRadicalSeen(questions[currentIdx].radical.name);
    }
  }, [currentIdx, questions]);

  const handleAnswer = useCallback((correct: boolean) => {
    if (correct) setScore((s) => s + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions.length]);

  const handleRestart = useCallback(() => {
    setQuestions(buildSession(currentLevel));
    setCurrentIdx(0);
    setScore(0);
    setFinished(false);
  }, [buildSession, currentLevel]);

  const handleLevelChange = useCallback(
    (level: number) => {
      setCurrentLevel(level);
      setQuestions(buildSession(level));
      setCurrentIdx(0);
      setScore(0);
      setFinished(false);
    },
    [buildSession],
  );

  if (questions.length === 0) {
    return (
      <div
        className="text-center py-12 text-gray-400"
        data-ocid="radical_quiz.empty_state"
      >
        <p className="text-lg">Data radikal belum tersedia.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-900 rounded-2xl p-5 max-w-md mx-auto space-y-4"
      data-ocid="radical_quiz.panel"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">
          {LEVEL_LABELS[currentLevel]}
        </h2>
        {!finished && (
          <span className="text-xs text-cyan-400 font-medium">
            Skor: {score}/{currentIdx}
          </span>
        )}
      </div>

      {/* Level Selector */}
      <div className="grid grid-cols-7 gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
          <button
            key={level}
            type="button"
            data-ocid={`radical_quiz.level_${level}_button`}
            onClick={() => handleLevelChange(level)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentLevel === level
                ? "bg-cyan-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            title={LEVEL_LABELS[level]}
          >
            L{level}
          </button>
        ))}
      </div>

      {finished ? (
        <ScoreScreen
          score={score}
          total={questions.length}
          onRestart={handleRestart}
        />
      ) : (
        <QuizQuestion
          question={questions[currentIdx]}
          questionIndex={currentIdx}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          onViewRadical={onViewRadical}
          onNext={handleNext}
          isLast={currentIdx + 1 >= questions.length}
        />
      )}
    </div>
  );
}

// ─── RadicalQuiz (alias with session label) ───────────────────────────────────

/**
 * RadicalQuiz — 5-question radical-guided session.
 * Tracks per-session score. Same engine as RadicalGuidedQuiz.
 */
export function RadicalQuiz(props: RadicalGuidedQuizProps) {
  return <RadicalGuidedQuiz {...props} sessionLength={5} />;
}

export default RadicalGuidedQuiz;
