import Debug "mo:core/Debug";

module {
  // ─── Quiz Result ──────────────────────────────────────────────────────────

  /// A single quiz answer event recorded by the frontend.
  public type QuizResult = {
    itemId    : Text;  // kanji character, radical character, or vocab id
    itemType  : Text;  // "kanji" | "radical" | "vocab"
    isCorrect : Bool;
    timestamp : Int;
    quizMode  : Text;  // e.g. "kanji-to-hiragana", "radical-guided"
  };

  // ─── Kanji Mastery (flat public view, field names match requirement spec) ──

  /// Public view of kanji mastery as expected by the requirements contract.
  /// Uses `kanji` (not `kanjiId`) to match the specification.
  public type KanjiMastery = {
    kanji        : Text;
    seenCount    : Nat;
    correctCount : Nat;
    wrongCount   : Nat;
    masteryLevel : Nat;  // 0–4
    lastSeen     : Int;
    lastCorrect  : Int;
    lastWrong    : Int;
  };

  // ─── Radical Mastery (flat public view, field names match requirement spec)

  /// Public view of radical mastery as expected by the requirements contract.
  /// Uses `radical` (not `radicalId`) to match the specification.
  public type RadicalMastery = {
    radical      : Text;
    seenCount    : Nat;
    correctCount : Nat;
    wrongCount   : Nat;
    masteryLevel : Nat;  // 0–4
  };

  // ─── Quiz Analytics ───────────────────────────────────────────────────────

  public type QuizAnalytics = {
    totalQuizzes : Nat;
    totalCorrect : Nat;
    totalWrong   : Nat;
    accuracy     : Float;  // 0.0–1.0
  };
};
