import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import DataTypes "../types/data-expansion";
import MasteryTypes "../types/mastery";
import MasteryLib "../lib/mastery";

/// Public API mixin for the mastery domain.
/// Receives the shared kanji / radical mastery stores from main.mo,
/// plus a dedicated quiz result log.
mixin (
  kanjiMastery  : Map.Map<Text, DataTypes.KanjiMasteryRecord>,
  radicalMastery : Map.Map<Text, DataTypes.RadicalMasteryRecord>,
  quizResults   : List.List<MasteryTypes.QuizResult>,
) {

  // ─── Kanji Mastery ──────────────────────────────────────────────────────────

  /// Upsert kanji mastery record for `kanji` based on a correct/wrong answer.
  public shared ({ caller }) func updateKanjiMastery(
    kanji     : Text,
    isCorrect : Bool,
  ) : async MasteryTypes.KanjiMastery {
    ignore caller;
    MasteryLib.updateKanjiMastery(kanjiMastery, kanji, isCorrect, Time.now());
  };

  /// Get the mastery record for a specific kanji (returns null if never seen).
  public query func getKanjiMasteryByChar(
    kanji : Text,
  ) : async ?MasteryTypes.KanjiMastery {
    switch (kanjiMastery.get(kanji)) {
      case (?rec) ?MasteryLib.toKanjiMastery(rec);
      case null   null;
    };
  };

  /// Return all kanji mastery records.
  public query func getAllKanjiMastery() : async [MasteryTypes.KanjiMastery] {
    MasteryLib.getAllKanjiMastery(kanjiMastery);
  };

  /// Return kanji with wrongCount > threshold OR accuracy < 50%.
  public query func getWeakKanjiByThreshold(
    threshold : Nat,
  ) : async [MasteryTypes.KanjiMastery] {
    MasteryLib.getWeakKanjiByThreshold(kanjiMastery, threshold);
  };

  /// Return kanji characters that have never been seen (seenCount = 0).
  /// The caller supplies `allKanji` — the complete static dataset.
  public query func getUntouchedKanji(
    allKanji : [Text],
  ) : async [Text] {
    MasteryLib.getUntouchedKanji(kanjiMastery, allKanji);
  };

  /// Return the supplied list of Dokkai-priority kanji (static pass-through).
  public query func getDokkaiPriorityKanji(
    dokkaiKanji : [Text],
  ) : async [Text] {
    MasteryLib.getDokkaiPriorityKanji(dokkaiKanji);
  };

  // ─── Radical Mastery ────────────────────────────────────────────────────────

  /// Upsert radical mastery record for `radical` based on a correct/wrong answer.
  public shared ({ caller }) func updateRadicalMastery(
    radical   : Text,
    isCorrect : Bool,
  ) : async MasteryTypes.RadicalMastery {
    ignore caller;
    MasteryLib.updateRadicalMastery(radicalMastery, radical, isCorrect, Time.now());
  };

  /// Get the mastery record for a specific radical (returns null if never seen).
  public query func getRadicalMasteryByChar(
    radical : Text,
  ) : async ?MasteryTypes.RadicalMastery {
    switch (radicalMastery.get(radical)) {
      case (?rec) ?MasteryLib.toRadicalMastery(rec);
      case null   null;
    };
  };

  /// Return all radical mastery records.
  public query func getAllRadicalMastery() : async [MasteryTypes.RadicalMastery] {
    MasteryLib.getAllRadicalMastery(radicalMastery);
  };

  // ─── Quiz Results ────────────────────────────────────────────────────────────

  /// Record a single quiz answer event.
  public shared ({ caller }) func recordQuizResult(
    itemId    : Text,
    itemType  : Text,
    isCorrect : Bool,
    quizMode  : Text,
  ) : async () {
    ignore caller;
    MasteryLib.recordQuizResult(
      quizResults,
      { itemId; itemType; isCorrect; quizMode; timestamp = Time.now() },
    );
  };

  /// Get aggregate quiz analytics: totalQuizzes, totalCorrect, totalWrong, accuracy.
  public query func getQuizAnalytics() : async MasteryTypes.QuizAnalytics {
    MasteryLib.getQuizAnalytics(quizResults);
  };
};
