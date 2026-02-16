import React from "react"

import "./header.css"

interface HeaderProps {
  children?: React.ReactNode
  action?: React.ReactNode
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  function Header({ children, action }, ref) {
    return (
      <header ref={ref} className="es-header">
        <svg className="es-header__logo" viewBox="0 0 23 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Elevation Station">
          <path d="M19.7622 0L4.90434 0.369927L0 35.9521L9.2317 32.5331L2.91164 64L22.6738 19.4359L11.7457 23.2081L19.7622 0Z" fill="currentColor" />
        </svg>
        {children}
        {action && <div className="es-header__action">{action}</div>}
      </header>
    )
  }
)
