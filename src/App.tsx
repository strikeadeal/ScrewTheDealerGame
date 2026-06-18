import { useGame, getDealer, getGuesser, getCallNumber } from './game/useGame'
import RosterScreen from './components/RosterScreen'
import TurnStrip from './components/TurnStrip'
import CardStage from './components/CardStage'
import ValuePad from './components/ValuePad'
import ValueBoard from './components/ValueBoard'
import Verdict from './components/Verdict'
import GameOver from './components/GameOver'
import styles from './App.module.css'

export default function App() {
  const { state, dispatch } = useGame()
  const dealer = getDealer(state)
  const guesser = getGuesser(state)
  const callNumber = getCallNumber(state)

  if (state.phase === 'roster') {
    return (
      <main className={styles.app}>
        <RosterScreen
          players={state.players}
          onAdd={(name) => dispatch({ type: 'addPlayer', name })}
          onRemove={(id) => dispatch({ type: 'removePlayer', id })}
          onStart={() => dispatch({ type: 'startGame' })}
        />
      </main>
    )
  }

  if (state.phase === 'gameOver') {
    return (
      <main className={styles.app}>
        <GameOver
          players={state.players}
          tally={state.tally}
          onNewGame={() => dispatch({ type: 'newGame' })}
        />
      </main>
    )
  }

  // Active table: ready / firstCall / higherLower / verdict
  const isCalling = state.phase === 'firstCall' || state.phase === 'higherLower'

  const prompt =
    state.phase === 'ready'
      ? `${dealer?.name ?? 'The dealer'} deals. Tap to draw the top card.`
      : state.phase === 'firstCall'
        ? `${guesser?.name ?? 'The guesser'}, call the value.`
        : state.phase === 'higherLower'
          ? `${guesser?.name ?? 'The guesser'}, call again.`
          : 'The card stands.'

  return (
    <main className={styles.app}>
      <div className={styles.table}>
        <header className={styles.head}>
          <button
            type="button"
            className={styles.endBtn}
            onClick={() => dispatch({ type: 'endGame' })}
          >
            End the night
          </button>
        </header>

        <TurnStrip
          dealerName={dealer?.name ?? '—'}
          guesserName={guesser?.name ?? '—'}
          callNumber={callNumber}
          phase={state.phase}
        />

        {state.reshuffled && (
          <p className={styles.reshuffle} role="status">
            Deck ran out — reshuffled a fresh 52.
          </p>
        )}

        <section className={styles.stage}>
          <CardStage
            card={state.currentCard}
            revealed={state.phase === 'verdict'}
            hint={state.hint}
            prompt={prompt}
          />
        </section>

        <section className={styles.controls}>
          {state.phase === 'ready' && (
            <button
              type="button"
              className={styles.deal}
              onClick={() => dispatch({ type: 'drawCard' })}
            >
              Deal the card
            </button>
          )}
          {isCalling && (
            <ValuePad
              onPick={(value) => dispatch({ type: 'guess', value })}
              excluded={state.firstGuess ? [state.firstGuess] : undefined}
            />
          )}
        </section>

        <section className={styles.board}>
          <ValueBoard board={state.board} />
        </section>
      </div>

      {state.phase === 'verdict' && state.outcome && (
        <Verdict
          outcome={state.outcome}
          card={state.currentCard}
          drinkerName={
            state.players.find((p) => p.id === state.outcome!.playerId)?.name ??
            'Someone'
          }
          onNext={() => dispatch({ type: 'nextRound' })}
        />
      )}
    </main>
  )
}
