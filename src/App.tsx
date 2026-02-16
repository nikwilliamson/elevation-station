import { useCallback, useEffect, useState } from 'react';

import { Header } from './components/header/Header';
import { ShadowTokenDesigner } from './components/shadowTokenDesigner/ShadowTokenDesigner';
import { ToggleSwitch } from './components/toggleSwitch/ToggleSwitch';

import './App.css';
import './components/title/title.css';

export default function App() {
  const [dark, setDark] = useState(true);

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
        />
        <main>
          <ShadowTokenDesigner />
        </main>
      </div>
      <div className="es-gradient-border" />
    </>
  );
}
