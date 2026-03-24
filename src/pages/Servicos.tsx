import { useEffect, useState } from 'react';
import { getServicos, addServico, updateServico, deleteServico, Servico, getStatusPagamento } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, Edit, X, Save, FileText, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Peca {
  nome: string;
  valor: number;
  qtd: number;
}

const emptyServico: Partial<Servico & { peca_list: Peca[], valor_mao_obra: number }> = {
  cliente_nome: '', cliente_telefone: '', carro_modelo: '',
  data_chegada: new Date().toISOString().split('T')[0], data_entrega: '',
  orcamento_privado: '', status_servico: 'Aguardando', valor_total: 0, valor_pago: 0,
  peca_list: [], valor_mao_obra: 0,
};

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [form, setForm] = useState<Partial<Servico & { peca_list: Peca[], valor_mao_obra: number }>>(emptyServico);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newPeca, setNewPeca] = useState<Peca>({ nome: '', valor: 0, qtd: 1 });

  useEffect(() => { load(); }, [search]);

  async function load() {
    setServicos(await getServicos(search || undefined));
  }

  async function handleSave() {
    try {
      if (!form.cliente_nome?.trim() || !form.carro_modelo?.trim()) {
        alert('Por favor, preencha o nome do cliente e modelo do carro');
        return;
      }

      const formComTotal = { 
        ...form, 
        valor_total: calcularTotal(),
        peca_list: form.peca_list || [],
        valor_mao_obra: form.valor_mao_obra || 0
      };
      
      if (editId) {
        await updateServico(editId, formComTotal as any);
      } else {
        await addServico(formComTotal as any);
      }
      
      setForm(emptyServico);
      setEditId(null);
      setShowForm(false);
      await load();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + (error as any).message);
    }
  }

  async function handleDelete(id: number) {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
      await deleteServico(id);
      await load();
    }
  }

  function handleEdit(s: Servico) {
    const formData = {
      ...s,
      peca_list: (s as any).peca_list || [],
      valor_mao_obra: (s as any).valor_mao_obra || 0
    };
    setForm(formData);
    setEditId(s.id);
    setShowForm(true);
  }

  function addPeca() {
    if (newPeca.nome.trim()) {
      const updated = { ...form, peca_list: [...(form.peca_list || []), newPeca] };
      setForm(updated);
      setNewPeca({ nome: '', valor: 0, qtd: 1 });
    }
  }

  function removePeca(index: number) {
    const updated = { ...form, peca_list: (form.peca_list || []).filter((_, i) => i !== index) };
    setForm(updated);
  }

  function calcularTotal() {
    const pecasTotal = (form.peca_list || []).reduce((sum, p) => sum + (p.valor * (p.qtd || 1)), 0);
    const maoObra = form.valor_mao_obra || 0;
    return maoObra + pecasTotal;
  }

  function enviarWhatsApp() {
    if (!form.cliente_telefone?.trim()) {
      alert('Por favor, preencha o número de telefone (WhatsApp) do cliente antes de enviar.');
      return;
    }
    let numero = form.cliente_telefone.replace(/\D/g, '');
    if (numero.length === 10 || numero.length === 11) {
      numero = '55' + numero;
    }
    const nomeTxt = form.cliente_nome ? ` ${form.cliente_nome}` : '';
    const carroTxt = form.carro_modelo ? ` *${form.carro_modelo}*` : '';
    const mensagem = `Olá${nomeTxt}! O orçamento do seu veículo${carroTxt} ficou no valor total de *R$ ${calcularTotal().toFixed(2)}*. Em breve enviaremos o arquivo em PDF com os detalhes!`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }

  function gerarPDF() {
    const doc = new jsPDF();
    
    // Fundo escuro (Dark Theme)
    doc.setFillColor(25, 25, 25); // #191919
    doc.rect(0, 0, 210, 297, 'F'); // Preenche uma folha A4 (210x297mm)
    
    // Título Centralizado
    doc.setTextColor(255, 165, 0); // Laranja #FFA500
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ORÇAMENTO / ORDEM DE SERVIÇO", 105, 20, { align: "center" });
    
    // Informações do Cliente
    doc.setTextColor(255, 255, 255); // Branco
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Cliente: ${form.cliente_nome || 'Não informado'}`, 14, 40);
    doc.text(`Telefone: ${form.cliente_telefone || 'Não informado'}`, 14, 48);
    doc.text(`Veículo (Modelo): ${form.carro_modelo || 'Não informado'}`, 14, 56);
    
    const dataChegadaStr = form.data_chegada ? new Date(form.data_chegada + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada';
    doc.text(`Data de Entrada: ${dataChegadaStr}`, 14, 64);
    
    // Montar os dados da tabela
    const tableData = (form.peca_list || []).map(p => [(p.qtd || 1).toString(), p.nome, `R$ ${(p.valor * (p.qtd || 1)).toFixed(2)}`]);
    tableData.push(['-', 'MÃO DE OBRA', `R$ ${(form.valor_mao_obra || 0).toFixed(2)}`]);

    autoTable(doc, {
      startY: 75,
      head: [['Qtd', 'Descrição', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 165, 0], // Fundo Laranja no Header
        textColor: [25, 25, 25],  // Texto escuro no Header
        fontStyle: 'bold' 
      },
      bodyStyles: { 
        fillColor: [40, 40, 40], // Fundo das linhas escuro
        textColor: [255, 255, 255] // Texto branco nas linhas
      },
      alternateRowStyles: { 
        fillColor: [50, 50, 50] // Fundo alternado mais claro
      },
      gridColor: [80, 80, 80] // Cor das bordas
    });
    
    // Total Geral
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setTextColor(255, 165, 0); // Laranja #FFA500
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL GERAL: R$ ${calcularTotal().toFixed(2)}`, 14, finalY + 15);
    
    // Download do arquivo
    const nomeArquivo = form.cliente_nome ? `Orcamento_${form.cliente_nome.replace(/\s+/g, '_')}.pdf` : `Orcamento.pdf`;
    doc.save(nomeArquivo);
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
            <Input type="number" placeholder="Valor Pago (R$)" value={form.valor_pago || ''} onChange={(e) => setForm({ ...form, valor_pago: parseFloat(e.target.value) || 0 })} className="h-12 text-base" />
            <Input type="number" placeholder="Valor Mão de Obra (R$)" value={form.valor_mao_obra || ''} onChange={(e) => setForm({ ...form, valor_mao_obra: parseFloat(e.target.value) || 0 })} className="h-12 text-base" />
          </div>

          {/* Seção de Peças */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-foreground mb-3">Peças Utilizadas</h3>
            <div className="flex gap-2 mb-3">
              <Input type="number" placeholder="Qtd" value={newPeca.qtd || ''} onChange={(e) => setNewPeca({ ...newPeca, qtd: parseInt(e.target.value) || 1 })} className="h-10 text-sm w-16" />
              <Input placeholder="Nome da peça" value={newPeca.nome} onChange={(e) => setNewPeca({ ...newPeca, nome: e.target.value })} className="h-10 text-sm flex-1" />
              <Input type="number" placeholder="R$" value={newPeca.valor || ''} onChange={(e) => setNewPeca({ ...newPeca, valor: parseFloat(e.target.value) || 0 })} className="h-10 text-sm w-24" />
              <Button onClick={addPeca} size="sm">+ Peça</Button>
            </div>

            {(form.peca_list || []).length > 0 ? (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {form.peca_list!.map((peca, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-background rounded-md border">{peca.qtd || 1}x</span>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate">{peca.nome}</p>
                        <p className="text-xs text-muted-foreground">R$ {(peca.valor * (peca.qtd || 1)).toFixed(2)} {peca.qtd > 1 && `(R$ ${peca.valor.toFixed(2)} un)`}</p>
                      </div>
                    </div>
                    <button onClick={() => removePeca(idx)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3 italic">Nenhuma peça adicionada</p>
            )}

            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Subtotal Peças: <span className="font-semibold text-foreground">R$ {(form.peca_list || []).reduce((sum, p) => sum + (p.valor * (p.qtd || 1)), 0).toFixed(2)}</span></p>
              <p className="text-sm text-muted-foreground mt-1">Mão de Obra: <span className="font-semibold text-foreground">R$ {(form.valor_mao_obra || 0).toFixed(2)}</span></p>
              <p className="text-sm font-semibold text-primary mt-2 pt-2 border-t border-primary/30">Total Serviço: R$ {calcularTotal().toFixed(2)}</p>
            </div>
          </div>
          <textarea
            placeholder="Orçamento / Anotações Privadas (só você vê)"
            value={form.orcamento_privado}
            onChange={(e) => setForm({ ...form, orcamento_privado: e.target.value })}
            className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
            <Button onClick={gerarPDF} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10">
              <FileText className="h-4 w-4 mr-2" /> Gerar PDF
            </Button>
            <Button onClick={enviarWhatsApp} variant="outline" className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10 dark:hover:bg-green-500/20">
              <Send className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground w-[140px] sm:w-48 appearance-none"
        >
          <option value="Todos">Todos</option>
          <option value="Aguardando">Aguardando</option>
          <option value="Fazendo">Fazendo</option>
          <option value="Concluído">Concluído</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {servicos.filter(s => statusFilter === 'Todos' || s.status_servico === statusFilter).length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
        ) : servicos.filter(s => statusFilter === 'Todos' || s.status_servico === statusFilter).map((s) => {
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
                  <div className="text-xs mt-1 space-y-1">
                    <p>
                      <span className="text-muted-foreground">R$ {s.valor_total.toFixed(2)}</span>
                      <span className="mx-1">•</span>
                      <span className={pag.variant === 'success' ? 'text-success' : pag.variant === 'destructive' ? 'text-destructive' : 'text-warning'}>
                        {pag.label}
                      </span>
                    </p>
                  </div>
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
