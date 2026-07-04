import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainScreen from './MainScreen';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <MainScreen />
  </React.StrictMode>
);

reportWebVitals();
