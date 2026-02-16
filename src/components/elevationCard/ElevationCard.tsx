import React, { useCallback } from "react"

import type { ElevationType, InteractionStateName } from "../../shared/defaults"
import { Button } from "../button/Button"
import { RemoveButton } from "../removeButton/RemoveButton"
import { ShadowPreview } from "../shadowPreview/ShadowPreview"

import "./elevationCard.css"

interface PreviewConfig {
  bgHex: string
  surfaceHex: string
}

export type ElevationCardVariant = "grid" | "list"

interface ElevationCardProps {
  index: number
  name: string
  depth: number
  zIndex: number
  type: ElevationType
  shadowStack: string
  interactiveShadowStacks?: Record<InteractionStateName, string>
  interactiveColorHsls?: Record<InteractionStateName, { shadow: string; accent: string | null }>
  componentBgHex?: string | Record<InteractionStateName, string>
  componentTextHex?: string | Record<InteractionStateName, string>
  enabledStates?: Record<InteractionStateName, boolean>
  preview: PreviewConfig
  variant?: ElevationCardVariant
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export const ElevationCard = React.memo<ElevationCardProps>(
  ({
    index,
    name,
    depth,
    zIndex,
    type,
    shadowStack,
    interactiveShadowStacks,
    interactiveColorHsls,
    componentBgHex,
    componentTextHex,
    enabledStates,
    preview,
    variant = "grid",
    onEdit,
    onRemove,
    canRemove,
  }) => {
    const handleEdit = useCallback(() => onEdit(index), [index, onEdit])

    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove(index)
      },
      [index, onRemove],
    )

    return (
      <div className={`es-shadow-token-designer__elevation-card es-shadow-token-designer__elevation-card--${variant}`}>
        <div className="es-shadow-token-designer__elevation-content">
          <div className="es-shadow-token-designer__elevation-header">
            <span className="es-shadow-token-designer__elevation-name">{name}</span>
            <div className="es-shadow-token-designer__elevation-actions">
              <Button emphasis="low" size="xs" onClick={handleEdit}>edit</Button>
              {canRemove && (
                <RemoveButton label="Remove elevation" onClick={handleRemove} />
              )}
            </div>
          </div>
          <div className="es-shadow-token-designer__elevation-meta">
            <span className="es-shadow-token-designer__elevation-meta-item">
              z-index: <span className="es-shadow-token-designer__elevation-meta-value">{zIndex}</span>
            </span>
            <span className="es-shadow-token-designer__elevation-meta-item">
              depth: <span className="es-shadow-token-designer__elevation-meta-value">{depth.toFixed(2)}</span>
            </span>
          </div>
        </div>
        <div className="es-shadow-token-designer__elevation-preview-wrap">
          {type === "interactive" && (
            <span className="es-shadow-token-designer__elevation-badge">Interactive</span>
          )}
          <ShadowPreview
            bgHex={preview.bgHex}
            surfaceHex={preview.surfaceHex}
            shadowStack={shadowStack}
            variant={type === "interactive" ? "button" : "card"}
            buttonLabel={name}
            interactiveShadowStacks={interactiveShadowStacks}
            interactiveColorHsls={interactiveColorHsls}
            componentBgHex={componentBgHex}
            componentTextHex={componentTextHex}
            enabledStates={enabledStates}
          />
        </div>
      </div>
    )
  },
)

ElevationCard.displayName = "ElevationCard"
