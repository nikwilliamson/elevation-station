import { ColorPicker } from "../colorPicker/ColorPicker"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { TabSelect } from "../tabSelect/TabSelect"
import type { ColorFormat } from "../../shared/colorPalette"

const COLOR_FORMATS: { label: string; value: ColorFormat }[] = [
  { label: "OKLCH", value: "oklch" },
  { label: "LCH", value: "lch" },
  { label: "RGB", value: "rgb" },
  { label: "Hex", value: "hex" },
]

export interface ColorControlsProps {
  colorFormat: ColorFormat
  onColorFormatChange: (format: ColorFormat) => void
  shadowColorHex: string
  accentColorHex: string | null
  onColorChange: (hex: string) => void
  onAccentColorChange: (hex: string | null) => void
}

export function ColorControls({ colorFormat, onColorFormatChange, shadowColorHex, accentColorHex, onColorChange, onAccentColorChange }: ColorControlsProps) {
  return (
    <>
      <div className="es-shadow-token-designer__slider-group">
        <FieldLabel label="Color Format" description="Output format for color values" size="md" />
        <TabSelect options={COLOR_FORMATS} value={colorFormat} onChange={onColorFormatChange} layoutId="color-format-tabs" ariaLabel="Color format" />
      </div>
      <div className="es-shadow-token-designer__slider-group">
        <ColorPicker label="Shadow Color" description="Base color for inner shadow layers" labelSize="md" value={shadowColorHex} onChange={onColorChange} />
      </div>
      <div className="es-shadow-token-designer__slider-group">
        <ColorPicker
          label="Accent Color (glow)"
          description="Color for outer atmospheric layers"
          labelSize="md"
          value={accentColorHex ?? shadowColorHex}
          onChange={(hex) => onAccentColorChange(hex)}
          disabled={!accentColorHex}
          toggle={accentColorHex ? "on" : "off"}
          onToggleChange={(v) => onAccentColorChange(v === "on" ? shadowColorHex : null)}
        />
      </div>
    </>
  )
}
