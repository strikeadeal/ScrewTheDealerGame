import type { Card } from '../game/types'
import PlayingCard from './PlayingCard'
import styles from './CardStage.module.css'

export interface CardStageProps {
  card: Card | null
  revealed: boolean
  hint: 'higher' | 'lower' | null
  prompt: string
}

export default function CardStage({ card, revealed, hint, prompt }: CardStageProps) {
  return (
    <div className={styles.stage}>
      {/* Hint banner — unmissable when set */}
      {hint !== null && (
        <div className={styles.hint} aria-live="polite" aria-atomic="true">
          <span className={styles.hintArrow} aria-hidden="true">
            {hint === 'higher' ? '▲' : '▼'}
          </span>
          <span className={styles.hintText}>{hint === 'higher' ? 'Higher' : 'Lower'}</span>
          <span className={styles.hintArrow} aria-hidden="true">
            {hint === 'higher' ? '▲' : '▼'}
          </span>
        </div>
      )}

      {/* Card area */}
      <div className={styles.cardSlot}>
        {card !== null ? (
          <PlayingCard
            value={card.value}
            suit={card.suit}
            faceUp={revealed}
            size="stage"
          />
        ) : (
          /* Empty rest state — gives direction, not just a void */
          <div className={styles.emptyPlaceholder} aria-label="No card drawn yet">
            <span className={styles.emptySuit} aria-hidden="true">♠</span>
            <span className={styles.emptyLabel}>Top card{'\n'}face down</span>
          </div>
        )}
      </div>

      {/* Prompt instruction */}
      {prompt.length > 0 && (
        <p className={styles.prompt}>{prompt}</p>
      )}
    </div>
  )
}
