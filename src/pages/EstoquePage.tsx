import { useEffect, useState } from 'react';
import { getEstoque, addEstoque, updateEstoqueQtd, deleteEstoque, Estoque } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2, X } from 'lucide-react';

export default function EstoquePage() {
  const [items, setItems] = useState<Estoque[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome_peca: '', quantidade: 0, valor_custo: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    setItems(await getEstoque());
  }

  async function handleAdd() {
    if (!form.nome_peca.trim()) {
      alert("Por favor, informe o nome da peça.");
      return;
    }
    
    await addEstoque(form);
    setForm({ nome_peca: '', quantidade: 0, valor_custo: 0 });
    setShowForm(false);
    await load();
  }

  async function handleQtd(id: number, delta: number) {
    await updateEstoqueQtd(id, delta);
    await load();
  }

  async function handleDelete(id: number) {
    await deleteEstoque(id);
    await load();
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="h-4 w-4" /> Fechar</> : <><Plus className="h-4 w-4" /> Nova Peça</>}
        </Button>
      </div>

      <Input 
        placeholder="Pesquisar Estoque..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-10"
      />

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-3 animate-fade-in">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Nome da peça" value={form.nome_peca} onChange={(e) => setForm({ ...form, nome_peca: e.target.value })} className="h-12 text-base" />
            <Input type="number" placeholder="Quantidade" value={form.quantidade || ''} onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 0 })} className="h-12 text-base" />
            <Input type="number" placeholder="Custo (R$)" value={form.valor_custo || ''} onChange={(e) => setForm({ ...form, valor_custo: parseFloat(e.target.value) || 0 })} className="h-12 text-base" />
          </div>
          <Button onClick={handleAdd}>Salvar</Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground col-span-full">Estoque vazio</p>
        ) : items.filter((e) =>
          e.nome_peca.toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? (
          <p className="text-center py-12 text-muted-foreground col-span-full">Nenhuma peça encontrada</p>
        ) : items.filter((e) =>
          e.nome_peca.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((e) => (
          <div key={e.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{e.nome_peca || 'Sem nome'}</p>
              {e.valor_custo > 0 && <p className="text-xs text-muted-foreground">Custo: R$ {e.valor_custo.toFixed(2)}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleQtd(e.id, -1)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-foreground">{e.quantidade}</span>
              <button onClick={() => handleQtd(e.id, 1)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-success/10 text-muted-foreground hover:text-success transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
