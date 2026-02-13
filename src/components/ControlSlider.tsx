import React, { useCallback, useEffect, useRef } from "react"

import { FieldLabel, type FieldLabelSize } from "./FieldLabel"
import { TextInput } from "./TextInput"

import "./controlSlider.css"

interface ControlSliderProps {
  label: string
  description?: string
  size?: FieldLabelSize
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export const ControlSlider = React.memo<ControlSliderProps>(
  ({ label, description, size, value, min, max, step, onChange }) => {
    const latestRef = useRef<number | null>(null)
    const rafRef = useRef<number>(0)

    useEffect(() => {
      return () => cancelAnimationFrame(rafRef.current)
    }, [])

    const handleRangeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value)
        latestRef.current = v
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0
            if (latestRef.current !== null) {
              onChange(latestRef.current)
              latestRef.current = null
            }
          })
        }
      },
      [onChange],
    )

    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value)
        if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
      },
      [onChange, min, max],
    )

    return (
      <div className="es-control-slider">
        <FieldLabel label={label} description={description} size={size} />
        <div className="es-control-slider__row">
          <input type="range" className="es-control-slider__input" min={min} max={max} step={step} value={value} onChange={handleRangeChange} />
          <TextInput
            label={label}
            hideLabel
            type="number"
            size="xs"
            emphasis="low"
            mono
            className="es-control-slider__value"
            min={min}
            max={max}
            step={step}
            value={value.toFixed(2)}
            onChange={handleTextChange}
          />
        </div>
      </div>
    )
  },
)

ControlSlider.displayName = "ControlSlider"
