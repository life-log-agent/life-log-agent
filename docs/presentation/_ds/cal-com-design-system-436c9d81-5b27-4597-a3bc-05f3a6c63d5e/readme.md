# Cal.com Design System

A clean, calendar-software-first system anchored on a white canvas with near-black
primary CTAs and the custom **Cal Sans** display typeface. It reads as friendly,
confidently-engineered modern SaaS: generous whitespace, soft-rounded cards (~12px),
real product UI fragments shown directly inside marketing cards, and a single deep-navy
footer that closes every long-scroll page. Brand voltage comes from Cal Sans + product
chrome, not from accent colors — the system is monochrome at the action layer.

---

## Product context

**Cal.com** is open-source scheduling infrastructure ("Calendly for the open web").
The surface analyzed here is the **marketing website** (cal.com) — the homepage hero,
feature bands, product-mockup cards, pricing tiers, testimonial grids, CTA band, and the
dark footer. The booking widget itself (cal.com/{username}) is the *product* surface and
is referenced where its chrome appears inside marketing cards, but full product UX is out
of scope for this system.

Cal.com positions itself as the scheduling layer for individuals, teams, and enterprises —
calendar connections, round-robin routing, workflows/automation, and an app store of
integrations. The marketing voice is precise, friendly, and developer-credible.

### Sources

- **Primary spec:** `design/DESIGN-cal.md` — a 543-line brand/design analysis
  (colors, type, spacing, components, do's & don'ts, responsive behavior). This was the
  ground truth for tokens and component specs.
- **Logos & icon:** pulled from the public `calcom/cal.com` repo (`apps/web/public/`) —
  `cal-com-icon.svg`, `cal-com-icon-white.svg`, `cal-logo-word-black.svg`.
  See `assets/logos/`.
- **Cal Sans font:** the real MIT-licensed face from the public `calcom/font` repo,
  copied to `assets/fonts/CalSans-SemiBold.woff2`.
- **Inter / JetBrains Mono:** copied from the Fontsource CDN into `assets/fonts/`.

> No Figma file was provided. If one exists, attach it and I'll cross-reference component
> geometry and pull any missing product-mockup assets.

---

## Content fundamentals

How Cal.com writes copy.

- **Voice:** plain-spoken, confident, slightly technical. It states the benefit directly
  and trusts the reader. Never hype-y, never emoji-driven.
- **Person:** speaks to **"you"** ("Schedule meetings without the back-and-forth"),
  refers to itself as **"we / Cal.com"** sparingly. Imperatives are common in CTAs
  ("Get started", "Sign up free", "Talk to sales").
- **Casing:** **Sentence case everywhere** — headlines, buttons, nav, labels. Title Case
  is avoided. Product/feature names ("Routing Forms", "Workflows", "Teams") are
  capitalized as proper nouns; everything else is sentence case.
- **Headlines:** short, declarative, benefit-first. "The better way to schedule your
  meetings." "Your all-purpose scheduling app." Often a single clause; occasionally a
  two-part claim.
- **Buttons:** verb-first and terse — "Get started", "Sign up free", "Contact us",
  "Learn more". Primary CTA is usually "Sign up free" or "Get started".
- **Body:** one to two tight sentences per idea. Avoids jargon walls; when it gets
  technical (API, webhooks, self-hosting) it stays matter-of-fact.
- **Numbers & proof:** uses concrete proof (logos, star ratings, "trusted by") rather
  than vague superlatives.
- **Emoji:** **not used** in the marketing surface. Don't introduce them.
- **Punctuation:** minimal. No exclamation-mark spam. Periods on full-sentence subheads,
  dropped on short labels.

**Vibe in one line:** *engineered, calm, friendly — confident without shouting.*

---

## Visual foundations

### Color
Near-monochrome. White canvas (`#ffffff`), near-black ink + primary (`#111111`).
The system has exactly **one dark surface** — the footer (`#101010`), reused only on the
featured pricing tier. Text steps through `#111` (ink) → `#374151` (body) →
`#6b7280` (muted) → `#898989` (faint). The blue accent (`#3b82f6`) is **rare** — inline
links and the occasional "customer story" highlight. A small pastel set
(orange/pink/violet/emerald) appears **only** as avatar fills and category-tag tints —
never on a CTA. See `tokens/colors.css`.

### Type
Two voices, strict boundary. **Cal Sans** (custom geometric display, weight **600**,
negative tracking **-0.5 to -2px**) for every headline h1–h3. **Inter** for everything
else — body, buttons, nav, captions, labels — at 400–600, 0 tracking. **JetBrains Mono**
for code. Never put body in Cal Sans; never put a display headline in Inter. Display
weight stays at 600 — never 700 (bombastic), never 500. Bigger before bolder.

