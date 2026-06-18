/**
 * generate-icons.mjs
 * Generates all PWA icons and iOS splash screens for Screw the Dealer.
 * Run: node scripts/generate-icons.mjs  (or: npm run icons)
 *
 * Pure Node ESM. Uses `sharp` for SVG→PNG rasterisation.
 * After writing PNGs, injects <link> splash tags into index.html.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');
const ICONS_DIR = resolve(PUBLIC, 'icons');
const SPLASH_DIR = resolve(PUBLIC, 'splash');

// ── Palette (matches tokens.css) ────────────────────────────────────────────
const C = {
  mahogany:  '#241510',
  felt:      '#1f4233',
  feltDark:  '#14271e',
  feltLit:   '#2a5641',
  brass:     '#c8a24a',
  brassDim:  '#8a6d33',
  brassLit:  '#e6c878',
  ivory:     '#ede3cc',
  ivoryDim:  '#b9ad92',
  oxblood:   '#8c2f22',
  ink:       '#1a1410',
};

// ── Ensure output directories exist ─────────────────────────────────────────
[ICONS_DIR, SPLASH_DIR].forEach(d => mkdirSync(d, { recursive: true }));

// ────────────────────────────────────────────────────────────────────────────
// SVG ARTWORK
// A burnished brass coin / token on a dark mahogany→felt ground.
// Engraved spade motif with "STD" monogram. Motif fills ~75% of canvas
// for standard icons; maskable variant keeps motif inside the safe zone (~72%).
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the coin SVG at a given canvas size.
 * @param {number}  size          - canvas dimension (square)
 * @param {boolean} maskable      - if true, shrink motif to keep inside safe zone
 * @param {boolean} solidBg       - if true, always use solid mahogany bg (no transparency)
 */
