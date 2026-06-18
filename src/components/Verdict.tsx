import type { Card, Outcome } from '../game/types'
import PlayingCard from './PlayingCard'
import styles from './Verdict.module.css'

export interface VerdictProps {
  outcome: Outcome
  drinkerName: string
  card?: Card | null
  onNext: () => void
}

export default function Verdict({ outcome, drinkerName, card, onNext }: VerdictProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Round result">
      <div className={styles.card}>
        {card && (
          <div className={styles.revealed}>
            <PlayingCard value={card.value} suit={card.suit} faceUp size="board" />
            <span className={styles.revealedLabel}>The card was a {card.value}</span>
          </div>
        )}

        <p className={styles.whoLine}>{drinkerName} drinks</p>

        <div className={styles.countWrap} aria-label={`${outcome.amount} drinks`}>
          <span className={styles.drinkLabel}>DRINK</span>
          <span className={styles.count}>{outcome.amount}</span>
        </div>

        <p className={styles.reason}>{outcome.reason}</p>

        <button className={styles.nextBtn} onClick={onNext}>
          Pass the deal
        </button>
      </div>
    </div>
  )
}
