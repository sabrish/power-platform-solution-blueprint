import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
