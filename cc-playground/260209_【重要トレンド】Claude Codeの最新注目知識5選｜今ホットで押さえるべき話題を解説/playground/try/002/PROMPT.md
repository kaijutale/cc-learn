# Task

Create a single-page website showcasing the history of GUCCI, the iconic Italian luxury fashion house. The page should embody a **dark luxury aesthetic** with rich animations and scroll-driven interactivity.

# Requirements

## Design Direction: Dark Luxury
- **Color palette**: Deep black (#000000, #0a0a0a) as primary background, gold (#c9a96e, #d4af37) as accent, off-white (#f5f0e8) for body text
- **Typography**: Use elegant serif fonts for headings (e.g., Google Fonts: Playfair Display or Cormorant Garamond) and clean sans-serif for body (e.g., Inter or Montserrat)
- **Visual style**: Minimalist luxury — generous whitespace, thin gold lines as dividers, subtle grain/noise texture overlay on backgrounds
- **GUCCI branding**: Reference the iconic green-red-green stripe and interlocking GG motif as decorative elements (CSS-only, no trademark images)

## Content Sections (in order)

### 1. Hero Section
- Full-viewport hero with the title "GUCCI" in large elegant typography
- Subtitle: "A Century of Italian Luxury — Since 1921"
- Subtle background animation (e.g., slow-moving gradient or particle effect)
- Scroll indicator at the bottom

### 2. Timeline — Key Historical Moments
A vertical timeline with the following events (research accurate dates and brief descriptions):
- 1921: Guccio Gucci founds the House of Gucci in Florence
- 1930s-40s: Introduction of the bamboo bag and signature materials
- 1953: GG logo and the iconic green-red-green stripe introduced
- 1960s: Hollywood glamour era — Grace Kelly, Jackie Kennedy association
- 1970s-80s: Global expansion, Tom Ford's predecessors
- 1994-2004: Tom Ford era — revolutionary transformation
- 2006-2014: Frida Giannini as Creative Director
- 2015-2022: Alessandro Michele era — maximalism and eclecticism
- 2023-present: Sabato De Sarno — return to quiet luxury

Each timeline item should animate in on scroll (fade + slide).

### 3. Iconic Products Gallery
A showcase of GUCCI's most iconic creations:
- **Bamboo Bag** (1947) — Brief description of its innovation
- **GG Marmont** — The modern icon with matelassé leather
- **Horsebit Loafer** (1953) — The shoe that defined luxury casual
- **Jackie Bag** — Named after Jackie Kennedy Onassis
- **Dionysus Bag** — Tiger head closure, a Michele masterpiece
- **Flora Print** (1966) — Originally designed for Grace Kelly

Display as elegant cards with hover effects. Use placeholder visuals created with CSS (abstract representations, NOT actual product images).

### 4. Footer
- "The House of Gucci — Florence, Italy"
- Current year
- Elegant minimal design

## Animations & Interactions
- **Scroll-triggered fade-in**: All sections animate into view using Intersection Observer API
- **Parallax effect**: Hero background has subtle parallax on scroll
- **Timeline animation**: Items slide in alternately from left and right
- **Product cards**: Hover reveals additional info with smooth transition
- **Gold shimmer effect**: Subtle CSS animation on gold text/borders
- **Smooth scrolling**: CSS scroll-behavior: smooth
- **Loading animation**: Brief luxury-feeling page entrance animation

# Tech Stack
- HTML5 (semantic markup)
- CSS3 (custom properties, grid, flexbox, animations, @keyframes)
- Vanilla JavaScript (Intersection Observer, scroll events, no libraries)
- Google Fonts (loaded via CDN link)
- No external libraries or frameworks — everything from scratch

# File Structure
```
/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260209_【重要トレンド】Claude Codeの最新注目知識5選｜今ホットで押さえるべき話題を解説/playground/try/002/
├── index.html      (main HTML file with all sections)
├── style.css       (all styles, animations, responsive design)
└── script.js       (scroll animations, parallax, interactions)
```

# Verification

Open the file in a browser and verify:
```bash
open "/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260209_【重要トレンド】Claude Codeの最新注目知識5選｜今ホットで押さえるべき話題を解説/playground/try/002/index.html"
```

Check:
1. Page loads without console errors
2. All 4 sections are visible when scrolling
3. Timeline has at least 8 historical entries
4. Product gallery has at least 6 items
5. Scroll animations trigger correctly
6. Gold color scheme and dark background are consistent
7. Typography is elegant and readable
8. Page is responsive (works on mobile widths too)

# Completion

When the page is fully implemented with all sections, animations working, responsive design applied, and no console errors, output exactly:
<promise>GUCCI HISTORY PAGE COMPLETE</promise>
