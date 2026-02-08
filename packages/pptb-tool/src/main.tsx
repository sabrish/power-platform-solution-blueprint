import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './App';
import './styles/accessibility.css';
import './styles/design-system.css';

// Detect keyboard navigation for enhanced focus indicators
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-nav');
  }
});

window.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-nav');
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Add skip link for accessibility
const skipLink = document.createElement('a');
skipLink.href = '#main-content';
skipLink.className = 'skip-link';
skipLink.textContent = 'Skip to main content';
document.body.insertBefore(skipLink, document.body.firstChild);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
