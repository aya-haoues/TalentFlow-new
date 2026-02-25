import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import App from './App';
import './index.css';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: '#00a89c',
          borderRadius: 12,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);