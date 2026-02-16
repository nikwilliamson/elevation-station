import './toggleSwitch.css'

type ToggleSwitchSize = "sm" | "md"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  size?: ToggleSwitchSize
}

export function ToggleSwitch({ checked, onChange, label, size = "md" }: ToggleSwitchProps) {
  return (
    <label className={`es-switch es-switch--${size}`}>
      <input
        type="checkbox"
        className="es-switch__input"
        aria-label={label}
        checked={checked}
        onChange={() => onChange(!checked)}
      />
      <span className="es-switch__track" />
    </label>
  )
}

export type { ToggleSwitchSize }
