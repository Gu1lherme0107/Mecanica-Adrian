import { useEffect, useRef, useState } from 'react';
import styles from './SyncIndicator.module.css';

export default function SyncIndicator() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ouvir eventos de sincronização
    const handleSyncStart = () => {
      setStatus('syncing');
      setMessage('🔄 Salvando...');
    };

    const handleSyncSuccess = (event: any) => {
      setStatus('success');
      setMessage('✓ Dados salvos');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus('idle'), 2000);
    };

    const handleSyncError = (event: any) => {
      setStatus('error');
      setMessage('❌ Erro ao salvar');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus('idle'), 3000);
    };

    window.addEventListener('db-sync-start', handleSyncStart);
    window.addEventListener('db-sync-success', handleSyncSuccess);
    window.addEventListener('db-sync-error', handleSyncError);

    return () => {
      window.removeEventListener('db-sync-start', handleSyncStart);
      window.removeEventListener('db-sync-success', handleSyncSuccess);
      window.removeEventListener('db-sync-error', handleSyncError);
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
