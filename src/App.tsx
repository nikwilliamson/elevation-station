import { useCallback, useEffect, useState } from 'react';

import { Header } from './components/header/Header';
import { NavItem } from './components/navItem/NavItem';
import { ShadowTokenDesigner } from './components/shadowTokenDesigner/ShadowTokenDesigner';
import { ShadowInteractionDesigner } from './components/shadowInteractionDesigner/ShadowInteractionDesigner';
import { ToggleSwitch } from './components/toggleSwitch/ToggleSwitch';

import './App.css';
import './components/title/title.css';

type View = "tokens" | "interaction"

const NAV_OPTIONS: { label: string; value: View }[] = [
  { label: "Elevation Token Designer", value: "tokens" },
  { label: "Interaction Designer", value: "interaction" },
]

export default function App() {
  const [dark, setDark] = useState(true);
  const [view, setView] = useState<View>("tokens");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const headerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const update = () => {
      document.documentElement.style.setProperty('--es-header-height', `${node.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div className="es-app">
        <Header
          ref={headerRef}
          action={
            <div className="es-switch--with-label" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="es-switch__label">Dark</span>
              <ToggleSwitch checked={dark} onChange={setDark} label="Dark mode" size="md" />
            </div>
          }
        >
          <NavItem options={NAV_OPTIONS} value={view} onChange={setView} />
        </Header>
        <main>
          {view === "tokens" ? <ShadowTokenDesigner /> : <ShadowInteractionDesigner />}
        </main>
      </div>
      <div className="es-gradient-border" />
    </>
  );
}