function buildIconSvg(size, { maskable = false, solidBg = true } = {}) {
  const cx = size / 2;
  const cy = size / 2;

  // Coin radius — maskable safe zone is 80% of canvas radius, we use 72% of that
  const safeR = maskable ? size * 0.36 : size * 0.44;
  const coinR = safeR;
  const innerR = coinR * 0.88;   // inner rim of the coin

  // Spade dimensions (relative to coin)
  const spadeScale = coinR * 0.55;
  const spadeY = cy + coinR * 0.06; // slightly below centre to leave room for "STD"

  // Text sizes
  const stdSize    = Math.max(8, Math.round(coinR * 0.22));
  const labelSize  = Math.max(6, Math.round(coinR * 0.13));

  // Unique gradient IDs (avoid collisions if multiple SVGs are inlined)
  const uid = `ic${size}${maskable ? 'm' : ''}`;

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${size} ${size}"
     width="${size}" height="${size}">
  <defs>
    <!-- Background radial: mahogany centre fading to felt-dark edges -->
    <radialGradient id="${uid}-bg" cx="50%" cy="42%" r="60%">
      <stop offset="0%"   stop-color="${C.feltDark}"/>
      <stop offset="55%"  stop-color="${C.mahogany}"/>
      <stop offset="100%" stop-color="${C.ink}"/>
    </radialGradient>

    <!-- Coin face: burnished brass radial -->
    <radialGradient id="${uid}-coin" cx="38%" cy="32%" r="70%">
      <stop offset="0%"   stop-color="${C.brassLit}"/>
      <stop offset="40%"  stop-color="${C.brass}"/>
      <stop offset="85%"  stop-color="${C.brassDim}"/>
      <stop offset="100%" stop-color="${C.ink}"/>
    </radialGradient>

    <!-- Inner engraved face: slightly darker, worn -->
    <radialGradient id="${uid}-face" cx="42%" cy="38%" r="65%">
      <stop offset="0%"   stop-color="${C.brass}"/>
      <stop offset="60%"  stop-color="${C.brassDim}"/>
      <stop offset="100%" stop-color="${C.mahogany}"/>
    </radialGradient>

    <!-- Spade engraving: dark into the brass -->
    <linearGradient id="${uid}-spade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${C.mahogany}"/>
      <stop offset="50%"  stop-color="${C.ink}"/>
      <stop offset="100%" stop-color="${C.feltDark}"/>
    </linearGradient>

    <!-- Rim highlight (top arc) -->
    <linearGradient id="${uid}-rim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${C.brassLit}" stop-opacity="0.9"/>
      <stop offset="60%"  stop-color="${C.brass}"    stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${C.brassDim}" stop-opacity="0.1"/>
    </linearGradient>

    <!-- Outer glow / shadow around coin -->
    <filter id="${uid}-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.round(coinR * 0.04)}"
                    stdDeviation="${Math.round(coinR * 0.08)}"
                    flood-color="${C.ink}" flood-opacity="0.85"/>
    </filter>
  </defs>

  <!-- Background fill: solid mahogany (full-bleed, covers iOS rounding) -->
  <rect width="${size}" height="${size}" fill="${solidBg ? C.mahogany : 'none'}"/>
  <!-- Radial felt/wood wash on top -->
  <rect width="${size}" height="${size}" fill="url(#${uid}-bg)"/>

  <!-- Coin outer disc (burnished brass) -->
  <circle cx="${cx}" cy="${cy}" r="${coinR}"
          fill="url(#${uid}-coin)"
          filter="url(#${uid}-glow)"/>

  <!-- Coin rim highlight arc (top glint) -->
  <circle cx="${cx}" cy="${cy}" r="${coinR}"
          fill="none"
          stroke="url(#${uid}-rim)"
          stroke-width="${Math.max(2, coinR * 0.055)}"/>

  <!-- Inner coin face (engraved recess) -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}"
          fill="url(#${uid}-face)"/>

  <!-- Inner rim groove line -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}"
          fill="none"
          stroke="${C.ink}"
          stroke-width="${Math.max(1, coinR * 0.025)}"
          stroke-opacity="0.6"/>

  <!-- ── SPADE MOTIF ───────────────────────────────────────────────────── -->
  <!--
    Classic playing-card spade: two mirrored arcs for the top bulges
    + a pointed bottom + a short stem + a small collar.
    Drawn in a normalised 100×110 box then scaled/translated to fit the coin.
  -->
  <g transform="translate(${cx}, ${spadeY - spadeScale * 0.15})
                scale(${spadeScale / 55})
                translate(-50, -55)">
    <!--
      Spade body: a symmetric shape.
      Two upper lobes (left & right arcs) meeting at the top peak,
      sweeping down to the centre divot at the bottom of the body,
      then converging into the tail.
    -->
    <path d="
      M 50,5
      C 50,5  80,20  80,45
      C 80,62  65,70  50,62
      C 35,70  20,62  20,45
      C 20,20  50,5   50,5
      Z
    "
    fill="url(#${uid}-spade)"
    stroke="${C.brassDim}"
    stroke-width="1"
    stroke-opacity="0.4"/>

    <!-- Bottom lobe (inverted teardrop / tail base) -->
    <path d="
      M 50,62
      C 42,66  34,74  38,84
      C 42,90  58,90  62,84
      C 66,74  58,66  50,62
      Z
    "
    fill="url(#${uid}-spade)"
    stroke="${C.brassDim}"
    stroke-width="1"
    stroke-opacity="0.4"/>

    <!-- Stem + collar (horizontal bar at base) -->
    <rect x="37" y="83" width="26" height="5" rx="2"
          fill="${C.mahogany}" fill-opacity="0.7"
          stroke="${C.brassDim}" stroke-width="0.5" stroke-opacity="0.5"/>

    <!-- Subtle inner highlight on spade (gives engraved depth) -->
    <path d="
      M 50,10
      C 50,10  75,24  75,46
      C 75,58  66,65  55,62
    "
    fill="none"
    stroke="${C.brassLit}"
    stroke-width="1.5"
    stroke-opacity="0.18"
    stroke-linecap="round"/>
  </g>

  <!-- ── "STD" MONOGRAM ────────────────────────────────────────────────── -->
  <!-- Engraved below the spade, in Cinzel-style serif caps -->
  <text x="${cx}" y="${cy + coinR * 0.62}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
        font-size="${stdSize}"
        font-weight="600"
        letter-spacing="${Math.round(stdSize * 0.28)}"
        fill="${C.mahogany}"
        fill-opacity="0.85">STD</text>
  <!-- Same text, slightly lighter, offset 1px for engraved relief -->
  <text x="${cx + 0.5}" y="${cy + coinR * 0.62 - 0.8}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
        font-size="${stdSize}"
        font-weight="600"
        letter-spacing="${Math.round(stdSize * 0.28)}"
        fill="${C.brassLit}"
        fill-opacity="0.55">STD</text>

  <!-- ── Outer decorative ring (tooled edge detail) ─────────────────────── -->
  <circle cx="${cx}" cy="${cy}" r="${coinR * 0.975}"
          fill="none"
          stroke="${C.brassLit}"
          stroke-width="${Math.max(1, coinR * 0.012)}"
          stroke-opacity="0.25"
          stroke-dasharray="${Math.round(coinR * 0.04)} ${Math.round(coinR * 0.04)}"/>
