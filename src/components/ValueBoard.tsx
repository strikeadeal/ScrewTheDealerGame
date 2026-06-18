import type { Value, Card } from '../game/types'
import { VALUES } from '../game/types'
import PlayingCard from './PlayingCard'
import styles from './ValueBoard.module.css'

export interface ValueBoardProps {
  board: Record<Value, Card[]>
}

function ValueColumn({ value, cards }: { value: Value; cards: Card[] }) {
  const count = cards.length

  return (
    <div className={styles.column}>
      {/* Engraved brass value head */}
      <div className={styles.valueHead} aria-label={`Value ${value}`}>
        <span className={styles.valueLabel}>{value}</span>
      </div>

      {/* Card stack */}
      <div className={styles.cardStack} aria-label={`${count} card${count !== 1 ? 's' : ''} in ${value}`}>
        {count === 0 ? (
          <div className={styles.emptySlot} aria-hidden="true" />
        ) : (
          <>
            {/* Show all cards stacked, most recent on top (last in array = visually topmost) */}
            {cards.map((card, i) => (
              <div key={card.id} className={styles.stackItem} style={{ zIndex: i + 1 }}>
                <PlayingCard
                  value={card.value}
                  suit={card.suit}
                  faceUp={true}
                  size="board"
                />
              </div>
            ))}
            {/* Count badge when stack has more than one card */}
            {count > 1 && (
              <div className={styles.countBadge} aria-label={`${count} cards`}>
                <span className={styles.countNum}>{count}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ValueBoard({ board }: ValueBoardProps) {
  return (
    <div className={styles.rail} role="region" aria-label="The Board — cards revealed this round">
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
