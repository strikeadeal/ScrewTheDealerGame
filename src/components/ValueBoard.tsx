import type { Value, Card, Suit } from '../game/types'
import { VALUES, RED_SUITS } from '../game/types'
import styles from './ValueBoard.module.css'

export interface ValueBoardProps {
  board: Record<Value, Card[]>
}

const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

function ValueColumn({ value, cards }: { value: Value; cards: Card[] }) {
  const count = cards.length
  // The column header already names the value, so the slot shows the most recent
  // card's suit plus a count — glanceable, and it always fits its column.
  const top = count > 0 ? cards[count - 1] : null
  const isRed = top ? RED_SUITS.has(top.suit) : false

  return (
    <div className={styles.column}>
      <div className={styles.valueHead}>
        <span className={styles.valueLabel}>{value}</span>
      </div>

      <div
        className={styles.slot}
        aria-label={`${value}: ${count} card${count !== 1 ? 's' : ''}`}
      >
        {top ? (
          <div className={`${styles.chip} ${isRed ? styles.red : styles.black}`}>
            <span className={styles.chipSuit} aria-hidden="true">
              {SUIT_GLYPH[top.suit]}
            </span>
            {count > 1 && <span className={styles.count}>{count}</span>}
          </div>
        ) : (
          <div className={styles.empty} aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

export default function ValueBoard({ board }: ValueBoardProps) {
  return (
    <div className={styles.rail} role="region" aria-label="The board — cards revealed this game">
      <div className={styles.board}>
        <h2 className={styles.title}>The Board</h2>
        <div className={styles.columns}>
          {VALUES.map((value) => (
            <ValueColumn key={value} value={value} cards={board[value]} />
          ))}
        </div>
      </div>
    </div>
  )
}
