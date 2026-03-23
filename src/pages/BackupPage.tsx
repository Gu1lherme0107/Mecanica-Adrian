import { useState } from 'react';
import { exportBackup, importBackup } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Download, Upload, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupPage() {
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mecanica_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar backup');
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        await importBackup(text);
        toast.success('Backup importado com sucesso! Recarregue a página.');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error('Erro ao importar backup. Verifique o arquivo.');
      }
      setImporting(false);
    };
    input.click();
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-foreground">Backup & Restauração</h1>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            Seus dados ficam salvos localmente no navegador. Use o backup para proteger contra formatação ou troca de PC.
          </p>
        </div>

        <Button onClick={handleExport} className="w-full h-14 text-base gap-3" variant="default">
          <Download className="h-5 w-5" /> Exportar Backup (.json)
        </Button>

        <Button onClick={handleImport} disabled={importing} className="w-full h-14 text-base gap-3" variant="outline">
          <Upload className="h-5 w-5" /> {importing ? 'Importando...' : 'Importar Backup'}
        </Button>
      </div>
    </div>
  );
}
