import { useEffect, useReducer } from 'react'
import { gameReducer, createInitialState } from './reducer'
import type { GameState } from './types'

export { getDealer, getGuesser, getCallNumber, canUndo } from './reducer'
export { directionFor, rankOf } from './deck'

// ─── persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'screw-the-dealer/v1'

/**
 * Read a previously saved state from localStorage and validate its shape
 * before trusting it. Returns undefined if anything looks wrong or throws,
 * so the reducer can fall back to createInitialState().
 *
 * Defensive coercion:
 *  - If the saved object is missing `past` (older save), default it to []
 *    so the app is forward/backward tolerant with saved data.
 */
function loadState(): GameState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as Record<string, unknown>).players) ||
      typeof (parsed as Record<string, unknown>).phase !== 'string' ||
      typeof (parsed as Record<string, unknown>).board !== 'object' ||
      (parsed as Record<string, unknown>).board === null ||
      typeof (parsed as Record<string, unknown>).tally !== 'object' ||
      (parsed as Record<string, unknown>).tally === null
    ) {
      return undefined
    }
    const loaded = parsed as GameState
    // Forward/backward tolerance: older saves may not have `past`.
    if (!Array.isArray(loaded.past)) {
      loaded.past = []
    }
    return loaded
  } catch {
    // localStorage unavailable (Safari private mode) or JSON parse failed.
    return undefined
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useGame() {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => loadState() ?? createInitialState(),
  )

  // Persist state to localStorage on every change.
  // Failures (quota exceeded, unavailable) are silently ignored.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota / availability errors
    }
  }, [state])

  return { state, dispatch }
}
