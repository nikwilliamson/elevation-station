import React, { useCallback, useState } from "react"
import { LayoutGroup, motion } from "motion/react"

import type { ElevationType, InteractionStateName, InteractionStateConfig, LayerCount, PreviewLayout } from "../../shared/defaults"
import { ColorPicker } from "../colorPicker/ColorPicker"
import { ControlSlider } from "../controlSlider/ControlSlider"
import { Divider } from "../divider/Divider"
import { ElevationCard } from "../elevationCard/ElevationCard"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { Modal } from "../modal/Modal"
import { ShadowPreview } from "../shadowPreview/ShadowPreview"
import { StatePanel } from "../statePanel/StatePanel"
import { TabSelect } from "../tabSelect/TabSelect"
import { TextInput } from "../textInput/TextInput"

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
    <div className="es-shadow-token-designer__preview-colors">
      {PREVIEW_FIELDS.map(({ label, key }) => (
        <div key={key} className="es-shadow-token-designer__slider-group">
          <ColorPicker label={label} labelSize="sm" value={preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
        </div>
      ))}
    </div>
  )
}

/* ── ElevationTokenFields ────────────────────────────────────────── */

interface ElevationTokenFieldsProps {
  editingIndex: number
  editingLevel: ElevationLevel
  showDepth?: boolean
  onTypeChange: (index: number, type: ElevationType) => void
  onNameChange: (index: number, name: string) => void
  onZIndexChange: (index: number, zIndex: number) => void
  onLayerCountChange: (index: number, layerCount: LayerCount | undefined) => void
  onDepthChange?: (index: number, depth: number) => void
}

function ElevationTokenFields({ editingIndex, editingLevel, showDepth, onTypeChange, onNameChange, onZIndexChange, onLayerCountChange, onDepthChange }: ElevationTokenFieldsProps) {
  return (
    <>
      <div>
        <FieldLabel size="sm" label="Type" />
        <TabSelect
          options={TYPE_OPTIONS}
          value={editingLevel.type}
          onChange={(type) => onTypeChange(editingIndex, type)}
          layoutId="elevation-type"
          size="md"
          ariaLabel="Elevation type"
        />
      </div>
      <TextInput
        label="Name"
        size="sm"
        emphasis="high"
        value={editingLevel.name}
        onChange={(e) => onNameChange(editingIndex, e.target.value)}
        spellCheck={false}
      />
      <TextInput
        label="z-index"
        type="number"
        size="sm"
        emphasis="high"
        mono
        min={0}
        max={9999}
        step={1}
        value={editingLevel.zIndex}
        onChange={(e) => {
          const v = Math.round(Number(e.target.value))
          if (!Number.isNaN(v))
            onZIndexChange(editingIndex, Math.min(9999, Math.max(0, v)))
        }}
      />
      <div>
        <FieldLabel size="sm" label="Resolution" />
        <TabSelect
          options={LAYER_COUNT_OPTIONS}
          value={editingLevel.layerCount?.toString() ?? "global"}
          onChange={(v) => onLayerCountChange(editingIndex, v === "global" ? undefined : (Number(v) as LayerCount))}
          layoutId="elevation-layer-count"
          ariaLabel="Layer count"
        />
      </div>
      {showDepth && onDepthChange && (
        <ControlSlider
          label="Depth"
          size="sm"
          value={editingLevel.depth}
          min={0}
          max={1}
          step={0.01}
          onChange={(d) => onDepthChange(editingIndex, d)}
        />
      )}
    </>
  )
}

/* ── ElevationPreview ────────────────────────────────────────────── */

export type { PreviewLayout }

const LAYOUT_OPTIONS: { label: string; value: PreviewLayout }[] = [
  { label: "List", value: "list" },
  { label: "Grid", value: "grid" },
]

const TYPE_OPTIONS: { label: string; value: ElevationType }[] = [
  { label: "Static", value: "static" },
  { label: "Interactive", value: "interactive" },
]

const INTERACTION_STATE_NAMES: InteractionStateName[] = ["default", "hover", "active"]

