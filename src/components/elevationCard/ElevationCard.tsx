import React, { useCallback } from "react"

import type { ElevationType, InteractionStateName } from "../../shared/defaults"
import { Button } from "../button/Button"
import { CopyButton } from "../copyButton/CopyButton"
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
  cssSnippet?: string
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
    cssSnippet,
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
      <div className={`es-elevation-card__card es-elevation-card__card--${variant}`}>
        <div className="es-elevation-card__content">
          <div className="es-elevation-card__header">
            <span className="es-elevation-card__name">{name}</span>
            {canRemove && (
              <Button icon emphasis="low" color="destructive" size="xs" aria-label="Remove elevation" onClick={handleRemove}>
                <svg viewBox="0 0 256 256" fill="none" aria-hidden="true">
                  <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" />
                  <line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" />
                </svg>
              </Button>
            )}
          </div>
          <div className="es-elevation-card__actions">
            <Button emphasis="low" size="xs" onClick={handleEdit}>Edit</Button>
            {cssSnippet && <CopyButton text={cssSnippet} emphasis="low" size="xs" />}
          </div>
          <div className="es-elevation-card__meta">
            <span className="es-elevation-card__meta-item">
              z-index: <span className="es-elevation-card__meta-value">{zIndex}</span>
            </span>
            <span className="es-elevation-card__meta-item">
              depth: <span className="es-elevation-card__meta-value">{depth.toFixed(2)}</span>
            </span>
          </div>
        </div>
        <div className="es-elevation-card__preview-wrap">
          {type === "interactive" && (
            <span className="es-elevation-card__badge">Interactive</span>
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
