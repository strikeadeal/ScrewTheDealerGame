import { useEffect, useCallback } from 'react'
import type { Player } from '../game/types'
import styles from './ScoreBoard.module.css'

export interface ScoreBoardProps {
  players: Player[]
  tally: Record<string, number>
  onClose: () => void
}

export default function ScoreBoard({ players, tally, onClose }: ScoreBoardProps) {
  const sorted = [...players].sort(
    (a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0),
  )

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scoreboard-heading"
      onClick={onClose}
    >
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.plaqueWrap}>
          <h2 id="scoreboard-heading" className={styles.heading}>
            Standings
          </h2>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colName} scope="col">Player</th>
              <th className={styles.colDrinks} scope="col">Drinks</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className={i === 0 ? styles.rowTop : styles.row}>
                <td className={styles.cellName}>{p.name}</td>
                <td className={styles.cellDrinks}>{tally[p.id] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className={styles.closeBtn} onClick={onClose}>
          Back to the table
        </button>
      </div>
    </div>
  )
}
