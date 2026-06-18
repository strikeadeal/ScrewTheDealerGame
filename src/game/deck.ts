import { SUITS, VALUES } from './types'
import type { Card, HigherLower, Suit, Value } from './types'

/** Build a fresh, ordered 52-card deck. Top of deck = last element. */
export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ id: `${suit}-${value}`, value, suit: suit as Suit })
    }
  }
  return deck
}

/** Fisher-Yates shuffle — returns a NEW array, does not mutate input. */
export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Returns 1 (Ace) … 13 (King). Mirrors VALUES index + 1. */
export function rankOf(value: Value): number {
  return VALUES.indexOf(value) + 1
}

/**
 * Given that guess !== actual, returns whether actual ranks higher or lower
 * than the guess. Caller guarantees the two values differ.
 */
export function directionFor(guess: Value, actual: Value): HigherLower {
  return rankOf(actual) > rankOf(guess) ? 'higher' : 'lower'
}