</svg>`;
}

/**
 * Build a splash screen SVG for a given device size.
 * Mahogany/felt gradient background with centred brass coin and title.
 */
function buildSplashSvg(width, height) {
  const cx = width / 2;
  const cy = height / 2;

  // Coin is ~28% of the shorter dimension
  const coinR = Math.round(Math.min(width, height) * 0.14);
  const coinY = cy - coinR * 0.8;  // slightly above centre

  // Title below the coin
  const titleY   = coinY + coinR + Math.round(coinR * 0.55);
  const subtitleY = titleY + Math.round(coinR * 0.42);

  const titleSize    = Math.round(coinR * 0.52);
  const subtitleSize = Math.round(coinR * 0.26);

  const uid = `sp${width}x${height}`;

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}"
     width="${width}" height="${height}">
  <defs>
    <!-- Full-screen background: mahogany up, deep ink at edges -->
    <radialGradient id="${uid}-bg" cx="50%" cy="46%" r="70%">
      <stop offset="0%"   stop-color="${C.feltDark}"/>
      <stop offset="45%"  stop-color="${C.mahogany}"/>
      <stop offset="100%" stop-color="${C.ink}"/>
    </radialGradient>

    <!-- Overhead light pool on the felt surface -->
    <radialGradient id="${uid}-light" cx="50%" cy="40%" r="55%">
      <stop offset="0%"   stop-color="${C.feltLit}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${C.felt}"    stop-opacity="0"/>
    </radialGradient>

    <!-- Coin radial -->
    <radialGradient id="${uid}-coin" cx="38%" cy="32%" r="70%">
      <stop offset="0%"   stop-color="${C.brassLit}"/>
      <stop offset="40%"  stop-color="${C.brass}"/>
      <stop offset="85%"  stop-color="${C.brassDim}"/>
      <stop offset="100%" stop-color="${C.ink}"/>
    </radialGradient>

    <!-- Coin face -->
    <radialGradient id="${uid}-face" cx="42%" cy="38%" r="65%">
      <stop offset="0%"   stop-color="${C.brass}"/>
      <stop offset="60%"  stop-color="${C.brassDim}"/>
      <stop offset="100%" stop-color="${C.mahogany}"/>
    </radialGradient>

    <!-- Spade gradient -->
    <linearGradient id="${uid}-spade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${C.mahogany}"/>
      <stop offset="100%" stop-color="${C.ink}"/>
    </linearGradient>

    <!-- Glow filter around coin -->
    <filter id="${uid}-glow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="${Math.round(coinR * 0.06)}"
                    stdDeviation="${Math.round(coinR * 0.12)}"
                    flood-color="${C.ink}" flood-opacity="0.9"/>
    </filter>

    <!-- Subtle text glow -->
    <filter id="${uid}-tglow" x="-10%" y="-40%" width="120%" height="180%">
      <feDropShadow dx="0" dy="2"
                    stdDeviation="4"
                    flood-color="${C.ink}" flood-opacity="0.7"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${C.ink}"/>
  <rect width="${width}" height="${height}" fill="url(#${uid}-bg)"/>
  <rect width="${width}" height="${height}" fill="url(#${uid}-light)"/>

  <!-- Coin outer -->
  <circle cx="${cx}" cy="${coinY}" r="${coinR}"
          fill="url(#${uid}-coin)"
          filter="url(#${uid}-glow)"/>

  <!-- Coin inner face -->
  <circle cx="${cx}" cy="${coinY}" r="${coinR * 0.87}"
          fill="url(#${uid}-face)"/>

  <!-- Coin inner rim -->
  <circle cx="${cx}" cy="${coinY}" r="${coinR * 0.87}"
          fill="none"
          stroke="${C.ink}"
          stroke-width="${Math.max(1, coinR * 0.025)}"
          stroke-opacity="0.5"/>

  <!-- Spade motif (scaled to fit coin) -->
  <g transform="translate(${cx}, ${coinY - coinR * 0.15})
                scale(${(coinR * 0.55) / 55})
                translate(-50, -55)">
    <path d="M 50,5 C 50,5 80,20 80,45 C 80,62 65,70 50,62 C 35,70 20,62 20,45 C 20,20 50,5 50,5 Z"
          fill="url(#${uid}-spade)" stroke="${C.brassDim}" stroke-width="1" stroke-opacity="0.3"/>
    <path d="M 50,62 C 42,66 34,74 38,84 C 42,90 58,90 62,84 C 66,74 58,66 50,62 Z"
          fill="url(#${uid}-spade)" stroke="${C.brassDim}" stroke-width="1" stroke-opacity="0.3"/>
    <rect x="37" y="83" width="26" height="5" rx="2"
          fill="${C.mahogany}" fill-opacity="0.6"/>
  </g>

  <!-- "STD" on coin -->
  <text x="${cx}" y="${coinY + coinR * 0.62}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', Georgia, serif"
        font-size="${Math.round(coinR * 0.22)}" font-weight="600"
        letter-spacing="${Math.round(coinR * 0.22 * 0.28)}"
        fill="${C.mahogany}" fill-opacity="0.85">STD</text>
  <text x="${cx + 0.5}" y="${coinY + coinR * 0.62 - 0.8}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', Georgia, serif"
        font-size="${Math.round(coinR * 0.22)}" font-weight="600"
        letter-spacing="${Math.round(coinR * 0.22 * 0.28)}"
        fill="${C.brassLit}" fill-opacity="0.5">STD</text>

  <!-- Decorative ring -->
  <circle cx="${cx}" cy="${coinY}" r="${coinR * 0.975}"
          fill="none"
          stroke="${C.brassLit}"
          stroke-width="${Math.max(1, coinR * 0.012)}"
          stroke-opacity="0.2"
          stroke-dasharray="${Math.round(coinR * 0.04)} ${Math.round(coinR * 0.04)}"/>

  <!-- ── TITLE TEXT ──────────────────────────────────────────────────── -->
  <!-- "SCREW THE DEALER" in two lines of engraved Cinzel caps -->
  <!-- Thin brass rule above title -->
  <line x1="${cx - titleSize * 3.2}" y1="${titleY - titleSize * 0.9}"
        x2="${cx + titleSize * 3.2}" y2="${titleY - titleSize * 0.9}"
        stroke="${C.brassDim}" stroke-width="1" stroke-opacity="0.5"/>

  <text x="${cx}" y="${titleY}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
        font-size="${titleSize}" font-weight="600"
        letter-spacing="${Math.round(titleSize * 0.18)}"
        filter="url(#${uid}-tglow)"
        fill="${C.brass}">SCREW THE DEALER</text>
  <!-- Engraved relief offset -->
  <text x="${cx + 0.8}" y="${titleY - 1}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
        font-size="${titleSize}" font-weight="600"
        letter-spacing="${Math.round(titleSize * 0.18)}"
        fill="${C.brassLit}" fill-opacity="0.35">SCREW THE DEALER</text>

  <!-- Subtitle -->
  <text x="${cx}" y="${subtitleY}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel', 'Palatino Linotype', Georgia, serif"
        font-size="${subtitleSize}" font-weight="400"
        letter-spacing="${Math.round(subtitleSize * 0.28)}"
        fill="${C.ivoryDim}" fill-opacity="0.7">THE CARD DRINKING GAME</text>

  <!-- Thin brass rule below subtitle -->
  <line x1="${cx - titleSize * 3.2}" y1="${subtitleY + subtitleSize * 0.9}"
        x2="${cx + titleSize * 3.2}" y2="${subtitleY + subtitleSize * 0.9}"
        stroke="${C.brassDim}" stroke-width="1" stroke-opacity="0.5"/>

  <!-- Four small suit pip ornaments flanking the rules (decorative) -->
  ${['♠', '♣', '♥', '♦'].map((pip, i) => {
    const px = cx + (i < 2 ? -1 : 1) * titleSize * (i % 2 === 0 ? 3.5 : 3.8);
    return `<text x="${px}" y="${titleY + (subtitleY - titleY) / 2}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="${Math.round(subtitleSize * 0.9)}"
        fill="${(i === 2 || i === 3) ? C.oxblood : C.brassDim}"
        fill-opacity="0.55">${pip}</text>`;
  }).join('\n  ')}
</svg>`;
}

