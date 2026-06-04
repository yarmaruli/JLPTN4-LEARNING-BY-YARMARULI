/**
 * morphology.ts
 * V2 Morphology Engine — deInflect Japanese conjugated forms.
 * Returns possible dictionary forms with grammar pattern and explanation.
 * All explanations in Indonesian.
 */

export interface DeInflectResult {
  dictionaryForm: string;
  grammarPattern: string;
  grammarExplanation: string;
  wordType: "verb" | "i-adjective" | "na-adjective" | "noun" | "unknown";
}

// ============================================================================
// GRAMMAR PATTERNS CATALOG
// ============================================================================

export const GRAMMAR_PATTERNS: Record<
  string,
  { name: string; explanation: string }
> = {
  MASU_PAST: {
    name: "Past Tense (ました)",
    explanation: "Menyatakan aksi yang sudah selesai di masa lalu.",
  },
  MASU_NEG: {
    name: "Negative Present (ません)",
    explanation: "Bentuk negatif present tense (tidak ~).",
  },
  MASU_NEG_PAST: {
    name: "Negative Past (ませんでした)",
    explanation: "Bentuk negatif past tense (tidak ~ di masa lalu).",
  },
  TE_IRU: {
    name: "～ています",
    explanation: "Sedang melakukan aktivitas atau kondisi berlanjut.",
  },
  TE_ITA: {
    name: "～ていました",
    explanation: "Sedang melakukan aktivitas di masa lalu.",
  },
  TE_ITA_CASUAL: {
    name: "～ていた",
    explanation: "Kondisi berlanjut di masa lalu (casual).",
  },
  TE_IRU_CASUAL: {
    name: "～ている",
    explanation: "Kondisi berlanjut (casual).",
  },
  TE_FORM: {
    name: "Te-form (て)",
    explanation: "Bentuk て digunakan untuk menghubungkan klausa.",
  },
  TA_CASUAL: {
    name: "Past Casual (た)",
    explanation: "Bentuk lampau casual.",
  },
  NAI: {
    name: "Negative Casual (ない)",
    explanation: "Bentuk negatif casual (tidak ~).",
  },
  NAKATTA: {
    name: "Negative Past Casual (なかった)",
    explanation: "Bentuk negatif lampau casual.",
  },
  TE_SHIMAU: {
    name: "～てしまいました",
    explanation: "Menyelesaikan aksi (seringkali tidak sengaja atau disesali).",
  },
  POTENTIAL: {
    name: "Potential (られる)",
    explanation: "Menyatakan kemampuan melakukan sesuatu.",
  },
  CAUSATIVE: {
    name: "Causative (させる)",
    explanation: "Membuat/menyuruh seseorang melakukan sesuatu.",
  },
  // I-ADJECTIVE
  IADJ_PAST: {
    name: "I-Adjective Past (かった)",
    explanation: "Kata sifat -i bentuk lampau.",
  },
  IADJ_NEG: {
    name: "I-Adjective Negative (くない)",
    explanation: "Kata sifat -i bentuk negatif.",
  },
  IADJ_NEG_PAST: {
    name: "I-Adjective Negative Past (くなかった)",
    explanation: "Kata sifat -i bentuk negatif lampau.",
  },
  IADJ_TE: {
    name: "I-Adjective Te-form (くて)",
    explanation: "Kata sifat -i bentuk て untuk menghubungkan.",
  },
  // NA-ADJECTIVE
  NAADJ_PAST: {
    name: "Na-Adjective Past (でした)",
    explanation: "Kata sifat -na bentuk lampau.",
  },
  NAADJ_NEG: {
    name: "Na-Adjective Negative (ではありません)",
    explanation: "Kata sifat -na bentuk negatif.",
  },
  NAADJ_NEG_PAST: {
    name: "Na-Adjective Negative Past (ではありませんでした)",
    explanation: "Kata sifat -na bentuk negatif lampau.",
  },
  NAADJ_NEG_CASUAL: {
    name: "Na-Adjective Casual Negative (じゃない)",
    explanation: "Kata sifat -na bentuk negatif casual.",
  },
};

// ============================================================================
// HELPER: Reconstruct masu-stem for Group 1 verbs (godan)
// ============================================================================

function godanTaToMasu(stem: string, ending: string): string[] {
  // stem is the part before った/んだ/いた/いで/んで etc.
  // ending tells us what kind of godan verb it was
  const results: string[] = [];
  switch (ending) {
    case "った":
    case "って":
      // could be: ~ります, ~います, ~ちます
      results.push(`${stem}ります`, `${stem}います`, `${stem}ちます`);
      break;
    case "んだ":
    case "んで":
      // ~にます, ~びます, ~みます
      results.push(`${stem}にます`, `${stem}びます`, `${stem}みます`);
      break;
    case "いた":
    case "いて":
      // ~きます
      results.push(`${stem}きます`);
      break;
    case "いだ":
    case "いで":
      // ~ぎます
      results.push(`${stem}ぎます`);
      break;
    case "した":
    case "して":
      // ~します (suru verb)
      results.push(`${stem}します`);
      break;
    case "った_ichidan":
      // ichidan: remove った, add ます
      results.push(`${stem}ます`);
      break;
  }
  return results;
}

