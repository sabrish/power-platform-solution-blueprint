import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider } from '@fluentui/react-components';
import App from './App';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
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

function AppWithTheme() {
  const { theme } = useTheme();

  return (
    <FluentProvider theme={theme}>
      <App />
    </FluentProvider>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  </React.StrictMode>
);
