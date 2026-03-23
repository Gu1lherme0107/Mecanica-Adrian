import { useEffect, useState } from 'react';
import { getFaturamentoMes, getServicosNoPatio, getAgendaHoje, Servico, Agenda, getStatusPagamento } from '@/lib/database';
import { DollarSign, Car, CalendarDays, Clock } from 'lucide-react';

export default function Dashboard() {
  const [faturamento, setFaturamento] = useState(0);
  const [patio, setPatio] = useState<Servico[]>([]);
  const [agendaHoje, setAgendaHoje] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [fat, pat, ag] = await Promise.all([getFaturamentoMes(), getServicosNoPatio(), getAgendaHoje()]);
    setFaturamento(fat);
    setPatio(pat);
    setAgendaHoje(ag);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  const statusColors: Record<string, string> = {
    'Aguardando': 'bg-warning/15 text-warning',
    'Fazendo': 'bg-primary/15 text-primary',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Revenue Card */}
      <div className="rounded-xl bg-revenue-bg border border-success/20 p-6 flex items-center gap-5">
        <div className="h-14 w-14 rounded-xl bg-success/20 flex items-center justify-center">
          <DollarSign className="h-7 w-7 text-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-success/80">Faturamento do Mês</p>
          <p className="text-3xl font-extrabold text-success">
            R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Agendamentos de Hoje</h2>
          </div>
          {agendaHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento para hoje</p>
          ) : (
            <ul className="space-y-2">
              {agendaHoje.map((a) => (
                <li key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.cliente_nome || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.carro_modelo || '—'}</p>
                  </div>
                  {a.concluido && <span className="text-xs font-medium text-success">Concluído</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Yard Status */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Car className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">No Pátio</h2>
            <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {patio.length}
            </span>
          </div>
          {patio.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum veículo no pátio</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-auto scrollbar-thin">
              {patio.map((s) => {
                const pagamento = getStatusPagamento(s.valor_total, s.valor_pago);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.carro_modelo || 'Sem modelo'}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.cliente_nome || 'Sem nome'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[s.status_servico] || ''}`}>
                      {s.status_servico}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