const LAYER_COUNT_OPTIONS: { label: string; value: string }[] = [
  { label: "Global", value: "global" },
  { label: "Low", value: "3" },
  { label: "Med", value: "5" },
  { label: "High", value: "7" },
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
    ? "es-shadow-token-designer__levels es-shadow-token-designer__levels--list"
    : "es-shadow-token-designer__levels"

  const handleCardClick = useCallback((index: number) => setEditingIndex(index), [])
  const handleModalClose = useCallback(() => setEditingIndex(null), [])

  const editingLevel = editingIndex !== null ? elevations[editingIndex] : null

  return (
    <>
      <div className="es-shadow-token-designer__preview-toolbar">
        <PreviewColors preview={preview} onPreviewChange={onPreviewChange} />
        <div className="es-shadow-token-designer__preview-controls">
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
          {elevations.map((level, i) => (
            <motion.div key={level.name} layout transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <ElevationCard
                index={i}
                name={level.name}
                depth={level.depth}
                zIndex={level.zIndex}
                type={level.type}
                shadowStack={shadowStacks[i]}
                interactiveShadowStacks={interactiveShadowStacks[i]}
                interactiveColorHsls={interactiveColorHsls[i]}
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
          editingLevel.type === "static" ? (
            <div className="es-elevation-modal__grid" style={{ "--shadow-color": shadowColorHsl, ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}) } as React.CSSProperties}>
              <div className="es-elevation-modal__column">
                <div className="es-elevation-modal__card">
                  <h3 className="es-title es-title--sm">Elevation Token</h3>
                  <ElevationTokenFields
                    editingIndex={editingIndex}
                    editingLevel={editingLevel}
                    showDepth
                    onTypeChange={onTypeChange}
                    onNameChange={onNameChange}
                    onZIndexChange={onZIndexChange}
                    onLayerCountChange={onLayerCountChange}
                    onDepthChange={onDepthChange}
                  />
                </div>
              </div>
              <div className="es-elevation-modal__column">
                <ShadowPreview
                  bgHex={preview.bgHex}
                  surfaceHex={preview.surfaceHex}
                  shadowStack={shadowStacks[editingIndex]}
                />
              </div>
            </div>
          ) : editingLevel.interactionStates ? (
            <div className="es-elevation-modal__grid" style={{ "--shadow-color": shadowColorHsl, ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}) } as React.CSSProperties}>
              <div className="es-elevation-modal__column es-elevation-modal__column--scroll">
                {INTERACTION_STATE_NAMES.map((stateName, i) => {
                  const cfg = editingLevel.interactionStates![stateName]
                  const stateStacks = interactiveShadowStacks[editingIndex]
                  const stateColors = interactiveColorHsls[editingIndex]
                  return (
                    <React.Fragment key={stateName}>
                      {i > 0 && <Divider />}
                      <StatePanel
                        name={stateName}
                        config={cfg}
                        isActive={false}
                        grouped
                        flat
                        enabled={editingLevel.enabledStates?.[stateName] !== false}
                        onEnabledChange={stateName !== "default" ? (enabled) => onInteractionStateEnabledChange(editingIndex, stateName, enabled) : undefined}
                        shadowStack={stateStacks?.[stateName] ?? "none"}
                        shadowColorHsl={stateColors?.[stateName]?.shadow ?? "0 0% 0%"}
                        accentColorHsl={stateColors?.[stateName]?.accent ?? null}
                        preview={{
                          bgHex: preview.bgHex,
                          componentBgHex: cfg.componentBgHex,
                          componentTextHex: cfg.componentTextHex,
                        }}
                        onSliderChange={(key, value) => onInteractionStateChange(editingIndex, stateName, key, value)}
                        onShadowColorChange={(hex) => onInteractionStateChange(editingIndex, stateName, "shadowColorHex", hex)}
                        onAccentColorChange={(hex) => onInteractionStateChange(editingIndex, stateName, "accentColorHex", hex)}
                        onComponentBgChange={(hex) => onInteractionStateChange(editingIndex, stateName, "componentBgHex", hex)}
                        onComponentTextChange={(hex) => onInteractionStateChange(editingIndex, stateName, "componentTextHex", hex)}
                      />
                    </React.Fragment>
                  )
                })}
              </div>
              <div className="es-elevation-modal__column">
                <ShadowPreview
                  variant="button"
                  buttonLabel={editingLevel.name}
                  className="es-shadow-preview--panel"
                  bgHex={preview.bgHex}
                  surfaceHex={preview.surfaceHex}
                  shadowStack="none"
                  interactiveShadowStacks={
                    interactiveShadowStacks[editingIndex] ?? { default: "none", hover: "none", active: "none" }
                  }
                  interactiveColorHsls={interactiveColorHsls[editingIndex]}
                  componentBgHex={Object.fromEntries(
                    INTERACTION_STATE_NAMES.map((s) => [s, editingLevel.interactionStates![s].componentBgHex]),
                  ) as Record<InteractionStateName, string>}
                  componentTextHex={Object.fromEntries(
                    INTERACTION_STATE_NAMES.map((s) => [s, editingLevel.interactionStates![s].componentTextHex]),
                  ) as Record<InteractionStateName, string>}
                  enabledStates={editingLevel.enabledStates}
                />
                <div className="es-elevation-modal__card">
                  <h3 className="es-title es-title--sm">Elevation Token</h3>
                  <ElevationTokenFields
                    editingIndex={editingIndex}
                    editingLevel={editingLevel}
                    onTypeChange={onTypeChange}
                    onNameChange={onNameChange}
                    onZIndexChange={onZIndexChange}
                    onLayerCountChange={onLayerCountChange}
                  />
                </div>
              </div>
            </div>
          ) : null
        )}
      </Modal>
    </>
  )
}
