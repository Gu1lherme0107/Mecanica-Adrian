import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DebugPage() {
  const [status, setStatus] = useState<Record<string, any>>({
    indexedDB: 'Verificando...',
    localStorage: 'Verificando...',
    idbSize: 0,
    lsSize: 0,
    swStatus: 'Verificando...',
  });

  const checkStorage = useCallback(async () => {
    // Verificar IndexedDB
    const idbCheckPromise = new Promise((resolve) => {
      const request = indexedDB.open('MecanicaERP', 1);
      request.onsuccess = () => {
        const idb = request.result;
        const tx = idb.transaction('database', 'readonly');
        const getReq = tx.objectStore('database').get('mecanica_erp_db');
        
        getReq.onsuccess = () => {
          const result = getReq.result;
          if (result) {
            const size = result instanceof Uint8Array ? result.byteLength : 0;
            resolve({ status: '✅ Dados encontrados', size });
          } else {
            resolve({ status: '❌ Nenhum dado', size: 0 });
          }
        };
        getReq.onerror = () => resolve({ status: '❌ Erro ao ler', size: 0 });
        idb.close();
      };
      request.onerror = () => resolve({ status: '❌ Erro ao abrir', size: 0 });
    });

    // Verificar localStorage
    const lsData = localStorage.getItem('mecanica_erp_db_backup');
    const lsStatus = lsData ? `✅ Dados encontrados (${Math.round(lsData.length / 1024)}KB)` : '❌ Nenhum dado';
    const lsSize = lsData ? lsData.length : 0;

    // Verificar Service Worker
    let swStatus = '❌ Não registrado';
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swStatus = registrations.length > 0 ? `✅ ${registrations.length} registrado(s)` : '❌ Nenhum registrado';
      } catch (e) {
        swStatus = '❌ Erro ao verificar';
      }
    }

    const idbResult = await idbCheckPromise as any;

    setStatus({
      indexedDB: idbResult.status,
      idbSize: idbResult.size,
      localStorage: lsStatus,
      lsSize,
      swStatus,
    });
  }, []);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  const exportDatabase = useCallback(async () => {
    try {
      const lsData = localStorage.getItem('mecanica_erp_db_backup');
      if (!lsData) {
        alert('Nenhum dado para exportar!');
        return;
      }

      // Converter base64 para Uint8Array
      const binaryString = atob(lsData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Criar e fazer download do arquivo
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mecanica-backup-${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Backup exportado com sucesso!');
    } catch (e) {
      console.error('❌ Erro ao exportar:', e);
      alert('Erro ao exportar backup');
    }
  }, []);

  const clearAllStorage = useCallback(() => {
    if (confirm('⚠️ CUIDADO! Isso vai deletar TODOS os dados! Tem certeza?')) {
      // Limpar localStorage
      localStorage.removeItem('mecanica_erp_db_backup');
      
      // Limpar IndexedDB
      const request = indexedDB.deleteDatabase('MecanicaERP');
      request.onsuccess = () => {
        console.log('✅ Storage limpo');
        checkStorage();
      };
      request.onerror = () => {
        console.error('❌ Erro ao limpar IndexedDB');
      };
    }
  }, [checkStorage]);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">🔧 Debug - Persistência de Dados</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Status de Armazenamento</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">📂 IndexedDB</p>
              <p className="text-sm text-muted-foreground">{status.indexedDB}</p>
              {status.idbSize > 0 && (
                <p className="text-xs text-muted-foreground">Tamanho: {(status.idbSize / 1024).toFixed(2)}KB</p>
              )}
            </div>
            {status.indexedDB.includes('✅') ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">💾 localStorage</p>
              <p className="text-sm text-muted-foreground">{status.localStorage}</p>
            </div>
            {status.localStorage.includes('✅') ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">🔄 Service Worker</p>
              <p className="text-sm text-muted-foreground">{status.swStatus}</p>
            </div>
            {status.swStatus.includes('✅') ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <Button onClick={checkStorage} className="w-full" variant="outline">
            🔄 Verificar Novamente
          </Button>
          <Button onClick={exportDatabase} className="w-full" variant="outline">
            💾 Exportar Backup
          </Button>
          <Button onClick={clearAllStorage} className="w-full" variant="destructive">
            🗑️ Limpar Todos os Dados
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 Como Testar Persistência:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
          <li>Adicione um serviço ou agendamento</li>
          <li>Clique em "Verificar Novamente" para confirmar que foi salvo</li>
          <li>Feche <strong>completamente</strong> o navegador (não só a aba)</li>
          <li>Reabra o programa</li>
          <li>Os dados devem estar lá!</li>
        </ol>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Informações Técnicas:</h3>
        <div className="space-y-1 text-sm text-blue-800 font-mono">
          <p>URL: {window.location.href}</p>
          <p>User Agent: {navigator.userAgent.substring(0, 60)}...</p>
          <p>LocalStorage Disponível: {typeof localStorage !== 'undefined' ? 'Sim' : 'Não'}</p>
          <p>IndexedDB Disponível: {'indexedDB' in window ? 'Sim' : 'Não'}</p>
          <p>Service Worker Disponível: {'serviceWorker' in navigator ? 'Sim' : 'Não'}</p>
        </div>
      </Card>
    </div>
  );
}
