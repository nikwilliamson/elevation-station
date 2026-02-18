import React from "react"

import type { InteractionStateName, InteractionStateConfig } from "../../shared/defaults"
import { INTERACTION_STATE_NAMES } from "../../shared/defaults"
import { ColorPicker } from "../colorPicker/ColorPicker"
import { ControlCard } from "../controlCard/ControlCard"
import { ControlSlider } from "../controlSlider/ControlSlider"
import { Divider } from "../divider/Divider"
import { StatePanel } from "../statePanel/StatePanel"

import "./stateGroup.css"


interface SliderConfig {
  label: string
  key: "intensity" | "hardness" | "depth"
  min: number
  max: number
  step: number
}

const STATE_SLIDERS: SliderConfig[] = [
  { label: "Intensity", key: "intensity", min: 0, max: 1, step: 0.01 },
  { label: "Hardness", key: "hardness", min: 0, max: 1, step: 0.01 },
  { label: "Depth", key: "depth", min: 0, max: 1, step: 0.01 },
]

interface StateGroupProps {
  editingIndex: number
  interactionStates: Record<InteractionStateName, InteractionStateConfig>
  enabledStates?: Record<InteractionStateName, boolean>
  interactiveShadowStacks: Record<InteractionStateName, string>
  preview: { bgHex: string; surfaceHex: string }
  states?: InteractionStateName[]
  showStateControls?: boolean
  defaultExtra?: React.ReactNode
  onInteractionStateChange: (index: number, stateName: InteractionStateName, key: keyof InteractionStateConfig, value: number | string | null) => void
  onInteractionStateEnabledChange: (index: number, stateName: InteractionStateName, enabled: boolean) => void
}

export const StateGroup = React.memo<StateGroupProps>(({
  editingIndex,
  interactionStates,
  enabledStates,
  interactiveShadowStacks,
  preview,
  states = INTERACTION_STATE_NAMES,
  showStateControls = true,
  defaultExtra,
  onInteractionStateChange,
  onInteractionStateEnabledChange,
}) => {
  return (
    <div className="es-state-group">
      {states.map((stateName, i) => {
        const cfg = interactionStates[stateName]
        return (
          <React.Fragment key={stateName}>
            {i > 0 && <Divider />}
            <StatePanel
              name={stateName}
              flat
              enabled={enabledStates?.[stateName] !== false}
              onEnabledChange={stateName !== "default" ? (enabled) => onInteractionStateEnabledChange(editingIndex, stateName, enabled) : undefined}
              shadowStack={interactiveShadowStacks?.[stateName] ?? "none"}
              variant={showStateControls ? "button" : "card"}
              preview={{
                bgHex: preview.bgHex,
                surfaceHex: preview.surfaceHex,
                componentBgHex: cfg.componentBgHex,
                componentTextHex: cfg.componentTextHex,
              }}
              aside={showStateControls ? (
                <>
                  <ColorPicker label="Component BG" labelSize="sm" value={cfg.componentBgHex} onChange={(hex) => onInteractionStateChange(editingIndex, stateName, "componentBgHex", hex)} />
                  <ColorPicker label="Component Text" labelSize="sm" value={cfg.componentTextHex} onChange={(hex) => onInteractionStateChange(editingIndex, stateName, "componentTextHex", hex)} />
                </>
              ) : undefined}
            >
              {stateName === "default" && defaultExtra}
              {showStateControls && (
                <ControlCard title="Shadow Engine" size="sm">
                  {STATE_SLIDERS.map((slider) => (
                    <ControlSlider
                      key={slider.key}
                      label={slider.label}
                      size="sm"
                      value={cfg[slider.key]}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      onChange={(v) => onInteractionStateChange(editingIndex, stateName, slider.key, v)}
                    />
                  ))}
                </ControlCard>
              )}
              {showStateControls && (
                <ControlCard title="Color" size="sm">
                  <ColorPicker label="Shadow Color" labelSize="sm" value={cfg.shadowColorHex} onChange={(hex) => onInteractionStateChange(editingIndex, stateName, "shadowColorHex", hex)} />
                  <ColorPicker
                    label="Accent Color"
                    labelSize="sm"
                    value={cfg.accentColorHex ?? cfg.shadowColorHex}
                    onChange={(hex) => onInteractionStateChange(editingIndex, stateName, "accentColorHex", hex)}
                    disabled={!cfg.accentColorHex}
                    toggle={cfg.accentColorHex ? "on" : "off"}
                    onToggleChange={(v) => onInteractionStateChange(editingIndex, stateName, "accentColorHex", v === "on" ? cfg.shadowColorHex : null)}
                  />
                </ControlCard>
              )}
            </StatePanel>
          </React.Fragment>
        )
      })}
    </div>
  )
})

StateGroup.displayName = "StateGroup"
