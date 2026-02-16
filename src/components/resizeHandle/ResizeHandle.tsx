import React, { useCallback, useRef } from "react"

import "./resizeHandle.css"

interface ResizeHandleProps {
  /** Ref to the grid container whose `gridTemplateColumns` will be updated */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Min/max fraction of the container the left pane can occupy (default 0.25–0.75) */
  min?: number
  max?: number
  /** Initial fraction (also used on double-click reset, default 0.5) */
  defaultFraction?: number
}

export function ResizeHandle({
  containerRef,
  min = 0.25,
  max = 0.75,
  defaultFraction = 0.5,
}: ResizeHandleProps) {
  const fractionRef = useRef(defaultFraction)
  const resizingRef = useRef(false)

  const applyFraction = useCallback(
    (fraction: number) => {
      fractionRef.current = fraction
      if (containerRef.current) {
        containerRef.current.style.gridTemplateColumns = `${fraction}fr auto ${1 - fraction}fr`
      }
    },
    [containerRef],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      resizingRef.current = true
      containerRef.current?.setAttribute("data-resizing", "")
      document.body.style.cursor = "col-resize"
    },
    [containerRef],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const fraction = Math.min(max, Math.max(min, (e.clientX - rect.left) / rect.width))
      applyFraction(fraction)
    },
    [containerRef, min, max, applyFraction],
  )

  const handlePointerUp = useCallback(() => {
    resizingRef.current = false
    containerRef.current?.removeAttribute("data-resizing")
    document.body.style.cursor = ""
  }, [containerRef])

  const handleDoubleClick = useCallback(() => {
    applyFraction(defaultFraction)
  }, [applyFraction, defaultFraction])

  return (
    <div
      className="es-resize-handle"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <div className="es-resize-handle__pill" />
    </div>
  )
}
