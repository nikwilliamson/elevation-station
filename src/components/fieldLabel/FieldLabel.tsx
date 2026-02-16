import React from "react"

import { ToggleSwitch } from "../toggleSwitch/ToggleSwitch"

import "./fieldLabel.css"

export type FieldLabelSize = "sm" | "md" | "lg"

interface FieldLabelProps {
  label: string
  size?: FieldLabelSize
  description?: string
  action?: React.ReactNode
  toggle?: false | "on" | "off"
  onToggleChange?: (value: "on" | "off") => void
  htmlFor?: string
}

export function FieldLabel({ label, size = "md", description, action, toggle = false, onToggleChange, htmlFor }: FieldLabelProps) {
  const hasRow = action || toggle !== false

  const toggleEl = toggle !== false && (
    <ToggleSwitch
      checked={toggle === "on"}
      onChange={(checked) => onToggleChange?.(checked ? "on" : "off")}
      label={`Toggle ${label}`}
      size="sm"
    />
  )

  return (
    <div className={`es-field-label es-field-label--${size}`}>
      {hasRow ? (
        <div className="es-field-label__row">
          <label className="es-field-label__label" htmlFor={htmlFor}>{label}</label>
          {action}
          {toggleEl}
        </div>
      ) : (
        <label className="es-field-label__label" htmlFor={htmlFor}>{label}</label>
      )}
      {description && <p className="es-field-label__description">{description}</p>}
    </div>
  )
}
