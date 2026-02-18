import React, { useCallback, useMemo, useState } from "react"
import { LayoutGroup, motion } from "motion/react"

import type { ElevationType, InteractionStateName, InteractionStateConfig, LayerCount, PreviewLayout } from "../../shared/defaults"
import { INTERACTION_STATE_NAMES } from "../../shared/defaults"
import { sanitiseCssName } from "../../shared/sanitiseCssName"
import { ColorPicker } from "../colorPicker/ColorPicker"
import { ElevationCard } from "../elevationCard/ElevationCard"
import { ElevationEditModal } from "../elevationEditModal/ElevationEditModal"
import { Modal } from "../modal/Modal"
import { TabSelect } from "../tabSelect/TabSelect"

import "./elevationPreview.css"

interface PreviewConfig {
  bgHex: string
  surfaceHex: string
}

interface ElevationLevel {
  name: string
  depth: number
  zIndex: number
  type: ElevationType
  layerCount?: LayerCount
  interactionStates?: Record<InteractionStateName, InteractionStateConfig>
  enabledStates?: Record<InteractionStateName, boolean>
}

/* ── PreviewControls ─────────────────────────────────────────────── */

const PREVIEW_FIELDS: { label: string; key: keyof PreviewConfig }[] = [
  { label: "Background", key: "bgHex" },
  { label: "Surface", key: "surfaceHex" },
]

