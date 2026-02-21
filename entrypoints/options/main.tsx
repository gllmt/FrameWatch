import React from 'react';
import ReactDOM from 'react-dom/client';

import OptionsApp from '@/src/options/App';

import './style.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('FrameWatch options root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
