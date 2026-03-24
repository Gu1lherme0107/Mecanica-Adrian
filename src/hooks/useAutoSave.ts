import { useEffect } from 'react';

/**
 * Hook vazio - a persistência agora é automática em cada operação
 * As funções de banco (addServico, updateServico, etc) já chamam saveToIndexedDB()
 */
export function useAutoSave() {
  useEffect(() => {
    console.log('✅ Persistência automática ativada em cada operação');
  }, []);
}
