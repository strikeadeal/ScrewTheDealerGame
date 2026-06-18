# Screw the Dealer

A progressive web app for the back-room card drinking game **Screw the Dealer** —
built to be added to an iPhone Home Screen from Safari and played as a standalone,
offline, full-screen app. One device sits on the table and the deal passes left.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run icons      # regenerate icons + iOS splash screens (sharp)
```

The build in `dist/` is a static bundle — drop it on any static host (it works
from a subpath; `base` is `./`). A service worker (Workbox via `vite-plugin-pwa`)
precaches the whole shell and the self-hosted fonts, so the game runs fully
offline after the first load.

## How to play

Each round there is a **dealer**, and the player to their **left** is the **guesser**.

1. The dealer draws the top card **face-down**. The guesser **calls its value** (A–K — suit doesn't matter).
2. **First call correct →** the **dealer drinks 4**. Round ends.
3. **First call wrong →** the dealer says **higher or lower**. The guesser calls again.
4. **Second call correct →** the **dealer drinks 2**. Round ends.
5. **Second call wrong →** the **guesser drinks 1**. Round ends.
6. The card is turned **face-up onto the Board** in its value's slot, and the deal **passes left**.

**Deck exhaustion:** when the deck can't fill a round it reshuffles a fresh 52 and
says so. The Board keeps accumulating across the whole night — it's the running
record of what's come up. **End the night** at any time for a drink-tally summary.

## Add it to your iPhone Home Screen (Safari)

1. Open the deployed URL in **Safari** on the iPhone.
2. Tap the **Share** button (the square with the up arrow).
3. Choose **Add to Home Screen**, then **Add**.
4. Launch it from the new icon. It opens full-screen with no browser chrome,
   clears the notch / Dynamic Island and the home indicator, and works offline.

> Installing is Safari-only on iOS — Chrome/Firefox on iPhone can't add a PWA to
> the Home Screen. The first launch needs a network connection to cache the app;
> after that it runs offline.

## Design notes

The aesthetic is a late-night back-room card table: worn forest-green felt, a
brass rail framing the screen, aged-ivory cards with paper grain, burnished gold,
dark mahogany. Casino-adjacent without the party-app clichés.

**Palette** (defined in `src/styles/tokens.css`, every colour derives from here):

| Token | Hex | Role |
|---|---|---|
| `--mahogany` | `#241510` | deepest wood — app backdrop, behind the felt |
| `--felt` | `#1F4233` | the table surface |
| `--felt-dark` | `#14271E` | felt in shadow — vignette, recesses |
| `--brass` | `#C8A24A` | the rail, engraving, gold accents |
| `--ivory` | `#EDE3CC` | aged card face, primary text on felt |
| `--oxblood` | `#8C2F22` | red pips and the drink-danger moment |

Each colour also has a lit/dim sibling (`--brass-lit`, `--felt-lit`, etc.) used
for bevels and the overhead pool of light on the felt.

**Type** — a deliberate pairing, self-hosted so it renders right offline:

- **Cinzel** (display): engraved Roman capitals, like a brass plaque. Used with
  restraint — titles, verdicts, the drink count, and card/board numerals.
- **Spectral** (body / utility): a warm transitional serif, legible at arm's length
  in low light. Used for everything else. Deliberately **not** Inter/Roboto.

**Signature element — the Board.** A brass-railed tableau of 13 engraved value-heads
(A–K). When a round resolves, the card flips face-up and drops into its value's
column, so a glance tells you which values have come up over the night. The boldness
is spent here; everything around it is kept quiet.

**Quality floor.** Mobile-first portrait, safe-area aware (`env(safe-area-inset-*)`),
thumb-sized touch targets, no hover-dependent interactions, no accidental zoom or
text selection during play, visible keyboard focus, and `prefers-reduced-motion`
respected (card flips and reveals collapse to instant).

## Architecture

- **Vite + React + TypeScript.** Game state is a single `useReducer` (`src/game/`)
  driving a small phase machine: `roster → ready → firstCall → higherLower → verdict`
  and back, with `gameOver`. Pure helpers handle the deck, shuffle, rank order, and
  higher/lower direction.
- **`vite-plugin-pwa`** (Workbox) provides the manifest, service worker, offline
  precache, and install behaviour. `theme_color`/`background_color` are drawn from
  the palette.
- **Hand-written CSS** — CSS Modules per component plus a token sheet and an app
  shell. No utility-class framework, no component kit; the felt/brass/ivory texture
  is bespoke. Card flips use CSS 3D transforms.
