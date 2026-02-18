import React, { forwardRef, useId } from "react"

import { FieldLabel, type FieldLabelSize } from "../fieldLabel/FieldLabel"

import "./textInput.css"

/* ── Types ─────────────────────────────────────────────────────── */

export type TextInputSize = "xs" | "sm" | "md" | "lg"
export type TextInputEmphasis = "low" | "medium" | "high"

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string
  description?: string
  hideLabel?: boolean
  labelSize?: FieldLabelSize
  size?: TextInputSize
  emphasis?: TextInputEmphasis
  mono?: boolean
  maxWidth?: string
}

/* ── TextInput ─────────────────────────────────────────────────── */

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      label,
      description,
      hideLabel = false,
      labelSize = "md",
      size = "md",
      emphasis = "high",
      mono = false,
      maxWidth,
      className,
      id: idProp,
      ...rest
    },
    ref,
  ) {
    const autoId = useId()
    const id = idProp ?? autoId
    const wrapCx = [
      "es-input-wrap",
      `es-input-wrap--${size}`,
      `es-input-wrap--${emphasis}`,
      className,
    ]
      .filter(Boolean)
      .join(" ")

    const inputCx = [
      "es-input",
      `es-input--${size}`,
      `es-input--${emphasis}`,
      mono && "es-input--mono",
    ]
      .filter(Boolean)
      .join(" ")

    const input = (
      <div className={wrapCx} style={maxWidth ? { maxWidth } : undefined}>
        <input
          ref={ref}
          id={id}
          className={inputCx}
          aria-label={hideLabel ? label : undefined}
          {...rest}
        />
      </div>
    )

    if (hideLabel) return input

    return (
      <div className="es-text-input">
        <FieldLabel label={label} description={description} size={labelSize} htmlFor={id} />
        {input}
      </div>
    )
  },
)
