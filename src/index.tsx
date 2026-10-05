import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainScreen from './MainScreen';
import GateRoute from './gate/GateRoute';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GateRoute>
      <MainScreen />
    </GateRoute>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);

reportWebVitals();
