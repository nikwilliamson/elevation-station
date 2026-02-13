import React from "react"

import "./shadowPreview.css"

interface ShadowPreviewProps {
  bgHex: string
  surfaceHex: string
  shadowStack: string
  className?: string
}

export const ShadowPreview = React.memo<ShadowPreviewProps>(
  ({ bgHex, surfaceHex, shadowStack, className }) => (
    <div
      className={`es-shadow-preview${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: bgHex }}
    >
      <div
        className="es-shadow-preview__card"
        style={{
          boxShadow: shadowStack,
          backgroundColor: surfaceHex,
        }}
      />
    </div>
  ),
)

ShadowPreview.displayName = "ShadowPreview"
