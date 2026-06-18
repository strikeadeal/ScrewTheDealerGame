import type { Phase } from '../game/types'
import styles from './TurnStrip.module.css'

export interface TurnStripProps {
  dealerName: string
  guesserName: string
  callNumber: 1 | 2
  phase: Phase
}

const showCall = (phase: Phase): boolean =>
  phase === 'firstCall' || phase === 'higherLower'

export default function TurnStrip({
  dealerName,
  guesserName,
  callNumber,
  phase,
}: TurnStripProps) {
  const callLabel = callNumber === 1 ? 'First call' : 'Second call'

  return (
    <div className={styles.strip} role="status" aria-live="polite">
      <div className={styles.seat}>
        <span className={styles.role}>Dealer</span>
        <span className={styles.name}>{dealerName}</span>
      </div>

      <div className={styles.center}>
        <span className={styles.arrow} aria-hidden="true">▸</span>
        {showCall(phase) && (
          <span className={styles.callBadge}>{callLabel}</span>
        )}
      </div>

      <div className={styles.seat}>
        <span className={styles.role}>Guesser</span>
        <span className={styles.name}>{guesserName}</span>
      </div>
    </div>
  )
}
