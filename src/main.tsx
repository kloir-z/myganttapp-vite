import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './reduxStoreAndSlices/store';
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import i18nConfig from './i18n/config';

i18n
  .use(initReactI18next)
  .init(i18nConfig);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);