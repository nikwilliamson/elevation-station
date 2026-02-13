import { useCallback, useEffect, useState } from 'react';

import { Header } from './components/Header';
import { NavItem } from './components/NavItem';
import { ShadowTokenDesigner } from './components/ShadowTokenDesigner';
import { ShadowInteractionDesigner } from './components/ShadowInteractionDesigner';

import './App.css';

type View = "tokens" | "interaction"

const NAV_OPTIONS: { label: string; value: View }[] = [
  { label: "Elevation Token Designer", value: "tokens" },
  // { label: "Interaction Designer", value: "interaction" },
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
            <label className="es-switch es-switch--with-label">
              <span className="es-switch__label">Dark</span>
              <input
                type="checkbox"
                className="es-switch__input"
                checked={dark}
                onChange={() => setDark((d) => !d)}
              />
              <span className="es-switch__track" />
            </label>
          }
        >
          <NavItem options={NAV_OPTIONS} value={view} onChange={setView} />
        </Header>
        {view === "tokens" ? <ShadowTokenDesigner /> : <ShadowInteractionDesigner />}
      </div>
      <div className="es-gradient-border" />
    </>
  );
}
