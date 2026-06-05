import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Types "../types/data-expansion";

module {
  // ─── Mastery Status Helper ────────────────────────────────────────────────

  /// Derive MasteryStatus from masteryLevel (0–5).
  /// Derive MasteryStatus from masteryLevel (0–5).
  public func masteryStatusFromLevel(level : Nat) : Types.MasteryStatus {
    if (level == 0) { #Untouched }
    else if (level <= 2) { #Learning }
    else if (level <= 4) { #Intermediate }
    else { #Mastered };
  };

  // ─── Kanji Mastery ────────────────────────────────────────────────────────

  /// Convert internal KanjiMasteryRecord to public type.
  /// Convert internal KanjiMasteryRecord to public type.
  public func toPublicKanjiMastery(r : Types.KanjiMasteryRecord) : Types.KanjiMasteryPublic {
    {
      kanjiId = r.kanjiId;
      seenCount = r.seenCount;
      correctCount = r.correctCount;
      wrongCount = r.wrongCount;
      lookupCount = r.lookupCount;
      masteryLevel = r.masteryLevel;
      lastSeen = r.lastSeen;
      lastCorrect = r.lastCorrect;
      lastWrong = r.lastWrong;
      status = masteryStatusFromLevel(r.masteryLevel);
    };
  };

  /// Record a kanji seen event; returns updated masteryLevel.
  /// Record a kanji seen event; returns updated masteryLevel.
  public func recordKanjiSeen(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    kanjiId : Text,
    now : Int,
  ) : Nat {
    switch (store.get(kanjiId)) {
      case (?r) {
        r.seenCount += 1;
        r.lastSeen := now;
        r.masteryLevel;
      };
      case null {
        let r : Types.KanjiMasteryRecord = {
          kanjiId;
          var seenCount = 1;
          var correctCount = 0;
          var wrongCount = 0;
          var lookupCount = 0;
          var masteryLevel = 0;
          var lastSeen = now;
          var lastCorrect = 0;
          var lastWrong = 0;
        };
        store.add(kanjiId, r);
        0;
      };
    };
  };

  /// Record a correct kanji answer.
  /// Record a correct kanji answer.
  public func recordKanjiCorrect(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    kanjiId : Text,
    now : Int,
  ) : Nat {
    ignore (recordKanjiSeen(store, kanjiId, now));
    switch (store.get(kanjiId)) {
      case (?r) {
        r.correctCount += 1;
        r.lastCorrect := now;
        // Increase masteryLevel up to 5
        if (r.masteryLevel < 5) { r.masteryLevel += 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Record a wrong kanji answer. Returns new masteryLevel.
  /// Record a wrong kanji answer. Returns new masteryLevel.
  public func recordKanjiWrong(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    kanjiId : Text,
    now : Int,
  ) : Nat {
    ignore (recordKanjiSeen(store, kanjiId, now));
    switch (store.get(kanjiId)) {
      case (?r) {
        r.wrongCount += 1;
        r.lastWrong := now;
        // Decrease masteryLevel but not below 0
        if (r.masteryLevel > 0) { r.masteryLevel -= 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Record a kanji lookup from Reading / VocabPopover.
  /// Record a kanji lookup from Reading / VocabPopover.
  public func recordKanjiLookup(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    kanjiId : Text,
    now : Int,
  ) : () {
    ignore (recordKanjiSeen(store, kanjiId, now));
    switch (store.get(kanjiId)) {
      case (?r) { r.lookupCount += 1 };
      case null {};
    };
  };

  /// Compute Kanji Score (0–100) from the full store.
  /// Compute Kanji Score (0–100) from the full store.
  /// Formula: weighted accuracy × mastery ratio.
  public func computeKanjiScore(store : Map.Map<Text, Types.KanjiMasteryRecord>) : Nat {
    var totalSeen = 0;
    var totalCorrect = 0;
    var totalMastery = 0;
    var count = 0;
    for ((_, r) in store.entries()) {
      if (r.seenCount > 0) {
        totalSeen += r.seenCount;
        totalCorrect += r.correctCount;
        totalMastery += r.masteryLevel;
        count += 1;
      };
    };
    if (count == 0 or totalSeen == 0) { return 0 };
    // accuracy component (0–100)
    let accuracy = (totalCorrect * 100) / totalSeen;
    // mastery component: average masteryLevel / 5 × 100
    let masteryAvg = (totalMastery * 100) / (count * 5);
    // blend: 60% accuracy + 40% mastery
    (accuracy * 60 + masteryAvg * 40) / 100;
  };

  /// Return top-N weakest kanji items (wrong ≥ 2 or accuracy ≤ 60%).
  /// Return top-N weakest kanji items (wrong ≥ 2 or accuracy ≤ 60%).
  public func getWeakKanji(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    topN : Nat,
  ) : [Types.WeakItem] {
    var items : List.List<Types.WeakItem> = List.empty();
    for ((_, r) in store.entries()) {
      if (isKanjiWeak(r)) {
        let total = r.correctCount + r.wrongCount;
        let accuracy = if (total == 0) { 0 } else { (r.correctCount * 100) / total };
        items.add({
          itemId = r.kanjiId;
          itemType = "kanji";
          wrongCount = r.wrongCount;
          correctCount = r.correctCount;
          accuracy;
          masteryLevel = r.masteryLevel;
        });
      };
    };
    // sort by wrongCount descending then slice topN
    let arr = items.toArray();
    let sorted = arr.sort(func(a : Types.WeakItem, b : Types.WeakItem) : { #less; #equal; #greater } {
      if (b.wrongCount > a.wrongCount) { #less }
      else if (b.wrongCount < a.wrongCount) { #greater }
      else { #equal };
    });
    if (topN >= sorted.size()) { sorted } else { sorted.sliceToArray(0, topN) };
  };

  // ─── Radical Mastery ──────────────────────────────────────────────────────

  /// Convert internal RadicalMasteryRecord to public type.
  /// Convert internal RadicalMasteryRecord to public type.
  public func toPublicRadicalMastery(r : Types.RadicalMasteryRecord) : Types.RadicalMasteryPublic {
    {
      radicalId = r.radicalId;
      seenCount = r.seenCount;
      correctCount = r.correctCount;
      wrongCount = r.wrongCount;
      masteryLevel = r.masteryLevel;
      lastSeen = r.lastSeen;
      status = masteryStatusFromLevel(r.masteryLevel);
    };
  };

  /// Record a radical seen event.
  /// Record a radical seen event.
  public func recordRadicalSeen(
    store : Map.Map<Text, Types.RadicalMasteryRecord>,
    radicalId : Text,
    now : Int,
  ) : Nat {
    switch (store.get(radicalId)) {
      case (?r) {
        r.seenCount += 1;
        r.lastSeen := now;
        r.masteryLevel;
      };
      case null {
        let r : Types.RadicalMasteryRecord = {
          radicalId;
          var seenCount = 1;
          var correctCount = 0;
          var wrongCount = 0;
          var masteryLevel = 0;
          var lastSeen = now;
        };
        store.add(radicalId, r);
        0;
      };
    };
  };

  /// Record a correct radical answer.
  /// Record a correct radical answer.
  public func recordRadicalCorrect(
    store : Map.Map<Text, Types.RadicalMasteryRecord>,
    radicalId : Text,
    now : Int,
  ) : Nat {
    ignore (recordRadicalSeen(store, radicalId, now));
    switch (store.get(radicalId)) {
      case (?r) {
        r.correctCount += 1;
        if (r.masteryLevel < 5) { r.masteryLevel += 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Record a wrong radical answer.
  /// Record a wrong radical answer.
  public func recordRadicalWrong(
    store : Map.Map<Text, Types.RadicalMasteryRecord>,
    radicalId : Text,
    now : Int,
  ) : Nat {
    ignore (recordRadicalSeen(store, radicalId, now));
    switch (store.get(radicalId)) {
      case (?r) {
        r.wrongCount += 1;
        if (r.masteryLevel > 0) { r.masteryLevel -= 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Compute Radical Score (0–100).
  /// Compute Radical Score (0–100).
  public func computeRadicalScore(store : Map.Map<Text, Types.RadicalMasteryRecord>) : Nat {
    var totalSeen = 0;
    var totalCorrect = 0;
    var totalMastery = 0;
    var count = 0;
    for ((_, r) in store.entries()) {
      if (r.seenCount > 0) {
        totalSeen += r.seenCount;
        totalCorrect += r.correctCount;
        totalMastery += r.masteryLevel;
        count += 1;
      };
    };
    if (count == 0 or totalSeen == 0) { return 0 };
    let accuracy = (totalCorrect * 100) / totalSeen;
    let masteryAvg = (totalMastery * 100) / (count * 5);
    (accuracy * 60 + masteryAvg * 40) / 100;
  };

  /// Return top-N weakest radicals.
  /// Return top-N weakest radicals.
  public func getWeakRadicals(
    store : Map.Map<Text, Types.RadicalMasteryRecord>,
    topN : Nat,
  ) : [Types.WeakItem] {
    var items : List.List<Types.WeakItem> = List.empty();
    for ((_, r) in store.entries()) {
      if (isRadicalWeak(r)) {
        let total = r.correctCount + r.wrongCount;
        let accuracy = if (total == 0) { 0 } else { (r.correctCount * 100) / total };
        items.add({
          itemId = r.radicalId;
          itemType = "radical";
          wrongCount = r.wrongCount;
          correctCount = r.correctCount;
          accuracy;
          masteryLevel = r.masteryLevel;
        });
      };
    };
    let arr = items.toArray();
    let sorted = arr.sort(func(a : Types.WeakItem, b : Types.WeakItem) : { #less; #equal; #greater } {
      if (b.wrongCount > a.wrongCount) { #less }
      else if (b.wrongCount < a.wrongCount) { #greater }
      else { #equal };
    });
    if (topN >= sorted.size()) { sorted } else { sorted.sliceToArray(0, topN) };
  };

  // ─── Vocabulary Mastery ───────────────────────────────────────────────────

  /// Convert internal VocabMasteryRecord to public type.
  /// Convert internal VocabMasteryRecord to public type.
  public func toPublicVocabMastery(r : Types.VocabMasteryRecord) : Types.VocabMasteryPublic {
    {
      vocabId = r.vocabId;
      seenCount = r.seenCount;
      correctCount = r.correctCount;
      wrongCount = r.wrongCount;
      lookupCount = r.lookupCount;
      masteryLevel = r.masteryLevel;
      lastSeen = r.lastSeen;
      lastCorrect = r.lastCorrect;
      lastWrong = r.lastWrong;
      status = masteryStatusFromLevel(r.masteryLevel);
    };
  };

  /// Record a vocabulary item seen.
  /// Record a vocabulary item seen.
  public func recordVocabSeen(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    vocabId : Text,
    now : Int,
  ) : Nat {
    switch (store.get(vocabId)) {
      case (?r) {
        r.seenCount += 1;
        r.lastSeen := now;
        r.masteryLevel;
      };
      case null {
        let r : Types.VocabMasteryRecord = {
          vocabId;
          var seenCount = 1;
          var correctCount = 0;
          var wrongCount = 0;
          var lookupCount = 0;
          var masteryLevel = 0;
          var lastSeen = now;
          var lastCorrect = 0;
          var lastWrong = 0;
        };
        store.add(vocabId, r);
        0;
      };
    };
  };

  /// Record a correct vocabulary answer.
  /// Record a correct vocabulary answer.
  public func recordVocabCorrect(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    vocabId : Text,
    now : Int,
  ) : Nat {
    ignore (recordVocabSeen(store, vocabId, now));
    switch (store.get(vocabId)) {
      case (?r) {
        r.correctCount += 1;
        r.lastCorrect := now;
        if (r.masteryLevel < 5) { r.masteryLevel += 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Record a wrong vocabulary answer. Triggers weakness flag when wrongCount ≥ 3.
  /// Record a wrong vocabulary answer. Triggers weakness flag when wrongCount ≥ 3.
  public func recordVocabWrong(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    vocabId : Text,
    now : Int,
  ) : Nat {
    ignore (recordVocabSeen(store, vocabId, now));
    switch (store.get(vocabId)) {
      case (?r) {
        r.wrongCount += 1;
        r.lastWrong := now;
        if (r.masteryLevel > 0) { r.masteryLevel -= 1 };
        r.masteryLevel;
      };
      case null { 0 };
    };
  };

  /// Record a vocab lookup from Reading / VocabPopover.
  /// Record a vocab lookup from Reading / VocabPopover.
  public func recordVocabLookup(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    vocabId : Text,
    now : Int,
  ) : () {
    ignore (recordVocabSeen(store, vocabId, now));
    switch (store.get(vocabId)) {
      case (?r) { r.lookupCount += 1 };
      case null {};
    };
  };

  /// Compute Vocabulary Score (0–100).
  /// Compute Vocabulary Score (0–100).
  /// Formula: weighted accuracy × mastery ratio (same as kanji).
  public func computeVocabScore(store : Map.Map<Text, Types.VocabMasteryRecord>) : Nat {
    var totalSeen = 0;
    var totalCorrect = 0;
    var totalMastery = 0;
    var count = 0;
    for ((_, r) in store.entries()) {
      if (r.seenCount > 0) {
        totalSeen += r.seenCount;
        totalCorrect += r.correctCount;
        totalMastery += r.masteryLevel;
        count += 1;
      };
    };
    if (count == 0 or totalSeen == 0) { return 0 };
    let accuracy = (totalCorrect * 100) / totalSeen;
    let masteryAvg = (totalMastery * 100) / (count * 5);
    (accuracy * 60 + masteryAvg * 40) / 100;
  };

  /// Return top-N weakest vocabulary items.
  /// Return top-N weakest vocabulary items.
  public func getWeakVocab(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    topN : Nat,
  ) : [Types.WeakItem] {
    var items : List.List<Types.WeakItem> = List.empty();
    for ((_, r) in store.entries()) {
      if (isVocabWeak(r)) {
        let total = r.correctCount + r.wrongCount;
        let accuracy = if (total == 0) { 0 } else { (r.correctCount * 100) / total };
        items.add({
          itemId = r.vocabId;
          itemType = "vocabulary";
          wrongCount = r.wrongCount;
          correctCount = r.correctCount;
          accuracy;
          masteryLevel = r.masteryLevel;
        });
      };
    };
    let arr = items.toArray();
    let sorted = arr.sort(func(a : Types.WeakItem, b : Types.WeakItem) : { #less; #equal; #greater } {
      if (b.wrongCount > a.wrongCount) { #less }
      else if (b.wrongCount < a.wrongCount) { #greater }
      else { #equal };
    });
    if (topN >= sorted.size()) { sorted } else { sorted.sliceToArray(0, topN) };
  };

  // ─── Reading Score ────────────────────────────────────────────────────────

  /// Compute Reading Score from recent reading sessions.
  /// Compute Reading Score from recent reading sessions.
  /// Formula: average session score weighted down by average lookupCount.
  public func computeReadingScore(
    sessions : List.List<Types.ReadingSessionRecord>,
  ) : Nat {
    let arr = sessions.toArray();
    let n = arr.size();
    if (n == 0) { return 0 };
    var totalScore = 0;
    var totalLookups = 0;
    for (s in arr.vals()) {
      totalScore += s.score;
      totalLookups += s.wordsLookedUp.size();
    };
    let avgScore = totalScore / n;
    let avgLookups = totalLookups / n;
    // Each lookup beyond threshold reduces score slightly (penalty capped at 20%)
    let penaltyPer = if (avgLookups > 5) { Nat.min((avgLookups - 5) * 2, 20) } else { 0 };
    if (avgScore > penaltyPer) { avgScore - penaltyPer } else { 0 };
  };

  // ─── Overall N4 Readiness ─────────────────────────────────────────────────

  /// Compute Overall N4 Readiness Score.
  /// Weighted: 50% Kanji + 30% Vocabulary + 20% Radical, capped 0–100.
  /// Compute Overall N4 Readiness Score.
  /// Weighted: 30% Kanji + 20% Radical + 30% Vocabulary + 20% Reading, capped 0–100.
  public func computeN4ReadinessScore(
    kanjiScore : Nat,
    vocabScore : Nat,
    radicalScore : Nat,
  ) : Nat {
    let weighted = (kanjiScore * 30 + vocabScore * 30 + radicalScore * 20) / 80;
    Nat.min(weighted, 100);
  };

  /// Build full ScoreSummary for a user.
  /// Build full ScoreSummary for a user.
  public func buildScoreSummary(
    kanjiStore : Map.Map<Text, Types.KanjiMasteryRecord>,
    vocabStore : Map.Map<Text, Types.VocabMasteryRecord>,
    radicalStore : Map.Map<Text, Types.RadicalMasteryRecord>,
    sessions : List.List<Types.ReadingSessionRecord>,
  ) : Types.ScoreSummary {
    let kanjiScore = computeKanjiScore(kanjiStore);
    let vocabularyScore = computeVocabScore(vocabStore);
    let radicalScore = computeRadicalScore(radicalStore);
    let readingScore = computeReadingScore(sessions);
    let overallN4ReadinessScore = (
      kanjiScore * 30 + vocabularyScore * 30 + radicalScore * 20 + readingScore * 20
    ) / 100;
    {
      kanjiScore;
      vocabularyScore;
      radicalScore;
      readingScore;
      overallN4ReadinessScore = Nat.min(overallN4ReadinessScore, 100);
    };
  };

  // ─── Adaptive Quiz Session ────────────────────────────────────────────────

  /// Create a new adaptive quiz session with given ratio.
  /// Create a new adaptive quiz session with given ratio.
  public func newAdaptiveSession(
    sessionId : Text,
    caller : Principal,
    ratio : Types.AdaptiveQuizRatio,
    now : Int,
  ) : Types.AdaptiveQuizSession {
    ignore now;
    {
      sessionId;
      userId = caller;
      var ratio = ratio;
      var completedAt = null;
      var totalQuestions = 0;
      var correctAnswers = 0;
    };
  };

  /// Convert internal adaptive session to public type.
  /// Convert internal adaptive session to public type.
  public func toPublicAdaptiveSession(
    s : Types.AdaptiveQuizSession,
  ) : Types.AdaptiveQuizSessionPublic {
    {
      sessionId = s.sessionId;
      ratio = s.ratio;
      completedAt = s.completedAt;
      totalQuestions = s.totalQuestions;
      correctAnswers = s.correctAnswers;
    };
  };

  // ─── Weakness Engine ──────────────────────────────────────────────────────

  /// Determine whether a kanji item should be flagged as weak.
  /// Triggers when wrongCount ≥ 3 or accuracy ≤ 60%.
  /// Determine whether a kanji item should be flagged as weak.
  /// Triggers when wrongCount ≥ 3 or accuracy ≤ 60%.
  public func isKanjiWeak(r : Types.KanjiMasteryRecord) : Bool {
    if (r.wrongCount >= 3) { return true };
    let total = r.correctCount + r.wrongCount;
    if (total == 0) { return false };
    (r.correctCount * 100) / total <= 60;
  };

  /// Determine whether a radical item should be flagged as weak.
  /// Determine whether a radical item should be flagged as weak.
  public func isRadicalWeak(r : Types.RadicalMasteryRecord) : Bool {
    if (r.wrongCount >= 3) { return true };
    let total = r.correctCount + r.wrongCount;
    if (total == 0) { return false };
    (r.correctCount * 100) / total <= 60;
  };

  /// Determine whether a vocabulary item should be flagged as weak.
  /// Determine whether a vocabulary item should be flagged as weak.
  public func isVocabWeak(r : Types.VocabMasteryRecord) : Bool {
    if (r.wrongCount >= 3) { return true };
    let total = r.correctCount + r.wrongCount;
    if (total == 0) { return false };
    (r.correctCount * 100) / total <= 60;
  };

  // ─── Dashboard Builders ───────────────────────────────────────────────────

  /// Build Vocabulary Dashboard stats.
  /// Build Vocabulary Dashboard stats.
  public func buildVocabDashboard(
    store : Map.Map<Text, Types.VocabMasteryRecord>,
    totalVocab : Nat,
    highFreqCount : Nat,
  ) : Types.VocabDashboardStats {
    var untouched = 0;
    var learning = 0;
    var intermediate = 0;
    var mastered = 0;
    for ((_, r) in store.entries()) {
      switch (masteryStatusFromLevel(r.masteryLevel)) {
        case (#Untouched) { untouched += 1 };
        case (#Learning) { learning += 1 };
        case (#Intermediate) { intermediate += 1 };
        case (#Mastered) { mastered += 1 };
      };
    };
    // Items in store that are untouched are already above; add remaining unseen
    let seenCount = untouched + learning + intermediate + mastered;
    let totalUntouched = if (totalVocab > seenCount) { totalVocab - seenCount + untouched } else { untouched };
    {
      total = totalVocab;
      highFrequency = highFreqCount;
      untouched = totalUntouched;
      learning;
      intermediate;
      mastered;
      weakItems = getWeakVocab(store, 10);
      strongItems = [];
    };
  };

  /// Build Kanji Dashboard stats.
  /// Build Kanji Dashboard stats.
  public func buildKanjiDashboard(
    store : Map.Map<Text, Types.KanjiMasteryRecord>,
    totalKanji : Nat,
    highFreqCount : Nat,
  ) : Types.KanjiDashboardStats {
    var untouched = 0;
    var learning = 0;
    var intermediate = 0;
    var mastered = 0;
    for ((_, r) in store.entries()) {
      switch (masteryStatusFromLevel(r.masteryLevel)) {
        case (#Untouched) { untouched += 1 };
        case (#Learning) { learning += 1 };
        case (#Intermediate) { intermediate += 1 };
        case (#Mastered) { mastered += 1 };
      };
    };
    let seenCount = untouched + learning + intermediate + mastered;
    let totalUntouched = if (totalKanji > seenCount) { totalKanji - seenCount + untouched } else { untouched };
    {
      total = totalKanji;
      highFrequency = highFreqCount;
      untouched = totalUntouched;
      learning;
      intermediate;
      mastered;
      weakItems = getWeakKanji(store, 10);
      strongItems = [];
    };
  };

  /// Build Radical Dashboard stats.
  /// Build Radical Dashboard stats.
  public func buildRadicalDashboard(
    store : Map.Map<Text, Types.RadicalMasteryRecord>,
    totalRadicals : Nat,
  ) : Types.RadicalDashboardStats {
    var untouched = 0;
    var learning = 0;
    var intermediate = 0;
    var mastered = 0;
    for ((_, r) in store.entries()) {
      switch (masteryStatusFromLevel(r.masteryLevel)) {
        case (#Untouched) { untouched += 1 };
        case (#Learning) { learning += 1 };
        case (#Intermediate) { intermediate += 1 };
        case (#Mastered) { mastered += 1 };
      };
    };
    let seenCount = untouched + learning + intermediate + mastered;
    let totalUntouched = if (totalRadicals > seenCount) { totalRadicals - seenCount + untouched } else { untouched };
    {
      total = totalRadicals;
      untouched = totalUntouched;
      learning;
      intermediate;
      mastered;
      weakItems = getWeakRadicals(store, 10);
    };
  };
};
