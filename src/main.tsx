import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar Service Worker para PWA offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('✅ Service Worker registrado com sucesso:', registration.scope);
      
      // Verificar atualizações periodicamente
      setInterval(async () => {
        try {
          await registration.update();
        } catch (error) {
          console.error('Erro ao verificar atualizações do SW:', error);
        }
      }, 60000); // A cada 1 minuto
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  });
  
  // Ouvir para novas versões do Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Nova versão do Service Worker ativada');
  });
}

