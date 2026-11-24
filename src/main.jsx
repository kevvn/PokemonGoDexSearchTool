import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { syncCopiedStringToDock } from './models/pokedexModel';
import { pwaModelStore } from './models/pwaModel';
import { initializeCopyService } from './services/copyService';
import { initializePwaService } from './services/pwaService';
import ErrorBoundary from './views/shared/ErrorBoundary';

initializeCopyService({ onCopied: syncCopiedStringToDock });
initializePwaService({
  onStateEvent: pwaModelStore.dispatch,
  onOnlineChange: pwaModelStore.setOnlineStatus,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary title="PokéSearch encountered an unexpected error">
      <App />
    </ErrorBoundary>
  </StrictMode>
);
