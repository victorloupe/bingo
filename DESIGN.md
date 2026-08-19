# DESIGN.md — Bingo 75

> **Design System & Visual Vocabulary** for Bingo 75. Defines color tokens, typography scales, layout rules, component standards, micro-interactions, and anti-patterns to guarantee visual rigor and prevent generic AI design drift.

---

## 1. Design Philosophy & Visual Tone

Bingo 75 uses a **clean, modern, high-contrast, broadcast-grade utility aesthetic**. It prioritizes extreme legibility, instantaneous cognitive parsing, and operational precision under real-world event conditions (glare, projector scaling, distance viewing).

- **Clarity over Clutter**: Every pixel has an operational purpose. No decorative fluff that distracts the operator or audience.
- **Fixed-Viewport Spatial Discipline**: Core operator and projector interfaces strictly adhere to `100dvh` — zero unwanted page-level scrolling.
- **Vibrant Semantic Color-Coding**: Distinct, memorable, standardized colors for the five B-I-N-G-O letters and game statuses.
- **Tactile & Snappy Micro-Interactions**: Micro-animations are crisp (150ms–300ms) with spring curves, providing immediate feedback without delaying fast-paced gameplay.

---

## 2. Color Palette & Semantic Tokens

### 2.1. B-I-N-G-O Column Tokens
The 75 numbers are divided strictly into 5 columns of 15 numbers each with dedicated color identities:

| Column | Number Range | Token | Hex Value | Semantic Meaning / Role |
| :--- | :--- | :--- | :--- | :--- |
| **B** | 01 – 15 | `--col-b` | `#2563eb` | Royal Blue (High contrast, authoritative) |
| **I** | 16 – 30 | `--col-i` | `#7c3aed` | Electric Purple (Vibrant, distinct from blue) |
| **N** | 31 – 45 | `--col-n` | `#d97706` | Warm Amber / Orange (Energetic center column) |
| **G** | 46 – 60 | `--col-g` | `#059669` | Emerald Green (Sharp, high-visibility green) |
| **O** | 61 – 75 | `--col-o` | `#dc2626` | Ruby Red (Decisive, high-alert final column) |

### 2.2. Surface & Background Tokens
- **Canvas Gradient**: `var(--bg-gradient)` = `radial-gradient(circle at 50% -20%, #e2e8f0 0%, #f1f5f9 100%)`
- **Background Base**: `var(--bg)` = `#f8fafc` (Slate 50)
- **Primary Card Surface**: `var(--card)` = `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(8px)`
- **Solid Card Surface**: `var(--card-solid)` = `#ffffff`
- **Border Default**: `var(--border)` = `#e2e8f0` (Slate 200)
- **Border Focus / Active**: `var(--border-focus)` = `#2563eb` (Blue 600)
- **Subtle Chip Border**: `var(--chip-border)` = `#cbd5e1` (Slate 300)

### 2.3. Action & State Tokens
- **Primary Action**: `var(--primary)` = `#2563eb` | Glow: `var(--primary-glow)` = `rgba(37, 99, 235, 0.2)`
- **Success / Validated**: `var(--success)` = `#10b981` (Emerald 500)
- **Warning / Attention**: `var(--warning)` = `#f59e0b` (Amber 500)
- **Danger / Reset / Undo**: `var(--danger)` = `#ef4444` (Red 500)
- **Text Primary**: `var(--text)` = `#0f172a` (Slate 900)
- **Text Muted / Dim**: `var(--text-dim)` = `#475569` (Slate 600)
- **Last Ball Glow / Pulse**: `var(--glow-yellow)` = `0 0 16px rgba(245, 158, 11, 0.35)`

---

## 3. Typography & Numerical Formatting

### 3.1. Font Stack
- **Primary Interface Font**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Hero Numbers & Display**: `'Plus Jakarta Sans'`, `'Poppins'`, `sans-serif` with font weight `800` or `900`.

