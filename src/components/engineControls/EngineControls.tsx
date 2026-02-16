import { ControlSlider } from "../controlSlider/ControlSlider"
import { FieldLabel } from "../fieldLabel/FieldLabel"
import { TabSelect } from "../tabSelect/TabSelect"
import type { EngineParams, LayerCount } from "../../shared/defaults"

interface SliderConfig {
  label: string
  description: string
  key: keyof EngineParams
  min: number
  max: number
  step: number
}

const ENGINE_SLIDERS: SliderConfig[] = [
  { label: "Intensity", description: "Overall shadow intensity and darkness", key: "intensity", min: 0, max: 1, step: 0.01 },
  { label: "Hardness", description: "Edge sharpness from soft to hard", key: "hardness", min: 0, max: 1, step: 0.01 },
]

const LAYER_COUNT_OPTIONS: { label: string; value: LayerCount }[] = [
  { label: "Low", value: 3 },
  { label: "Medium", value: 5 },
  { label: "High", value: 7 },
]

export interface EngineControlsProps {
  engine: EngineParams
  onEngineChange: (key: keyof EngineParams, value: number) => void
}

export function EngineControls({ engine, onEngineChange }: EngineControlsProps) {
  return (
    <div className="es-shadow-token-designer__panel">
      {ENGINE_SLIDERS.map((slider) => (
        <ControlSlider key={slider.key} label={slider.label} description={slider.description} size="sm" value={engine[slider.key] as number} min={slider.min} max={slider.max} step={slider.step} onChange={(v) => onEngineChange(slider.key, v)} />
      ))}
      <div>
        <FieldLabel size="sm" label="Resolution" />
        <TabSelect options={LAYER_COUNT_OPTIONS} value={engine.layerCount} onChange={(v) => onEngineChange("layerCount", v)} layoutId="engine-layer-count" ariaLabel="Layer count" />
      </div>
    </div>
  )
}
