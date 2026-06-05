import Debug "mo:core/Debug";

module {
  // ─── Mastery Levels ───────────────────────────────────────────────────────

  public type MasteryStatus = {
    #Untouched;   // Belum Tersentuh
    #Learning;    // Sedang Belajar
    #Intermediate; // Cukup Paham
    #Mastered;    // Dikuasai
  };

  // ─── Kanji Mastery ────────────────────────────────────────────────────────

  public type KanjiMasteryRecord = {
    kanjiId : Text;
    var seenCount : Nat;
    var correctCount : Nat;
    var wrongCount : Nat;
    var lookupCount : Nat;
    var masteryLevel : Nat;  // 0–5
    var lastSeen : Int;
    var lastCorrect : Int;
    var lastWrong : Int;
  };

  public type KanjiMasteryPublic = {
    kanjiId : Text;
    seenCount : Nat;
    correctCount : Nat;
    wrongCount : Nat;
    lookupCount : Nat;
    masteryLevel : Nat;
    lastSeen : Int;
    lastCorrect : Int;
    lastWrong : Int;
    status : MasteryStatus;
  };

  // ─── Radical Mastery ──────────────────────────────────────────────────────

  public type RadicalMasteryRecord = {
    radicalId : Text;
    var seenCount : Nat;
    var correctCount : Nat;
    var wrongCount : Nat;
    var masteryLevel : Nat;  // 0–5
    var lastSeen : Int;
  };

  public type RadicalMasteryPublic = {
    radicalId : Text;
    seenCount : Nat;
    correctCount : Nat;
    wrongCount : Nat;
    masteryLevel : Nat;
    lastSeen : Int;
    status : MasteryStatus;
  };

  // ─── Vocabulary Mastery ───────────────────────────────────────────────────

  public type VocabMasteryRecord = {
    vocabId : Text;
    var seenCount : Nat;
    var correctCount : Nat;
    var wrongCount : Nat;
    var lookupCount : Nat;
    var masteryLevel : Nat;  // 0–5
    var lastSeen : Int;
    var lastCorrect : Int;
    var lastWrong : Int;
  };

  public type VocabMasteryPublic = {
    vocabId : Text;
    seenCount : Nat;
    correctCount : Nat;
    wrongCount : Nat;
    lookupCount : Nat;
    masteryLevel : Nat;
    lastSeen : Int;
    lastCorrect : Int;
    lastWrong : Int;
    status : MasteryStatus;
  };

  // ─── Score Summaries ──────────────────────────────────────────────────────

  // All scores in range 0–100
  public type ScoreSummary = {
    kanjiScore : Nat;       // 50% weight in N4 Readiness
    vocabularyScore : Nat;  // 30% weight
    radicalScore : Nat;     // 20% weight
    readingScore : Nat;     // standalone
    overallN4ReadinessScore : Nat; // weighted composite 0–100
  };

  // ─── Reading Session ──────────────────────────────────────────────────────

  public type ReadingSessionRecord = {
    sessionId : Text;
    userId : Principal;
    var score : Nat;          // 0–100
    var durationSeconds : Nat;
    var wordsLookedUp : [Text];
    var unknownWords : [Text];
    var kanjiFailures : [Text];
    var timestamp : Int;
  };

  public type ReadingSessionPublic = {
    sessionId : Text;
    score : Nat;
    durationSeconds : Nat;
    wordsLookedUp : [Text];
    unknownWords : [Text];
    kanjiFailures : [Text];
    timestamp : Int;
  };

  // ─── Weak Item ────────────────────────────────────────────────────────────

  // Generic weak item for kanji/radical/vocabulary weakness report
  public type WeakItem = {
    itemId : Text;
    itemType : Text; // "kanji" | "radical" | "vocabulary"
    wrongCount : Nat;
    correctCount : Nat;
    accuracy : Nat; // 0–100
    masteryLevel : Nat;
  };

  // ─── Adaptive Quiz Config ────────────────────────────────────────────────

  // Ratio must sum to 100
  public type AdaptiveQuizRatio = {
    kanjiPercent : Nat;      // default 50
    vocabularyPercent : Nat; // default 30
    radicalPercent : Nat;    // default 20
  };

  public type AdaptiveQuizSession = {
    sessionId : Text;
    userId : Principal;
    var ratio : AdaptiveQuizRatio;
    var completedAt : ?Int;
    var totalQuestions : Nat;
    var correctAnswers : Nat;
  };

  public type AdaptiveQuizSessionPublic = {
    sessionId : Text;
    ratio : AdaptiveQuizRatio;
    completedAt : ?Int;
    totalQuestions : Nat;
    correctAnswers : Nat;
  };

  // ─── Vocabulary Dashboard Stats ──────────────────────────────────────────

  public type VocabDashboardStats = {
    total : Nat;
    highFrequency : Nat;  // marked as priority
    untouched : Nat;
    learning : Nat;
    intermediate : Nat;
    mastered : Nat;
    weakItems : [WeakItem];   // top 10 low-accuracy items
    strongItems : [WeakItem]; // top 10 high-accuracy items
  };

  // ─── Kanji Dashboard Stats ───────────────────────────────────────────────

  public type KanjiDashboardStats = {
    total : Nat;
    highFrequency : Nat;
    untouched : Nat;
    learning : Nat;
    intermediate : Nat;
    mastered : Nat;
    weakItems : [WeakItem];
    strongItems : [WeakItem];
  };

  // ─── Radical Dashboard Stats ─────────────────────────────────────────────

  public type RadicalDashboardStats = {
    total : Nat;
    untouched : Nat;
    learning : Nat;
    intermediate : Nat;
    mastered : Nat;
    weakItems : [WeakItem];
  };
};
