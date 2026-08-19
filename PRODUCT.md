# PRODUCT.md — Bingo 75

> **Durable Product Truth** for Bingo 75: A high-performance, real-time live event bingo platform engineered for broadcast projectors, operator consoles, anti-fraud card validation, and event management.

---

## 1. Product Mission & Value Proposition

**Bingo 75** is a comprehensive, broadcast-ready digital bingo operations suite built for live physical events, festivals, community fundraisers, parish bingos, and commercial gaming halls.

It eliminates operator stress, manual verification errors, and visual lag by delivering:
1. **Ultra-Low Latency Multi-Screen Synchronization**: Instant broadcast from the operator's console to giant projection screens and judges' validation tables via Supabase Realtime + local offline fallbacks.
2. **Instant Anti-Fraud Verification**: Real-time card validation algorithms capable of auditing printed 75-ball cards in milliseconds, identifying winning cards, remaining numbers, and anti-tamper hashes.
3. **Broadcast-Grade Visual Polish**: High-DPI, TV/Projector-optimized interfaces with fluid typography, responsive grids, sponsor media carousels, and high-visibility contrast designed for viewing from 20+ meters away.
4. **Resilient Offline-First Execution**: Seamless operation whether fully connected to the cloud or completely offline in venues with unstable Wi-Fi.

---

## 2. Target Audience & Personas

| Persona | Environment & Device | Primary Objectives & Pain Points |
| :--- | :--- | :--- |
| **Stage Operator / Caller** | Desktop / Laptop / Tablet at the podium or sound booth | Needs fast, error-free ball drawing (automatic or manual), quick undos, sound synthesis, clear view of the last ball drawn, and instant event status. |
| **Conference Table / Judges** | Laptop / Tablet at validation desk | Needs instantaneous card lookup (by card number or barcode), visual hit matrix, automatic validation against drawn numbers, and antifraud hash check. |
| **Audience & Players** | Stage projector screens, TV arrays, or mobile devices | Need crisp, crystal-clear readability from a distance, immediate ball announcements, prize callouts, and clean sponsor visibility. |
| **Event Organizer / Admin** | Management PC before/after events | Needs to configure night schedules (rodadas), set prizes (Quina, Linha, Cheia), generate batches of PDF cards with anti-fraud QR/Barcodes, and manage sponsor media. |

---

## 3. Core Workflows & Functional Modules

### 3.1. Night Schedule & Operations Hub (`menu.html`)
- **Event / Round Configuration**: Setup sequential rounds (*Rodadas*), award categories (Cartela Cheia, Quina, Linha, etc.), and prize descriptions.
- **Sponsor & Ad Management**: Upload, preview, and toggle sponsor logos, promotional banners, and stage announcements during intervals or live play.
- **Operator Key Security**: Operator authentication and state initialization using secure local/cloud credentials.

### 3.2. Live Draw Operator Console (`painel.html`)
- **Dual Draw Engines**:
  - **Automatic Mode**: Timed motorized globo simulation with configurable interval (1s–15s), pause, voice callouts, and audio chimes.
  - **Manual Mode**: Direct click-to-draw on the 75-ball interactive matrix for physical cage balls or manual call-ins.
- **Realtime Ball Display**: Hero display of the latest drawn ball with letter color-coding and full 1–75 master board.
- **Undo / Reset Safety**: Safeguards to prevent accidental draws or accidental resets during high-stakes games.

### 3.3. Projector & Big Screen Display (`projetor.html`)
- **Fullscreen 100dvh Layout**: Zero-scroll, ultra-clean UI engineered for 16:9 and 4:3 high-definition stage projectors.
- **Dynamic Animation & FX**: Smooth ball entry animations, glow highlights for the most recent numbers, and victory fanfare overlays.
- **Integrated Sponsor Rail & Ad Takeover**: Live sponsor banners that cycle seamlessly without interrupting draw visibility.

### 3.4. Fast Conference & Anti-Fraud Desk (`check.html`)
- **Live Leaderboard / Proximity Radar**: Tracks all active cards in memory, showing in real-time which cards are 1 away (*Armadas / Na Boa*), 2 away, or have completed winning patterns.
- **Instant Card Audit**: Search by card ID to see the exact 5x5 grid with matched numbers highlighted and antifraud hash confirmation.

### 3.5. Official Card Generator & PDF Export (`cartelas.html`, `pdf-export.js`)
- **Mathematical Uniformity**: Generates unique, non-colliding 75-ball matrices adhering to classic B-I-N-G-O distribution rules (B: 1–15, I: 16–30, N: 31–45 with Free center, G: 46–60, O: 61–75).
- **Print & PDF Production**: High-resolution, multi-page vector PDF generation with custom event branding, sponsor footers, and validation barcodes.

---

## 4. Key Entities & Terminology

- **Rodada (Round)**: An individual game instance with defined winning conditions (e.g., 1ª Rodada: Quina; 2ª Rodada: Cartela Cheia).
- **Globo / Sorteio**: The pool of 75 numbered balls drawn sequentially without replacement.
- **Cartela (Card)**: 5x5 grid of 24 numbers + 1 central "FREE / CORINGA" space.
- **Armada / Na Boa**: A card that is missing only 1 number to win the current prize.
- **Batida / Bingo**: A card that has successfully fulfilled the required winning pattern for the active round.
- **Patrocinadores**: Commercial sponsors with promotional assets integrated into menus, printouts, and live screens.

---

## 5. Architectural & Technical Constraints

1. **Zero-Dependency Core Runtime**: Pure vanilla JavaScript (ES6+), modern CSS custom properties, and lightweight SVG icons (Lucide) ensuring instant startup and zero bundler friction.
2. **Hybrid Cloud + Offline Fallback**:
   - Primary: Supabase Realtime for bi-directional state synchronization across devices.
   - Fallback: `localStorage` / `BroadcastChannel` for instant local-machine multi-window synchronization when offline.
3. **Viewport Budgeting (`100dvh`)**: The entire UI must fit strictly inside the visible screen height without triggering vertical window scrollbars during live stage operations.
4. **High Contrast & Accessible Typography**: Visual hierarchy must remain legible under bright stage lights, sunlight, or low-resolution projector bulbs.