// ────────────────────────────────────────────────────────────────────────────
// favicon.svg — the source SVG written to public/
// Uses the standard icon artwork at a neutral viewBox size
// ────────────────────────────────────────────────────────────────────────────
const faviconSvg = buildIconSvg(512, { maskable: false, solidBg: true });
writeFileSync(resolve(PUBLIC, 'favicon.svg'), faviconSvg, 'utf8');
console.log('✔ public/favicon.svg written');

// ────────────────────────────────────────────────────────────────────────────
// ICON OUTPUTS
// ────────────────────────────────────────────────────────────────────────────
const iconJobs = [
  {
    out: resolve(ICONS_DIR, 'icon-192.png'),
    size: 192,
    opts: { maskable: false, solidBg: true },
    label: 'public/icons/icon-192.png',
  },
  {
    out: resolve(ICONS_DIR, 'icon-512.png'),
    size: 512,
    opts: { maskable: false, solidBg: true },
    label: 'public/icons/icon-512.png',
  },
  {
    out: resolve(ICONS_DIR, 'icon-512-maskable.png'),
    size: 512,
    opts: { maskable: true, solidBg: true },
    label: 'public/icons/icon-512-maskable.png',
  },
  {
    out: resolve(PUBLIC, 'apple-touch-icon.png'),
    size: 180,
    opts: { maskable: false, solidBg: true },
    label: 'public/apple-touch-icon.png',
  },
];

