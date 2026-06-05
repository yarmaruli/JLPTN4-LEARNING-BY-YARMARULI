import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Float "mo:core/Float";
import DataTypes "../types/data-expansion";
import MasteryTypes "../types/mastery";

/// Domain logic for the mastery domain.
/// Operates on injected state slices — no state of its own.
module {

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /// Clamp a Nat mastery level to the 0–4 range used in the public contract.
  func clampLevel(level : Nat) : Nat {
    if (level > 4) 4 else level;
  };

  /// Convert an internal KanjiMasteryRecord to the requirements KanjiMastery shape.
  public func toKanjiMastery(r : DataTypes.KanjiMasteryRecord) : MasteryTypes.KanjiMastery {
    {
      kanji        = r.kanjiId;
      seenCount    = r.seenCount;
      correctCount = r.correctCount;
      wrongCount   = r.wrongCount;
      masteryLevel = clampLevel(r.masteryLevel);
      lastSeen     = r.lastSeen;
      lastCorrect  = r.lastCorrect;
      lastWrong    = r.lastWrong;
    };
  };

  /// Convert an internal RadicalMasteryRecord to the requirements RadicalMastery shape.
  public func toRadicalMastery(r : DataTypes.RadicalMasteryRecord) : MasteryTypes.RadicalMastery {
    {
      radical      = r.radicalId;
      seenCount    = r.seenCount;
      correctCount = r.correctCount;
      wrongCount   = r.wrongCount;
      masteryLevel = clampLevel(r.masteryLevel);
    };
  };

  // ─── updateKanjiMastery ──────────────────────────────────────────────────────

  /// Upsert the mastery record for `kanji`, incrementing correct/wrong counts
  /// and recomputing `masteryLevel`. Returns the updated public view.
  public func updateKanjiMastery(
    store     : Map.Map<Text, DataTypes.KanjiMasteryRecord>,
    kanji     : Text,
    isCorrect : Bool,
    now       : Int,
  ) : MasteryTypes.KanjiMastery {
    let rec = switch (store.get(kanji)) {
      case (?existing) { existing };
      case null {
        let fresh : DataTypes.KanjiMasteryRecord = {
          kanjiId      = kanji;
          var seenCount    = 0;
          var correctCount = 0;
          var wrongCount   = 0;
          var lookupCount  = 0;
          var masteryLevel = 0;
          var lastSeen     = 0;
          var lastCorrect  = 0;
          var lastWrong    = 0;
        };
        store.add(kanji, fresh);
        fresh;
      };
    };
    rec.seenCount    += 1;
    rec.lastSeen      := now;
    if (isCorrect) {
      rec.correctCount += 1;
      rec.lastCorrect  := now;
    } else {
      rec.wrongCount   += 1;
      rec.lastWrong    := now;
    };
    // masteryLevel 0-4: advance on correct when correctCount crosses thresholds
    let total = rec.correctCount + rec.wrongCount;
    let newLevel : Nat = if (total == 0) 0
      else if (rec.correctCount * 100 / total >= 80 and rec.correctCount >= 10) 4
      else if (rec.correctCount * 100 / total >= 70 and rec.correctCount >= 5)  3
      else if (rec.correctCount * 100 / total >= 60 and rec.correctCount >= 3)  2
      else if (rec.correctCount >= 1)                                            1
      else 0;
    rec.masteryLevel := newLevel;
    toKanjiMastery(rec);
  };

  // ─── updateRadicalMastery ────────────────────────────────────────────────────

  /// Upsert the mastery record for `radical`, incrementing correct/wrong counts
  /// and recomputing `masteryLevel`. Returns the updated public view.
  public func updateRadicalMastery(
    store     : Map.Map<Text, DataTypes.RadicalMasteryRecord>,
    radical   : Text,
    isCorrect : Bool,
    now       : Int,
  ) : MasteryTypes.RadicalMastery {
    let rec = switch (store.get(radical)) {
      case (?existing) { existing };
      case null {
        let fresh : DataTypes.RadicalMasteryRecord = {
          radicalId        = radical;
          var seenCount    = 0;
          var correctCount = 0;
          var wrongCount   = 0;
          var masteryLevel = 0;
          var lastSeen     = 0;
        };
        store.add(radical, fresh);
        fresh;
      };
    };
    rec.seenCount   += 1;
    rec.lastSeen     := now;
    if (isCorrect) {
      rec.correctCount += 1;
    } else {
      rec.wrongCount   += 1;
    };
    let total = rec.correctCount + rec.wrongCount;
    let newLevel : Nat = if (total == 0) 0
      else if (rec.correctCount * 100 / total >= 80 and rec.correctCount >= 10) 4
      else if (rec.correctCount * 100 / total >= 70 and rec.correctCount >= 5)  3
      else if (rec.correctCount * 100 / total >= 60 and rec.correctCount >= 3)  2
      else if (rec.correctCount >= 1)                                            1
      else 0;
    rec.masteryLevel := newLevel;
    toRadicalMastery(rec);
  };

  // ─── getAllKanjiMastery ──────────────────────────────────────────────────────

  /// Return all kanji mastery records as a flat array.
  public func getAllKanjiMastery(
    store : Map.Map<Text, DataTypes.KanjiMasteryRecord>,
  ) : [MasteryTypes.KanjiMastery] {
    let out = List.empty<MasteryTypes.KanjiMastery>();
    for ((_, rec) in store.entries()) {
      out.add(toKanjiMastery(rec));
    };
    out.toArray();
  };

  // ─── getAllRadicalMastery ────────────────────────────────────────────────────

  /// Return all radical mastery records as a flat array.
  public func getAllRadicalMastery(
    store : Map.Map<Text, DataTypes.RadicalMasteryRecord>,
  ) : [MasteryTypes.RadicalMastery] {
    let out = List.empty<MasteryTypes.RadicalMastery>();
    for ((_, rec) in store.entries()) {
      out.add(toRadicalMastery(rec));
    };
    out.toArray();
  };

  // ─── getWeakKanji ────────────────────────────────────────────────────────────

  /// Return kanji where wrongCount > threshold OR accuracy < 50%.
  public func getWeakKanjiByThreshold(
    store     : Map.Map<Text, DataTypes.KanjiMasteryRecord>,
    threshold : Nat,
  ) : [MasteryTypes.KanjiMastery] {
    let out = List.empty<MasteryTypes.KanjiMastery>();
    for ((_, rec) in store.entries()) {
      let total = rec.correctCount + rec.wrongCount;
      let accuracy : Nat = if (total == 0) 0 else rec.correctCount * 100 / total;
      if (rec.wrongCount > threshold or accuracy < 50) {
        out.add(toKanjiMastery(rec));
      };
    };
    out.toArray();
  };

  // ─── getUntouchedKanji ───────────────────────────────────────────────────────

  /// Return the list of kanji characters that have seenCount = 0.
  /// `allKanji` is the complete set of kanji characters known to the system
  /// (passed in from the frontend-owned static dataset via the mixin call).
  public func getUntouchedKanji(
    store    : Map.Map<Text, DataTypes.KanjiMasteryRecord>,
    allKanji : [Text],
  ) : [Text] {
    let out = List.empty<Text>();
    for (k in allKanji.vals()) {
      switch (store.get(k)) {
        case (?rec) { if (rec.seenCount == 0) out.add(k) };
        case null   { out.add(k) };
      };
    };
    out.toArray();
  };

  // ─── getDokkaiPriorityKanji ──────────────────────────────────────────────────

  /// Return the kanji characters tagged as Dokkai Priority.
  /// `dokkaiKanji` is the static list of high-priority dokkai kanji
  /// maintained in the frontend dataset.
  public func getDokkaiPriorityKanji(
    dokkaiKanji : [Text],
  ) : [Text] {
    dokkaiKanji;
  };

  // ─── recordQuizResult ────────────────────────────────────────────────────────

  /// Append a quiz result event to the log.
  public func recordQuizResult(
    log    : List.List<MasteryTypes.QuizResult>,
    result : MasteryTypes.QuizResult,
  ) : () {
    log.add(result);
  };

  // ─── getQuizAnalytics ────────────────────────────────────────────────────────

  /// Compute aggregate quiz analytics from the result log.
  public func getQuizAnalytics(
    log : List.List<MasteryTypes.QuizResult>,
  ) : MasteryTypes.QuizAnalytics {
    var total   : Nat = 0;
    var correct : Nat = 0;
    var wrong   : Nat = 0;
    for (r in log.toArray().vals()) {
      total += 1;
      if (r.isCorrect) correct += 1 else wrong += 1;
    };
    let accuracy : Float = if (total == 0) 0.0
      else correct.toFloat() / total.toFloat();
    { totalQuizzes = total; totalCorrect = correct; totalWrong = wrong; accuracy };
  };
};
