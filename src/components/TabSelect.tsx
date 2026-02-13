import { motion } from "motion/react"

import "./tabSelect.css"

interface TabOption<T extends string | number> {
  label: string
  value: T
}

interface TabSelectProps<T extends string | number> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Unique ID for the animated indicator — required when multiple TabSelects are on screen */
  layoutId?: string
  size?: "sm" | "md" | "lg"
  contained?: boolean
  variant?: "pill" | "border"
}

export function TabSelect<T extends string | number>({ options, value, onChange, layoutId = "tab-indicator", size = "md", contained = true, variant = "pill" }: TabSelectProps<T>) {
  const variantClass = variant === "border" ? " es-tab-select--border" : ""
  return (
    <nav className={`es-tab-select es-tab-select--${size}${contained ? "" : " es-tab-select--loose"}${variantClass}`}>
      <ul className="es-tab-select__list" role="tablist">
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <li
              key={option.value}
              className="es-tab-select__item"
              role="tab"
              aria-selected={isSelected}
            >
              {isSelected && (
                <motion.div
                  layoutId={layoutId}
                  className="es-tab-select__indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.button
                type="button"
                className="es-tab-select__btn"
                onTapStart={() => onChange(option.value)}
                whileTap={{ scale: 0.95 }}
              >
                {option.label}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
