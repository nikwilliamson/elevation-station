import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { animate } from "motion/react"

import "./modal.css"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  className?: string
  children: React.ReactNode
}

const OPEN_EASE = [0.17, 0.67, 0.51, 1] as const
const CLOSE_EASE = [0.67, 0.17, 0.62, 0.64] as const

export function Modal({ open, onClose, title, className, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const isAnimatingOut = useRef(false)
  const prevClassRef = useRef(className)
  const prevSizeRef = useRef<{ width: number; height: number } | null>(null)
  const resizeAnimRef = useRef<Animation | null>(null)

  const animateOut = useCallback(() => {
    if (isAnimatingOut.current) return
    isAnimatingOut.current = true

    const overlay = overlayRef.current
    const dialog = dialogRef.current
    if (!overlay || !dialog) {
      isAnimatingOut.current = false
      onClose()
      return
    }

    Promise.all([
      animate(overlay, { opacity: 0 }, { duration: 0.3, ease: [...CLOSE_EASE] }),
      animate(
        dialog,
        {
          opacity: 0,
          filter: "blur(10px)",
          transform: "perspective(500px) rotateY(25deg) rotateX(5deg) translateZ(-100px)",
        },
        { duration: 0.3, ease: [...CLOSE_EASE] },
      ),
    ]).then(() => {
      isAnimatingOut.current = false
      onClose()
    })
  }, [onClose])

  /* Animate in when opened */
  useEffect(() => {
    if (!open) return
    isAnimatingOut.current = false

    const overlay = overlayRef.current
    const dialog = dialogRef.current
    if (!overlay || !dialog) return

    /* Set initial state */
    overlay.style.opacity = "0"
    dialog.style.opacity = "0"
    dialog.style.filter = "blur(10px)"
    dialog.style.transform = "perspective(500px) rotateY(25deg) rotateX(5deg) translateZ(-100px)"

    animate(overlay, { opacity: 1 }, { duration: 0.8, delay: 0.1, ease: [...OPEN_EASE] })
    animate(
      dialog,
      {
        opacity: 1,
        filter: "blur(0px)",
        transform: "perspective(500px) rotateY(0deg) rotateX(0deg) translateZ(0px)",
      },
      { duration: 0.8, delay: 0.2, ease: [...OPEN_EASE] },
    )
  }, [open])

  /* Escape key */
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        animateOut()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, animateOut])

  /* FLIP resize when className changes (e.g. static ↔ interactive).
     Uses WAAPI directly so it doesn't cancel motion/react's open animation.
     Runs every commit to keep prevSizeRef in sync — the offsetWidth/Height
     read is cheap because layout is already pending before paint. */
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) {
      prevSizeRef.current = null
      prevClassRef.current = className
      return
    }

    const classChanged = prevClassRef.current !== className
    prevClassRef.current = className

    if (classChanged && prevSizeRef.current) {
      /* Cancel any in-flight resize */
      if (resizeAnimRef.current) {
        resizeAnimRef.current.cancel()
        resizeAnimRef.current = null
        dialog.style.overflow = ""
      }

      const from = prevSizeRef.current
      const to = { width: dialog.offsetWidth, height: dialog.offsetHeight }

      if (from.width !== to.width || from.height !== to.height) {
        const easing = `cubic-bezier(${OPEN_EASE.join(",")})`

        dialog.style.overflow = "hidden"
        const anim = dialog.animate(
          [
            { width: `${from.width}px`, height: `${from.height}px` },
            { width: `${to.width}px`, height: `${to.height}px` },
          ],
          { duration: 500, easing, fill: "none" },
        )
        resizeAnimRef.current = anim
        anim.onfinish = () => {
          dialog.style.overflow = ""
          resizeAnimRef.current = null
        }

        /* Crossfade body content */
        const body = bodyRef.current
        if (body) {
          body.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 300, delay: 150, easing, fill: "none" },
          )
        }
      }
    }

    /* Always snapshot the target size — read AFTER cancelling any old
       animation so we get the true CSS dimensions, not an in-flight value. */
    prevSizeRef.current = {
      width: dialog.offsetWidth,
      height: dialog.offsetHeight,
    }
  })

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="es-modal-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) animateOut()
      }}
    >
      <div ref={dialogRef} className={`es-modal${className ? ` ${className}` : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="es-modal__header">
          <h2 className="es-modal__title">{title}</h2>
          <button className="es-modal__close" onClick={animateOut} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div ref={bodyRef} className="es-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
