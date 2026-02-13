import React, { useCallback } from "react"

import { ControlSlider } from "./ControlSlider"
import { RemoveButton } from "./RemoveButton"
import { ShadowPreview } from "./ShadowPreview"
import { TextInput } from "./TextInput"

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
  shadowStack: string
  preview: PreviewConfig
  variant?: ElevationCardVariant
  onNameChange: (index: number, name: string) => void
  onDepthChange: (index: number, depth: number) => void
  onZIndexChange: (index: number, zIndex: number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export const ElevationCard = React.memo<ElevationCardProps>(
  ({
    index,
    name,
    depth,
    zIndex,
    shadowStack,
    preview,
    variant = "grid",
    onNameChange,
    onDepthChange,
    onZIndexChange,
    onRemove,
    canRemove,
  }) => {
    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => onNameChange(index, e.target.value),
      [index, onNameChange],
    )

    const handleDepthChange = useCallback(
      (d: number) => onDepthChange(index, d),
      [index, onDepthChange],
    )

    const handleZIndexChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Math.round(Number(e.target.value));
        if (!Number.isNaN(v))
          onZIndexChange(index, Math.min(9999, Math.max(0, v)));
      },
      [index, onZIndexChange],
    )

    const handleRemove = useCallback(
      () => onRemove(index),
      [index, onRemove],
    )

    return (
      <div
        className={`es-shadow-token-designer__elevation-card es-shadow-token-designer__elevation-card--${variant}`}
      >
        <div className="es-shadow-token-designer__elevation-content">
          <div className="es-shadow-token-designer__elevation-header">
            <TextInput
              label="Name"
              hideLabel
              size="md"
              emphasis="medium"
              value={name}
              onChange={handleNameChange}
              spellCheck={false}
            />
            {canRemove && (
              <RemoveButton label="Remove elevation" onClick={handleRemove} />
            )}
          </div>
          <div className="es-shadow-token-designer__elevation-controls">
            <TextInput
              label="z-index"
              type="number"
              size="xs"
              emphasis="high"
              mono
              maxWidth="4rem"
              min={0}
              max={9999}
              step={1}
              value={zIndex}
              onChange={handleZIndexChange}
            />
            <ControlSlider
              label="Depth"
              size="sm"
              value={depth}
              min={0}
              max={1}
              step={0.01}
              onChange={handleDepthChange}
            />
          </div>
        </div>
        <ShadowPreview
          bgHex={preview.bgHex}
          surfaceHex={preview.surfaceHex}
          shadowStack={shadowStack}
        />
      </div>
    )
  },
)

ElevationCard.displayName = "ElevationCard"
