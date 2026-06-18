import { VALUES } from '../game/types'
import type { Value } from '../game/types'
import styles from './ValuePad.module.css'

export interface ValuePadProps {
  onPick: (value: Value) => void
  excluded?: Value[]
  disabled?: boolean
}

export default function ValuePad({
  onPick,
  excluded = [],
  disabled = false,
}: ValuePadProps) {
  const excludedSet = new Set(excluded)

  return (
    <div
      className={styles.pad}
      role="group"
      aria-label="Pick a card value"
    >
      {VALUES.map(v => {
        const isExcluded = excludedSet.has(v)
        const isDisabled = disabled || isExcluded
        return (
          <button
            key={v}
            className={`${styles.key} ${isExcluded ? styles.excluded : ''}`}
            onClick={() => onPick(v)}
            disabled={isDisabled}
            aria-label={v === 'A' ? 'Ace' : v === 'J' ? 'Jack' : v === 'Q' ? 'Queen' : v === 'K' ? 'King' : v}
            aria-pressed={undefined}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
