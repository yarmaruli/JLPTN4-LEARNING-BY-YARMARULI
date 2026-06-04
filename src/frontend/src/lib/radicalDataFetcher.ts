import {
  type KanjiEntry,
  type RadicalInfo,
  type VocabularyEntry,
  kanjiData,
  radicalData,
  vocabularyData,
} from "../data/kanjiData";

interface ParsedRadical {
  name: string;
  origin: string;
  meaning: string;
  relatedConcepts: string;
  kanjiList: string[];
  vocabularyList: string[];
}

interface ParsedKanji {
  character: string;
  romaji: string;
  meaning: string;
  radical: string;
  wordType: string;
  similarKanji: string[];
  explanation: string;
  jlptLevel: string;
}

interface ParsedVocabulary {
  vocabulary: string;
  romaji: string;
  meaning: string;
  radical: string;
  wordType: string;
  explanation: string;
  jlptLevel: string;
}

interface FetchResult {
  newRadicals: ParsedRadical[];
  newKanji: ParsedKanji[];
  newVocabulary: ParsedVocabulary[];
  allRadicals: ParsedRadical[];
  allKanji: ParsedKanji[];
  allVocabulary: ParsedVocabulary[];
  pagesProcessed: number;
}

interface N5FetchResult {
  newKanji: ParsedKanji[];
  newVocabulary: ParsedVocabulary[];
  allKanji: ParsedKanji[];
  allVocabulary: ParsedVocabulary[];
  totalEntries: number;
}

/**
 * Fetch and parse JLPT N5 data from kanjikana.com
 * This function scrapes the N5 page and extracts kanji and vocabulary data
 */
export async function fetchAndParseN5Data(
  onProgress?: (progress: number) => void,
): Promise<N5FetchResult> {
  const url = "https://kanjikana.com/id/kanji/jlpt/n5";

  try {
    if (onProgress) onProgress(10);

    console.log("🌐 Mengambil data JLPT N5 dari:", url);

    // Fetch the page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Gagal mengambil halaman N5: ${response.status}`);
    }

    if (onProgress) onProgress(30);

    const html = await response.text();

    if (onProgress) onProgress(50);

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (onProgress) onProgress(60);

    console.log("📄 Halaman berhasil diambil, mulai parsing...");

    // Extract kanji and vocabulary data from the page
    const { kanji, vocabulary } = parseN5DataFromPage(doc);

    console.log(
      `✅ Parsing selesai: ${kanji.length} kanji, ${vocabulary.length} kosakata`,
    );

    if (onProgress) onProgress(80);

    // Compare with existing data
    const newKanji = findNewKanji(kanji);
    const newVocabulary = findNewVocabulary(vocabulary);

    console.log(
      `🆕 Data baru: ${newKanji.length} kanji, ${newVocabulary.length} kosakata`,
    );

    if (onProgress) onProgress(100);

    return {
      newKanji,
      newVocabulary,
      allKanji: kanji,
      allVocabulary: vocabulary,
      totalEntries: kanji.length + vocabulary.length,
    };
  } catch (error) {
    console.error("❌ Error mengambil data N5:", error);
    throw error;
  }
}

/**
 * Parse N5 kanji and vocabulary from the kanjikana.com page
 * Extracts data from various HTML structures on the page
 */
function parseN5DataFromPage(doc: Document): {
  kanji: ParsedKanji[];
  vocabulary: ParsedVocabulary[];
} {
  const kanjiList: ParsedKanji[] = [];
  const vocabularyList: ParsedVocabulary[] = [];

  console.log("🔍 Mencari elemen kanji dan kosakata...");

  // Try multiple selector strategies to find kanji/vocabulary entries
  const possibleSelectors = [
    ".kanji-entry",
    ".kanji-item",
    ".kanji-card",
    "[data-kanji]",
    "article.kanji",
    "div.kanji",
    ".entry",
    ".item",
    "table tr",
    ".list-item",
  ];

  let elements: NodeListOf<Element> | null = null;

  for (const selector of possibleSelectors) {
    const found = doc.querySelectorAll(selector);
    if (found.length > 0) {
      console.log(
        `✓ Menemukan ${found.length} elemen dengan selector: ${selector}`,
      );
      elements = found;
      break;
    }
  }

  if (!elements || elements.length === 0) {
    console.warn(
      "⚠️ Tidak menemukan elemen dengan selector standar, mencoba parsing alternatif...",
    );

    // Alternative: Look for any elements containing Japanese characters
    const allElements = doc.querySelectorAll("div, article, section, li, tr");
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;

    for (const element of Array.from(allElements)) {
      const text = element.textContent || "";
      if (japaneseRegex.test(text) && text.length < 200) {
        // This might be a kanji/vocabulary entry
        tryParseElement(element, kanjiList, vocabularyList);
      }
    }
  } else {
    // Parse found elements
    for (const element of Array.from(elements)) {
      tryParseElement(element, kanjiList, vocabularyList);
    }
  }

  console.log(
    `📊 Hasil parsing: ${kanjiList.length} kanji, ${vocabularyList.length} kosakata`,
  );

  return { kanji: kanjiList, vocabulary: vocabularyList };
}

