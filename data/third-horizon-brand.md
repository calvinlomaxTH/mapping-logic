---
name: third-horizon-brand
description: Canonical Third Horizon brand kit — colors, typography, logo, and voice. Use whenever building TH-branded deliverables (websites, PPTX, PDFs, reports, emails, slide decks, charts) or when the user references TH brand, TH colors, or TH style.
---

# Third Horizon Brand Kit

The canonical visual and verbal identity for Third Horizon Strategy (TH / THS). Apply to any client-facing or internal TH deliverable.

## Colors

The THS palette is built on navy + blue + warm gold + beige, with neutrals for support.

### Core brand colors

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Dark Navy | `#213F56` | Headers, titles, primary text on light, key callouts |
| Secondary | Medium Blue | `#214D8A` | Sub-headers, links, supporting graphics, second chart series |
| Accent | Warm Gold | `#F7C560` | Highlights, CTA emphasis, key metrics, callout boxes |
| Background | Warm Beige | `#E3DED1` | Alt-section backgrounds, callout panels, less-stark-than-white surfaces |

### Neutrals

| Role | Name | Hex |
|---|---|---|
| Text | Pure Black | `#000000` |
| Text (secondary) | Charcoal | `#323232` |
| De-emphasis | Medium Gray | `#999999` |
| Borders/Dividers | Mid Gray | `#D0D0D0` |
| Subtle BG | Light Gray | `#F1F1F1` |
| Surface | White | `#FFFFFF` |
| Hyperlink (unvisited) | — | `#686668` |

### CSS variable preset

```css
:root {
  --color-surface: #FFFFFF;
  --color-surface-alt: #E3DED1;
  --color-surface-foreground: #000000;
  --color-primary: #213F56;
  --color-primary-light: #214D8A;
  --color-primary-foreground: #FFFFFF;
  --color-accent: #F7C560;
  --color-accent-foreground: #000000;
  --color-secondary: #F1F1F1;
  --color-muted: #D0D0D0;
  --color-muted-foreground: #323232;
  --color-border: #D0D0D0;
}
```

### Chart color sequence

`#213F56` → `#214D8A` → `#F7C560` → `#999999` → `#D0D0D0` → `#686668`

### Color usage rules

1. Navy first — default to navy for primary elements
2. Gold sparingly — highlights only, never bulk content or large fills
3. Avoid pure-black backgrounds — keep deliverables light and professional
4. Beige for warmth — use instead of pure white when softer contrast is wanted
5. Grays for de-emphasis — progressively lighter to reduce visual weight

## Typography

**Family:** Calibri throughout. Do not mix font families.

- **Display / titles:** Calibri Light (weight 300)
- **Body / content:** Calibri Regular (weight 400)
- **Emphasis:** Calibri Bold — use sparingly, only for key terms

### Type scale (PPTX defaults)

```
Slide titles:        32–44pt, Calibri Light, Navy (#213F56)
Section headers:     24–28pt, Calibri, Navy or Black
Subsection headers:  18–20pt, Calibri Bold, Black
Body text:           14–16pt, Calibri Regular, Black/Charcoal
Supporting text:     12–14pt, Calibri Regular, Medium Gray
Footnotes/citations: 10–11pt, Calibri Regular, Medium Gray
```

Minimum size: 10pt. Maximum hierarchy levels per slide: 3–4.

Note (2026-03): the website refresh added a separate display font for top headings on the new Webflow site while keeping Calibri for body. Confirm the current heading font with David before applying outside PPTX/Office contexts.

## Logo

Three-arch mark stacked above the "THIRD HORIZON" wordmark. Available in all-navy and all-white variants; the all-blue variant is also approved. The 2026 refresh kept the existing logo unchanged — only the color hierarchy was updated.

**Canonical file:** request the latest PNG/SVG from David or pull from the shared drive. The previous working file on Topher's local machine lived at `~/Desktop/Manual Library/Work/THS/2025/th logo.png`; do not assume this path is available in any other environment.

## Voice

Third Horizon is a healthcare policy and strategy consultancy. The brand voice conveys:

- Trustworthy and professional
- Healthcare expertise and policy knowledge
- Data-driven and analytical
- Approachable yet authoritative
- Sophisticated without being cold
- Conservative with modern touches

### Writing style for client-facing content

- Use complete sentences and formal language
- Avoid fragments and casual phrasing
- Keep recommendations at the top; technical detail at the bottom or in an appendix
- Prefer concrete consequences over technical names ("a malicious email could trick an agent into sending client data somewhere it shouldn't" beats "prompt injection via untrusted input")
- Spell out acronyms on first use with a short gloss

## Layout principles (decks and pages)

- Generous margins (min 0.5" on slides)
- Left-align text; center only titles
- Max 7 bullets per slide — split if more
- One main idea per slide
- Always cite sources at the bottom
- Flat design — no 3D effects, gradients, or heavy drop shadows

## What this style is NOT

- Not flashy or animation-heavy
- Not text-dense like academic decks
- Not as rigid as McKinsey, not as vibrant as BCG
- Not generic corporate blue — use the specific navy `#213F56`

## Source

Distilled from the THS PowerPoint Template (January 2025) theme analysis and the 2026-03-13 website redesign review meeting. When in doubt, defer to David Smith or the current PPTX template in the shared drive.
