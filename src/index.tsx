import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainScreen from './MainScreen';
import GateRoute from './screens/Gate/GateRoute';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';


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


