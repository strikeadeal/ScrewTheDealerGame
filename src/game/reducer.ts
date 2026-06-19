import { VALUES } from './types'
import type { Card, GameAction, GameState, Value } from './types'
import { buildDeck, directionFor, shuffle } from './deck'

// ─── helpers ──────────────────────────────────────────────────────────────────

function emptyBoard(): Record<Value, Card[]> {
  const board = {} as Record<Value, Card[]>
  for (const v of VALUES) board[v] = []
  return board
}

// ─── public factory ───────────────────────────────────────────────────────────

export function createInitialState(): GameState {
  return {
    players: [],
    deck: [],
    board: emptyBoard(),
    dealerIndex: 0,
    currentCard: null,
    phase: 'roster',
    firstGuess: null,
    hint: null,
    outcome: null,
    tally: {},
    reshuffled: false,
    past: [],
  }
}

// ─── selectors ────────────────────────────────────────────────────────────────

export function getDealer(s: GameState) {
  if (s.players.length === 0) return null
  return s.players[s.dealerIndex] ?? null
}

export function getGuesser(s: GameState) {
  if (s.players.length === 0) return null
  return s.players[(s.dealerIndex + 1) % s.players.length] ?? null
}

export function getCallNumber(s: GameState): 1 | 2 {
  return s.phase === 'higherLower' ? 2 : 1
}

export function canUndo(s: GameState): boolean {
  return s.past.length > 0
}

// ─── reducer ──────────────────────────────────────────────────────────────────

/**
 * Produce a snapshot of `s` suitable for pushing onto the undo stack.
 * The snapshot's own `past` is cleared to avoid unbounded nesting.
 */
function snapshot(s: GameState): GameState {
  return { ...s, past: [] }
}

/**
 * Prepend the current snapshot to an existing past array, capping at 10 entries.
 * Oldest entries are dropped when the cap is exceeded.
 */
function pushPast(current: GameState, existingPast: GameState[]): GameState[] {
  return [snapshot(current), ...existingPast].slice(0, 10)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Clear reshuffled flag on every action except the one that sets it.
  // We handle the drawCard case inline and skip this default clear there.
  const base: GameState =
    action.type === 'drawCard' ? state : { ...state, reshuffled: false }

  switch (action.type) {
    case 'addPlayer': {
      const name = action.name.trim()
      if (!name) return base
      return {
        ...base,
        players: [
          ...base.players,
          { id: crypto.randomUUID(), name },
        ],
      }
    }

    case 'removePlayer': {
      return {
        ...base,
        players: base.players.filter((p) => p.id !== action.id),
      }
    }

    case 'renamePlayer': {
      const name = action.name.trim()
      if (!name) return base
      return {
        ...base,
        players: base.players.map((p) =>
          p.id === action.id ? { ...p, name } : p,
        ),
      }
    }

    case 'movePlayer': {
      const idx = base.players.findIndex((p) => p.id === action.id)
      if (idx === -1) return base
      const swapIdx = action.direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= base.players.length) return base
      const players = base.players.slice()
      ;[players[idx], players[swapIdx]] = [players[swapIdx], players[idx]]
      return { ...base, players }
    }

    case 'startGame': {
      if (base.players.length < 2) return base
      return {
        ...base,
        deck: shuffle(buildDeck()),
        board: emptyBoard(),
        tally: {},
        currentCard: null,
        firstGuess: null,
        hint: null,
        outcome: null,
        dealerIndex: 0,
        phase: 'ready',
        reshuffled: false,
        past: [], // cannot undo across a game start
      }
    }

    case 'drawCard': {
      // Build a fresh deck if exhausted, setting reshuffled flag.
      let deck = state.deck
      let reshuffled = false
      if (deck.length === 0) {
        deck = shuffle(buildDeck())
        reshuffled = true
      }

      const drawn = deck[deck.length - 1]
      const newDeck = deck.slice(0, deck.length - 1)

      // drawCard builds from state (not base) because of the reshuffled-flag
      // handling — preserve that; just add the updated past alongside.
      return {
        ...state,
        reshuffled,
        deck: newDeck,
        currentCard: drawn,
        phase: 'firstCall',
        firstGuess: null,
        hint: null,
        outcome: null,
        past: pushPast(state, state.past),
      }
    }

    case 'guess': {
      const { value } = action
      const card = base.currentCard
      if (!card) return base

      const dealer = getDealer(base)
      const guesser = getGuesser(base)
      if (!dealer || !guesser) return base

      const nextPast = pushPast(state, base.past)

      if (base.phase === 'firstCall') {
        if (value === card.value) {
          // Correct first call — dealer drinks 4.
          return {
            ...base,
            outcome: {
              drinker: 'dealer',
              playerId: dealer.id,
              amount: 4,
              reason: 'Called it on the first guess.',
            },
            tally: {
              ...base.tally,
              [dealer.id]: (base.tally[dealer.id] ?? 0) + 4,
            },
            phase: 'verdict',
            past: nextPast,
          }
        }
        // Wrong first call — give hint.
        return {
          ...base,
          firstGuess: value,
          hint: directionFor(value, card.value),
          phase: 'higherLower',
          past: nextPast,
        }
      }

      if (base.phase === 'higherLower') {
        if (value === card.value) {
          // Correct second call — dealer drinks 2.
          return {
            ...base,
            outcome: {
              drinker: 'dealer',
              playerId: dealer.id,
              amount: 2,
              reason: 'Second call landed it.',
            },
            tally: {
              ...base.tally,
              [dealer.id]: (base.tally[dealer.id] ?? 0) + 2,
            },
            phase: 'verdict',
            past: nextPast,
          }
        }
        // Wrong second call — guesser drinks 1.
        return {
          ...base,
          outcome: {
            drinker: 'guesser',
            playerId: guesser.id,
            amount: 1,
            reason: 'Two wrong calls — the guesser drinks.',
          },
          tally: {
            ...base.tally,
            [guesser.id]: (base.tally[guesser.id] ?? 0) + 1,
          },
          phase: 'verdict',
          past: nextPast,
        }
      }

      return base
    }

    case 'nextRound': {
      if (base.phase !== 'verdict' || !base.currentCard) return base
      const filed = base.currentCard
      return {
        ...base,
        board: {
          ...base.board,
          [filed.value]: [...base.board[filed.value], filed],
        },
        dealerIndex: (base.dealerIndex + 1) % base.players.length,
        currentCard: null,
        firstGuess: null,
        hint: null,
        outcome: null,
        phase: 'ready',
        past: pushPast(state, base.past),
      }
    }

    case 'endGame': {
      return { ...base, phase: 'gameOver', past: [] } // cannot undo across game end
    }

    case 'newGame': {
      return {
        ...createInitialState(),
        players: base.players,
        // past stays [] from createInitialState — cannot undo across newGame
      }
    }

    case 'undo': {
      if (base.past.length === 0) return base
      const [prev, ...remaining] = base.past
      // Restore snapshot; attach the shortened history so further undos work.
      return { ...prev, past: remaining, reshuffled: false }
    }

    default: {
      // Exhaustive check
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
