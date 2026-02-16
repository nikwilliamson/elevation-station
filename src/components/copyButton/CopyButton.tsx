import { useCallback, useRef, useState } from "react"

import { Button, type ButtonState, type ButtonEmphasis, type ButtonSize } from "../button/Button"

interface CopyButtonProps {
  text: string
  emphasis?: ButtonEmphasis
  size?: ButtonSize
  labels?: { idle?: string; success?: string; error?: string }
}

export function CopyButton({ text, emphasis = "high", size = "sm", labels }: CopyButtonProps) {
  const [copyState, setCopyState] = useState<ButtonState>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCopy = useCallback(() => {
    clearTimeout(timeoutRef.current)
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyState("success")
        timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
      },
      () => {
        setCopyState("error")
        timeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
      },
    )
  }, [text])

  return (
    <Button
      emphasis={emphasis}
      size={size}
      state={copyState}
      stateLabels={{
        idle: labels?.idle ?? "Copy",
        success: labels?.success ?? "Copied!",
        error: labels?.error ?? "Failed",
      }}
      onClick={handleCopy}
    />
  )
}
