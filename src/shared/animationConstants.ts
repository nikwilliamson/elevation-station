import type { TargetAndTransition } from "motion/react"

/* ── Spring configs ──────────────────────────────────────────────── */

/** Modal open — smooth settle with subtle life */
export const MODAL_OPEN_SPRING = { type: "spring" as const, visualDuration: 0.5, bounce: 0.12 }

/** Modal close — snappy dismissal, no bounce */
export const MODAL_CLOSE_SPRING = { type: "spring" as const, visualDuration: 0.25, bounce: 0 }

/** Grid/layout spring for modal children */
export const LAYOUT_SPRING = { type: "spring" as const, visualDuration: 0.35, bounce: 0.08 }

/* ── Dialog animation states ─────────────────────────────────────── */

export const dialogInitialState: TargetAndTransition = {
  opacity: 0,
  filter: "blur(10px)",
  rotateX: 5,
  rotateY: 25,
  z: -100,
  transition: MODAL_CLOSE_SPRING,
}

export const dialogOpenState: TargetAndTransition = {
  opacity: 1,
  filter: "blur(0px)",
  rotateX: 0,
  rotateY: 0,
  z: 0,
  transition: {
    ...MODAL_OPEN_SPRING,
    opacity: { duration: 0.4, ease: "easeOut" },
  },
}
