import type { Player } from '../game/types'
import styles from './GameOver.module.css'

export interface GameOverProps {
  players: Player[]
  tally: Record<string, number>
  onNewGame: () => void
}

export default function GameOver({ players, tally, onNewGame }: GameOverProps) {
  const sorted = [...players].sort(
    (a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0)
  )

  const topPlayer = sorted[0]
  const topCount = topPlayer ? (tally[topPlayer.id] ?? 0) : 0

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.plaque}>
          <h1 className={styles.heading}>Night's end</h1>
        </div>
      </header>

      <section className={styles.body}>
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

        {topPlayer && topCount > 0 && (
          <p className={styles.summary}>
            {topPlayer.name} took the most — {topCount} drinks.
          </p>
        )}
      </section>

      <footer className={styles.footer}>
        <button className={styles.newGameBtn} onClick={onNewGame}>
          Start a new night
        </button>
      </footer>
    </main>
  )
}
