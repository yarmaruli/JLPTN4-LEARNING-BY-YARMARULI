import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kanji Master</h1>
            <p className="text-xs text-muted-foreground">JLPT N4</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/brush-icon.dim_64x64.png"
            alt="Brush"
            className="w-8 h-8 opacity-70"
          />
        </div>
      </div>
    </header>
  );
}
