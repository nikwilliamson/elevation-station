import React, { useMemo } from "react"
import { motion } from "motion/react"

import type { ElevationType, InteractionStateName, InteractionStateConfig, LayerCount } from "../../shared/defaults"
import { INTERACTION_STATE_NAMES } from "../../shared/defaults"
import { LAYOUT_SPRING } from "../../shared/animationConstants"
import { ControlCard } from "../controlCard/ControlCard"
import { ControlSlider } from "../controlSlider/ControlSlider"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { ShadowPreview } from "../shadowPreview/ShadowPreview"
import { StateGroup } from "../stateGroup/StateGroup"
import { TabSelect } from "../tabSelect/TabSelect"
import { TextInput } from "../textInput/TextInput"

import "./elevationEditModal.css"

/* ── Constants ─────────────────────────────────────────────────────── */

const TYPE_OPTIONS: { label: string; value: ElevationType }[] = [
  { label: "Static", value: "static" },
  { label: "Interactive", value: "interactive" },
]

const LAYER_COUNT_OPTIONS: { label: string; value: string }[] = [
  { label: "Global", value: "global" },
  { label: "Low", value: "3" },
  { label: "Med", value: "5" },
  { label: "High", value: "7" },
]

/* ── ElevationTokenFields ──────────────────────────────────────────── */

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

interface ElevationLevel {
  name: string
  depth: number
  zIndex: number
  type: ElevationType
  layerCount?: LayerCount
  interactionStates?: Record<InteractionStateName, InteractionStateConfig>
  enabledStates?: Record<InteractionStateName, boolean>
}

function ElevationTokenFields({ editingIndex, editingLevel, showDepth, onTypeChange, onNameChange, onZIndexChange, onLayerCountChange, onDepthChange }: ElevationTokenFieldsProps) {
  return (
    <>
      <div className="es-shadow-token-designer__slider-group">
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
        labelSize="sm"
        size="sm"
        emphasis="high"
        value={editingLevel.name}
        onChange={(e) => onNameChange(editingIndex, e.target.value)}
        spellCheck={false}
      />
      <TextInput
        label="z-index"
        type="number"
        labelSize="sm"
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
      <div className="es-shadow-token-designer__slider-group">
        <FieldLabel size="md" label="Resolution" description="Number of shadow layers to render" />
        <TabSelect
          options={LAYER_COUNT_OPTIONS}
          value={editingLevel.layerCount?.toString() ?? "global"}
          onChange={(v) => onLayerCountChange(editingIndex, v === "global" ? undefined : (Number(v) as LayerCount))}
          layoutId="elevation-layer-count"
          ariaLabel="Layer count"
        />
      </div>
      <motion.div
        animate={{ gridTemplateRows: showDepth && onDepthChange ? "1fr" : "0fr" }}
        transition={LAYOUT_SPRING}
        style={{ display: "grid", overflow: "hidden" }}
      >
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <ControlSlider
            label="Depth"
            size="sm"
            value={editingLevel.depth}
            min={0}
            max={1}
            step={0.01}
            onChange={(d) => onDepthChange?.(editingIndex, d)}
          />
        </div>
      </motion.div>
    </>
  )
}

/* ── ElevationEditModal ────────────────────────────────────────────── */

export interface ElevationEditModalProps {
  editingIndex: number
  editingLevel: ElevationLevel
  preview: { bgHex: string; surfaceHex: string }
  shadowColorHsl: string
  accentColorHsl: string | null
  shadowStacks: string[]
  interactiveShadowStacks: Record<number, Record<InteractionStateName, string>>
  interactiveColorHsls: Record<number, Record<InteractionStateName, { shadow: string; accent: string | null }>>
  onTypeChange: (index: number, type: ElevationType) => void
  onNameChange: (index: number, name: string) => void
  onZIndexChange: (index: number, zIndex: number) => void
  onDepthChange: (index: number, depth: number) => void
  onLayerCountChange: (index: number, layerCount: LayerCount | undefined) => void
  onInteractionStateChange: (index: number, stateName: InteractionStateName, key: keyof InteractionStateConfig, value: number | string | null) => void
  onInteractionStateEnabledChange: (index: number, stateName: InteractionStateName, enabled: boolean) => void
}

export function ElevationEditModal({
  editingIndex,
  editingLevel,
  preview,
  shadowColorHsl,
  accentColorHsl,
  shadowStacks,
  interactiveShadowStacks,
  interactiveColorHsls,
  onTypeChange,
  onNameChange,
  onZIndexChange,
  onDepthChange,
  onLayerCountChange,
  onInteractionStateChange,
  onInteractionStateEnabledChange,
}: ElevationEditModalProps) {
  const isInteractive = editingLevel.type === "interactive" && !!editingLevel.interactionStates

  const stateGroupInteractionStates = useMemo(() => {
    if (isInteractive) return editingLevel.interactionStates!
    return {
      default: { depth: editingLevel.depth, intensity: 0, hardness: 0, shadowColorHex: "#000000", accentColorHex: null, componentBgHex: preview.surfaceHex, componentTextHex: "#333333" },
      hover: { depth: 0, intensity: 0, hardness: 0, shadowColorHex: "#000000", accentColorHex: null, componentBgHex: preview.surfaceHex, componentTextHex: "#333333" },
      active: { depth: 0, intensity: 0, hardness: 0, shadowColorHex: "#000000", accentColorHex: null, componentBgHex: preview.surfaceHex, componentTextHex: "#333333" },
    } satisfies Record<InteractionStateName, InteractionStateConfig>
  }, [isInteractive, editingLevel.interactionStates, editingLevel.depth, preview.surfaceHex])

  const stateGroupShadowStacks = useMemo(() => {
    if (isInteractive) return interactiveShadowStacks[editingIndex]
    return { default: shadowStacks[editingIndex], hover: "none", active: "none" }
  }, [isInteractive, interactiveShadowStacks, shadowStacks, editingIndex])

  return (
    <motion.div
      className="es-elevation-modal__grid"
      style={{ "--shadow-color": shadowColorHsl, ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}) } as React.CSSProperties}
      animate={{ gridTemplateColumns: isInteractive ? "2fr 1fr" : "1fr 0fr" }}
      transition={LAYOUT_SPRING}
    >
      <div className="es-elevation-modal__column es-elevation-modal__column--scroll">
        <StateGroup
          editingIndex={editingIndex}
          interactionStates={stateGroupInteractionStates}
          enabledStates={editingLevel.enabledStates}
          interactiveShadowStacks={stateGroupShadowStacks}
          preview={preview}
          states={isInteractive ? undefined : ["default"]}
          showStateControls={isInteractive}
          defaultExtra={
            <ControlCard title="Elevation Token" size="sm">
              <ElevationTokenFields
                editingIndex={editingIndex}
                editingLevel={editingLevel}
                showDepth={!isInteractive}
                onTypeChange={onTypeChange}
                onNameChange={onNameChange}
                onZIndexChange={onZIndexChange}
                onLayerCountChange={onLayerCountChange}
                onDepthChange={onDepthChange}
              />
            </ControlCard>
          }
          onInteractionStateChange={onInteractionStateChange}
          onInteractionStateEnabledChange={onInteractionStateEnabledChange}
        />
      </div>
      <div className="es-elevation-modal__column es-elevation-modal__column--preview" style={{ overflow: "hidden", minWidth: 0 }}>
        {isInteractive && editingLevel.interactionStates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", visualDuration: 0.3, bounce: 0, delay: 0.1 }}
          >
            <ControlCard title="Interactive Preview" size="sm">
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
            </ControlCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
