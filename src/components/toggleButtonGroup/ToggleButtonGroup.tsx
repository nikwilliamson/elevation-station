import "./toggleButtonGroup.css"

interface ToggleOption<T extends string | number> {
  label: string
  value: T
}

interface ToggleButtonGroupProps<T extends string | number> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  variant?: "separated" | "segmented"
}

export function ToggleButtonGroup<T extends string | number>({ options, value, onChange, variant = "separated" }: ToggleButtonGroupProps<T>) {
  return (
    <div className={`es-toggle-group${variant === "segmented" ? " es-toggle-group--segmented" : ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="es-toggle-group__btn"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