/**
 * Try to parse a single element as kanji or vocabulary entry
 */
function tryParseElement(
  element: Element,
  kanjiList: ParsedKanji[],
  vocabularyList: ParsedVocabulary[],
): void {
  try {
    const text = element.textContent || "";

    // Extract Japanese character (kanji or kana)
    const japaneseMatch = text.match(
      /[\u4E00-\u9FAF]|[\u3040-\u309F\u30A0-\u30FF]+/,
    );
    if (!japaneseMatch) return;

    const character = japaneseMatch[0];

    // Try to find romaji (usually in parentheses or specific elements)
    let romaji = "";
    const romajiSelectors = [
      ".romaji",
      ".reading",
      ".furigana",
      ".pronunciation",
      "[data-romaji]",
    ];
    for (const selector of romajiSelectors) {
      const romajiEl = element.querySelector(selector);
      if (romajiEl) {
        romaji = romajiEl.textContent?.trim() || "";
        break;
      }
    }

    // If no romaji found in specific element, try to extract from text
    if (!romaji) {
      const romajiMatch = text.match(/\(([a-zA-Z\s]+)\)/);
      if (romajiMatch) {
        romaji = romajiMatch[1].trim();
      }
    }

    // Try to find meaning (usually in Indonesian or English)
    let meaning = "";
    const meaningSelectors = [
      ".meaning",
      ".arti",
      ".translation",
      ".definition",
      "[data-meaning]",
    ];
    for (const selector of meaningSelectors) {
      const meaningEl = element.querySelector(selector);
      if (meaningEl) {
        meaning = meaningEl.textContent?.trim() || "";
        break;
      }
    }

    // If no meaning found, try to extract from text
    if (!meaning) {
      // Look for Indonesian/English words after the Japanese
      const parts = text.split(/[:\-–]/);
      if (parts.length > 1) {
        meaning = parts[parts.length - 1].trim();
      }
    }

    // Extract radical if available
    let radical = "";
    const radicalSelectors = [".radical", "[data-radical]"];
    for (const selector of radicalSelectors) {
      const radicalEl = element.querySelector(selector);
      if (radicalEl) {
        radical = radicalEl.textContent?.trim() || "";
        break;
      }
    }

    // Extract word type if available
    let wordType = "Kata Benda";
    const typeSelectors = [".type", ".word-type", ".jenis", "[data-type]"];
    for (const selector of typeSelectors) {
      const typeEl = element.querySelector(selector);
      if (typeEl) {
        wordType = typeEl.textContent?.trim() || "Kata Benda";
        break;
      }
    }

    // Determine if it's a kanji (single character) or vocabulary (multiple characters)
    if (character.length === 1 && /[\u4E00-\u9FAF]/.test(character)) {
      // It's a kanji
      if (romaji && meaning) {
        kanjiList.push({
          character,
          romaji,
          meaning,
          radical: radical || "",
          wordType: "Kanji",
          similarKanji: [],
          explanation: `Kanji ${character} dari JLPT N5. ${meaning}`,
          jlptLevel: "N5",
        });
      }
    }

    // Also add as vocabulary if it has romaji and meaning
    if (character && romaji && meaning) {
      vocabularyList.push({
        vocabulary: character,
        romaji,
        meaning,
        radical: radical || "",
        wordType: wordType || "Kata Benda",
        explanation: `Kosakata ${character} dari JLPT N5. ${meaning}`,
        jlptLevel: "N5",
      });
    }
  } catch (_error) {
    // Silently skip problematic elements
  }
}

/**
 * Fetch and parse radical data from kanjikana.com pages 2-14
 */
export async function fetchAndParseRadicalData(
  onProgress?: (progress: number) => void,
): Promise<FetchResult> {
  const baseUrl = "https://kanjikana.com/id/kanji/radicals/";
  const pages = Array.from({ length: 13 }, (_, i) => i + 2); // pages 2-14
  const totalPages = pages.length;

  const allParsedRadicals: ParsedRadical[] = [];
  const allParsedKanji: ParsedKanji[] = [];
  const allParsedVocabulary: ParsedVocabulary[] = [];

  let processedPages = 0;

  for (const pageNum of pages) {
    try {
      const url = `${baseUrl}pages/${pageNum}`;

      console.log(`📄 Mengambil halaman ${pageNum}...`);

      // Fetch the page
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(
          `⚠️ Gagal mengambil halaman ${pageNum}: ${response.status}`,
        );
        continue;
      }

      const html = await response.text();

      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Extract radical data from the page
      const radicals = parseRadicalsFromPage(doc);
      allParsedRadicals.push(...radicals);

      // Extract kanji data from the page
      const kanji = parseKanjiFromPage(doc);
      allParsedKanji.push(...kanji);

      processedPages++;

      console.log(
        `✅ Halaman ${pageNum} selesai: ${radicals.length} radikal, ${kanji.length} kanji`,
      );

      // Update progress
      if (onProgress) {
        const progress = Math.round((processedPages / totalPages) * 100);
        onProgress(progress);
      }

      // Add a small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error memproses halaman ${pageNum}:`, error);
    }
  }

  // Compare with existing data
  const newRadicals = findNewRadicals(allParsedRadicals);
  const newKanji = findNewKanji(allParsedKanji);
  const newVocabulary = findNewVocabulary(allParsedVocabulary);

  console.log(
    `🎉 Selesai! Total: ${allParsedRadicals.length} radikal, ${allParsedKanji.length} kanji`,
  );
  console.log(
    `🆕 Baru: ${newRadicals.length} radikal, ${newKanji.length} kanji`,
  );

  return {
    newRadicals,
    newKanji,
    newVocabulary,
    allRadicals: allParsedRadicals,
    allKanji: allParsedKanji,
    allVocabulary: allParsedVocabulary,
    pagesProcessed: processedPages,
  };
}

