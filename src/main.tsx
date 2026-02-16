import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import './tokens/tokens.css';
import App from './App';

if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
