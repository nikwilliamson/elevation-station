import { useCallback, useRef, useState } from "react"

import { HighlightedCode } from "./HighlightedCode"
import { TabSelect } from "./TabSelect"
import { Button, type ButtonState } from "./Button"

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
  const [copyState, setCopyState] = useState<ButtonState>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const content = format === "css" ? cssOutput : jsonOutput

  const handleCopy = useCallback(() => {
    clearTimeout(timeoutRef.current)

    void navigator.clipboard.writeText(content).then(
      () => {
        setCopyState("success")
        timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
      },
      () => {
        setCopyState("error")
        timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
      }
    )
  }, [content])

  return (
    <div className="es-output">
      <div className="es-output__header">
        <h3 className="es-title es-title--sm">Output</h3>
        <TabSelect options={OUTPUT_FORMAT_OPTIONS} value={format} onChange={setFormat} layoutId="output-tabs" />
      </div>
      <div className="es-output__code">
        <HighlightedCode code={content} lang={format} />
      </div>
      <div className="es-output__copy-row">
        <Button
          emphasis="high"
          size="sm"
          state={copyState}
          stateLabels={{ idle: "Copy", success: "Copied!", error: "Failed" }}
          onClick={handleCopy}
        />
      </div>
    </div>
  )
}
