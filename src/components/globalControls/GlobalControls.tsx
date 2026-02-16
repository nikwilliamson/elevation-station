import React from "react"

import { ControlSlider } from "../controlSlider/ControlSlider"
import "./globalControls.css"
import { ToggleButtonGroup } from "../toggleButtonGroup/ToggleButtonGroup"
import { ColorPicker } from "../colorPicker/ColorPicker"
import { FieldLabel } from "../fieldLabel/FieldLabel"

interface PreviewConfig {
  bgHex: string
  componentBgHex: string
  componentTextHex: string
}

type LayerCount = 3 | 5 | 7

interface DesignerState {
  lightX: number
  lightY: number
  layerCount: LayerCount
  states: Record<string, unknown>
  preview: PreviewConfig
}

interface SliderConfig {
  label: string
  key: string
  min: number
  max: number
  step: number
}

const LIGHT_SLIDERS: SliderConfig[] = [
  { label: "Light X", key: "lightX", min: -1, max: 1, step: 0.01 },
  { label: "Light Y", key: "lightY", min: -1, max: 1, step: 0.01 },
]

const LAYER_COUNT_OPTIONS: { label: string; value: LayerCount }[] = [
  { label: "Low", value: 3 },
  { label: "Medium", value: 5 },
  { label: "High", value: 7 },
]

const PREVIEW_FIELDS: { label: string; key: keyof PreviewConfig }[] = [
  { label: "Background", key: "bgHex" },
  { label: "Component BG", key: "componentBgHex" },
  { label: "Component Text", key: "componentTextHex" },
]

export interface GlobalControlsProps {
  state: DesignerState
  onLightChange: (key: "lightX" | "lightY", value: number) => void
  onLayerCountChange: (value: LayerCount) => void
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void
}

export const GlobalControls = React.memo<GlobalControlsProps>(({ state, onLightChange, onLayerCountChange, onPreviewChange }) => (
  <div className="es-interaction-designer__global-panel">
    <h3 className="es-title es-title--sm">Global Controls</h3>

    <div className="es-interaction-designer__global-section">
      {LIGHT_SLIDERS.map((slider) => (
        <ControlSlider
          key={slider.key}
          label={slider.label}
          size="sm"
          value={state[slider.key as "lightX" | "lightY"]}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          onChange={(v) => onLightChange(slider.key as "lightX" | "lightY", v)}
        />
      ))}
    </div>

    <hr className="es-interaction-designer__section-divider" />

    <div className="es-interaction-designer__slider-group">
      <FieldLabel size="sm" label="Resolution" />
      <ToggleButtonGroup options={LAYER_COUNT_OPTIONS} value={state.layerCount} onChange={onLayerCountChange} />
    </div>

    <hr className="es-interaction-designer__section-divider" />

    <div className="es-interaction-designer__global-section">
      {PREVIEW_FIELDS.map(({ label, key }) => (
        <div key={key} className="es-interaction-designer__slider-group">
          <ColorPicker label={label} labelSize="sm" value={state.preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
        </div>
      ))}
    </div>
  </div>
))

GlobalControls.displayName = "GlobalControls"
