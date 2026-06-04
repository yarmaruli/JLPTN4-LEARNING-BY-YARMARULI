import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";
import { useGetAllRadicals } from "../hooks/useQueries";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedJlptLevel: string | null;
  setSelectedJlptLevel: (level: string | null) => void;
  selectedWordType: string | null;
  setSelectedWordType: (type: string | null) => void;
  selectedRadical: string | null;
  setSelectedRadical: (radical: string | null) => void;
  onReset: () => void;
}

export function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedJlptLevel,
  setSelectedJlptLevel,
  selectedWordType,
  setSelectedWordType,
  selectedRadical,
  setSelectedRadical,
  onReset,
}: SearchFiltersProps) {
  const { data: radicals = [] } = useGetAllRadicals();

  const hasActiveFilters =
    selectedJlptLevel || selectedWordType || selectedRadical || searchTerm;

  const wordTypes = [
    "Kata Benda",
    "Kata Kerja",
    "Kata Sifat",
    "Kata Keterangan",
    "Partikel",
    "Lainnya",
  ];

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Cari & Filter Kanji</h2>
      </div>

      <div className="space-y-5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari kanji, romaji, atau arti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="filter-jlpt"
              className="text-sm font-medium mb-2 block"
            >
              Level JLPT
            </label>
            <Select
              value={selectedJlptLevel || "all"}
              onValueChange={(value) =>
                setSelectedJlptLevel(value === "all" ? null : value)
              }
            >
              <SelectTrigger id="filter-jlpt">
                <SelectValue placeholder="Semua Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Level</SelectItem>
                <SelectItem value="N5">N5</SelectItem>
                <SelectItem value="N4">N4</SelectItem>
                <SelectItem value="N3">N3</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="N1">N1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="filter-wordtype"
              className="text-sm font-medium mb-2 block"
            >
              Jenis Kata
            </label>
            <Select
              value={selectedWordType || "all"}
              onValueChange={(value) =>
                setSelectedWordType(value === "all" ? null : value)
              }
            >
              <SelectTrigger id="filter-wordtype">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {wordTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="filter-radical"
              className="text-sm font-medium mb-2 block"
            >
              Radikal
            </label>
            <Select
              value={selectedRadical || "all"}
              onValueChange={(value) =>
                setSelectedRadical(value === "all" ? null : value)
              }
            >
              <SelectTrigger id="filter-radical">
                <SelectValue placeholder="Semua Radikal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Radikal</SelectItem>
                {radicals.map((radical) => (
                  <SelectItem key={radical.name} value={radical.name}>
                    {radical.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters & Reset */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <span className="text-sm text-muted-foreground">Filter aktif:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                Pencarian: {searchTerm}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSearchTerm("")}
                />
              </Badge>
            )}
            {selectedJlptLevel && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                {selectedJlptLevel}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSelectedJlptLevel(null)}
                />
              </Badge>
            )}
            {selectedWordType && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                {selectedWordType}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSelectedWordType(null)}
                />
              </Badge>
            )}
            {selectedRadical && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                Radikal: {selectedRadical}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSelectedRadical(null)}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="ml-auto"
            >
              Reset Semua
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
