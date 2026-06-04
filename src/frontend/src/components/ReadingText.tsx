/**
 * ReadingText.tsx
 * Renders a Japanese reading passage with clickable VocabPopover tokens.
 * Target vocabulary tokens are wrapped in VocabPopover.
 * Non-target tokens render as plain text.
 */
import { VocabPopover } from "./VocabPopover";

interface ReadingTextProps {
  sentences: string[];
  targetVocabulary: string[];
}

interface Segment {
  text: string;
  isJapanese: boolean;
  isTarget: boolean;
}

/**
 * Splits a sentence into segments:
 * - Japanese sequences (kanji/hiragana/katakana) -> isJapanese: true
 * - Everything else -> isJapanese: false
 *
 * Within Japanese blocks, greedy-splits on targetVocabulary so known words
 * keep their highlight distinction, while all other Japanese tokens are still
 * clickable via VocabPopover.
 */
function segmentSentence(sentence: string, targetSet: Set<string>): Segment[] {
  if (!sentence) return [];
  const JAPANESE_RE = /([\u3041-\u9FFF\uFF66-\uFF9F\u30A0-\u30FF]+)/g;
  const parts: Array<{ text: string; isJapanese: boolean }> = [];
  let lastIndex = 0;
  for (const match of sentence.matchAll(JAPANESE_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ text: sentence.slice(lastIndex, start), isJapanese: false });
    }
    parts.push({ text: match[0], isJapanese: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < sentence.length) {
    parts.push({ text: sentence.slice(lastIndex), isJapanese: false });
  }

  const sortedTargets = [...targetSet].sort((a, b) => b.length - a.length);
  const segments: Segment[] = [];

  for (const part of parts) {
    if (!part.isJapanese) {
      segments.push({ text: part.text, isJapanese: false, isTarget: false });
      continue;
    }
    let remaining = part.text;
    while (remaining.length > 0) {
      let matched = false;
      for (const t of sortedTargets) {
        if (t && remaining.startsWith(t)) {
          segments.push({ text: t, isJapanese: true, isTarget: true });
          remaining = remaining.slice(t.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        let cutAt = remaining.length;
        for (const t of sortedTargets) {
          const idx = remaining.indexOf(t, 1);
          if (idx !== -1 && idx < cutAt) cutAt = idx;
        }
        segments.push({
          text: remaining.slice(0, cutAt),
          isJapanese: true,
          isTarget: false,
        });
        remaining = remaining.slice(cutAt);
      }
    }
  }
  return segments;
}

export function ReadingText({ sentences, targetVocabulary }: ReadingTextProps) {
  const targetSet = new Set(targetVocabulary);

  return (
    <div
      className="reading-passage max-w-2xl mx-auto text-foreground"
      data-ocid="reading.passage"
    >
      {sentences.map((sentence, si) => {
        const segments = segmentSentence(sentence, targetSet);
        return (
          <p
            // biome-ignore lint/suspicious/noArrayIndexKey: sentences are static per render
            key={`sentence-${si}`}
            className="mb-5 leading-relaxed"
            style={{ fontSize: "1.2rem", lineHeight: "1.9" }}
            data-ocid={`reading.sentence.${si + 1}`}
          >
            {segments.map((seg, ci) =>
              seg.isJapanese ? (
                <VocabPopover
                  // biome-ignore lint/suspicious/noArrayIndexKey: segments are static per render
                  key={`seg-${si}-${ci}`}
                  word={seg.text}
                >
                  <span
                    className={
                      seg.isTarget
                        ? "underline underline-offset-4 decoration-dotted decoration-primary font-medium"
                        : undefined
                    }
                  >
                    {seg.text}
                  </span>
                </VocabPopover>
              ) : (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: segments are static per render
                  key={`seg-${si}-${ci}`}
                >
                  {seg.text}
                </span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
