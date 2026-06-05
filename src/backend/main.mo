import Map "mo:core/Map";
import List "mo:core/List";
import Types "types/data-expansion";
import MasteryTypes "types/mastery";
import DataExpansionApi "mixins/data-expansion-api";
import MasteryApi "mixins/mastery-api";

actor {
  let kanjiMastery    = Map.empty<Text, Types.KanjiMasteryRecord>();
  let radicalMastery  = Map.empty<Text, Types.RadicalMasteryRecord>();
  let vocabMastery    = Map.empty<Text, Types.VocabMasteryRecord>();
  let readingSessions = List.empty<Types.ReadingSessionRecord>();
  let quizResults     = List.empty<MasteryTypes.QuizResult>();

  include DataExpansionApi(kanjiMastery, radicalMastery, vocabMastery, readingSessions);
  include MasteryApi(kanjiMastery, radicalMastery, quizResults);
};
