// Shared game contracts. Logic, screens, and rendering slices all derive from these.

/** The 13 card values, in rank order (A low, K high). Suit never matters for guessing. */
export const VALUES = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
] as const
export type Value = (typeof VALUES)[number]

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const
export type Suit = (typeof SUITS)[number]

/** Hearts and diamonds print in oxblood; spades and clubs in ink. */
export const RED_SUITS: ReadonlySet<Suit> = new Set<Suit>(['hearts', 'diamonds'])

export interface Card {
  id: string // stable key, e.g. "hearts-Q"
  value: Value
  suit: Suit
}

export interface Player {
  id: string
  name: string
}

/** Who drinks when a round resolves, and why. */
export type Drinker = 'dealer' | 'guesser'
export interface Outcome {
  drinker: Drinker
  playerId: string
  amount: 4 | 2 | 1
  /** Plain, player-facing reason, e.g. "Nailed it first call." */
  reason: string
}

export type HigherLower = 'higher' | 'lower'

/**
 * Phases of play:
 *  - 'roster'      building the player list
 *  - 'ready'       deal pending; the new dealer taps to draw the top card
 *  - 'firstCall'   card is down; guesser makes the first call
 *  - 'higherLower' first call was wrong; dealer has said higher/lower
 *  - 'verdict'     round resolved; card revealed; drink prompt shown
 *  - 'gameOver'    night ended; summary shown
 */
export type Phase =
  | 'roster'
  | 'ready'
  | 'firstCall'
  | 'higherLower'
  | 'verdict'
  | 'gameOver'

export interface GameState {
  players: Player[]
  deck: Card[] // remaining cards, top of deck = last element
  board: Record<Value, Card[]> // cards revealed into each value's slot, in order
  dealerIndex: number // index into players; guesser is the next player (wraps)
  currentCard: Card | null // the drawn, face-down card for this round
  phase: Phase
  firstGuess: Value | null
  hint: HigherLower | null // dealer's higher/lower steer after a wrong first call
  outcome: Outcome | null
  /** Total drinks taken per player across the night, keyed by player id. */
  tally: Record<string, number>
  /** True for one render after the deck was rebuilt, so the UI can announce it. */
  reshuffled: boolean
}

export type GameAction =
  | { type: 'addPlayer'; name: string }
  | { type: 'removePlayer'; id: string }
  | { type: 'startGame' }
  | { type: 'drawCard' } // begin a round: take top card face-down
  | { type: 'guess'; value: Value } // first or second call, depending on phase
  | { type: 'nextRound' } // from verdict: file the card, pass the deal left
  | { type: 'endGame' }
  | { type: 'newGame' } // back to roster, keep players
