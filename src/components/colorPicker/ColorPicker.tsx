import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { formatColor, parseColorToHex } from "../../shared/colorPalette"
import { useColorFormat } from "../../shared/ColorFormatContext"
import { FieldLabel, type FieldLabelSize } from "../fieldLabel/FieldLabel"
import { TextInput } from "../textInput/TextInput"

import "./colorPicker.css"

/* ── ColorPicker ─────────────────────────────────────────────────── */

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
  label?: string
  description?: string
  hideLabel?: boolean
  labelSize?: FieldLabelSize
  toggle?: false | "on" | "off"
  onToggleChange?: (value: "on" | "off") => void
}

export function ColorPicker({ value, onChange, disabled, label, description, hideLabel, labelSize, toggle = false, onToggleChange }: ColorPickerProps) {
  const colorFormat = useColorFormat()
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const displayValue = useMemo(() => formatColor(value, colorFormat), [value, colorFormat])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  const handleFocus = useCallback(() => {
    setEditing(true)
    setDraft(displayValue)
  }, [displayValue])

  const commitValue = useCallback(() => {
    setEditing(false)
    const parsed = parseColorToHex(draft)
    if (parsed) {
      onChange(parsed)
    }
  }, [draft, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitValue()
        ;(e.target as HTMLInputElement).blur()
      }
    },
    [commitValue],
  )

  return (
    <div className="es-color-picker">
      {label && !hideLabel && <FieldLabel label={label} description={description} size={labelSize} toggle={toggle} onToggleChange={onToggleChange} />}
      <div className="es-color-picker__field">
        <button
          ref={triggerRef}
          type="button"
          className="es-color-picker__swatch"
          style={{ backgroundColor: value }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Open color picker"
          disabled={disabled}
        />
        <TextInput
          label={label ?? "Color value"}
          hideLabel
          size="sm"
          emphasis="high"
          mono
          className="es-color-picker__input"
          value={editing ? draft : displayValue}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={handleFocus}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          placeholder={colorFormat === "hex" ? "#000000" : colorFormat}
        />
      </div>
      {open && (
        <div ref={popoverRef} className="es-color-picker__popover">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="es-color-picker__popover-value">
            {formatColor(value, colorFormat)}
          </div>
        </div>
      )}
    </div>
  )
}

export type { ColorPickerProps }
