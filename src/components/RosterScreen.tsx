import { useRef, useState } from 'react'
import type { Player } from '../game/types'
import styles from './RosterScreen.module.css'

export interface RosterScreenProps {
  players: Player[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onStart: () => void
}

export default function RosterScreen({
  players,
  onAdd,
  onRemove,
  onStart,
}: RosterScreenProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const name = input.trim()
    if (!name) return
    onAdd(name)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  const canStart = players.length >= 2

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.plaque}>
          <h1 className={styles.title}>Screw the Dealer</h1>
          <p className={styles.subtitle}>
            Guess the card. Wrong twice? The dealer drinks. Right first try? Drink four.
          </p>
        </div>
      </header>

      <section className={styles.body}>
        <div className={styles.addRow}>
          <input
            ref={inputRef}
            className={styles.nameInput}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Player name"
            aria-label="Player name"
            maxLength={24}
          />
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!input.trim()}
            aria-label="Add player"
          >
            Add player
          </button>
        </div>

        <ul className={styles.roster} aria-label="Players at the table" aria-live="polite">
          {players.length === 0 ? (
            <li className={styles.emptyHint}>Add the players around the table.</li>
          ) : (
            players.map(p => (
              <li key={p.id} className={styles.playerRow}>
                <span className={styles.playerName}>{p.name}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <footer className={styles.footer}>
        {!canStart && (
          <p className={styles.startHint} role="status">
            Add at least two players to start.
          </p>
        )}
        <button
          className={styles.startBtn}
          onClick={onStart}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          Start the night
        </button>
      </footer>
    </main>
  )
}
