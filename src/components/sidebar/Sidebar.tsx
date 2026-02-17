import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TabSelect } from "../tabSelect/TabSelect"
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
  const [drawerExpanded, setDrawerExpanded] = useState(false)
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

  const handleTabChange = useCallback(
    (value: T) => {
      if (value === activeTab) {
        setDrawerExpanded((prev) => !prev)
      } else {
        onTabChange(value)
        setDrawerExpanded(true)
      }
    },
    [activeTab, onTabChange],
  )

  return (
    <aside
      className="es-sidebar"
      aria-label="Controls"
      data-drawer-expanded={drawerExpanded || undefined}
    >
      <div className="es-sidebar__tabs">
        <TabSelect
          options={tabOptions}
          value={activeTab}
          onChange={handleTabChange}
          layoutId={layoutId}
          variant={tabVariant}
          size={tabSize}
          ariaLabel="Sidebar"
        />
      </div>

      <div className="es-sidebar__drawer-bar">
        <h2 className="es-title es-title--sm">{tabs[activeIndex]?.title}</h2>
        <button
          className="es-sidebar__drawer-toggle"
          onClick={() => setDrawerExpanded((prev) => !prev)}
          aria-label={drawerExpanded ? "Collapse drawer" : "Expand drawer"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
                  {tab.title && <h2 className="es-title es-title--sm">{tab.title}</h2>}
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
