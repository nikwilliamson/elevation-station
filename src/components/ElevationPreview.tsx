import { LayoutGroup, motion } from "motion/react"

import type { PreviewLayout } from "../shared/defaults"
import { ColorPicker } from "./ColorPicker"
import { ElevationCard } from "./ElevationCard"
import { TabSelect } from "./TabSelect"

import "./elevationPreview.css"

interface PreviewConfig {
  bgHex: string
  surfaceHex: string
}

interface ElevationLevel {
  name: string
  depth: number
  zIndex: number
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
  layout: PreviewLayout
  onLayoutChange: (layout: PreviewLayout) => void
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void
  onNameChange: (index: number, name: string) => void
  onDepthChange: (index: number, depth: number) => void
  onZIndexChange: (index: number, zIndex: number) => void
  onRemoveElevation: (index: number) => void
}

export function ElevationPreview({
  preview,
  elevations,
  shadowStacks,
  layout,
  onLayoutChange,
  onPreviewChange,
  onNameChange,
  onDepthChange,
  onZIndexChange,
  onRemoveElevation,
}: ElevationPreviewProps) {
  const isList = layout === "list"
  const levelsClass = isList
    ? "es-shadow-token-designer__levels es-shadow-token-designer__levels--list"
    : "es-shadow-token-designer__levels"

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
                shadowStack={shadowStacks[i]}
                preview={preview}
                variant={isList ? "list" : "grid"}
                onNameChange={onNameChange}
                onDepthChange={onDepthChange}
                onZIndexChange={onZIndexChange}
                onRemove={onRemoveElevation}
                canRemove={elevations.length > 1}
              />
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </>
  )
}
