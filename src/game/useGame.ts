import { useReducer } from 'react'
import { gameReducer, createInitialState } from './reducer'

export { getDealer, getGuesser, getCallNumber } from './reducer'
export { directionFor, rankOf } from './deck'

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  return { state, dispatch }
}
