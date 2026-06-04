import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 mt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>
              © 2025. Built with{" "}
              <Heart className="inline w-4 h-4 text-red-500 fill-red-500" />{" "}
              using{" "}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Aplikasi pembelajaran Kanji Jepang untuk JLPT N4</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
