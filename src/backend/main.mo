import Map "mo:core/Map";
import List "mo:core/List";
import Types "types/data-expansion";
import DataExpansionApi "mixins/data-expansion-api";

actor {
  let kanjiMastery   = Map.empty<Text, Types.KanjiMasteryRecord>();
  let radicalMastery = Map.empty<Text, Types.RadicalMasteryRecord>();
  let vocabMastery   = Map.empty<Text, Types.VocabMasteryRecord>();
  let readingSessions = List.empty<Types.ReadingSessionRecord>();

  include DataExpansionApi(kanjiMastery, radicalMastery, vocabMastery, readingSessions);
};
