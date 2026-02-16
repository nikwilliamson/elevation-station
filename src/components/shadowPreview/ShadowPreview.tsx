import React, { useCallback, useState } from "react"

import "./shadowPreview.css"

type InteractionStateName = "default" | "hover" | "active"

interface ShadowPreviewProps {
  bgHex: string
  surfaceHex: string
  shadowStack: string
  className?: string
  variant?: "card" | "button"
  buttonLabel?: string
  componentBgHex?: string | Record<InteractionStateName, string>
  componentTextHex?: string | Record<InteractionStateName, string>
  interactiveShadowStacks?: Record<InteractionStateName, string>
  interactiveColorHsls?: Record<InteractionStateName, { shadow: string; accent: string | null }>
  enabledStates?: Record<InteractionStateName, boolean>
}

export const ShadowPreview = React.memo<ShadowPreviewProps>(
  ({ bgHex, surfaceHex, shadowStack, className, variant = "card", buttonLabel = "Button", componentBgHex, componentTextHex, interactiveShadowStacks, interactiveColorHsls, enabledStates }) => {
    const [currentState, setCurrentState] = useState<InteractionStateName>("default")
    const isInteractive = !!interactiveShadowStacks

    // Resolve which state to use for values (shadow, colors) — disabled states fall back to default
    const resolveValues = useCallback((state: InteractionStateName): InteractionStateName => {
      if (!enabledStates || enabledStates[state]) return state
      return "default"
    }, [enabledStates])

    // Mouse handlers always set the visual state directly
    const handleMouseEnter = useCallback(() => setCurrentState("hover"), [])
    const handleMouseLeave = useCallback(() => setCurrentState("default"), [])
    const handleMouseDown = useCallback(() => setCurrentState("active"), [])
    const handleMouseUp = useCallback(() => setCurrentState("hover"), [])

    const valueState = isInteractive ? resolveValues(currentState) : currentState

    const resolvedShadow = isInteractive
      ? interactiveShadowStacks[valueState]
      : shadowStack

    const colors = isInteractive ? interactiveColorHsls?.[valueState] : null

    const resolvedBgHex = typeof componentBgHex === "object" ? componentBgHex[valueState] : componentBgHex
    const resolvedTextHex = typeof componentTextHex === "object" ? componentTextHex[valueState] : componentTextHex

    if (variant === "button") {
      return (
        <div
          className={`es-shadow-preview es-shadow-preview--button${className ? ` ${className}` : ""}`}
          style={{
            backgroundColor: bgHex,
            ...(colors ? {
              "--shadow-color": colors.shadow,
              ...(colors.accent ? { "--shadow-accent": colors.accent } : {}),
            } as React.CSSProperties : {}),
          }}
        >
          <span
            className="es-shadow-preview__button"
            style={{
              backgroundColor: resolvedBgHex,
              color: resolvedTextHex,
              boxShadow: resolvedShadow,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            role="button"
            tabIndex={0}
          >
            {buttonLabel}
          </span>
          <span className="es-shadow-preview__state-label">{currentState}</span>
        </div>
      )
    }

    return (
      <div
        className={`es-shadow-preview${className ? ` ${className}` : ""}`}
        style={{
          backgroundColor: bgHex,
          ...(colors ? {
            "--shadow-color": colors.shadow,
            ...(colors.accent ? { "--shadow-accent": colors.accent } : {}),
          } as React.CSSProperties : {}),
        }}
      >
        <div
          className={`es-shadow-preview__card${isInteractive ? " es-shadow-preview__card--interactive" : ""}`}
          style={{
            boxShadow: resolvedShadow,
            backgroundColor: surfaceHex,
          }}
          onMouseEnter={isInteractive ? handleMouseEnter : undefined}
          onMouseLeave={isInteractive ? handleMouseLeave : undefined}
          onMouseDown={isInteractive ? handleMouseDown : undefined}
          onMouseUp={isInteractive ? handleMouseUp : undefined}
        />
      </div>
    )
  },
)

ShadowPreview.displayName = "ShadowPreview"
