import { useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"

import {
  MODAL_OPEN_SPRING,
  dialogInitialState,
  dialogOpenState,
} from "../../shared/animationConstants"
import { useFocusTrap } from "../../hooks/useFocusTrap"

import "./modal.css"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  className?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => onClose(), [onClose])

  useFocusTrap(dialogRef, open, handleClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="es-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) handleClose()
            }}
          >
            <motion.div
              ref={dialogRef}
              className={`es-modal${className ? ` ${className}` : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={dialogInitialState}
              animate={dialogOpenState}
              exit={dialogInitialState}
              style={{ transformPerspective: 500 }}
            >
              <div className="es-modal__header">
                <h2 className="es-modal__title">{title}</h2>
                <button className="es-modal__close" onClick={handleClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <motion.div
                className="es-modal__body"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...MODAL_OPEN_SPRING, delay: 0.12 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
