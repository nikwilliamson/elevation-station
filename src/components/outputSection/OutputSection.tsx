import { useState } from "react"

import { HighlightedCode } from "../highlightedCode/HighlightedCode"
import { TabSelect } from "../tabSelect/TabSelect"
import { CopyButton } from "../copyButton/CopyButton"

import "./outputSection.css"

type OutputFormat = "css" | "json"

const OUTPUT_FORMAT_OPTIONS: { label: string; value: OutputFormat }[] = [
  { label: "CSS Variables", value: "css" },
  { label: "Token JSON", value: "json" },
]

interface OutputSectionProps {
  cssOutput: string
  jsonOutput: string
}

export function OutputSection({ cssOutput, jsonOutput }: OutputSectionProps) {
  const [format, setFormat] = useState<OutputFormat>("css")

  const content = format === "css" ? cssOutput : jsonOutput

  return (
    <div className="es-output">
      <div className="es-output__header">
        <h3 className="es-title es-title--sm">Output</h3>
        <TabSelect options={OUTPUT_FORMAT_OPTIONS} value={format} onChange={setFormat} layoutId="output-tabs" ariaLabel="Output format" />
      </div>
      <div className="es-output__code">
        <HighlightedCode code={content} lang={format} />
      </div>
      <div className="es-output__copy-row">
        <CopyButton text={content} />
      </div>
    </div>
  )
}
