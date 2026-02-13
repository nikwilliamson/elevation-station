import "./removeButton.css"

interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export function RemoveButton({ label = "Remove", className, ...rest }: RemoveButtonProps) {
  return (
    <button
      type="button"
      className={`es-remove-btn${className ? ` ${className}` : ""}`}
      aria-label={label}
      {...rest}
    >
      <svg className="es-remove-btn__icon" viewBox="0 0 256 256" fill="none" aria-hidden="true">
        <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" />
        <line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24" />
      </svg>
    </button>
  )
}
