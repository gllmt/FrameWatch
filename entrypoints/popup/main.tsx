import React from 'react';
import ReactDOM from 'react-dom/client';

import PopupApp from '@/src/popup/App';

import './style.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('FrameWatch popup root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
