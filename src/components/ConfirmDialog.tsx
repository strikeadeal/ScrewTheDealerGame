import { useEffect, useCallback } from 'react'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  title: string
  body?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'normal'
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'normal',
}: ConfirmDialogProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel],
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
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>

        {body && <p className={styles.body}>{body}</p>}

        <div className={styles.actions}>
          <button
            className={tone === 'danger' ? styles.confirmDanger : styles.confirmNormal}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
