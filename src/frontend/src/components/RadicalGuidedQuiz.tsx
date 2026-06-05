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
      className={`flex items-start gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 ${bg} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0 mt-0.5">
        {letters[index]}
      </span>
      <span className="text-3xl font-bold text-white leading-tight break-words min-w-0 flex-1">
        {char}
      </span>
      {state !== "idle" && (
        <span className="ml-auto text-sm text-gray-300 shrink-0 text-right max-w-[40%] whitespace-normal break-words leading-snug">
          {label}
        </span>
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
      className={`flex items-start gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 ${bg} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0 mt-0.5">
        {letters[index] ?? index + 1}
      </span>
      <span className="text-2xl font-bold text-white leading-tight break-words min-w-0 flex-1">
        {char}
      </span>
      {state !== "idle" && (
        <span className="ml-auto text-sm text-gray-300 shrink-0 text-right max-w-[40%] whitespace-normal break-words leading-snug">
          {label}
        </span>
      )}
      {selected && state === "idle" && (
        <span className="ml-auto text-xs text-cyan-400 shrink-0">
          ✓ Dipilih
        </span>
      )}
    </button>
  );
}

// ─── Example sentences lookup (reused from KanjiAnswerPanel) ─────────────────

const RADICAL_QUIZ_SENTENCES: Record<
  string,
  { japanese: string; romaji: string; meaning: string }
