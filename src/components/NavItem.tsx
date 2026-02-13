import { motion } from "motion/react"

import "./navItem.css"

interface NavOption<T extends string | number> {
  label: string
  value: T
}

interface NavItemProps<T extends string | number> {
  options: NavOption<T>[]
  value: T
  onChange: (value: T) => void
  layoutId?: string
}

export function NavItem<T extends string | number>({ options, value, onChange, layoutId = "nav-indicator" }: NavItemProps<T>) {
  return (
    <ul className="es-nav-item__list">
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <li key={option.value} className="es-nav-item__item" aria-selected={isSelected}>
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                className="es-nav-item__indicator"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <motion.button
              type="button"
              className="es-nav-item__btn"
              onTapStart={() => onChange(option.value)}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          </li>
        )
      })}
    </ul>
  )
}
