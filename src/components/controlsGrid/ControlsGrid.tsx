import { useMemo } from "react"

import { BezierCurveEditor } from "../bezierCurveEditor/BezierCurveEditor"
import { ColorControls, type ColorControlsProps } from "../colorControls/ColorControls"
import { EngineControls, type EngineControlsProps } from "../engineControls/EngineControls"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { LightPositionPad } from "../lightPositionPad/LightPositionPad"
import type { CurvePoint } from "../../shared/curvePresets"
import type { ShadowCurves } from "../../shared/defaults"

interface CurveControlsProps {
  curves: ShadowCurves
  onCurveChange: (key: keyof ShadowCurves, points: CurvePoint[]) => void
}

const CURVE_EDITORS: { label: string; description: string; key: keyof ShadowCurves; color: string; axisLabels: { x: [string, string]; y: [string, string] } }[] = [
  { label: "Layer Distribution", description: "How tightly shadow layers cluster near the surface vs. spread outward", key: "layerDistribution", color: "#126bf9", axisLabels: { x: ["Inner", "Outer"], y: ["Near", "Far"] } },
  { label: "Offset Growth", description: "How quickly shadows grow as elevation increases", key: "offsetGrowth", color: "#126bf9", axisLabels: { x: ["Low", "High"], y: ["Small", "Large"] } },
  { label: "Alpha Distribution", description: "How opacity is distributed across layers, from closest to farthest", key: "alphaDistribution", color: "#9636df", axisLabels: { x: ["Inner", "Outer"], y: ["Transparent", "Opaque"] } },
]

export interface ControlsGridProps extends CurveControlsProps, EngineControlsProps, ColorControlsProps {
  /** Raw depth values (0–1) from each elevation level */
  elevationDepths?: number[]
}

/** Match the engine's depth → En: full 0–1 range */
function depthToEn(depth: number): number {
  return Math.max(0, Math.min(1, depth))
}

export function ControlsGrid({ curves, onCurveChange, engine, onEngineChange, colorFormat, onColorFormatChange, shadowColorHex, accentColorHex, onColorChange, onAccentColorChange, elevationDepths }: ControlsGridProps) {
  const handlers = useMemo(() => Object.fromEntries(CURVE_EDITORS.map(({ key }) => [key, (points: CurvePoint[]) => onCurveChange(key, points)])) as Record<keyof ShadowCurves, (points: CurvePoint[]) => void>, [onCurveChange])

  // Remap elevation depths to the engine's normalized En space for curve markers
  const offsetGrowthMarkers = useMemo(() => elevationDepths?.map(depthToEn), [elevationDepths])

  return (
    <div className="es-shadow-token-designer__controls-grid">
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Shadow Engine" description="Core parameters that shape the shadow output" />
        <EngineControls engine={engine} onEngineChange={onEngineChange} />
      </div>
      {/* Light position */}
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Light Position" description="Where the light source is relative to the surface" />
        <LightPositionPad lightX={engine.lightX} lightY={engine.lightY} onChangeX={(v) => onEngineChange("lightX", v)} onChangeY={(v) => onEngineChange("lightY", v)} />
      </div>
      {/* Color controls */}
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Color" description="Shadow and accent color configuration" />
        <ColorControls colorFormat={colorFormat} onColorFormatChange={onColorFormatChange} shadowColorHex={shadowColorHex} accentColorHex={accentColorHex} onColorChange={onColorChange} onAccentColorChange={onAccentColorChange} />
      </div>

      {/* Curve editors */}
      {CURVE_EDITORS.map(({ label, description, key, color, axisLabels }) => (
        <div key={key} className="es-shadow-token-designer__controls-grid-cell">
          <FieldLabel label={label} description={description} />
          <BezierCurveEditor points={curves[key] ?? []} onChange={handlers[key]} color={color} label={label} xGridLines={key === "offsetGrowth" ? offsetGrowthMarkers : undefined} axisLabels={axisLabels} />
        </div>
      ))}
    </div>
  )
}