> = {
  会: {
    japanese: "会社で会議があります。",
    romaji: "Kaisha de kaigi ga arimasu.",
    meaning: "Ada rapat di kantor.",
  },
  学: {
    japanese: "大学で日本語を学びます。",
    romaji: "Daigaku de Nihongo o manabimasu.",
    meaning: "Saya belajar bahasa Jepang di universitas.",
  },
  食: {
    japanese: "毎朝、ご飯を食べます。",
    romaji: "Maiasa, gohan o tabemasu.",
    meaning: "Setiap pagi, saya makan nasi.",
  },
  飲: {
    japanese: "お茶を飲みます。",
    romaji: "Ocha o nomimasu.",
    meaning: "Saya minum teh.",
  },
  行: {
    japanese: "学校へ行きます。",
    romaji: "Gakkou e ikimasu.",
    meaning: "Saya pergi ke sekolah.",
  },
  来: {
    japanese: "友達が来ました。",
    romaji: "Tomodachi ga kimashita.",
    meaning: "Teman saya datang.",
  },
  見: {
    japanese: "テレビを見ます。",
    romaji: "Terebi o mimasu.",
    meaning: "Saya menonton TV.",
  },
  聞: {
    japanese: "音楽を聴きます。",
    romaji: "Ongaku o kikimasu.",
    meaning: "Saya mendengarkan musik.",
  },
  読: {
    japanese: "本を読みます。",
    romaji: "Hon o yomimasu.",
    meaning: "Saya membaca buku.",
  },
  書: {
    japanese: "手紙を書きます。",
    romaji: "Tegami o kakimasu.",
    meaning: "Saya menulis surat.",
  },
  話: {
    japanese: "日本語で話します。",
    romaji: "Nihongo de hanashimasu.",
    meaning: "Saya berbicara dalam bahasa Jepang.",
  },
  買: {
    japanese: "スーパーで野菜を買いました。",
    romaji: "Suupaa de yasai o kaimashita.",
    meaning: "Saya membeli sayuran di supermarket.",
  },
  作: {
    japanese: "料理を作ります。",
    romaji: "Ryouri o tsukurimasu.",
    meaning: "Saya memasak.",
  },
  使: {
    japanese: "パソコンを使います。",
    romaji: "Pasokon o tsukaimasu.",
    meaning: "Saya menggunakan komputer.",
  },
  出: {
    japanese: "家を出ます。",
    romaji: "Ie o demasu.",
    meaning: "Saya keluar dari rumah.",
  },
  入: {
    japanese: "部屋に入ります。",
    romaji: "Heya ni hairimasu.",
    meaning: "Saya masuk ke kamar.",
  },
  帰: {
    japanese: "家に帰ります。",
    romaji: "Ie ni kaerimasu.",
    meaning: "Saya pulang ke rumah.",
  },
  起: {
    japanese: "毎朝6時に起きます。",
    romaji: "Maiasa rokuji ni okimasu.",
    meaning: "Setiap pagi saya bangun pukul 6.",
  },
  寝: {
    japanese: "11時に寝ます。",
    romaji: "Juuichiji ni nemasu.",
    meaning: "Saya tidur pukul 11.",
  },
  働: {
    japanese: "会社で働きます。",
    romaji: "Kaisha de hatarakimasu.",
    meaning: "Saya bekerja di kantor.",
  },
  勉: {
    japanese: "毎日勉強します。",
    romaji: "Mainichi benkyou shimasu.",
    meaning: "Saya belajar setiap hari.",
  },
  経: {
    japanese: "日本で働いた経験があります。",
    romaji: "Nihon de hataraita keiken ga arimasu.",
    meaning: "Saya memiliki pengalaman bekerja di Jepang.",
  },
  発: {
    japanese: "会議で発表します。",
    romaji: "Kaigi de happyou shimasu.",
    meaning: "Saya presentasi dalam rapat.",
  },
  説: {
    japanese: "先生が説明してくれました。",
    romaji: "Sensei ga setsumei shite kuremashita.",
    meaning: "Guru menjelaskan kepada saya.",
  },
  準: {
    japanese: "試験の準備をします。",
    romaji: "Shiken no junbi o shimasu.",
    meaning: "Saya mempersiapkan diri untuk ujian.",
  },
  利: {
    japanese: "インターネットを利用します。",
    romaji: "Intaanetto o riyou shimasu.",
    meaning: "Saya menggunakan internet.",
  },
  連: {
    japanese: "後で連絡します。",
    romaji: "Ato de renraku shimasu.",
    meaning: "Saya akan menghubungi nanti.",
  },
  約: {
    japanese: "レストランを予約しました。",
    romaji: "Resutoran o yoyaku shimashita.",
    meaning: "Saya memesan restoran.",
  },
  確: {
    japanese: "予定を確認してください。",
    romaji: "Yotei o kakunin shite kudasai.",
    meaning: "Tolong konfirmasi jadwal.",
  },
  必: {
    japanese: "パスポートが必要です。",
    romaji: "Pasupooto ga hitsuyou desu.",
    meaning: "Paspor diperlukan.",
  },
  研: {
    japanese: "大学で研究しています。",
    romaji: "Daigaku de kenkyuu shite imasu.",
    meaning: "Saya sedang meneliti di universitas.",
  },
  運: {
    japanese: "車の運転が好きです。",
    romaji: "Kuruma no unten ga suki desu.",
    meaning: "Saya suka mengemudi.",
  },
  卒: {
    japanese: "来年、大学を卒業します。",
    romaji: "Rainen, daigaku o sotsugyou shimasu.",
    meaning: "Tahun depan saya lulus universitas.",
  },
  旅: {
    japanese: "日本へ旅行します。",
    romaji: "Nihon e ryokou shimasu.",
    meaning: "Saya pergi wisata ke Jepang.",
  },
  特: {
    japanese: "今日は特別な日です。",
    romaji: "Kyou wa tokubetsu na hi desu.",
    meaning: "Hari ini adalah hari istimewa.",
  },
  原: {
    japanese: "事故の原因は何ですか。",
    romaji: "Jiko no gen'in wa nan desu ka.",
    meaning: "Apa penyebab kecelakaan itu?",
  },
  安: {
    japanese: "この道は安全ですか。",
    romaji: "Kono michi wa anzen desu ka.",
    meaning: "Apakah jalan ini aman?",
  },
  交: {
    japanese: "交通が便利な場所に住みたい。",
    romaji: "Koutsuu ga benri na basho ni sumitai.",
    meaning: "Saya ingin tinggal di tempat transportasi mudah.",
  },
  文: {
    japanese: "日本の文化を勉強しています。",
    romaji: "Nihon no bunka o benkyou shite imasu.",
    meaning: "Saya mempelajari budaya Jepang.",
  },
  生: {
    japanese: "毎日、生活が忙しいです。",
    romaji: "Mainichi, seikatsu ga isogashii desu.",
    meaning: "Kehidupan sehari-hari saya sibuk.",
  },
  試: {
    japanese: "今月、日本語の試験があります。",
    romaji: "Kongetsu, Nihongo no shiken ga arimasu.",
    meaning: "Bulan ini ada ujian bahasa Jepang.",
  },
  海: {
    japanese: "海へ行きます。",
    romaji: "Umi e ikimasu.",
    meaning: "Saya pergi ke laut.",
  },
  山: {
    japanese: "山に登ります。",
    romaji: "Yama ni noborimasu.",
    meaning: "Saya mendaki gunung.",
  },
  川: {
    japanese: "川で魚を釣ります。",
    romaji: "Kawa de sakana o tsurimasu.",
    meaning: "Saya memancing ikan di sungai.",
  },
  電: {
    japanese: "電車で会社へ行きます。",
    romaji: "Densha de kaisha e ikimasu.",
    meaning: "Saya pergi ke kantor naik kereta.",
  },
  車: {
    japanese: "車で旅行します。",
    romaji: "Kuruma de ryokou shimasu.",
    meaning: "Saya berwisata naik mobil.",
  },
  駅: {
    japanese: "駅まで歩いて10分です。",
    romaji: "Eki made aruite juppun desu.",
    meaning: "Jarak ke stasiun 10 menit jalan kaki.",
  },
  病: {
    japanese: "病院に行きます。",
    romaji: "Byouin ni ikimasu.",
    meaning: "Saya pergi ke rumah sakit.",
  },
  薬: {
    japanese: "薬を飲んでください。",
    romaji: "Kusuri o nonde kudasai.",
    meaning: "Tolong minum obatnya.",
  },
  店: {
    japanese: "店でコーヒーを飲みます。",
    romaji: "Mise de koohii o nomimasu.",
    meaning: "Saya minum kopi di toko.",
  },
  家: {
    japanese: "新しい家を買いました。",
    romaji: "Atarashii ie o kaimashita.",
    meaning: "Saya membeli rumah baru.",
  },
  国: {
    japanese: "どの国から来ましたか。",
    romaji: "Dono kuni kara kimashita ka.",
    meaning: "Anda berasal dari negara mana?",
  },
  人: {
    japanese: "あの人は誰ですか。",
    romaji: "Ano hito wa dare desu ka.",
    meaning: "Siapa orang itu?",
  },
  時: {
    japanese: "今、何時ですか。",
    romaji: "Ima, nanji desu ka.",
    meaning: "Sekarang jam berapa?",
  },
  間: {
    japanese: "授業は2時間あります。",
    romaji: "Jugyou wa nijikan arimasu.",
    meaning: "Pelajaran berlangsung 2 jam.",
  },
  週: {
    japanese: "来週、友達と会います。",
    romaji: "Raishuu, tomodachi to aimasu.",
    meaning: "Minggu depan saya bertemu teman.",
  },
  月: {
    japanese: "毎月、給料をもらいます。",
    romaji: "Maitsuki, kyuuryou o moraimasu.",
    meaning: "Setiap bulan saya menerima gaji.",
  },
  年: {
    japanese: "来年、日本へ行きたいです。",
    romaji: "Rainen, Nihon e ikitai desu.",
    meaning: "Tahun depan saya ingin pergi ke Jepang.",
  },
  今: {
    japanese: "今から勉強します。",
    romaji: "Ima kara benkyou shimasu.",
    meaning: "Saya akan mulai belajar sekarang.",
  },
  先: {
    japanese: "先生に質問します。",
    romaji: "Sensei ni shitsumon shimasu.",
    meaning: "Saya bertanya kepada guru.",
  },
  高: {
    japanese: "この山はとても高いです。",
    romaji: "Kono yama wa totemo takai desu.",
    meaning: "Gunung ini sangat tinggi.",
  },
  長: {
    japanese: "この映画は長いです。",
    romaji: "Kono eiga wa nagai desu.",
    meaning: "Film ini panjang.",
  },
  新: {
    japanese: "新しいスマホを買いました。",
    romaji: "Atarashii sumaho o kaimashita.",
    meaning: "Saya membeli HP baru.",
  },
  古: {
    japanese: "古い建物を見ました。",
    romaji: "Furui tatemono o mimashita.",
    meaning: "Saya melihat bangunan tua.",
  },
  大: {
    japanese: "大学は大きいです。",
    romaji: "Daigaku wa ookii desu.",
    meaning: "Universitas itu besar.",
  },
  小: {
    japanese: "小さい猫がいます。",
    romaji: "Chiisai neko ga imasu.",
    meaning: "Ada kucing kecil.",
  },
  水: {
    japanese: "毎日水を飲みます。",
    romaji: "Mainichi mizu o nomimasu.",
    meaning: "Saya minum air setiap hari.",
  },
  火: {
    japanese: "火曜日に試験があります。",
    romaji: "Kayoubi ni shiken ga arimasu.",
    meaning: "Ada ujian pada hari Selasa.",
  },
  木: {
    japanese: "公園に木がたくさんあります。",
    romaji: "Kouen ni ki ga takusan arimasu.",
    meaning: "Di taman banyak terdapat pohon.",
  },
  日: {
    japanese: "今日は何曜日ですか。",
    romaji: "Kyou wa nanyoubi desu ka.",
    meaning: "Hari ini hari apa?",
  },
  本: {
    japanese: "図書館で本を借ります。",
    romaji: "Toshokan de hon o karimasu.",
    meaning: "Saya meminjam buku di perpustakaan.",
  },
  語: {
    japanese: "日本語を毎日練習します。",
    romaji: "Nihongo o mainichi renshuu shimasu.",
    meaning: "Saya berlatih bahasa Jepang setiap hari.",
  },
  友: {
    japanese: "友達とカフェに行きます。",
    romaji: "Tomodachi to kafe ni ikimasu.",
    meaning: "Saya pergi ke kafe bersama teman.",
  },
  校: {
    japanese: "学校は8時に始まります。",
    romaji: "Gakkou wa hachiji ni hajimarimasu.",
    meaning: "Sekolah dimulai pukul 8.",
  },
};