/**
 * Parse radical information from a page
 */
function parseRadicalsFromPage(doc: Document): ParsedRadical[] {
  const radicals: ParsedRadical[] = [];

  const radicalElements = doc.querySelectorAll(
    ".radical-item, .kanji-radical, [data-radical]",
  );

  for (const element of Array.from(radicalElements)) {
    try {
      const radicalSymbol =
        element
          .querySelector(".radical-symbol, .radical-char")
          ?.textContent?.trim() || "";
      const radicalName =
        element.querySelector(".radical-name, .name")?.textContent?.trim() ||
        "";
      const meaning =
        element
          .querySelector(".radical-meaning, .meaning")
          ?.textContent?.trim() || "";
      const description =
        element
          .querySelector(".radical-description, .description, .origin")
          ?.textContent?.trim() || "";

      const kanjiElements = element.querySelectorAll(
        ".kanji-list .kanji, .associated-kanji",
      );
      const kanjiList: string[] = [];
      for (const k of Array.from(kanjiElements)) {
        const char = k.textContent?.trim();
        if (char && char.length === 1) {
          kanjiList.push(char);
        }
      }

      if (radicalSymbol) {
        radicals.push({
          name: radicalSymbol,
          origin: description || radicalName,
          meaning: meaning || radicalName,
          relatedConcepts: description || `Radikal ${radicalName}`,
          kanjiList: kanjiList,
          vocabularyList: [],
        });
      }
    } catch (_error) {
      // Skip problematic elements
    }
  }

  return radicals;
}

/**
 * Parse kanji information from a page
 */
function parseKanjiFromPage(doc: Document): ParsedKanji[] {
  const kanjiList: ParsedKanji[] = [];

  const kanjiElements = doc.querySelectorAll(
    ".kanji-entry, .kanji-item, [data-kanji]",
  );

  for (const element of Array.from(kanjiElements)) {
    try {
      const character =
        element.querySelector(".kanji-char, .character")?.textContent?.trim() ||
        "";
      const romaji =
        element
          .querySelector(".kanji-reading, .romaji, .reading")
          ?.textContent?.trim() || "";
      const meaning =
        element
          .querySelector(".kanji-meaning, .meaning")
          ?.textContent?.trim() || "";
      const radical =
        element
          .querySelector(".kanji-radical, .radical")
          ?.textContent?.trim() || "";
      const wordType =
        element.querySelector(".word-type, .type")?.textContent?.trim() ||
        "Kanji";
      const explanation =
        element
          .querySelector(".explanation, .description")
          ?.textContent?.trim() || "";

      if (character && character.length === 1) {
        kanjiList.push({
          character,
          romaji: romaji || "",
          meaning: meaning || "",
          radical: radical || "",
          wordType: wordType || "Kanji",
          similarKanji: [],
          explanation: explanation || `Kanji ${character}`,
          jlptLevel: "N4",
        });
      }
    } catch (_error) {
      // Skip problematic elements
    }
  }

  return kanjiList;
}

/**
 * Find radicals that don't exist in current data
 */
function findNewRadicals(parsedRadicals: ParsedRadical[]): ParsedRadical[] {
  const existingRadicalNames = new Set(radicalData.map((r) => r.name));
  return parsedRadicals.filter((r) => !existingRadicalNames.has(r.name));
}

/**
 * Find kanji that don't exist in current data
 */
function findNewKanji(parsedKanji: ParsedKanji[]): ParsedKanji[] {
  const existingKanjiChars = new Set(kanjiData.map((k) => k.character));
  return parsedKanji.filter((k) => !existingKanjiChars.has(k.character));
}

/**
 * Find vocabulary that don't exist in current data
 */
function findNewVocabulary(
  parsedVocabulary: ParsedVocabulary[],
): ParsedVocabulary[] {
  const existingVocabWords = new Set(vocabularyData.map((v) => v.vocabulary));
  return parsedVocabulary.filter((v) => !existingVocabWords.has(v.vocabulary));
}