for (const job of iconJobs) {
  const svg = buildIconSvg(job.size, job.opts);
  await sharp(Buffer.from(svg))
    .resize(job.size, job.size)
    .png({ compressionLevel: 9 })
    .toFile(job.out);
  console.log(`✔ ${job.label} (${job.size}×${job.size})`);
}

// ────────────────────────────────────────────────────────────────────────────
// iOS SPLASH SCREENS
// Device list: [width, height, pixelRatio, deviceWidthPt, deviceHeightPt]
// Media query uses device-width / device-height in CSS points + pixel-ratio.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Each entry: { label, w, h, dpr, ptW, ptH }
 * w×h = actual PNG pixel dimensions
 * ptW×ptH = CSS points (w/dpr, h/dpr) used in the media query
 * dpr = -webkit-device-pixel-ratio
 */
const splashDevices = [
  // iPhone 16 Pro Max
  { label: 'iphone-16-pro-max', w: 1320, h: 2868, dpr: 3, ptW: 440, ptH: 956 },
  // iPhone 16 Pro
  { label: 'iphone-16-pro',     w: 1206, h: 2622, dpr: 3, ptW: 402, ptH: 874 },
  // iPhone 16 Plus / 15 Plus / 14 Plus / 15 / 14 Pro Max
  { label: 'iphone-16-plus',    w: 1290, h: 2796, dpr: 3, ptW: 430, ptH: 932 },
  // iPhone 15 / 14 Pro
  { label: 'iphone-15-14pro',   w: 1179, h: 2556, dpr: 3, ptW: 393, ptH: 852 },
  // iPhone 14 / 13 / 12
  { label: 'iphone-14',         w: 1170, h: 2532, dpr: 3, ptW: 390, ptH: 844 },
  // iPhone 13 Pro Max / 12 Pro Max
  { label: 'iphone-13-pro-max', w: 1284, h: 2778, dpr: 3, ptW: 428, ptH: 926 },
  // iPhone 13 mini / 12 mini
  { label: 'iphone-13-mini',    w: 1080, h: 2340, dpr: 3, ptW: 360, ptH: 780 },
  // iPhone 11 Pro Max / XS Max
  { label: 'iphone-11-pro-max', w: 1242, h: 2688, dpr: 3, ptW: 414, ptH: 896 },
  // iPhone 11 / XR
  { label: 'iphone-11',         w:  828, h: 1792, dpr: 2, ptW: 414, ptH: 896 },
  // iPhone X / XS / 11 Pro
  { label: 'iphone-x',          w: 1125, h: 2436, dpr: 3, ptW: 375, ptH: 812 },
  // iPhone 8 Plus / 7 Plus
  { label: 'iphone-8-plus',     w: 1242, h: 2208, dpr: 3, ptW: 414, ptH: 736 },
  // iPhone SE 3rd/2nd / 8 / 7
  { label: 'iphone-se',         w:  750, h: 1334, dpr: 2, ptW: 375, ptH: 667 },
];

