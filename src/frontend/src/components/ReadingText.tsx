/**
 * ReadingText.tsx
 * Renders a Japanese reading passage with clickable VocabPopover tokens.
 * Uses the V3 Japanese tokenizer (dictionary longest-match + particles).
 * Each token becomes a clickable VocabPopover span.
 */
import { vocabularyData } from "@/data/kanjiData";
import { tokenize } from "@/lib/tokenizer";
import { VocabPopover } from "./VocabPopover";

interface ReadingTextProps {
  sentences: string[];
  targetVocabulary: string[];
}

/**
 * Determine if a string contains any Japanese character.
 */
function hasJapanese(text: string): boolean {
  return /[\u3041-\u9FFF\uFF66-\uFF9F\u30A0-\u30FF]/.test(text);
}

export function ReadingText({ sentences, targetVocabulary }: ReadingTextProps) {
  const targetSet = new Set(targetVocabulary);

  return (
    <div
      className="reading-passage max-w-2xl mx-auto text-foreground"
      data-ocid="reading.passage"
    >
      {sentences.map((sentence, si) => {
        // Use V3 tokenizer: dictionary longest-match + particle detection
        const tokens = tokenize(sentence, vocabularyData);
        return (
          <p
            // biome-ignore lint/suspicious/noArrayIndexKey: sentences are static per render
            key={`sentence-${si}`}
            className="mb-5 leading-relaxed"
            style={{ fontSize: "1.2rem", lineHeight: "1.9" }}
            data-ocid={`reading.sentence.${si + 1}`}
          >
            {tokens.map((token, ci) =>
              hasJapanese(token) ? (
                <VocabPopover
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens are static per render
                  key={`tok-${si}-${ci}`}
                  word={token}
                >
                  <span
                    className={
                      targetSet.has(token)
                        ? "underline underline-offset-4 decoration-dotted decoration-primary font-medium"
                        : undefined
                    }
                  >
                    {token}
                  </span>
                </VocabPopover>
              ) : (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens are static per render
                  key={`tok-${si}-${ci}`}
                >
                  {token}
                </span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