function PreviewColors({ preview, onPreviewChange }: { preview: PreviewConfig; onPreviewChange: (key: keyof PreviewConfig, hex: string) => void }) {
  return (
    <div className="es-elevation-preview__colors">
      {PREVIEW_FIELDS.map(({ label, key }) => (
        <div key={key} className="es-shadow-token-designer__slider-group">
          <ColorPicker label={label} labelSize="md" value={preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
        </div>
      ))}
    </div>
  )
}

/* ── ElevationPreview ────────────────────────────────────────────── */

export type { PreviewLayout }

const LAYOUT_OPTIONS: { label: string; value: PreviewLayout }[] = [
  { label: "List", value: "list" },
  { label: "Grid", value: "grid" },
]

export interface ElevationPreviewProps {
  preview: PreviewConfig
  elevations: ElevationLevel[]
  shadowStacks: string[]
  interactiveShadowStacks: Record<number, Record<InteractionStateName, string>>
  interactiveColorHsls: Record<number, Record<InteractionStateName, { shadow: string; accent: string | null }>>
  shadowColorHsl: string
  accentColorHsl: string | null
  layout: PreviewLayout
  onLayoutChange: (layout: PreviewLayout) => void
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void
  onNameChange: (index: number, name: string) => void
  onDepthChange: (index: number, depth: number) => void
  onZIndexChange: (index: number, zIndex: number) => void
  onRemoveElevation: (index: number) => void
  onTypeChange: (index: number, type: ElevationType) => void
  onInteractionStateChange: (index: number, stateName: InteractionStateName, key: keyof InteractionStateConfig, value: number | string | null) => void
  onInteractionStateEnabledChange: (index: number, stateName: InteractionStateName, enabled: boolean) => void
  onLayerCountChange: (index: number, layerCount: LayerCount | undefined) => void
}

export function ElevationPreview({
  preview,
  elevations,
  shadowStacks,
  interactiveShadowStacks,
  interactiveColorHsls,
  shadowColorHsl,
  accentColorHsl,
  layout,
  onLayoutChange,
  onPreviewChange,
  onNameChange,
  onDepthChange,
  onZIndexChange,
  onRemoveElevation,
  onTypeChange,
  onInteractionStateChange,
  onInteractionStateEnabledChange,
  onLayerCountChange,
}: ElevationPreviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const isList = layout === "list"
  const levelsClass = isList
    ? "es-elevation-preview__levels es-elevation-preview__levels--list"
    : "es-elevation-preview__levels"

  const handleCardClick = useCallback((index: number) => setEditingIndex(index), [])
  const handleModalClose = useCallback(() => setEditingIndex(null), [])

  const sortedElevations = React.useMemo(() => {
    const effectiveDepth = (level: ElevationLevel) =>
      level.type === "interactive" && level.interactionStates
        ? level.interactionStates.default.depth
        : level.depth

    return elevations
      .map((level, i) => ({ level, originalIndex: i }))
      .sort((a, b) => effectiveDepth(a.level) - effectiveDepth(b.level) || a.level.zIndex - b.level.zIndex)
  }, [elevations])

  const cssSnippets = useMemo(() =>
    elevations.map((level, i) => {
      const safeName = sanitiseCssName(level.name)
      if (level.type === "interactive" && interactiveShadowStacks[i]) {
        const lines: string[] = []
        for (const stateName of INTERACTION_STATE_NAMES) {
          if (level.enabledStates?.[stateName] === false) continue
          lines.push(`--shadow-elevation-${safeName}-${stateName}:\n    ${interactiveShadowStacks[i][stateName]};`)
        }
        return lines.join("\n")
      }
      return `--shadow-elevation-${safeName}:\n    ${shadowStacks[i]};`
    }),
    [elevations, shadowStacks, interactiveShadowStacks],
  )

  const editingLevel = editingIndex !== null ? elevations[editingIndex] : null

  return (
    <>
      <div className="es-elevation-preview__toolbar">
        <PreviewColors preview={preview} onPreviewChange={onPreviewChange} />
        <div className="es-elevation-preview__controls">
          <TabSelect
            options={LAYOUT_OPTIONS}
            value={layout}
            onChange={onLayoutChange}
            layoutId="preview-layout"
            size="md"
            ariaLabel="Preview layout"
          />
        </div>
      </div>
      <LayoutGroup>
        <motion.div layout className={levelsClass}>
          {sortedElevations.map(({ level, originalIndex }) => (
            <motion.div key={level.name} layout transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <ElevationCard
                index={originalIndex}
                name={level.name}
                depth={level.type === "interactive" && level.interactionStates ? level.interactionStates.default.depth : level.depth}
                zIndex={level.zIndex}
                type={level.type}
                shadowStack={shadowStacks[originalIndex]}
                interactiveShadowStacks={interactiveShadowStacks[originalIndex]}
                interactiveColorHsls={interactiveColorHsls[originalIndex]}
                componentBgHex={level.interactionStates
                  ? Object.fromEntries(
                      INTERACTION_STATE_NAMES.map((s) => [s, level.interactionStates![s].componentBgHex]),
                    ) as Record<InteractionStateName, string>
                  : undefined}
                componentTextHex={level.interactionStates
                  ? Object.fromEntries(
                      INTERACTION_STATE_NAMES.map((s) => [s, level.interactionStates![s].componentTextHex]),
                    ) as Record<InteractionStateName, string>
                  : undefined}
                cssSnippet={cssSnippets[originalIndex]}
                enabledStates={level.enabledStates}
                preview={preview}
                variant={isList ? "list" : "grid"}
                onEdit={handleCardClick}
                onRemove={onRemoveElevation}
                canRemove={elevations.length > 1}
              />
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>

      <Modal
        open={editingIndex !== null}
        onClose={handleModalClose}
        title="Elevation Token"
        className={editingLevel?.type === "interactive" ? "es-modal--interactive" : undefined}
      >
        {editingIndex !== null && editingLevel && (
          <ElevationEditModal
            editingIndex={editingIndex}
            editingLevel={editingLevel}
            preview={preview}
            shadowColorHsl={shadowColorHsl}
            accentColorHsl={accentColorHsl}
            shadowStacks={shadowStacks}
            interactiveShadowStacks={interactiveShadowStacks}
            interactiveColorHsls={interactiveColorHsls}
            onTypeChange={onTypeChange}
            onNameChange={onNameChange}
            onZIndexChange={onZIndexChange}
            onDepthChange={onDepthChange}
            onLayerCountChange={onLayerCountChange}
            onInteractionStateChange={onInteractionStateChange}
            onInteractionStateEnabledChange={onInteractionStateEnabledChange}
          />
        )}
      </Modal>
    </>
  )
}
