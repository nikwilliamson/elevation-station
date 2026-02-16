import React from "react"

import { ControlSlider } from "../controlSlider/ControlSlider"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { ToggleSwitch } from "../toggleSwitch/ToggleSwitch"
import "./statePanel.css"
import { ColorPicker } from "../colorPicker/ColorPicker"

interface InteractionStateConfig {
  intensity: number
  hardness: number
  depth: number
  shadowColorHex: string
  accentColorHex: string | null
  componentBgHex: string
  componentTextHex: string
}

type InteractionStateName = "default" | "hover" | "active"

interface PreviewConfig {
  bgHex: string
  componentBgHex: string
  componentTextHex: string
}

interface SliderConfig {
  label: string
  key: string
  min: number
  max: number
  step: number
}

const STATE_SLIDERS: SliderConfig[] = [
  { label: "Intensity", key: "intensity", min: 0, max: 1, step: 0.01 },
  { label: "Hardness", key: "hardness", min: 0, max: 1, step: 0.01 },
  { label: "Depth", key: "depth", min: 0, max: 1, step: 0.01 },
]

const STATE_LABELS: Record<InteractionStateName, string> = {
  default: "Default",
  hover: "Hover",
  active: "Active",
}

export interface StatePanelProps {
  name: InteractionStateName
  config: InteractionStateConfig
  isActive: boolean
  shadowStack: string
  shadowColorHsl: string
  accentColorHsl: string | null
  preview: PreviewConfig
  grouped?: boolean
  flat?: boolean
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  onSliderChange: (key: "intensity" | "hardness" | "depth", value: number) => void
  onShadowColorChange: (hex: string) => void
  onAccentColorChange: (hex: string | null) => void
  onComponentBgChange?: (hex: string) => void
  onComponentTextChange?: (hex: string) => void
}

export const StatePanel = React.memo<StatePanelProps>(({ name, config, isActive, shadowStack, shadowColorHsl, accentColorHsl, preview, grouped, flat, enabled, onEnabledChange, onSliderChange, onShadowColorChange, onAccentColorChange, onComponentBgChange, onComponentTextChange }) => {
  const showToggle = onEnabledChange !== undefined
  const isEnabled = enabled !== false

  return (
  <div className={`es-interaction-designer__state-panel${isActive ? " es-interaction-designer__state-panel--active" : ""}${flat ? " es-interaction-designer__state-panel--flat" : ""}${!isEnabled ? " es-interaction-designer__state-panel--disabled" : ""}`}>
    <div className="es-interaction-designer__state-panel-header">
      <h3 className="es-title es-title--sm">{STATE_LABELS[name]}</h3>
      {showToggle && (
        <ToggleSwitch checked={isEnabled} onChange={onEnabledChange!} label={`Enable ${STATE_LABELS[name]} state`} size="md" />
      )}
    </div>
    <div className={`es-state-panel__content${isEnabled ? " es-state-panel__content--open" : ""}`}>
      <div className="es-state-panel__content-inner">
        <div
          className="es-interaction-designer__state-preview"
          style={{
            backgroundColor: preview.bgHex,
            "--shadow-color": shadowColorHsl,
            ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}),
          } as React.CSSProperties}
        >
          <span
            className="es-interaction-designer__state-preview-button"
            style={{
              backgroundColor: preview.componentBgHex,
              color: preview.componentTextHex,
              boxShadow: shadowStack,
            }}
          >
            Button
          </span>
        </div>

        {grouped ? (
          <>
            <div className="es-state-panel__group-grid">
              <div className="es-state-panel__group-column">
                <FieldLabel size="sm" label="Shadow Engine" />
                <div className="es-state-panel__group">
                  {STATE_SLIDERS.map((slider) => (
                    <ControlSlider
                      key={slider.key}
                      label={slider.label}
                      size="sm"
                      value={config[slider.key as "intensity" | "hardness" | "depth"]}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      onChange={(v) => onSliderChange(slider.key as "intensity" | "hardness" | "depth", v)}
                    />
                  ))}
                </div>
              </div>
              <div className="es-state-panel__group-column">
                <FieldLabel size="sm" label="Color" />
                <div className="es-state-panel__group">
                  <ColorPicker label="Shadow Color" labelSize="sm" value={config.shadowColorHex} onChange={onShadowColorChange} />
                  <ColorPicker
                    label="Accent Color"
                    labelSize="sm"
                    value={config.accentColorHex ?? config.shadowColorHex}
                    onChange={(hex) => onAccentColorChange(hex)}
                    disabled={!config.accentColorHex}
                    toggle={config.accentColorHex ? "on" : "off"}
                    onToggleChange={(v) => onAccentColorChange(v === "on" ? config.shadowColorHex : null)}
                  />
                </div>
              </div>
            </div>
            {(onComponentBgChange || onComponentTextChange) && (
              <div className="es-state-panel__group-column">
                <FieldLabel size="sm" label="Preview" />
                <div className="es-state-panel__group">
                  <div className="es-state-panel__group-grid">
                    {onComponentBgChange && (
                      <ColorPicker label="Component BG" labelSize="sm" value={config.componentBgHex} onChange={onComponentBgChange} />
                    )}
                    {onComponentTextChange && (
                      <ColorPicker label="Component Text" labelSize="sm" value={config.componentTextHex} onChange={onComponentTextChange} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {STATE_SLIDERS.map((slider) => (
              <ControlSlider
                key={slider.key}
                label={slider.label}
                size="sm"
                value={config[slider.key as "intensity" | "hardness" | "depth"]}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                onChange={(v) => onSliderChange(slider.key as "intensity" | "hardness" | "depth", v)}
              />
            ))}
            <ColorPicker label="Shadow Color" labelSize="sm" value={config.shadowColorHex} onChange={onShadowColorChange} />
            <div className="es-interaction-designer__slider-group">
              <ColorPicker
                label="Accent Color"
                labelSize="sm"
                value={config.accentColorHex ?? config.shadowColorHex}
                onChange={(hex) => onAccentColorChange(hex)}
                disabled={!config.accentColorHex}
                toggle={config.accentColorHex ? "on" : "off"}
                onToggleChange={(v) => onAccentColorChange(v === "on" ? config.shadowColorHex : null)}
              />
            </div>
            {onComponentBgChange && (
              <ColorPicker label="Component BG" labelSize="sm" value={config.componentBgHex} onChange={onComponentBgChange} />
            )}
            {onComponentTextChange && (
              <ColorPicker label="Component Text" labelSize="sm" value={config.componentTextHex} onChange={onComponentTextChange} />
            )}
          </>
        )}
      </div>
    </div>
  </div>
  )
})

StatePanel.displayName = "StatePanel"
