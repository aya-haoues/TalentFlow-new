import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // 👈 Importe ton Provider ici
import './index.css';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* IMPORTANT : AuthProvider doit être AU-DESSUS de ConfigProvider et App 
        pour que tous les composants puissent accéder à l'état de connexion.
    */}
    <AuthProvider> 
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
    </AuthProvider>
  </React.StrictMode>
);