import React, { useCallback, useEffect, useRef, useState } from "react"

import { motion, useMotionValue, useSpring, useTransform } from "motion/react"

import { Legend } from "../legend/Legend"

/* ── Types ─────────────────────────────────────────────────────── */

export interface LightPositionPadProps {
  lightX: number
  lightY: number
  onChangeX: (value: number) => void
  onChangeY: (value: number) => void
}

/** Spring configs for the light position pad */
const LIGHT_SPRING = { stiffness: 400, damping: 35, restDelta: 0.001 }
const SUN_SCALE_SPRING = { stiffness: 500, damping: 25 }

export function LightPositionPad({ lightX, lightY, onChangeX, onChangeY }: LightPositionPadProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  // Motion values -> springs for smooth sun position
  const rawX = useMotionValue(lightX)
  const rawY = useMotionValue(lightY)
  const springX = useSpring(rawX, LIGHT_SPRING)
  const springY = useSpring(rawY, LIGHT_SPRING)

  // Map light coords (-1...1) -> percentage offsets from center
  const x = useTransform(springX, (v) => `${((-v + 1) / 2) * 100}%`)
  const y = useTransform(springY, (v) => `${((-v + 1) / 2) * 100}%`)

  // Scale spring: grows when grabbed
  const sunScale = useSpring(1, SUN_SCALE_SPRING)

  // Sync incoming prop changes (Reset, external) -> spring to new position
  useEffect(() => {
    if (!dragging) {
      rawX.set(lightX)
      rawY.set(lightY)
    }
  }, [lightX, lightY, dragging, rawX, rawY])

  const updateFromPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const pad = padRef.current
      if (!pad) return
      const rect = pad.getBoundingClientRect()
      // Pad shows light position; engine uses shadow direction — invert both axes
      const nx = Math.max(-1, Math.min(1, -(((e.clientX - rect.left) / rect.width) * 2 - 1)))
      const ny = Math.max(-1, Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)))
      const rx = Math.round(nx * 100) / 100
      const ry = Math.round(ny * 100) / 100
      rawX.set(rx)
      rawY.set(ry)
      onChangeX(rx)
      onChangeY(ry)
    },
    [onChangeX, onChangeY, rawX, rawY],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      setDragging(true)
      sunScale.set(1.4)
      updateFromPointer(e)
    },
    [updateFromPointer, sunScale],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      updateFromPointer(e)
    },
    [dragging, updateFromPointer],
  )

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    sunScale.set(1)
  }, [sunScale])

  return (
    <div className="es-shadow-token-designer__light-pad-wrapper">
      <div ref={padRef} className="es-shadow-token-designer__light-pad" style={{ cursor: dragging ? "grabbing" : "crosshair" }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Sun indicator — spring-animated position + scale */}
        <motion.div className="es-shadow-token-designer__light-pad-sun" data-active={dragging || undefined} style={{ left: x, top: y, scale: sunScale }} />
        <Legend
          items={[
            { label: "x", value: lightX.toFixed(2) },
            { label: "y", value: lightY.toFixed(2) },
          ]}
        />
      </div>
    </div>
  )
}
