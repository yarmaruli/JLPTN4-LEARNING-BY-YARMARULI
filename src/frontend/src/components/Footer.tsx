import { Heart } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "kanjikan")}`;
  return (
    <footer className="border-t border-border/40 bg-card mt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm font-semibold text-primary font-display">
              Kan-Ji-Kan
            </p>
            <p className="text-xs text-muted-foreground">
              Dibuat oleh Kevin Year (Yar Maruli)
            </p>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>Aplikasi pembelajaran Kanji Jepang untuk JLPT N4 &amp; N5</p>
          </div>

          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>
              © {year}. Built with{" "}
              <Heart className="inline w-3.5 h-3.5 text-red-500 fill-red-500" />{" "}
              using{" "}
              <a
                href={utm}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
