import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/data-expansion";
import DataLib "../lib/data-expansion";

/// Public API mixin for the data-expansion domain.
/// State slices are injected by main.mo via mixin parameters.
mixin (
  kanjiMastery : Map.Map<Text, Types.KanjiMasteryRecord>,
  radicalMastery : Map.Map<Text, Types.RadicalMasteryRecord>,
  vocabMastery : Map.Map<Text, Types.VocabMasteryRecord>,
  readingSessions : List.List<Types.ReadingSessionRecord>,
) {

  // ─── Kanji Mastery ─────────────────────────────────────────────────────────

  /// Record that user saw a kanji (increments seenCount).
  public shared ({ caller }) func trackKanjiSeen(kanjiId : Text) : async () {
    ignore caller;
    ignore DataLib.recordKanjiSeen(kanjiMastery, kanjiId, Time.now());
  };

  /// Record a correct kanji quiz answer.
  public shared ({ caller }) func trackKanjiCorrect(kanjiId : Text) : async () {
    ignore caller;
    ignore DataLib.recordKanjiCorrect(kanjiMastery, kanjiId, Time.now());
  };

  /// Record a wrong kanji quiz answer.
  public shared ({ caller }) func trackKanjiWrong(kanjiId : Text) : async () {
    ignore caller;
    ignore DataLib.recordKanjiWrong(kanjiMastery, kanjiId, Time.now());
  };

  /// Record a kanji lookup from Reading / VocabPopover.
  public shared ({ caller }) func trackKanjiLookup(kanjiId : Text) : async () {
    ignore caller;
    DataLib.recordKanjiLookup(kanjiMastery, kanjiId, Time.now());
  };

  /// Get mastery record for a specific kanji.
  public query func getKanjiMastery(kanjiId : Text) : async ?Types.KanjiMasteryPublic {
    switch (kanjiMastery.get(kanjiId)) {
      case (?r) { ?DataLib.toPublicKanjiMastery(r) };
      case null { null };
    };
  };

  /// Get all kanji mastery records (paged).
  public query func listKanjiMastery(offset : Nat, limit : Nat) : async [Types.KanjiMasteryPublic] {
    var result : List.List<Types.KanjiMasteryPublic> = List.empty();
    var idx = 0;
    for ((_, r) in kanjiMastery.entries()) {
      if (idx >= offset and result.size() < limit) {
        result.add(DataLib.toPublicKanjiMastery(r));
      };
      idx += 1;
    };
    result.toArray();
  };

  /// Get top-N weakest kanji.
  public query func getWeakKanji(topN : Nat) : async [Types.WeakItem] {
    DataLib.getWeakKanji(kanjiMastery, topN);
  };

  // ─── Radical Mastery ───────────────────────────────────────────────────────

  /// Record that user saw a radical.
  public shared ({ caller }) func trackRadicalSeen(radicalId : Text) : async () {
    ignore caller;
    ignore DataLib.recordRadicalSeen(radicalMastery, radicalId, Time.now());
  };

  /// Record a correct radical quiz answer.
  public shared ({ caller }) func trackRadicalCorrect(radicalId : Text) : async () {
    ignore caller;
    ignore DataLib.recordRadicalCorrect(radicalMastery, radicalId, Time.now());
  };

  /// Record a wrong radical quiz answer.
  public shared ({ caller }) func trackRadicalWrong(radicalId : Text) : async () {
    ignore caller;
    ignore DataLib.recordRadicalWrong(radicalMastery, radicalId, Time.now());
  };

  /// Get mastery record for a specific radical.
  public query func getRadicalMastery(radicalId : Text) : async ?Types.RadicalMasteryPublic {
    switch (radicalMastery.get(radicalId)) {
      case (?r) { ?DataLib.toPublicRadicalMastery(r) };
      case null { null };
    };
  };

  /// Get top-N weakest radicals.
  public query func getWeakRadicals(topN : Nat) : async [Types.WeakItem] {
    DataLib.getWeakRadicals(radicalMastery, topN);
  };

  // ─── Vocabulary Mastery ────────────────────────────────────────────────────

  /// Record that user saw a vocabulary item.
  public shared ({ caller }) func trackVocabSeen(vocabId : Text) : async () {
    ignore caller;
    ignore DataLib.recordVocabSeen(vocabMastery, vocabId, Time.now());
  };

  /// Record a correct vocabulary quiz answer.
  public shared ({ caller }) func trackVocabCorrect(vocabId : Text) : async () {
    ignore caller;
    ignore DataLib.recordVocabCorrect(vocabMastery, vocabId, Time.now());
  };

  /// Record a wrong vocabulary quiz answer.
  public shared ({ caller }) func trackVocabWrong(vocabId : Text) : async () {
    ignore caller;
    ignore DataLib.recordVocabWrong(vocabMastery, vocabId, Time.now());
  };

  /// Record a vocab lookup from Reading / VocabPopover.
  public shared ({ caller }) func trackVocabLookup(vocabId : Text) : async () {
    ignore caller;
    DataLib.recordVocabLookup(vocabMastery, vocabId, Time.now());
  };

  /// Get mastery record for a specific vocabulary item.
  public query func getVocabMastery(vocabId : Text) : async ?Types.VocabMasteryPublic {
    switch (vocabMastery.get(vocabId)) {
      case (?r) { ?DataLib.toPublicVocabMastery(r) };
      case null { null };
    };
  };

  /// Get top-N weakest vocabulary items.
  public query func getWeakVocab(topN : Nat) : async [Types.WeakItem] {
    DataLib.getWeakVocab(vocabMastery, topN);
  };

  // ─── Reading Sessions ──────────────────────────────────────────────────────

  /// Save a completed reading session (score, lookups, unknown words).
  public shared ({ caller }) func saveReadingSession(
    sessionId : Text,
    score : Nat,
    durationSeconds : Nat,
    wordsLookedUp : [Text],
    unknownWords : [Text],
    kanjiFailures : [Text],
  ) : async () {
    let now = Time.now();
    let r : Types.ReadingSessionRecord = {
      sessionId;
      userId = caller;
      var score;
      var durationSeconds;
      var wordsLookedUp;
      var unknownWords;
      var kanjiFailures;
      var timestamp = now;
    };
    readingSessions.add(r);
  };

  /// List recent reading sessions for the caller.
  public query func listReadingSessions(limit : Nat) : async [Types.ReadingSessionPublic] {
    var result : List.List<Types.ReadingSessionPublic> = List.empty();
    let arr = readingSessions.toArray();
    let n = arr.size();
    let start = if (n > limit) { n - limit } else { 0 };
    var i = start;
    while (i < n) {
      let s = arr[i];
      result.add({
        sessionId = s.sessionId;
        score = s.score;
        durationSeconds = s.durationSeconds;
        wordsLookedUp = s.wordsLookedUp;
        unknownWords = s.unknownWords;
        kanjiFailures = s.kanjiFailures;
        timestamp = s.timestamp;
      });
      i += 1;
    };
    result.toArray();
  };

  // ─── Scores ────────────────────────────────────────────────────────────────

  /// Get full score summary: Kanji, Vocabulary, Radical, Reading, N4 Readiness.
  public query func getScoreSummary() : async Types.ScoreSummary {
    DataLib.buildScoreSummary(kanjiMastery, vocabMastery, radicalMastery, readingSessions);
  };

  // ─── Adaptive Quiz ─────────────────────────────────────────────────────────

  /// Start a new adaptive quiz session with custom ratio.
  public shared ({ caller }) func startAdaptiveSession(
    sessionId : Text,
    kanjiPercent : Nat,
    vocabPercent : Nat,
    radicalPercent : Nat,
  ) : async Types.AdaptiveQuizSessionPublic {
    let ratio : Types.AdaptiveQuizRatio = {
      kanjiPercent;
      vocabularyPercent = vocabPercent;
      radicalPercent;
    };
    let session = DataLib.newAdaptiveSession(sessionId, caller, ratio, Time.now());
    DataLib.toPublicAdaptiveSession(session);
  };

  /// Complete an adaptive quiz session and record results.
  public shared ({ caller }) func completeAdaptiveSession(
    sessionId : Text,
    totalQuestions : Nat,
    correctAnswers : Nat,
  ) : async () {
    ignore (caller, sessionId, totalQuestions, correctAnswers);
    // Session state is transient — stats are captured per-item via track* calls.
    // This endpoint is a no-op placeholder for client-side session management.
  };

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  /// Get Vocabulary Dashboard stats (totals, weakness, strength, batch).
  public query func getVocabDashboard() : async Types.VocabDashboardStats {
    // totalVocab and highFreqCount are frontend-owned constants; backend tracks only seen items.
    DataLib.buildVocabDashboard(vocabMastery, 0, 0);
  };

  /// Get Kanji Dashboard stats.
  public query func getKanjiDashboard() : async Types.KanjiDashboardStats {
    DataLib.buildKanjiDashboard(kanjiMastery, 0, 0);
  };

  /// Get Radical Dashboard stats.
  public query func getRadicalDashboard() : async Types.RadicalDashboardStats {
    DataLib.buildRadicalDashboard(radicalMastery, 0);
  };
};
