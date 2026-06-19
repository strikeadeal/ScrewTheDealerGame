import { useRef, useState } from 'react'
import type { Player } from '../game/types'
import styles from './RosterScreen.module.css'

export interface RosterScreenProps {
  players: Player[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onStart: () => void
  onRename: (id: string, name: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

export default function RosterScreen({
  players,
  onAdd,
  onRemove,
  onStart,
  onRename,
  onMove,
}: RosterScreenProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // id of the player row currently in rename-edit mode; null = none
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

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

  // Enter edit mode for a player row
  function startEditing(player: Player) {
    setEditingId(player.id)
    setEditValue(player.name)
  }

  // Commit rename on Enter or blur
  function commitEdit(player: Player) {
    const trimmed = editValue.trim()
    if (trimmed) {
      onRename(player.id, trimmed)
    }
    // Either way, exit edit mode (fall back to original name if empty)
    setEditingId(null)
    setEditValue('')
  }

  // Cancel on Escape
  function handleEditKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    player: Player,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit(player)
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditValue('')
    }
  }

  const canStart = players.length >= 2
  const lastIndex = players.length - 1

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
            players.map((p, index) => {
              const isEditing = editingId === p.id
              const isFirst = index === 0
              const isLast = index === lastIndex

              return (
                <li key={p.id} className={styles.playerRow}>
                  {isEditing ? (
                    <input
                      className={`${styles.nameInput} ${styles.inlineEdit}`}
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => handleEditKeyDown(e, p)}
                      onBlur={() => commitEdit(p)}
                      aria-label={`Rename ${p.name}`}
                      maxLength={24}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                  ) : (
                    <button
                      className={styles.playerNameBtn}
                      onClick={() => startEditing(p)}
                      aria-label={`Rename ${p.name}`}
                      title="Tap to rename"
                    >
                      <span className={styles.playerName}>{p.name}</span>
                    </button>
                  )}

                  <div className={styles.moveControls} aria-label={`Reorder ${p.name}`}>
                    <button
                      className={styles.moveBtn}
                      onClick={() => onMove(p.id, 'up')}
                      disabled={isFirst}
                      aria-disabled={isFirst}
                      aria-label={`Move ${p.name} up`}
                      tabIndex={isFirst ? -1 : 0}
                    >
                      ▲
                    </button>
                    <button
                      className={styles.moveBtn}
                      onClick={() => onMove(p.id, 'down')}
                      disabled={isLast}
                      aria-disabled={isLast}
                      aria-label={`Move ${p.name} down`}
                      tabIndex={isLast ? -1 : 0}
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.name}`}
                  >
                    Remove
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {players.length > 0 && (
          <p className={styles.seatHint}>Deal passes left, in this order.</p>
        )}
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