// ============================================================================
// MAIN: deInflect
// ============================================================================

/**
 * Attempt to de-inflect a Japanese word and return possible dictionary forms
 * with grammar pattern information.
 */
export function deInflect(word: string): DeInflectResult[] {
  if (!word) return [];
  const results: DeInflectResult[] = [];
  const add = (df: string, patKey: string, wt: DeInflectResult["wordType"]) => {
    const pat = GRAMMAR_PATTERNS[patKey];
    if (!pat) return;
    if (
      !results.some(
        (r) => r.dictionaryForm === df && r.grammarPattern === pat.name,
      )
    ) {
      results.push({
        dictionaryForm: df,
        grammarPattern: pat.name,
        grammarExplanation: pat.explanation,
        wordType: wt,
      });
    }
  };

  // ── NA-ADJECTIVE (check before verb since endings overlap) ──────────
  if (word.endsWith("ではありませんでした")) {
    add(word.slice(0, -9), "NAADJ_NEG_PAST", "na-adjective");
  }
  if (word.endsWith("ではありません")) {
    add(word.slice(0, -7), "NAADJ_NEG", "na-adjective");
  }
  if (word.endsWith("じゃありません")) {
    add(word.slice(0, -7), "NAADJ_NEG", "na-adjective");
  }
  if (word.endsWith("じゃない")) {
    add(word.slice(0, -4), "NAADJ_NEG_CASUAL", "na-adjective");
  }
  if (word.endsWith("でした")) {
    add(word.slice(0, -3), "NAADJ_PAST", "na-adjective");
  }

  // ── I-ADJECTIVE ─────────────────────────────────────────────────────
  if (word.endsWith("くなかった")) {
    add(`${word.slice(0, -5)}い`, "IADJ_NEG_PAST", "i-adjective");
  }
  if (word.endsWith("くない")) {
    add(`${word.slice(0, -3)}い`, "IADJ_NEG", "i-adjective");
  }
  if (word.endsWith("くて")) {
    add(`${word.slice(0, -2)}い`, "IADJ_TE", "i-adjective");
  }
  if (word.endsWith("かった")) {
    add(`${word.slice(0, -3)}い`, "IADJ_PAST", "i-adjective");
  }

  // ── VERB — longest suffixes first ────────────────────────────────────

  // ～ませんでした
  if (word.endsWith("ませんでした")) {
    add(`${word.slice(0, -6)}ます`, "MASU_NEG_PAST", "verb");
  }

  // ～てしまいました / ～でしまいました
  if (word.endsWith("てしまいました")) {
    add(`${word.slice(0, -7)}ます`, "TE_SHIMAU", "verb");
  }
  if (word.endsWith("でしまいました")) {
    add(`${word.slice(0, -7)}ます`, "TE_SHIMAU", "verb");
  }

  // ～ていました / ～でいました
  if (word.endsWith("ていました")) {
    const stem = word.slice(0, -5);
    add(`${stem}ます`, "TE_ITA", "verb");
    add(`${stem}る`, "TE_ITA", "verb");
  }
  if (word.endsWith("でいました")) {
    const stem = word.slice(0, -5);
    add(`${stem}ます`, "TE_ITA", "verb");
  }

  // ～んでいました
  if (word.endsWith("んでいました")) {
    const stem = word.slice(0, -6);
    for (const s of godanTaToMasu(stem, "んで")) add(s, "TE_ITA", "verb");
  }

  // ～んでいます / ～んでいる / ～んでいた
  if (word.endsWith("んでいます")) {
    const stem = word.slice(0, -5);
    for (const s of godanTaToMasu(stem, "んで")) add(s, "TE_IRU", "verb");
  }
  if (word.endsWith("んでいる")) {
    const stem = word.slice(0, -4);
    for (const s of godanTaToMasu(stem, "んで"))
      add(s, "TE_IRU_CASUAL", "verb");
  }
  if (word.endsWith("んでいた")) {
    const stem = word.slice(0, -4);
    for (const s of godanTaToMasu(stem, "んで"))
      add(s, "TE_ITA_CASUAL", "verb");
  }

  // ～ています / ～でいます
  if (word.endsWith("ています")) {
    const stem = word.slice(0, -4);
    add(`${stem}ます`, "TE_IRU", "verb");
    add(`${stem}る`, "TE_IRU", "verb");
  }
  if (word.endsWith("でいます")) {
    const stem = word.slice(0, -4);
    add(`${stem}ます`, "TE_IRU", "verb");
  }

  // ～ている / ～でいる
  if (word.endsWith("ている")) {
    const stem = word.slice(0, -3);
    add(`${stem}ます`, "TE_IRU_CASUAL", "verb");
    add(`${stem}る`, "TE_IRU_CASUAL", "verb");
  }
  if (word.endsWith("でいる")) {
    const stem = word.slice(0, -3);
    add(`${stem}ます`, "TE_IRU_CASUAL", "verb");
  }

  // ～ていた / ～でいた
  if (word.endsWith("ていた")) {
    const stem = word.slice(0, -3);
    add(`${stem}ます`, "TE_ITA_CASUAL", "verb");
    add(`${stem}る`, "TE_ITA_CASUAL", "verb");
  }
  if (word.endsWith("でいた")) {
    const stem = word.slice(0, -3);
    add(`${stem}ます`, "TE_ITA_CASUAL", "verb");
  }

  // ～ました
  if (word.endsWith("ました")) {
    add(`${word.slice(0, -3)}ます`, "MASU_PAST", "verb");
  }

  // ～ません
  if (word.endsWith("ません")) {
    add(`${word.slice(0, -3)}ます`, "MASU_NEG", "verb");
  }

  // ～られた / ～られる
  if (word.endsWith("られた")) {
    add(`${word.slice(0, -3)}ます`, "POTENTIAL", "verb");
    add(`${word.slice(0, -3)}る`, "POTENTIAL", "verb");
  }
  if (word.endsWith("られます")) {
    add(`${word.slice(0, -4)}ます`, "POTENTIAL", "verb");
    add(`${word.slice(0, -4)}る`, "POTENTIAL", "verb");
  }

  // ～させた / ～させる / ～させます
  if (word.endsWith("させました")) {
    add(`${word.slice(0, -5)}ます`, "CAUSATIVE", "verb");
  }
  if (word.endsWith("させた")) {
    add(`${word.slice(0, -3)}ます`, "CAUSATIVE", "verb");
  }

  // ～なかった
  if (word.endsWith("なかった")) {
    add(`${word.slice(0, -4)}ます`, "NAKATTA", "verb");
    add(`${word.slice(0, -4)}ない`, "NAKATTA", "verb");
  }

  // ～ない
  if (word.endsWith("ない")) {
    add(`${word.slice(0, -2)}ます`, "NAI", "verb");
  }

  // ～って (casual te-form for つ/う/る godan)
  if (word.endsWith("って")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "った")) add(s, "TE_FORM", "verb");
  }

  // ～った (casual past for godan)
  if (word.endsWith("った")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "った")) add(s, "TA_CASUAL", "verb");
    // also ichidan possibility: strip った add ます
    add(`${stem}ます`, "TA_CASUAL", "verb");
  }

  // ～んだ (casual past for n-row godan)
  if (word.endsWith("んだ")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "んだ")) add(s, "TA_CASUAL", "verb");
  }

  // ～んで (te-form for n-row godan)
  if (word.endsWith("んで")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "んで")) add(s, "TE_FORM", "verb");
  }

  // ～いた (past for k-row godan)
  if (word.endsWith("いた")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "いた")) add(s, "TA_CASUAL", "verb");
  }

  // ～いて (te-form for k-row godan)
  if (word.endsWith("いて")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "いて")) add(s, "TE_FORM", "verb");
  }

  // ～いだ (past for g-row godan)
  if (word.endsWith("いだ")) {
    const stem = word.slice(0, -2);
    for (const s of godanTaToMasu(stem, "いだ")) add(s, "TA_CASUAL", "verb");
  }

  // ～した (past for suru verb)
  if (
    word.endsWith("した") &&
    !word.endsWith("ました") &&
    !word.endsWith("でした")
  ) {
    const stem = word.slice(0, -2);
    add(`${stem}します`, "TA_CASUAL", "verb");
    add(`${word.slice(0, -2)}する`, "TA_CASUAL", "verb");
  }

  // ～て (te-form — only if ends in just て and has substance before)
  if (
    word.endsWith("て") &&
    word.length > 1 &&
    !word.endsWith("して") &&
    !word.endsWith("って") &&
    !word.endsWith("いて") &&
    !word.endsWith("んで") &&
    !word.endsWith("でいて")
  ) {
    const stem = word.slice(0, -1);
    add(`${stem}ます`, "TE_FORM", "verb");
  }

  // ～た (casual past — ichidan/group2 ending in た directly)
  if (
    word.endsWith("た") &&
    word.length > 1 &&
    !word.endsWith("った") &&
    !word.endsWith("いた") &&
    !word.endsWith("んだ".replace("だ", "た")) &&
    !word.endsWith("した") &&
    !word.endsWith("ました") &&
    !word.endsWith("かった") &&
    !word.endsWith("でした")
  ) {
    // Strip た and try both ます and る
    add(`${word.slice(0, -1)}ます`, "TA_CASUAL", "verb");
    add(`${word.slice(0, -1)}る`, "TA_CASUAL", "verb");
  }

  return results;
}
