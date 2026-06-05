/**
 * KanjiAnswerPanel.tsx
 * Rich answer explanation panel shown after user answers a Kanji Quiz question.
 * Shows: kanji, hiragana/romaji, arti, penjelasan, radikal + arti radikal,
 * 3 contoh kosakata, 1 contoh kalimat, tombol Lihat Radikal.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { KanjiEntry, VocabularyEntry } from "@/data/kanjiData";
import { radicalData, vocabularyData } from "@/data/kanjiData";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import type { ReactElement } from "react";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findRelatedVocab(
  kanji: string,
  vocab: VocabularyEntry[],
  max = 3,
): VocabularyEntry[] {
  const results: VocabularyEntry[] = [];
  for (const v of vocab) {
    const word = v.vocabulary ?? "";
    if (word.includes(kanji) && word !== kanji && word.length > 1) {
      results.push(v);
      if (results.length >= max) break;
    }
  }
  return results;
}

function findRadicalMeaning(radicalChar: string): string {
  if (!radicalChar) return "";
  const clean = radicalChar.replace(/\s*\(.*\)/, "").trim();
  const found = radicalData.find((r) => {
    const rname = r.name.replace(/\s*\(.*\)/, "").trim();
    return (
      rname === clean || rname.startsWith(clean) || clean.startsWith(rname)
    );
  });
  return found?.meaning ?? "";
}

const EXAMPLE_SENTENCES: Record<
  string,
  { japanese: string; romaji: string; meaning: string }
> = {
  "\u4f1a": {
    japanese:
      "\u4f1a\u793e\u3067\u4f1a\u8b70\u304c\u3042\u308a\u307e\u3059\u3002",
    romaji: "Kaisha de kaigi ga arimasu.",
    meaning: "Ada rapat di kantor.",
  },
  "\u5b66": {
    japanese:
      "\u5927\u5b66\u3067\u65e5\u672c\u8a9e\u3092\u5b66\u3073\u307e\u3059\u3002",
    romaji: "Daigaku de Nihongo o manabimasu.",
    meaning: "Saya belajar bahasa Jepang di universitas.",
  },
  "\u98df": {
    japanese:
      "\u6bce\u671d\u3001\u3054\u98ef\u3092\u98df\u3079\u307e\u3059\u3002",
    romaji: "Maiasa, gohan o tabemasu.",
    meaning: "Setiap pagi, saya makan nasi.",
  },
  "\u98f2": {
    japanese: "\u304a\u8336\u3092\u98f2\u307f\u307e\u3059\u3002",
    romaji: "Ocha o nomimasu.",
    meaning: "Saya minum teh.",
  },
  "\u884c": {
    japanese: "\u5b66\u6821\u3078\u884c\u304d\u307e\u3059\u3002",
    romaji: "Gakkou e ikimasu.",
    meaning: "Saya pergi ke sekolah.",
  },
  "\u6765": {
    japanese: "\u53cb\u9054\u304c\u6765\u307e\u3057\u305f\u3002",
    romaji: "Tomodachi ga kimashita.",
    meaning: "Teman saya datang.",
  },
  "\u898b": {
    japanese: "\u30c6\u30ec\u30d3\u3092\u898b\u307e\u3059\u3002",
    romaji: "Terebi o mimasu.",
    meaning: "Saya menonton TV.",
  },
  "\u8033": {
    japanese: "\u97f3\u697d\u3092\u8033\u304d\u307e\u3059\u3002",
    romaji: "Ongaku o kikimasu.",
    meaning: "Saya mendengarkan musik.",
  },
  "\u8aad": {
    japanese: "\u672c\u3092\u8aad\u307f\u307e\u3059\u3002",
    romaji: "Hon o yomimasu.",
    meaning: "Saya membaca buku.",
  },
  "\u66f8": {
    japanese: "\u624b\u7d19\u3092\u66f8\u304d\u307e\u3059\u3002",
    romaji: "Tegami o kakimasu.",
    meaning: "Saya menulis surat.",
  },
  "\u8a71": {
    japanese: "\u65e5\u672c\u8a9e\u3067\u8a71\u3057\u307e\u3059\u3002",
    romaji: "Nihongo de hanashimasu.",
    meaning: "Saya berbicara dalam bahasa Jepang.",
  },
  "\u8cb7": {
    japanese:
      "\u30b9\u30fc\u30d1\u30fc\u3067\u91ce\u83dc\u3092\u8cb7\u3044\u307e\u3057\u305f\u3002",
    romaji: "Suupaa de yasai o kaimashita.",
    meaning: "Saya membeli sayuran di supermarket.",
  },
  "\u4f5c": {
    japanese: "\u6599\u7406\u3092\u4f5c\u308a\u307e\u3059\u3002",
    romaji: "Ryouri o tsukurimasu.",
    meaning: "Saya memasak.",
  },
  "\u4f7f": {
    japanese: "\u30d1\u30bd\u30b3\u30f3\u3092\u4f7f\u3044\u307e\u3059\u3002",
    romaji: "Pasokon o tsukaimasu.",
    meaning: "Saya menggunakan komputer.",
  },
  "\u51fa": {
    japanese: "\u5bb6\u3092\u51fa\u307e\u3059\u3002",
    romaji: "Ie o demasu.",
    meaning: "Saya keluar dari rumah.",
  },
  "\u5165": {
    japanese: "\u90e8\u5c4b\u306b\u5165\u308a\u307e\u3059\u3002",
    romaji: "Heya ni hairimasu.",
    meaning: "Saya masuk ke kamar.",
  },
  "\u5e30": {
    japanese: "\u5bb6\u306b\u5e30\u308a\u307e\u3059\u3002",
    romaji: "Ie ni kaerimasu.",
    meaning: "Saya pulang ke rumah.",
  },
  "\u8d77": {
    japanese: "\u6bce\u671d6\u6642\u306b\u8d77\u304d\u307e\u3059\u3002",
    romaji: "Maiasa rokuji ni okimasu.",
    meaning: "Setiap pagi saya bangun pukul 6.",
  },
  "\u5bdd": {
    japanese: "11\u6642\u306b\u5bdd\u307e\u3059\u3002",
    romaji: "Juuichiji ni nemasu.",
    meaning: "Saya tidur pukul 11.",
  },
  "\u50cd": {
    japanese: "\u4f1a\u793e\u3067\u50cd\u304d\u307e\u3059\u3002",
    romaji: "Kaisha de hatarakimasu.",
    meaning: "Saya bekerja di kantor.",
  },
  "\u52c9": {
    japanese: "\u6bce\u65e5\u52c9\u5f37\u3057\u307e\u3059\u3002",
    romaji: "Mainichi benkyou shimasu.",
    meaning: "Saya belajar setiap hari.",
  },
  "\u7d4c": {
    japanese:
      "\u65e5\u672c\u3067\u50cd\u3044\u305f\u7d4c\u9a13\u304c\u3042\u308a\u307e\u3059\u3002",
    romaji: "Nihon de hataraita keiken ga arimasu.",
    meaning: "Saya memiliki pengalaman bekerja di Jepang.",
  },
  "\u767a": {
    japanese: "\u4f1a\u8b70\u3067\u767a\u8868\u3057\u307e\u3059\u3002",
    romaji: "Kaigi de happyou shimasu.",
    meaning: "Saya presentasi dalam rapat.",
  },
  "\u8aac": {
    japanese:
      "\u5148\u751f\u304c\u8aac\u660e\u3057\u3066\u304f\u308c\u307e\u3057\u305f\u3002",
    romaji: "Sensei ga setsumei shite kuremashita.",
    meaning: "Guru menjelaskan kepada saya.",
  },
  "\u6e96": {
    japanese: "\u8a66\u9a13\u306e\u6e96\u5099\u3092\u3057\u307e\u3059\u3002",
    romaji: "Shiken no junbi o shimasu.",
    meaning: "Saya mempersiapkan diri untuk ujian.",
  },
  "\u5229": {
    japanese:
      "\u30a4\u30f3\u30bf\u30fc\u30cd\u30c3\u30c8\u3092\u5229\u7528\u3057\u307e\u3059\u3002",
    romaji: "Intaanetto o riyou shimasu.",
    meaning: "Saya menggunakan internet.",
  },
  "\u9023": {
    japanese: "\u5f8c\u3067\u9023\u7d61\u3057\u307e\u3059\u3002",
    romaji: "Ato de renraku shimasu.",
    meaning: "Saya akan menghubungi nanti.",
  },
  "\u7d04": {
    japanese:
      "\u30ec\u30b9\u30c8\u30e9\u30f3\u3092\u4e88\u7d04\u3057\u307e\u3057\u305f\u3002",
    romaji: "Resutoran o yoyaku shimashita.",
    meaning: "Saya memesan restoran.",
  },
  "\u78ba": {
    japanese:
      "\u4e88\u5b9a\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    romaji: "Yotei o kakunin shite kudasai.",
    meaning: "Tolong konfirmasi jadwal.",
  },
  "\u5fc5": {
    japanese:
      "\u30d1\u30b9\u30dd\u30fc\u30c8\u304c\u5fc5\u8981\u3067\u3059\u3002",
    romaji: "Pasupooto ga hitsuyou desu.",
    meaning: "Paspor diperlukan.",
  },
  "\u7814": {
    japanese:
      "\u5927\u5b66\u3067\u7814\u7a76\u3057\u3066\u3044\u307e\u3059\u3002",
    romaji: "Daigaku de kenkyuu shite imasu.",
    meaning: "Saya sedang meneliti di universitas.",
  },
  "\u904b": {
    japanese: "\u8eca\u306e\u904b\u8ee2\u304c\u597d\u304d\u3067\u3059\u3002",
    romaji: "Kuruma no unten ga suki desu.",
    meaning: "Saya suka mengemudi.",
  },
  "\u5352": {
    japanese:
      "\u6765\u5e74\u3001\u5927\u5b66\u3092\u5352\u696d\u3057\u307e\u3059\u3002",
    romaji: "Rainen, daigaku o sotsugyou shimasu.",
    meaning: "Tahun depan saya lulus universitas.",
  },
  "\u65c5": {
    japanese: "\u65e5\u672c\u3078\u65c5\u884c\u3057\u307e\u3059\u3002",
    romaji: "Nihon e ryokou shimasu.",
    meaning: "Saya pergi wisata ke Jepang.",
  },
  "\u7279": {
    japanese: "\u4eca\u65e5\u306f\u7279\u5225\u306a\u65e5\u3067\u3059\u3002",
    romaji: "Kyou wa tokubetsu na hi desu.",
    meaning: "Hari ini adalah hari istimewa.",
  },
  "\u539f": {
    japanese:
      "\u4e8b\u6545\u306e\u539f\u56e0\u306f\u4f55\u3067\u3059\u304b\u3002",
    romaji: "Jiko no gen'in wa nan desu ka.",
    meaning: "Apa penyebab kecelakaan itu?",
  },
  "\u5b89": {
    japanese: "\u3053\u306e\u9053\u306f\u5b89\u5168\u3067\u3059\u304b\u3002",
    romaji: "Kono michi wa anzen desu ka.",
    meaning: "Apakah jalan ini aman?",
  },
  "\u4ea4": {
    japanese:
      "\u4ea4\u901a\u304c\u4fbf\u5229\u306a\u5834\u6240\u306b\u4f4f\u307f\u305f\u3044\u3002",
    romaji: "Koutsuu ga benri na basho ni sumitai.",
    meaning: "Saya ingin tinggal di tempat transportasi yang mudah.",
  },
  "\u6587": {
    japanese:
      "\u65e5\u672c\u306e\u6587\u5316\u3092\u52c9\u5f37\u3057\u3066\u3044\u307e\u3059\u3002",
    romaji: "Nihon no bunka o benkyou shite imasu.",
    meaning: "Saya mempelajari budaya Jepang.",
  },
  "\u751f": {
    japanese:
      "\u6bce\u65e5\u3001\u751f\u6d3b\u304c\u5fd9\u3057\u3044\u3067\u3059\u3002",
    romaji: "Mainichi, seikatsu ga isogashii desu.",
    meaning: "Kehidupan sehari-hari saya sibuk.",
  },
  "\u8a66": {
    japanese:
      "\u4eca\u6708\u3001\u65e5\u672c\u8a9e\u306e\u8a66\u9a13\u304c\u3042\u308a\u307e\u3059\u3002",
    romaji: "Kongetsu, Nihongo no shiken ga arimasu.",
    meaning: "Bulan ini ada ujian bahasa Jepang.",
  },
  "\u6d77": {
    japanese: "\u6d77\u3078\u884c\u304d\u307e\u3059\u3002",
    romaji: "Umi e ikimasu.",
    meaning: "Saya pergi ke laut.",
  },
  "\u5c71": {
    japanese: "\u5c71\u306b\u767b\u308a\u307e\u3059\u3002",
    romaji: "Yama ni noborimasu.",
    meaning: "Saya mendaki gunung.",
  },
  "\u5ddd": {
    japanese: "\u5ddd\u3067\u9b5a\u3092\u91e3\u308a\u307e\u3059\u3002",
    romaji: "Kawa de sakana o tsurimasu.",
    meaning: "Saya memancing ikan di sungai.",
  },
  "\u96fb": {
    japanese:
      "\u96fb\u8eca\u3067\u4f1a\u793e\u3078\u884c\u304d\u307e\u3059\u3002",
    romaji: "Densha de kaisha e ikimasu.",
    meaning: "Saya pergi ke kantor naik kereta.",
  },
  "\u8eca": {
    japanese: "\u8eca\u3067\u65c5\u884c\u3057\u307e\u3059\u3002",
    romaji: "Kuruma de ryokou shimasu.",
    meaning: "Saya berwisata naik mobil.",
  },
  "\u99c5": {
    japanese:
      "\u99c5\u307e\u3067\u6b69\u3044\u3066\uff10\u5206\u3067\u3059\u3002",
    romaji: "Eki made aruite juppun desu.",
    meaning: "Jarak ke stasiun 10 menit jalan kaki.",
  },
  "\u75c5": {
    japanese: "\u75c5\u9662\u306b\u884c\u304d\u307e\u3059\u3002",
    romaji: "Byouin ni ikimasu.",
    meaning: "Saya pergi ke rumah sakit.",
  },
  "\u85ac": {
    japanese: "\u85ac\u3092\u98f2\u3093\u3067\u304f\u3060\u3055\u3044\u3002",
    romaji: "Kusuri o nonde kudasai.",
    meaning: "Tolong minum obatnya.",
  },
  "\u5e97": {
    japanese:
      "\u5e97\u3067\u30b3\u30fc\u30d2\u30fc\u3092\u98f2\u307f\u307e\u3059\u3002",
    romaji: "Mise de koohii o nomimasu.",
    meaning: "Saya minum kopi di toko.",
  },
  "\u5bb6": {
    japanese:
      "\u65b0\u3057\u3044\u5bb6\u3092\u8cb7\u3044\u307e\u3057\u305f\u3002",
    romaji: "Atarashii ie o kaimashita.",
    meaning: "Saya membeli rumah baru.",
  },
  "\u56fd": {
    japanese:
      "\u3069\u306e\u56fd\u304b\u3089\u6765\u307e\u3057\u305f\u304b\u3002",
    romaji: "Dono kuni kara kimashita ka.",
    meaning: "Anda berasal dari negara mana?",
  },
  "\u4eba": {
    japanese: "\u3042\u306e\u4eba\u306f\u8aa4\u3067\u3059\u304b\u3002",
    romaji: "Ano hito wa dare desu ka.",
    meaning: "Siapa orang itu?",
  },
  "\u6642": {
    japanese: "\u4eca\u3001\u4f55\u6642\u3067\u3059\u304b\u3002",
    romaji: "Ima, nanji desu ka.",
    meaning: "Sekarang jam berapa?",
  },
  "\u9593": {
    japanese: "\u6388\u696d\u306f2\u6642\u9593\u3042\u308a\u307e\u3059\u3002",
    romaji: "Jugyou wa nijikan arimasu.",
    meaning: "Pelajaran berlangsung 2 jam.",
  },
  "\u9031": {
    japanese:
      "\u6765\u9031\u3001\u53cb\u9054\u3068\u4f1a\u3044\u307e\u3059\u3002",
    romaji: "Raishuu, tomodachi to aimasu.",
    meaning: "Minggu depan saya bertemu teman.",
  },
  "\u6708": {
    japanese:
      "\u6bce\u6708\u3001\u7d66\u6599\u3092\u3082\u3089\u3044\u307e\u3059\u3002",
    romaji: "Maitsuki, kyuuryou o moraimasu.",
    meaning: "Setiap bulan saya menerima gaji.",
  },
  "\u5e74": {
    japanese:
      "\u6765\u5e74\u3001\u65e5\u672c\u3078\u884c\u304d\u305f\u3044\u3067\u3059\u3002",
    romaji: "Rainen, Nihon e ikitai desu.",
    meaning: "Tahun depan saya ingin pergi ke Jepang.",
  },
  "\u4eca": {
    japanese: "\u4eca\u304b\u3089\u52c9\u5f37\u3057\u307e\u3059\u3002",
    romaji: "Ima kara benkyou shimasu.",
    meaning: "Saya akan mulai belajar sekarang.",
  },
  "\u5148": {
    japanese: "\u5148\u751f\u306b\u8cea\u554f\u3057\u307e\u3059\u3002",
    romaji: "Sensei ni shitsumon shimasu.",
    meaning: "Saya bertanya kepada guru.",
  },
  "\u9ad8": {
    japanese:
      "\u3053\u306e\u5c71\u306f\u3068\u3066\u3082\u9ad8\u3044\u3067\u3059\u3002",
    romaji: "Kono yama wa totemo takai desu.",
    meaning: "Gunung ini sangat tinggi.",
  },
  "\u9577": {
    japanese: "\u3053\u306e\u6620\u753b\u306f\u9577\u3044\u3067\u3059\u3002",
    romaji: "Kono eiga wa nagai desu.",
    meaning: "Film ini panjang.",
  },
  "\u65b0": {
    japanese:
      "\u65b0\u3057\u3044\u30b9\u30de\u30db\u3092\u8cb7\u3044\u307e\u3057\u305f\u3002",
    romaji: "Atarashii sumaho o kaimashita.",
    meaning: "Saya membeli HP baru.",
  },
  "\u53e4": {
    japanese: "\u53e4\u3044\u5efa\u7269\u3092\u898b\u307e\u3057\u305f\u3002",
    romaji: "Furui tatemono o mimashita.",
    meaning: "Saya melihat bangunan tua.",
  },
  "\u5927": {
    japanese: "\u5927\u5b66\u306f\u5927\u304d\u3044\u3067\u3059\u3002",
    romaji: "Daigaku wa ookii desu.",
    meaning: "Universitas itu besar.",
  },
  "\u5c0f": {
    japanese: "\u5c0f\u3055\u3044\u732b\u304c\u3044\u307e\u3059\u3002",
    romaji: "Chiisai neko ga imasu.",
    meaning: "Ada kucing kecil.",
  },
};

function buildExampleSentence(
  entry: KanjiEntry,
  relatedVocab: VocabularyEntry[],
): { japanese: string; romaji: string; meaning: string } {
  if (EXAMPLE_SENTENCES[entry.character]) {
    return EXAMPLE_SENTENCES[entry.character];
  }
  if (relatedVocab.length > 0) {
    const v = relatedVocab[0];
    return {
      japanese: `${v.vocabulary}\u306f\u5927\u5207\u3067\u3059\u3002`,
      romaji: `${v.romaji} wa taisetsu desu.`,
      meaning: `${v.meaning} itu penting.`,
    };
  }
  return {
    japanese: `\u3053\u306e${entry.character}\u306f\u5927\u5207\u306a\u6f22\u5b57\u3067\u3059\u3002`,
    romaji: `Kono ${entry.romaji} wa taisetsu na kanji desu.`,
    meaning: `Kanji "${entry.meaning}" ini adalah kanji yang penting.`,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanjiAnswerPanelProps {
  isCorrect: boolean;
  entry: KanjiEntry;
  onNext: () => void;
  onReviewAgain: () => void;
  onViewRadical?: () => void;
  nextLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KanjiAnswerPanel({
  isCorrect,
  entry,
  onNext,
  onReviewAgain,
  onViewRadical,
  nextLabel = "Lanjut \u2192",
}: KanjiAnswerPanelProps): ReactElement {
  const safeVocab = useMemo(
    () => (Array.isArray(vocabularyData) ? vocabularyData : []),
    [],
  );

  const relatedVocab = useMemo(
    () => findRelatedVocab(entry.character, safeVocab, 3),
    [entry.character, safeVocab],
  );

  const radicalMeaning = useMemo(
    () => findRadicalMeaning(entry.radical),
    [entry.radical],
  );

  const exampleSentence = useMemo(
    () => buildExampleSentence(entry, relatedVocab),
    [entry, relatedVocab],
  );

  const borderCls = isCorrect
    ? "border-green-600 bg-green-950/20"
    : "border-red-600 bg-red-950/20";

  return (
    <Card className={borderCls} data-ocid="kanji_quiz.answer_panel">
      <CardContent className="pt-5 pb-4 space-y-4">
        {/* result badge */}
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
              <span className="font-bold text-green-400 text-base">Benar!</span>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              <span className="font-bold text-red-400 text-base">Salah</span>
            </>
          )}
        </div>

        {/* kanji header block */}
        <div className="bg-gray-900/60 rounded-xl p-4 flex items-start gap-4">
          <div className="text-center shrink-0">
            <div
              className="text-6xl font-bold text-white leading-none"
              data-ocid="kanji_quiz.answer_kanji"
            >
              {entry.character}
            </div>
            <Badge
              variant="outline"
              className="mt-2 text-xs border-cyan-700 text-cyan-300"
            >
              {entry.jlptLevel}
            </Badge>
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Bacaan / Romaji
              </p>
              <p
                className="text-cyan-300 font-semibold text-lg leading-tight"
                data-ocid="kanji_quiz.answer_romaji"
              >
                {entry.romaji}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Arti Indonesia
              </p>
              <p
                className="text-white font-medium text-base"
                data-ocid="kanji_quiz.answer_meaning"
              >
                {entry.meaning}
              </p>
            </div>
          </div>
        </div>

        {/* penjelasan */}
        {entry.explanation && (
          <div
            className="bg-gray-900/40 rounded-lg p-3"
            data-ocid="kanji_quiz.answer_explanation"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              Penjelasan
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {entry.explanation}
            </p>
          </div>
        )}

        {/* radikal */}
        {entry.radical && (
          <div
            className="bg-gray-900/40 rounded-lg p-3 flex items-start gap-4"
            data-ocid="kanji_quiz.answer_radical"
          >
            <div className="text-center shrink-0 bg-gray-800 rounded-lg p-2 min-w-[3rem]">
              <div className="text-3xl font-bold text-yellow-300 leading-none">
                {entry.radical.replace(/\s*\(.*\)/, "").trim()}
              </div>
              <p className="text-gray-500 text-xs mt-1">Radikal</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                Arti Radikal
              </p>
              <p className="text-yellow-200 font-medium text-sm">
                {radicalMeaning || entry.radical}
              </p>
              {onViewRadical && (
                <button
                  type="button"
                  onClick={onViewRadical}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  data-ocid="kanji_quiz.view_radical_inline_link"
                >
                  <ExternalLink className="w-3 h-3" />
                  Lihat halaman radikal
                </button>
              )}
            </div>
          </div>
        )}

        {/* contoh kosakata */}
        {relatedVocab.length > 0 && (
          <div
            className="bg-gray-900/40 rounded-lg p-3"
            data-ocid="kanji_quiz.answer_vocab_examples"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
              Contoh Kosakata
            </p>
            <div className="space-y-2">
              {relatedVocab.map((v, i) => (
                <div
                  key={v.vocabulary}
                  className="flex items-start gap-2"
                  data-ocid={`kanji_quiz.answer_vocab.${i + 1}`}
                >
                  <span className="text-cyan-300 font-bold text-base min-w-[5rem] shrink-0">
                    {v.vocabulary}
                  </span>
                  <span className="text-gray-400 text-sm leading-snug">
                    ({v.romaji}){" "}
                    <span className="text-gray-300">&mdash; {v.meaning}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* contoh kalimat */}
        <div
          className="bg-gray-900/40 rounded-lg p-3 border-l-2 border-cyan-700"
          data-ocid="kanji_quiz.answer_example_sentence"
        >
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
            Contoh Kalimat
          </p>
          <p className="text-white font-medium text-base leading-relaxed">
            {exampleSentence.japanese}
          </p>
          <p className="text-gray-400 text-sm mt-1 italic">
            ({exampleSentence.romaji})
          </p>
          <p className="text-cyan-200 text-sm mt-0.5">
            {exampleSentence.meaning}
          </p>
        </div>

        {/* action buttons */}
        <div
          className="flex flex-wrap gap-2 pt-1"
          data-ocid="kanji_quiz.answer_actions"
        >
          <Button
            type="button"
            variant="outline"
            onClick={onReviewAgain}
            size="sm"
            className="border-yellow-700 text-yellow-300 hover:bg-yellow-950/40 hover:text-yellow-200"
            data-ocid="kanji_quiz.review_again_button"
          >
            Pelajari Lagi
          </Button>
          {onViewRadical && (
            <Button
              type="button"
              variant="outline"
              onClick={onViewRadical}
              size="sm"
              className="border-purple-700 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 flex items-center gap-1"
              data-ocid="kanji_quiz.view_radical_button"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Radikal
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            size="sm"
            className="flex-1 min-w-[6rem] bg-cyan-600 hover:bg-cyan-500 text-white"
            data-ocid="kanji_quiz.next_button"
          >
            {nextLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