/** Find multiple related vocabulary for a kanji char */
function findRelatedVocabList(
  kanjiChar: string,
  max = 3,
): Array<{ vocabulary: string; romaji: string; meaning: string }> {
  const results: Array<{
    vocabulary: string;
    romaji: string;
    meaning: string;
  }> = [];
  for (const v of vocabularyData) {
    const word = v.vocabulary ?? "";
    if (word.includes(kanjiChar) && word !== kanjiChar && word.length > 1) {
      results.push({ vocabulary: word, romaji: v.romaji, meaning: v.meaning });
      if (results.length >= max) break;
    }
  }
  return results;
}

/** Get example sentence for a kanji char */
function getExampleSentence(
  kanjiChar: string,
  relatedVocab: Array<{ vocabulary: string; romaji: string; meaning: string }>,
): { japanese: string; romaji: string; meaning: string } {
  if (RADICAL_QUIZ_SENTENCES[kanjiChar]) {
    return RADICAL_QUIZ_SENTENCES[kanjiChar];
  }
  if (relatedVocab.length > 0) {
    const v = relatedVocab[0];
    return {
      japanese: `${v.vocabulary}はとても大切です。`,
      romaji: `${v.romaji} wa totemo taisetsu desu.`,
      meaning: `${v.meaning} sangat penting.`,
    };
  }
  return {
    japanese: `この${kanjiChar}は大切な漢字です。`,
    romaji: "Kono kanji wa taisetsu desu.",
    meaning: "Kanji ini adalah kanji yang penting.",
  };
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

  // Resolve the correct kanji character and its entry
  const correctChar =
    question.type === "multi" ? question.correctChars[0] : question.correctChar;
  const correctEntry: KanjiEntry =
    question.type === "multi"
      ? (question.allOptions.find((o) => o.isCorrect)?.entry ??
        question.allOptions[0].entry)
      : question.correctEntry;

  // Data
  const kanjiChar = correctEntry.character;
  const reading = correctEntry.romaji ?? "";
  const kanjiMeaning = correctEntry.meaning;
  const radicalMeaning = radical.meaning;
  const kanjiExplanation = correctEntry.explanation ?? "";

  // Related vocabulary (up to 3)
  const relatedVocab = useMemo(
    () => findRelatedVocabList(kanjiChar, 3),
    [kanjiChar],
  );

  // Example sentence
  const exampleSentence = useMemo(
    () => getExampleSentence(kanjiChar, relatedVocab),
    [kanjiChar, relatedVocab],
  );

  // Also keep the single findExampleVocab for highlighting
  const singleVocab = findExampleVocab(correctChar);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Verdict Banner ─────────────────────────────────────────────── */}
      <div
        data-ocid="radical_quiz.result_verdict"
        className={`flex items-center gap-2 text-sm font-semibold px-3 py-2.5 rounded-xl ${
          wasCorrect
            ? "bg-emerald-900/60 border border-emerald-700 text-emerald-300"
            : "bg-red-900/60 border border-red-700 text-red-300"
        }`}
      >
        <span className="text-lg">{wasCorrect ? "✅" : "❌"}</span>
        <span>
          {wasCorrect
            ? "Benar! Bagus sekali!"
            : "Kurang tepat — pelajari penjelasan di bawah."}
        </span>
      </div>

      {/* ── Kanji Hero ─────────────────────────────────────────────────── */}
      <div
        data-ocid="radical_quiz.answer_kanji_hero"
        className="bg-gray-800 rounded-2xl p-5 flex items-center gap-5"
      >
        {/* Big kanji */}
        <div className="text-center shrink-0">
          <div className="text-7xl font-bold text-white leading-none">
            {kanjiChar}
          </div>
          <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-700 text-cyan-300 font-medium">
            {correctEntry.jlptLevel}
          </span>
        </div>
        {/* Reading & meaning */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">
              Cara Baca / Romaji
            </p>
            <p
              className="text-cyan-300 font-bold text-xl leading-tight"
              data-ocid="radical_quiz.answer_reading"
            >
              {reading}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">
              Arti Indonesia
            </p>
            <p
              className="text-white font-semibold text-lg leading-tight"
              data-ocid="radical_quiz.answer_meaning"
            >
              {kanjiMeaning}
            </p>
          </div>
        </div>
      </div>

      {/* ── Penjelasan Kanji ────────────────────────────────────────────── */}
      {kanjiExplanation && (
        <div
          className="bg-gray-800/70 rounded-xl p-4"
          data-ocid="radical_quiz.answer_explanation"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
            Penjelasan
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {kanjiExplanation}
          </p>
        </div>
      )}

      {/* ── Penjelasan Hubungan Radikal-Kanji ───────────────────────────── */}
      <div
        className="bg-gray-800/80 rounded-xl p-4"
        data-ocid="radical_quiz.answer_radical_explanation"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
          Hubungan Radikal & Kanji
        </p>
        <div className="flex items-start gap-4">
          {/* Radical symbol box */}
          <div className="shrink-0 bg-gray-700/80 rounded-xl p-3 text-center min-w-[4rem]">
            <div className="text-4xl font-bold text-yellow-300 leading-none">
              {symbol}
            </div>
            <p className="text-gray-400 text-xs mt-1">Radikal</p>
          </div>
          {/* Arrow and explanation */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-yellow-300">{symbol}</span>
              <span className="text-gray-500">→</span>
              <span className="text-white font-semibold">{radicalMeaning}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-white">{kanjiChar}</span>
              <span className="text-gray-500">→</span>
              <span className="text-white font-semibold">{kanjiMeaning}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed pt-1 border-t border-gray-700">
              Radikal{" "}
              <span className="font-bold text-yellow-300">{symbol}</span>{" "}
              artinya{" "}
              <span className="font-bold text-white">"{radicalMeaning}"</span>.
              Kanji <span className="font-bold text-white">{kanjiChar}</span>{" "}
              berarti{" "}
              <span className="font-bold text-cyan-300">"{kanjiMeaning}"</span>.
              Karena{" "}
              <span className="italic">{kanjiMeaning.toLowerCase()}</span>{" "}
              berhubungan dengan{" "}
              <span className="italic">{radicalMeaning.toLowerCase()}</span>,
              kanji ini menggunakan radikal{" "}
              <span className="font-bold text-yellow-300">{symbol}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Contoh Kosakata (3 items) ───────────────────────────────────── */}
      {relatedVocab.length > 0 && (
        <div
          className="bg-gray-800/60 rounded-xl p-4"
          data-ocid="radical_quiz.answer_vocab_examples"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Contoh Kosakata
          </p>
          <div className="space-y-2.5">
            {relatedVocab.map((v, i) => (
              <div
                key={`${v.vocabulary}-${i}`}
                className="flex items-start gap-3"
                data-ocid={`radical_quiz.answer_vocab.${i + 1}`}
              >
                <span className="text-cyan-300 font-bold text-base min-w-[5.5rem] shrink-0">
                  {v.vocabulary}
                </span>
                <span className="text-gray-400 text-sm leading-snug">
                  ({v.romaji}){" "}
                  <span className="text-gray-200">— {v.meaning}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: single vocab highlight if no related vocab from list */}
      {relatedVocab.length === 0 && singleVocab && (
        <div className="bg-gray-800/60 rounded-xl p-4 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Contoh Kosakata
          </p>
          <p className="text-base text-white font-semibold">
            {singleVocab.vocabulary}
          </p>
          <p className="text-sm text-gray-400">{singleVocab.romaji}</p>
          <p className="text-sm text-gray-300">{singleVocab.meaning}</p>
        </div>
      )}

      {/* ── Contoh Kalimat ──────────────────────────────────────────────── */}
      <div
        className="bg-gray-800/60 rounded-xl p-4 border-l-2 border-cyan-700"
        data-ocid="radical_quiz.answer_example_sentence"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
          Contoh Kalimat
        </p>
        <p className="text-white font-medium text-base leading-relaxed">
          {exampleSentence.japanese.split("").map((ch, i) => {
            const key = `s-${i}`;
            return ch === kanjiChar ? (
              <mark
                key={key}
                className="bg-cyan-500/30 text-cyan-200 px-0.5 rounded not-italic"
              >
                {ch}
              </mark>
            ) : (
              <span key={key}>{ch}</span>
            );
          })}
        </p>
        <p className="text-gray-400 text-sm mt-1 italic">
          ({exampleSentence.romaji})
        </p>
        <p className="text-cyan-200 text-sm mt-0.5">
          {exampleSentence.meaning}
        </p>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────── */}
      <div className="flex gap-3" data-ocid="radical_quiz.answer_actions">
        <button
          type="button"
          data-ocid="radical_quiz.view_radical_button"
          onClick={() => onViewRadical(radical.name)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-yellow-600 text-yellow-300 text-sm font-medium hover:bg-yellow-900/30 transition-colors"
        >
          🔍 Lihat Radikal
        </button>
        <button
          type="button"
          data-ocid="radical_quiz.next_button"
          onClick={onNext}
          className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
        >
          {isLast ? "Lihat Hasil" : "Lanjut →"}
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