### 3.2. Tabular Numbers Requirement
All dynamic counters, ball numbers, timers, and statistics **MUST** use tabular numbers to eliminate layout shifts:
```css
.tabnum {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

### 3.3. Fluid & Scaled Type Scale
- **Last Drawn Ball Hero**: `var(--last-font)` = `clamp(40px, 5.5vmin, 72px)`
- **Matrix Ball Cell**: `var(--cell-font)` = `clamp(15px, 2vmin, 22px)`
- **App Title**: `clamp(20px, 2.8vmin, 28px)`
- **Badge / Round Pill**: `0.75rem` – `0.92rem`, weight `800`
- **Stats / Counter Labels**: `0.70rem` – `0.80rem`, weight `700`, uppercase tracking `0.5px`

---

## 4. Layout, Grid & Spatial Budgeting

### 4.1. The `100dvh` Viewport Rule
- `painel.html`, `projetor.html`, `menu.html`, and `check.html` are designed as **self-contained application viewports**.
- The main wrapper (`.tv-shell` or `.menu-container`) uses `height: 100dvh; max-height: 100dvh; overflow: hidden;`.
- Scrollbars are restricted exclusively to dedicated internal scroll containers (e.g., `.schedule-scroll-area`, `.audit-history-list`), styled with custom `6px` sleek slate thumbs.

### 4.2. Master 75-Ball Matrix Layout
- Standard 5-row or 5-column grid mapping:
  - Row 1: B (01 – 15)
  - Row 2: I (16 – 30)
  - Row 3: N (31 – 45)
  - Row 4: G (46 – 60)
  - Row 5: O (61 – 75)
- **Cell States**:
  1. *Undrawn*: Soft slate background (`#f8fafc`), crisp border (`#cbd5e1`), dark slate text (`#475569`).
  2. *Drawn*: Solid column theme color background with bright white text, subtle elevation.
  3. *Last Drawn*: Golden amber highlight (`#fef08a` / `#854d0e`), pulsing border glow (`#eab308`), scale transform `1.06x`.

---

## 5. UI Components & Patterns

### 5.1. Mode Switcher Capsule
- Pill-shaped segmented control with a sliding glider background:
  - Automatic Mode = Blue accent glider (`#2563eb`)
  - Manual Mode = Emerald accent glider (`#059669`)
- Smooth cubic-bezier transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

### 5.2. Last Ball Hero Display
- High-visibility square / rounded card showing the column letter (e.g., `B`) and large number (e.g., `12`).
- Background matches the column semantic color with a subtle radial gradient.
- Accompanied by a mini-reel of the last 4 drawn balls for quick context.

### 5.3. Antifraud Card Audit Matrix (5x5)
- Standard printed card aspect ratio.
- Header row with bold B-I-N-G-O lettering in matching column colors.
- Hit cells highlighted with green / gold chips; missed cells in neutral white/slate.
- Center cell marked as `★ FREE` or `CORINGA`.

### 5.4. Sponsor Banner Marquee / Slider
- Non-intrusive bottom or header ticker with high-resolution sponsor logos and crisp promotional text.
- Automated gentle cross-fade or slide transition every 5–8 seconds.

---

## 6. Icons & Vector Imagery

- **Icon Set**: Lucide Icons (`data-lucide` SVG attributes).
- **Icon Sizing Standards**:
  - `sm`: 14px (stroke width 2.2px)
  - `default`: 16px (stroke width 2.2px)
  - `lg`: 20px (stroke width 2.0px)
  - `xl`: 28px (stroke width 1.8px)

---

## 7. Anti-Patterns & What to Avoid ("Anti-Slop Rules")

1. ❌ **No Random AI Gradients**: Never introduce multi-color rainbow borders, fuzzy pastel overlays, or purple-to-pink generic hero gradients. Stick to the curated blue/emerald/amber palette.
2. ❌ **No Page Scrollbars on Live Screens**: Never allow accidental viewport overflows that cause vertical scrolling on `painel.html` or `projetor.html`.
3. ❌ **No Low-Contrast Text**: Never use light gray text on white backgrounds or dark gray on dark backgrounds. All text must pass WCAG AA contrast (minimum 4.5:1, preferably 7:1 for projector numbers).
4. ❌ **No Sluggish Transitions**: Never use slow fade animations (>300ms) for game state updates. Ball draws must render within <50ms of the event trigger.
5. ❌ **No Inconsistent B-I-N-G-O Colors**: Never swap or randomize column colors (B is always Blue, I is always Purple, N is always Amber, G is always Emerald, O is always Red).
6. ❌ **No Inter / Roboto Fallback Bloat**: Keep typography crisp and unified on `Plus Jakarta Sans`.
