import React from "react"

import { FieldLabel, type FieldLabelSize } from "../fieldLabel/FieldLabel"

import "./controlCard.css"

interface ControlCardProps {
  title: string
  description?: string
  size?: FieldLabelSize
  children: React.ReactNode
}

export function ControlCard({ title, description, size = "md", children }: ControlCardProps) {
  return (
    <div className="es-control-card">
      <FieldLabel label={title} description={description} size={size} />
      <div className="es-control-card__content">
        {children}
      </div>
    </div>
  )
}
