import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety shield for third-party browser extension content scripts
window.addEventListener(
  'error',
  (event) => {
    const msg = event?.message || event?.error?.message || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('Talisman') ||
        msg.includes('extension') ||
        msg.includes('injectedWeb3') ||
        event.filename?.includes('chrome-extension') ||
        event.filename?.includes('moz-extension'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  },
  true
);

window.addEventListener(
  'unhandledrejection',
  (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('Talisman') ||
        msg.includes('extension') ||
        msg.includes('injectedWeb3'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

createRoot(document.getElementById('root')!).render(<App />);
