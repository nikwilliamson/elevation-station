import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { TabSelect } from "./TabSelect"
import "./sidebar.css"

/* ── Types ─────────────────────────────────────────────────────── */

export interface SidebarTab<T extends string = string> {
  label: string
  value: T
  title: string
  control?: React.ReactNode
  content: React.ReactNode
}

export interface SidebarProps<T extends string = string> {
  tabs: SidebarTab<T>[]
  activeTab: T
  onTabChange: (value: T) => void
  layoutId?: string
  tabVariant?: "pill" | "border"
  tabSize?: "sm" | "md" | "lg"
}

/* ── Spring-animated view ────────────────────────────────────────── */

const VIEW_SPRING = { stiffness: 400, damping: 60 }

const calculateViewX = (difference: number, containerWidth: number) =>
  difference * containerWidth * 0.75 * -1

interface ViewProps {
  children: React.ReactNode
  containerWidth: number
  viewIndex: number
  activeIndex: number
}

function View({ children, containerWidth, viewIndex, activeIndex }: ViewProps) {
  const difference = activeIndex - viewIndex
  const x = useSpring(calculateViewX(difference, containerWidth), VIEW_SPRING)
  const xVelocity = useVelocity(x)

  const opacity = useTransform(
    x,
    [-containerWidth * 0.6, 0, containerWidth * 0.6],
    [0, 1, 0],
  )

  const blur = useTransform(xVelocity, [-1000, 0, 1000], [4, 0, 4], {
    clamp: false,
  })

  const filterBlur = useMotionTemplate`blur(${blur}px)`

  useEffect(() => {
    x.set(calculateViewX(activeIndex - viewIndex, containerWidth))
  }, [activeIndex, containerWidth, viewIndex, x])

  return (
    <motion.div
      className="es-sidebar__view"
      data-active={viewIndex === activeIndex || undefined}
      style={{ x, opacity, filter: filterBlur }}
    >
      <div className="es-sidebar__view-inner">
        {children}
      </div>
    </motion.div>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────── */

export function Sidebar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  layoutId = "sidebar-tabs",
  tabVariant = "border",
  tabSize = "lg",
}: SidebarProps<T>) {
  const [isMounted, setIsMounted] = useState(false)
  const viewsRef = useRef<HTMLDivElement>(null)
  const [viewsWidth, setViewsWidth] = useState(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const el = viewsRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setViewsWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const tabOptions = useMemo(
    () => tabs.map(({ label, value }) => ({ label, value })),
    [tabs],
  )

  const activeIndex = tabs.findIndex((t) => t.value === activeTab)

  return (
    <aside className="es-sidebar">
      <div className="es-sidebar__tabs">
        <TabSelect
          options={tabOptions}
          value={activeTab}
          onChange={onTabChange}
          layoutId={layoutId}
          variant={tabVariant}
          size={tabSize}
        />
      </div>

      <div ref={viewsRef} className="es-sidebar__views">
        {isMounted &&
          tabs.map((tab, idx) => (
            <View
              key={tab.value}
              containerWidth={viewsWidth}
              viewIndex={idx}
              activeIndex={activeIndex}
            >
              {(tab.title || tab.control) && (
                <div className="es-sidebar__header">
                  {tab.title && <h3 className="es-title es-title--sm">{tab.title}</h3>}
                  {tab.control}
                </div>
              )}
              {tab.content}
            </View>
          ))}
      </div>
    </aside>
  )
}
