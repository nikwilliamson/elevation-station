import {
  animate,
  AnimatePresence,
  motion,
  type Transition,
  useTime,
  useTransform,
} from "motion/react"
import { useEffect, useRef, useState } from "react"

import "./button.css"

/* ── Types ─────────────────────────────────────────────────────── */

export type ButtonEmphasis = "low" | "medium" | "high"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonState = "idle" | "processing" | "success" | "error"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emphasis?: ButtonEmphasis
  size?: ButtonSize
  /** When provided, enables animated multistate mode */
  state?: ButtonState
  /** Custom labels per state */
  stateLabels?: Partial<Record<ButtonState, string>>
}

/* ── Constants ─────────────────────────────────────────────────── */

const DEFAULT_LABELS: Record<ButtonState, string> = {
  idle: "Submit",
  processing: "Processing",
  success: "Done",
  error: "Error",
}

const ICON_SIZES: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 }
const ICON_GAPS: Record<ButtonSize, number> = { sm: 5, md: 7, lg: 9 }

const SPRING: Transition = { type: "spring", stiffness: 600, damping: 30 }

const PATH_SPRING: Transition = { type: "spring", stiffness: 150, damping: 20 }

/* ── Button ────────────────────────────────────────────────────── */

export function Button({
  children,
  emphasis = "high",
  size = "md",
  state,
  stateLabels,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const isMultistate = state !== undefined
  const labels = { ...DEFAULT_LABELS, ...stateLabels }

  useEffect(() => {
    if (!ref.current || !isMultistate) return

    if (state === "error") {
      animate(
        ref.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          delay: 0.1,
        }
      )
    } else if (state === "success") {
      animate(
        ref.current,
        { scale: [1, 1.06, 1] },
        { duration: 0.3, ease: "easeInOut", times: [0, 0.5, 1] }
      )
    }
  }, [state, isMultistate])

  const cx = [
    "es-button",
    `es-button--${emphasis}`,
    `es-button--${size}`,
    isMultistate && "es-button--multistate",
    isMultistate && state && `es-button--state-${state}`,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      ref={ref}
      type={type}
      className={cx}
      disabled={disabled || (isMultistate && state === "processing")}
      {...rest}
    >
      {isMultistate && state !== undefined ? (
        <MultistateContent
          state={state}
          label={labels[state]}
          size={size}
        />
      ) : (
        children
      )}
    </button>
  )
}

/* ── Multistate content ────────────────────────────────────────── */

function MultistateContent({
  state,
  label,
  size,
}: {
  state: ButtonState
  label: string
  size: ButtonSize
}) {
  const iconSize = ICON_SIZES[size]
  const gap = ICON_GAPS[size]

  return (
    <span
      className="es-button__state-content"
      style={{ gap: state === "idle" ? 0 : gap }}
    >
      <StateIcon state={state} iconSize={iconSize} />
      <StateLabel state={state} label={label} />
    </span>
  )
}

/* ── State icon ────────────────────────────────────────────────── */

function StateIcon({
  state,
  iconSize,
}: {
  state: ButtonState
  iconSize: number
}) {
  const icons: Record<ButtonState, React.ReactNode> = {
    idle: null,
    processing: <Loader size={iconSize} />,
    success: <Check size={iconSize} />,
    error: <XIcon size={iconSize} />,
  }

  return (
    <motion.span
      className="es-button__icon-wrap"
      style={{ height: iconSize }}
      animate={{ width: state === "idle" ? 0 : iconSize }}
      transition={SPRING}
    >
      <AnimatePresence>
        <motion.span
          key={state}
          className="es-button__icon"
          initial={{ y: -30, scale: 0.5, filter: "blur(5px)" }}
          animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ y: 30, scale: 0.5, filter: "blur(5px)" }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {icons[state]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

/* ── State label ───────────────────────────────────────────────── */

function StateLabel({ state, label }: { state: ButtonState; label: string }) {
  const [width, setWidth] = useState(0)
  const measureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.getBoundingClientRect().width)
    }
  }, [label])

  return (
    <>
      <span ref={measureRef} className="es-button__label-measure">
        {label}
      </span>

      <motion.span
        className="es-button__label-wrap"
        animate={{ width }}
        transition={SPRING}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={state}
            className="es-button__label"
            initial={{
              y: -16,
              opacity: 0,
              filter: "blur(8px)",
              position: "absolute",
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              position: "relative",
            }}
            exit={{
              y: 16,
              opacity: 0,
              filter: "blur(8px)",
              position: "absolute",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  )
}

/* ── SVG icons ─────────────────────────────────────────────────── */

const VIEW_BOX = 24
const STROKE = 1.5

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: `0 0 ${VIEW_BOX} ${VIEW_BOX}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
}

const pathAnim = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: PATH_SPRING,
}

const pathAnimDelayed = {
  ...pathAnim,
  transition: { ...PATH_SPRING, delay: 0.1 },
}

function Check({ size }: { size: number }) {
  return (
    <motion.svg {...svgProps(size)}>
      <motion.polyline points="4 12 9 17 20 6" {...pathAnim} />
    </motion.svg>
  )
}

function Loader({ size }: { size: number }) {
  const time = useTime()
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false })

  return (
    <motion.span
      style={{
        rotate,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      <motion.svg {...svgProps(size)}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...pathAnim} />
      </motion.svg>
    </motion.span>
  )
}

function XIcon({ size }: { size: number }) {
  return (
    <motion.svg {...svgProps(size)}>
      <motion.line x1="6" y1="6" x2="18" y2="18" {...pathAnim} />
      <motion.line x1="18" y1="6" x2="6" y2="18" {...pathAnimDelayed} />
    </motion.svg>
  )
}
