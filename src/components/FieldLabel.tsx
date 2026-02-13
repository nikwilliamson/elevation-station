import React from "react"

import "./fieldLabel.css"

export type FieldLabelSize = "sm" | "md" | "lg"

interface FieldLabelProps {
  label: string
  size?: FieldLabelSize
  description?: string
  action?: React.ReactNode
  toggle?: false | "on" | "off"
  onToggleChange?: (value: "on" | "off") => void
}

export function FieldLabel({ label, size = "md", description, action, toggle = false, onToggleChange }: FieldLabelProps) {
  const hasRow = action || toggle !== false

  const toggleEl = toggle !== false && (
    <label className="es-switch">
      <input
        type="checkbox"
        className="es-switch__input"
        checked={toggle === "on"}
        onChange={() => onToggleChange?.(toggle === "on" ? "off" : "on")}
      />
      <span className="es-switch__track" />
    </label>
  )

  return (
    <div className={`es-field-label es-field-label--${size}`}>
      {hasRow ? (
        <div className="es-field-label__row">
          <label className="es-field-label__label">{label}</label>
          {action}
          {toggleEl}
        </div>
      ) : (
        <label className="es-field-label__label">{label}</label>
      )}
      {description && <p className="es-field-label__description">{description}</p>}
    </div>
  )
}