const splashLinks = [];

for (const dev of splashDevices) {
  const svg = buildSplashSvg(dev.w, dev.h);
  const filename = `splash-${dev.label}.png`;
  const outPath = resolve(SPLASH_DIR, filename);

  await sharp(Buffer.from(svg))
    .resize(dev.w, dev.h)
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`✔ public/splash/${filename} (${dev.w}×${dev.h})`);

  // Build the <link> tag. iOS matches on device-width + device-height in points.
  const media = [
    `(device-width: ${dev.ptW}px)`,
    `(device-height: ${dev.ptH}px)`,
    `(-webkit-device-pixel-ratio: ${dev.dpr})`,
    `(orientation: portrait)`,
  ].join(' and ');

  splashLinks.push(
    `    <link rel="apple-touch-startup-image" media="${media}" href="./splash/${filename}"/>`
  );
}

// ────────────────────────────────────────────────────────────────────────────
// INJECT SPLASH LINKS INTO index.html
// Idempotent: looks for <!-- splash:start --> / <!-- splash:end --> block first,
// falls back to <!-- @splash-links --> marker on first run.
// ────────────────────────────────────────────────────────────────────────────
const htmlPath = resolve(ROOT, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

const BLOCK_START = '<!-- splash:start -->';
const BLOCK_END   = '<!-- splash:end -->';
const MARKER      = '<!-- @splash-links -->';

const injected = [
  BLOCK_START,
  ...splashLinks,
  `    ${BLOCK_END}`,
].join('\n');

if (html.includes(BLOCK_START) && html.includes(BLOCK_END)) {
  // Re-run: replace between existing markers
  const startIdx = html.indexOf(BLOCK_START);
  const endIdx   = html.indexOf(BLOCK_END) + BLOCK_END.length;
  html = html.slice(0, startIdx) + injected + html.slice(endIdx);
  console.log('✔ index.html splash links replaced (idempotent re-run)');
} else if (html.includes(MARKER)) {
  // First run: replace the marker
  html = html.replace(MARKER, injected);
  console.log('✔ index.html splash links injected at <!-- @splash-links -->');
} else {
  console.warn('⚠ Could not find injection point in index.html — no changes made');
}

writeFileSync(htmlPath, html, 'utf8');

console.log('\n✅ All icons and splash screens generated successfully.');
