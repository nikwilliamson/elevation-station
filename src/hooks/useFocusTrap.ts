import { useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Traps focus inside a container while `active` is true.
 * Auto-focuses `autoFocusSelector` (or the first focusable element) on open,
 * cycles Tab/Shift+Tab, handles Escape via `onEscape`, and restores focus on close.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
  autoFocusSelector = ".es-modal__close",
) {
  const previouslyFocusedRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!active) return

    previouslyFocusedRef.current = document.activeElement

    // Auto-focus after open animation settles
    const focusTimer = setTimeout(() => {
      const container = containerRef.current
      if (container) {
        const target = container.querySelector<HTMLElement>(autoFocusSelector)
        target?.focus()
      }
    }, 300)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onEscape()
        return
      }

      if (e.key === "Tab") {
        const container = containerRef.current
        if (!container) return
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown)
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [active, onEscape, containerRef, autoFocusSelector])
}
