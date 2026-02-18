import React, { useCallback, useRef, useState } from "react"

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

    const stateOrder: InteractionStateName[] = ["default", "hover", "active"]
    const keyboardControlled = useRef(false)

    // Mouse handlers always set the visual state directly
    const handleMouseEnter = useCallback(() => {
      if (!keyboardControlled.current) setCurrentState("hover")
    }, [])
    const handleMouseLeave = useCallback(() => {
      if (!keyboardControlled.current) setCurrentState("default")
    }, [])
    const handleMouseDown = useCallback(() => {
      keyboardControlled.current = false
      setCurrentState("active")
    }, [])
    const handleMouseUp = useCallback(() => setCurrentState("hover"), [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        keyboardControlled.current = true
        setCurrentState((prev) => {
          const idx = stateOrder.indexOf(prev)
          return stateOrder[(idx + 1) % stateOrder.length]
        })
      }
    }, [])

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
            onKeyDown={handleKeyDown}
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
          onKeyDown={isInteractive ? handleKeyDown : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          role={isInteractive ? "button" : undefined}
          aria-label={isInteractive ? "Cycle interaction state" : undefined}
        />
      </div>
    )
  },
)

ShadowPreview.displayName = "ShadowPreview"
