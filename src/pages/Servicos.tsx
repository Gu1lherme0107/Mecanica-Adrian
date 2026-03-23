import { useEffect, useState } from 'react';
import { getServicos, addServico, updateServico, deleteServico, Servico, getStatusPagamento } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, Edit, X, Save } from 'lucide-react';

const emptyServico: Partial<Servico> = {
  cliente_nome: '', cliente_telefone: '', carro_modelo: '',
  data_chegada: new Date().toISOString().split('T')[0], data_entrega: '',
  orcamento_privado: '', status_servico: 'Aguardando', valor_total: 0, valor_pago: 0,
};

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<Servico>>(emptyServico);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    setServicos(await getServicos(search || undefined));
  }

  async function handleSave() {
    if (editId) {
      await updateServico(editId, form);
    } else {
      await addServico(form);
    }
    setForm(emptyServico);
    setEditId(null);
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: number) {
    await deleteServico(id);
    await load();
  }

  function handleEdit(s: Servico) {
    setForm(s);
    setEditId(s.id);
    setShowForm(true);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
        <Button onClick={() => { setForm(emptyServico); setEditId(null); setShowForm(!showForm); }}>
          {showForm ? <><X className="h-4 w-4" /> Fechar</> : <><Plus className="h-4 w-4" /> Nova OS</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-foreground">{editId ? 'Editar OS' : 'Nova Ordem de Serviço'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nome do cliente" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} className="h-12 text-base" />
            <Input placeholder="Telefone" value={form.cliente_telefone} onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })} className="h-12 text-base" />
            <Input placeholder="Modelo do carro" value={form.carro_modelo} onChange={(e) => setForm({ ...form, carro_modelo: e.target.value })} className="h-12 text-base" />
            <select
              value={form.status_servico}
              onChange={(e) => setForm({ ...form, status_servico: e.target.value })}
              className="h-12 text-base rounded-lg border border-input bg-background px-3 text-foreground"
            >
              <option>Aguardando</option>
              <option>Fazendo</option>
              <option>Concluído</option>
            </select>
            <Input type="date" placeholder="Chegada" value={form.data_chegada} onChange={(e) => setForm({ ...form, data_chegada: e.target.value })} className="h-12 text-base" />
            <Input type="date" placeholder="Entrega" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} className="h-12 text-base" />
            <Input type="number" placeholder="Valor Total (R$)" value={form.valor_total || ''} onChange={(e) => setForm({ ...form, valor_total: parseFloat(e.target.value) || 0 })} className="h-12 text-base" />
            <Input type="number" placeholder="Valor Pago (R$)" value={form.valor_pago || ''} onChange={(e) => setForm({ ...form, valor_pago: parseFloat(e.target.value) || 0 })} className="h-12 text-base" />
          </div>
          <textarea
            placeholder="Orçamento / Anotações Privadas (só você vê)"
            value={form.orcamento_privado}
            onChange={(e) => setForm({ ...form, orcamento_privado: e.target.value })}
            className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none"
          />
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {servicos.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
        ) : servicos.map((s) => {
          const pag = getStatusPagamento(s.valor_total, s.valor_pago);
          const statusColor: Record<string, string> = {
            'Aguardando': 'bg-warning/15 text-warning',
            'Fazendo': 'bg-primary/15 text-primary',
            'Concluído': 'bg-success/15 text-success',
          };
          return (
            <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{s.carro_modelo || 'Sem modelo'}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[s.status_servico] || 'bg-muted text-muted-foreground'}`}>{s.status_servico}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.cliente_nome || 'Sem nome'} {s.cliente_telefone ? `• ${s.cliente_telefone}` : ''}</p>
                {s.valor_total > 0 && (
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">R$ {s.valor_total.toFixed(2)}</span>
                    <span className="mx-1">•</span>
                    <span className={pag.variant === 'success' ? 'text-success' : pag.variant === 'destructive' ? 'text-destructive' : 'text-warning'}>
                      {pag.label}
                    </span>
                  </p>
                )}
              </div>
              <button onClick={() => handleEdit(s)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
