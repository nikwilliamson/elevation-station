import { useState } from 'react';

import { ShadowTokenDesigner } from './components/ShadowTokenDesigner';
import { ShadowInteractionDesigner } from './components/ShadowInteractionDesigner';

import './App.css';

type Tab = 'palette' | 'interaction';

export default function App() {
  const [tab, setTab] = useState<Tab>('palette');

  return (
    <>
      <nav className="es-nav">
        <h1 className="es-nav__title">Elevation Station</h1>
        <button
          type="button"
          className="es-nav__tab"
          aria-selected={tab === 'palette'}
          onClick={() => setTab('palette')}
        >
          Palette
        </button>
        <button
          type="button"
          className="es-nav__tab"
          aria-selected={tab === 'interaction'}
          onClick={() => setTab('interaction')}
        >
          Interaction
        </button>
      </nav>
      {tab === 'palette' ? <ShadowTokenDesigner /> : <ShadowInteractionDesigner />}
    </>
  );
}