### Spacing & layout
4px base unit. Section rhythm is **96px** between editorial bands. Card padding is
**32px** (feature/pricing) or **24px** (testimonial/mockup). Content max-width ~**1200px**,
centered. Hero uses a 7/5 split (headline left, app-mockup card right). Grids reduce
columns rather than scaling cards: features 3→2→1, pricing 4→2→1.

### Backgrounds
**No gradients, no textures, no hand-drawn illustration, no photography washes.** The page
is flat white. Visual interest comes from **light-gray cards** (`#f5f5f5`) and from **real
product UI fragments** embedded inside white cards (calendar widgets, scheduling forms,
integration grids). The only background inversion is the dark footer.

### Borders & elevation
1px hairlines in `#e5e7eb` on inputs, dividers, and some cards. Elevation is **soft and
low-alpha**: `0 1px 2px rgba(0,0,0,.05)` for resting cards, `0 4px 12px rgba(0,0,0,.08)`
for elevated/hover. **No heavy shadows, no neumorphism, no glassmorphism.** The featured
pricing tier uses color-block contrast (dark surface) instead of shadow to elevate.

### Corner radii
Hierarchical: **8px** buttons/inputs/tabs · **12px** content cards · **16px** hero
app-mockup card · **pill** for nav-pill-group + badges · **full** for avatars + icon
buttons. Never exceed 16px on cards — larger reads consumer-app, not booking software.

### Cards
Two deliberate modes. **Gray card** (`#f5f5f5`, 12px radius, no shadow) = abstract feature
claim. **White card** (hairline border / soft shadow, holds real product chrome) = "look
at the actual product." Don't decorate around the product — show it.

### Motion, hover & press
Restrained. **Primary button darkens on press** (`#111` → `#242424`); shrink/scale is not
part of the system. Hover is minimal — links underline, cards may lift with the soft
shadow. Transitions are short (~120–180ms, standard ease). No bounces, no decorative
infinite loops. Avatar/pill transitions are quick fades. Reduced-motion: show end state.

### Transparency & blur
Effectively unused on the marketing surface. Surfaces are solid. No frosted glass.

### Signature components
The **nav-pill-group** (pill-radius wrapper around 2–3 sub-nav segments; active segment is
a white pill with a subtle inner shadow) is the system's most recognizable interactive
motif. Circular **36px avatars** with occasional pastel fills are the only chromatic
flourish.

---

## Iconography

- Cal.com's marketing surface uses **thin-stroke line icons** (≈1.5–2px), rounded joins,
  in a monochrome ink/muted treatment — the same family popularized by **Lucide**
  (Cal.com's product is built on a Lucide-derived icon set). For this system we link
  **Lucide** from CDN as the canonical icon set. *(Substitution flag: the exact product
  icon sprite wasn't provided; Lucide matches the stroke weight and rounded-join style
  closely. Attach the product icon set if you want pixel-exact marks.)*
- **Logo / brand mark:** the Cal.com mark is the lowercase **"C"** glyph inside a rounded
  square (`assets/logos/cal-com-icon.svg`, dark `#292929` tile; white variant for dark
  surfaces). The full wordmark is `assets/logos/cal-logo-word-black.svg` (and a generated
  `-white.svg` for the footer). These are the **real** marks from the public repo.
- **Emoji:** not used. **Unicode glyphs as icons:** not used — always a real line icon.
- Use icons sparingly and at small scale (16–20px) beside labels or inside feature cards;
  never as decorative hero art.

Lucide via CDN:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="calendar"></i>
<script>lucide.createIcons();</script>
```

---

## Index / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import` lines only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter wrapper.

**Tokens** (`tokens/`)
- `fonts.css` — `@font-face` for Cal Sans, Inter, JetBrains Mono.
- `colors.css` — palette + semantic aliases.
- `typography.css` — families, weights, scale, ready-made type classes.
- `spacing.css` — spacing, radius, shadow, layout, motion tokens.

**Assets** (`assets/`)
- `logos/` — Cal.com icon (dark/white) + wordmark (black/white).
- `fonts/` — the webfont binaries.

**Foundations** (`guidelines/`) — specimen cards for the Design System tab (Type, Colors,
Spacing, Brand).

**Components** (`components/core/`) — reusable React primitives: Button, IconButton,
Input, Badge, Avatar, Card, NavPillGroup, Switch, Tooltip-less primitives, etc. Each has a
`.jsx`, `.d.ts`, `.prompt.md`, and a `@dsCard` HTML.

**UI kits** (`ui_kits/`)
- `marketing/` — high-fidelity recreation of the cal.com marketing site (hero, features,
  product mockup, pricing, footer) as a click-through.

**Slides** (`slides/`) — branded sample slides using the foundations.
