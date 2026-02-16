import "./legend.css"

interface LegendItem {
  label: string
  value?: string | number
  muted?: boolean
}

interface LegendProps {
  items: LegendItem[]
}

export function Legend({ items }: LegendProps) {
  return (
    <div className="es-legend">
      {items.map((item, i) => (
        <span key={i} className="es-legend__item" data-muted={item.muted || undefined}>
          {item.value !== undefined ? (
            <>
              <span className="es-legend__label">{item.label}</span>
              <span className="es-legend__value">{item.value}</span>
            </>
          ) : (
            item.label
          )}
        </span>
      ))}
    </div>
  )
}
