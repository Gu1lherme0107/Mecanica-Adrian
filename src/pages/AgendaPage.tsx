import { useEffect, useState } from 'react';
import { getAgenda, addAgenda, toggleAgendaConcluido, deleteAgenda, Agenda } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Trash2, X } from 'lucide-react';

export default function AgendaPage() {
  const [items, setItems] = useState<Agenda[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ data_agendada: '', cliente_nome: '', cliente_telefone: '', carro_modelo: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setItems(await getAgenda());
  }

  async function handleAdd() {
    await addAgenda(form);
    setForm({ data_agendada: '', cliente_nome: '', cliente_telefone: '', carro_modelo: '' });
    setShowForm(false);
    await load();
  }

  async function handleToggle(id: number, current: boolean) {
    await toggleAgendaConcluido(id, !current);
    await load();
  }

  async function handleDelete(id: number) {
    await deleteAgenda(id);
    await load();
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="h-4 w-4" /> Fechar</> : <><Plus className="h-4 w-4" /> Agendar</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-3 animate-fade-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} className="h-12 text-base" />
            <Input placeholder="Cliente" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} className="h-12 text-base" />
            <Input placeholder="Telefone" value={form.cliente_telefone} onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })} className="h-12 text-base" />
            <Input placeholder="Modelo do carro" value={form.carro_modelo} onChange={(e) => setForm({ ...form, carro_modelo: e.target.value })} className="h-12 text-base" />
          </div>
          <Button onClick={handleAdd}>Salvar</Button>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Nenhum agendamento</p>
        ) : items.map((a) => {
          const dateStr = a.data_agendada ? new Date(a.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          return (
            <div key={a.id} className={`flex items-center gap-3 p-4 rounded-xl border bg-card transition-opacity ${a.concluido ? 'opacity-50' : ''}`}>
              <button
                onClick={() => handleToggle(a.id, a.concluido)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center border-2 transition-colors ${a.concluido ? 'bg-success border-success' : 'border-input hover:border-primary'}`}
              >
                {a.concluido && <Check className="h-4 w-4 text-success-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.cliente_nome || 'Sem nome'} — <span className="text-muted-foreground">{a.carro_modelo || '—'}</span></p>
                <p className="text-xs text-muted-foreground">{dateStr} {a.cliente_telefone ? `• ${a.cliente_telefone}` : ''}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
