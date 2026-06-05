# Design Brief: Kan-Ji-Kan — JLPT N4 Learning Platform

## Tone
Professional, refined, educational. Modern Japanese aesthetic without childishness. Minimalist, focused, premium.

## Color Palette
| Role | Light OKLCH | Dark OKLCH | Usage |
|------|---|---|---|
| Primary (Navy) | 0.32 0.16 265 | 0.56 0.18 265 | Headers, CTA buttons, active states |
| Secondary (Gold) | 0.68 0.21 45 | 0.74 0.22 45 | Accent highlights, decorative elements |
| Accent (Warm) | 0.62 0.25 55 | 0.68 0.26 55 | Quiz buttons, progress indicators |
| Background | 0.98 0.01 0 | 0.12 0.01 0 | Page base |
| Card | 0.99 0.01 0 | 0.18 0.01 0 | Quiz cards, reading panels |
| Border | 0.92 0.01 0 | 0.28 0.01 0 | Card edges, dividers |
| Muted | 0.88 0.02 0 | 0.3 0.01 0 | Disabled states, secondary text |

## Typography
- **Display Font**: Lora (serif, elegant, Japanese kanji-friendly)
- **Body Font**: General Sans (clean, readable, 16px base, 1.6+ line-height)
- **Mono Font**: Geist Mono (for code, dictionary entries)
- **Hierarchy**: Display (28px), Heading (24px), Subheading (18px), Body (16px), Small (14px)

## Shape & Spacing
- **Radius**: 0.5rem (8px) for cards, 4px for controls, full for badges
- **Spacing**: 4px, 8px, 12px, 16px, 24px, 32px (base = 4px)
- **Density**: Mobile-first responsive, card-based layout

## Structural Zones
| Zone | Background | Border | Shadow | Purpose |
|------|---|---|---|---|
| Header/Nav | Primary (0.32 0.16 265) | None | Subtle | App name, menu |
| Main Content | Background (0.98 0.01 0) | None | None | Quiz cards, reading |
| Card | Card (0.99 0.01 0) | Border (0.92 0.01 0) | Card shadow | Question, vocab item |
| Footer | Muted (0.88 0.02 0) | Border (0.92 0.01 0) | None | Links, copyright |
| Sidebar | Card (0.99 0.01 0) | Border (0.92 0.01 0) | Subtle | Navigation, stats |

## Component Patterns
- **Card**: `.card-elevated` (md shadow, border) for primary content; `.card-minimal` for secondary
- **Button**: Primary (navy bg, white text), Secondary (border + navy text), Accent (gold/warm)
- **Quiz Item**: Card-elevated with kanji/romaji/meaning fields left-aligned, 16px spacing
- **Vocabulary Link**: Inline `.japanese-accent` (left border, padding, hover primary)
- **Badge**: 12px height, rounded-full, primary text on muted-bg
- **Progress**: Bar with primary color, background muted

## Motion
- **Transitions**: All interactive elements use smooth cubic-bezier(0.4, 0, 0.2, 1) 300ms
- **No bouncy animations**—focus on educational clarity
- **Entrance**: Subtle fade-in for quiz cards (100ms), reading highlights
- **Feedback**: 150ms press feedback on buttons, 200ms slide for review queue

## Signature Detail
- **Japanese Accent Borders**: Left 3px navy border on vocabulary items, kanji explanations, related radical links — reinforces Japanese language focus without visual overload
- **Kanji Decorative Elements**: Subtle watermark-style small kanji characters (20px, 8% opacity) in footer/sidebar backgrounds — non-intrusive, sets cultural tone
- **Card Hierarchy**: Solid cards for primary info (quiz questions, reading), minimal cards for secondary (related vocabulary, notes)

## Constraints
- Mobile-first: all interactions readable at 375px width
- No gradients—pure OKLCH colors for consistency
- Accessibility: WCAG AA+ contrast for all text-on-color combinations
- No red text on colored backgrounds—use semantic destructive color (0.55 0.22 25) sparingly
- Keep shadow depth subtle (0.04–0.08 opacity) to maintain professional tone

## Differentiation
Focused Japanese-themed learning interface that treats kanji/radical mastery as the core design element. Minimalist navigation, card-based progressive learning, and intentional use of Japanese visual language (left borders, elegant serif for titles) distinguish this from generic education platforms. Professional over playful, clarity over decoration.
