import React from "react"

import { ControlCard } from "../controlCard/ControlCard"
import { ShadowPreview } from "../shadowPreview/ShadowPreview"
import { ToggleSwitch } from "../toggleSwitch/ToggleSwitch"

import "./statePanel.css"

type InteractionStateName = "default" | "hover" | "active"

interface PreviewConfig {
  bgHex: string
  surfaceHex: string
  componentBgHex: string
  componentTextHex: string
}

const STATE_LABELS: Record<InteractionStateName, string> = {
  default: "Default",
  hover: "Hover",
  active: "Active",
}

export interface StatePanelProps {
  name: InteractionStateName
  shadowStack: string
  preview: PreviewConfig
  variant?: "card" | "button"
  aside?: React.ReactNode
  isActive?: boolean
  flat?: boolean
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  children?: React.ReactNode
}

export const StatePanel = React.memo<StatePanelProps>(({ name, shadowStack, preview, variant = "button", aside, isActive, flat, enabled, onEnabledChange, children }) => {
  const showToggle = onEnabledChange !== undefined
  const isEnabled = enabled !== false

  return (
  <div className={`es-state-panel${isActive ? " es-state-panel--active" : ""}${flat ? " es-state-panel--flat" : ""}${!isEnabled ? " es-state-panel--disabled" : ""}`}>
    <div className="es-state-panel-header">
      <h3 className="es-title es-title--sm">{STATE_LABELS[name]}</h3>
      {showToggle && (
        <ToggleSwitch checked={isEnabled} onChange={onEnabledChange!} label={`Enable ${STATE_LABELS[name]} state`} size="md" />
      )}
    </div>
    <div className={`es-state-panel__content${isEnabled ? " es-state-panel__content--open" : ""}`}>
      <div className="es-state-panel__content-inner">
        <div className={`es-state-panel__grid${React.Children.toArray(children).length <= 1 ? " es-state-panel__grid--compact" : ""}`}>
          <div className={`es-state-panel__main${React.Children.toArray(children).length <= 1 ? " es-state-panel__main--single" : ""}`}>
            {children}
          </div>
          <div className="es-state-panel__aside">
            <ControlCard title="Preview" size="sm">
              <ShadowPreview
                className="es-shadow-preview--state-panel"
                bgHex={preview.bgHex}
                surfaceHex={preview.surfaceHex}
                shadowStack={shadowStack}
                variant={variant}
                componentBgHex={preview.componentBgHex}
                componentTextHex={preview.componentTextHex}
              />
              {aside}
            </ControlCard>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
})

StatePanel.displayName = "StatePanel"
