export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md select-none">
            <span className="text-primary-foreground font-bold text-lg leading-none">
              字
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary font-display">
              Kan-Ji-Kan
            </h1>
            <p className="text-xs text-muted-foreground">JLPT N4 マスター</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-accent font-bold text-2xl select-none"
            aria-hidden
          >
            書
          </span>
        </div>
      </div>
    </header>
  );
}
