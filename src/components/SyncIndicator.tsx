import { useEffect, useRef, useState } from 'react';
import styles from './SyncIndicator.module.css';

export default function SyncIndicator() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout |null>(null);

  useEffect(() => {
    // Ouvir por mensagens de save no console via interceptação
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = String(args[0]);
      
      if (message.includes('salvo no IndexedDB')) {
        setStatus('success');
        setMessage('✓ Dados salvos');
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setStatus('idle'), 2000);
      } else if (message.includes('Auto-save') && message.includes('progresso')) {
        setStatus('syncing');
        setMessage('🔄 Salvando...');
      } else if (message.includes('Banco salvo em localStorage')) {
        setStatus('success');
        setMessage('✓ Backup salvo');
      }
      
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      const message = String(args[0]);
      if (message.includes('Erro') || message.includes('Error')) {
        setStatus('error');
        setMessage('❌ Erro ao salvar');
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setStatus('idle'), 3000);
      }
      
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div className={`${styles.container} ${styles[status]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {status === 'syncing' && '🔄'}
          {status === 'success' && '✓'}
          {status === 'error' && '❌'}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  );
}
