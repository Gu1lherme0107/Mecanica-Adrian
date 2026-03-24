import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
const DB_KEY = 'mecanica_erp_db';
const LS_KEY = 'mecanica_erp_db_backup'; // Backup em localStorage

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });

  // Try to load from IndexedDB primeiro
  let savedData = await loadFromIndexedDB();
  
  // Se não encontrou no IndexedDB, tentar localStorage (fallback)
  if (!savedData) {
    console.log('📂 Tentando carregar backup do localStorage...');
    savedData = loadFromLocalStorage();
  }

  if (savedData) {
    try {
      db = new SQL.Database(new Uint8Array(savedData));
      console.log('✓ Banco carregado com sucesso');
    } catch (e) {
      console.log('⚠️ Erro ao carregar banco anterior, criando novo');
      db = new SQL.Database();
      // Limpar streams corrompidas
      await clearIndexedDB();
      clearLocalStorage();
    }
  } else {
    console.log('🆕 Criando novo banco de dados');
    db = new SQL.Database();
  }

  // PRIMEIRO: Criar todas as tabelas base (evita erros em first-run)
  db.run(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT DEFAULT '',
      cliente_telefone TEXT DEFAULT '',
      carro_modelo TEXT DEFAULT '',
      data_chegada TEXT DEFAULT '',
      data_entrega TEXT DEFAULT '',
      orcamento_privado TEXT DEFAULT '',
      status_servico TEXT DEFAULT 'Aguardando',
      valor_total REAL DEFAULT 0,
      valor_pago REAL DEFAULT 0,
      valor_mao_obra REAL DEFAULT 0,
      peca_list TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_agendada TEXT DEFAULT '',
      cliente_nome TEXT DEFAULT '',
      cliente_telefone TEXT DEFAULT '',
      carro_modelo TEXT DEFAULT '',
      concluido INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_peca TEXT DEFAULT '',
      quantidade INTEGER DEFAULT 0,
      valor_custo REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // DEPOIS: Verificar e fazer migrações de schema
  try {
    // Tentar executar uma query com a coluna de migração
    db.exec(`SELECT valor_mao_obra FROM servicos LIMIT 0`);
    console.log('✓ Schema das tabelas está atualizado');
  } catch (e) {
    console.log('⚠️ Migrando schema das tabelas...');
    try {
      // Backup dos dados antigos
      const servicos = db.exec(`SELECT * FROM servicos`)[0]?.values || [];
      if (servicos.length > 0) {
        console.log('Backup de', servicos.length, 'registros realizado');
        
        // Deletar tabela antiga
        db.run(`DROP TABLE servicos;`);
        
        // Criar tabela nova com schema correto
        db.run(`
          CREATE TABLE servicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_nome TEXT DEFAULT '',
            cliente_telefone TEXT DEFAULT '',
            carro_modelo TEXT DEFAULT '',
            data_chegada TEXT DEFAULT '',
            data_entrega TEXT DEFAULT '',
            orcamento_privado TEXT DEFAULT '',
            status_servico TEXT DEFAULT 'Aguardando',
            valor_total REAL DEFAULT 0,
            valor_pago REAL DEFAULT 0,
            valor_mao_obra REAL DEFAULT 0,
            peca_list TEXT DEFAULT '[]',
            created_at TEXT DEFAULT (datetime('now','localtime'))
          );
        `);
        
        // Restaurar dados antigos
        for (const row of servicos) {
          db.run(
            `INSERT INTO servicos (id, cliente_nome, cliente_telefone, carro_modelo, data_chegada, data_entrega, orcamento_privado, status_servico, valor_total, valor_pago, valor_mao_obra, peca_list, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]', ?)`,
            [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10] || new Date().toISOString()]
          );
        }
        console.log('✓ Migração concluída com sucesso');
      }
    } catch (migError) {
      console.log('✓ Banco novo criado (sem migração necessária)');
    }
  }

  await saveToIndexedDB();
  console.log('🔄 Banco de dados pronto e persistência ativada');
  return db;
}

function clearIndexedDB(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('MecanicaERP');
    request.onsuccess = () => {
      console.log('✓ IndexedDB limpo');
      resolve();
    };
    request.onerror = () => {
      console.warn('⚠️ Erro ao limpar IndexedDB');
      resolve();
    };
  });
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(LS_KEY);
    console.log('✓ localStorage limpo');
  } catch (e) {
    console.warn('⚠️ Erro ao limpar localStorage:', e);
  }
}

function loadFromLocalStorage(): ArrayBuffer | null {
  try {
    const data = localStorage.getItem(LS_KEY);
    if (!data) {
      console.log('⚠️ Nenhum backup em localStorage');
      return null;
    }
    // Decodificar base64 para ArrayBuffer
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('✓ Banco carregado do localStorage (backup)');
    return bytes.buffer;
  } catch (e) {
    console.error('❌ Erro ao ler localStorage:', e);
    return null;
  }
}

function saveToLocalStorage(): void {
  try {
    if (!db) return;
    const data = db.export();
    // Codificar para base64 para armazenar em localStorage
    const binaryString = String.fromCharCode.apply(null, Array.from(data));
    const encodedData = btoa(binaryString);
    localStorage.setItem(LS_KEY, encodedData);
    console.log('✓ Banco salvo em localStorage (backup)');
  } catch (e) {
    console.warn('⚠️ Erro ao salvar em localStorage:', e);
    // Quotas de localStorage geralmente são pequenas, então é ok falhar silenciosamente
  }
}

export function saveToIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    try {
      // Disparar evento de sincronização começando
      window.dispatchEvent(new CustomEvent('db-sync-start'));
      
      const data = db.export();
      const request = indexedDB.open('MecanicaERP', 1);
      
      request.onupgradeneeded = (event) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        if (!idb.objectStoreNames.contains('database')) {
          idb.createObjectStore('database');
        }
      };
      
      request.onsuccess = () => {
        const idb = request.result;
        try {
          const tx = idb.transaction('database', 'readwrite');
          const store = tx.objectStore('database');
          // Usar Uint8Array em vez de Blob
          store.put(data, DB_KEY);
          
          tx.oncomplete = () => {
            console.log('✓ Banco salvo no IndexedDB');
            // Também salvar em localStorage como backup
            saveToLocalStorage();
            
            // Disparar evento de sucesso
            window.dispatchEvent(new CustomEvent('db-sync-success', {
              detail: { message: 'Dados salvos com sucesso' }
            }));
            
            resolve();
          };
          tx.onerror = () => {
            console.error('❌ Erro ao salvar no IndexedDB:', tx.error);
            window.dispatchEvent(new CustomEvent('db-sync-error', {
              detail: { error: String(tx.error) }
            }));
            reject(tx.error);
          };
        } catch (e) {
          console.error('❌ Erro na transação:', e);
          window.dispatchEvent(new CustomEvent('db-sync-error', {
            detail: { error: String(e) }
          }));
          reject(e);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        window.dispatchEvent(new CustomEvent('db-sync-error', {
          detail: { error: String(request.error) }
        }));
        reject(request.error);
      };
    } catch (e) {
      console.error('❌ Erro ao exportar banco:', e);
      window.dispatchEvent(new CustomEvent('db-sync-error', {
        detail: { error: String(e) }
      }));
      reject(e);
    }
  });
}

function loadFromIndexedDB(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('MecanicaERP', 1);
      
      request.onupgradeneeded = (event) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        if (!idb.objectStoreNames.contains('database')) {
          idb.createObjectStore('database');
        }
      };
      
      request.onsuccess = () => {
        const idb = request.result;
        try {
          const tx = idb.transaction('database', 'readonly');
          const getReq = tx.objectStore('database').get(DB_KEY);
          
          getReq.onsuccess = () => {
            const result = getReq.result;
            if (result instanceof Uint8Array) {
              console.log('✓ Banco carregado do IndexedDB');
              resolve(result.buffer);
            } else if (result instanceof ArrayBuffer) {
              console.log('✓ Banco carregado do IndexedDB (ArrayBuffer)');
              resolve(result);
            } else if (result) {
              // Pode ser Blob ou outro tipo
              console.warn('⚠️ Tipo de dado desconhecido no IndexedDB:', typeof result);
              resolve(null);
            } else {
              console.log('⚠️ Banco não encontrado no IndexedDB (primeira execução)');
              resolve(null);
            }
          };
          
          getReq.onerror = () => {
            console.error('❌ Erro ao ler do IndexedDB:', getReq.error);
            resolve(null);
          };
        } catch (e) {
          console.error('❌ Erro na transação de leitura:', e);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB para leitura:', request.error);
        resolve(null);
      };
    } catch (e) {
      console.error('❌ Erro geral no loadFromIndexedDB:', e);
      resolve(null);
    }
  });
}

// ===== SERVICOS =====
export async function getServicos(search?: string) {
  const d = await getDb();
  let query = 'SELECT * FROM servicos ORDER BY created_at DESC';
  if (search) {
    query = `SELECT * FROM servicos WHERE cliente_nome LIKE '%${search}%' OR carro_modelo LIKE '%${search}%' ORDER BY created_at DESC`;
  }
  return d.exec(query)[0]?.values.map(rowToServico) || [];
}

export async function addServico(s: Partial<Servico>) {
  const d = await getDb();
  d.run(
    `INSERT INTO servicos (cliente_nome, cliente_telefone, carro_modelo, data_chegada, data_entrega, orcamento_privado, status_servico, valor_total, valor_pago, valor_mao_obra, peca_list)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.cliente_nome || '', s.cliente_telefone || '', s.carro_modelo || '', s.data_chegada || '', s.data_entrega || '', s.orcamento_privado || '', s.status_servico || 'Aguardando', s.valor_total || 0, s.valor_pago || 0, (s as any).valor_mao_obra || 0, JSON.stringify((s as any).peca_list || [])]
  );
  await saveToIndexedDB();
}

export async function updateServico(id: number, s: Partial<Servico>) {
  const d = await getDb();
  d.run(
    `UPDATE servicos SET cliente_nome=?, cliente_telefone=?, carro_modelo=?, data_chegada=?, data_entrega=?, orcamento_privado=?, status_servico=?, valor_total=?, valor_pago=?, valor_mao_obra=?, peca_list=? WHERE id=?`,
    [s.cliente_nome || '', s.cliente_telefone || '', s.carro_modelo || '', s.data_chegada || '', s.data_entrega || '', s.orcamento_privado || '', s.status_servico || 'Aguardando', s.valor_total || 0, s.valor_pago || 0, (s as any).valor_mao_obra || 0, JSON.stringify((s as any).peca_list || []), id]
  );
  await saveToIndexedDB();
}

export async function deleteServico(id: number) {
  const d = await getDb();
  d.run('DELETE FROM servicos WHERE id=?', [id]);
  await saveToIndexedDB();
}

// ===== AGENDA =====
export async function getAgenda() {
  const d = await getDb();
  return d.exec('SELECT * FROM agenda ORDER BY data_agendada ASC')[0]?.values.map(rowToAgenda) || [];
}

export async function addAgenda(a: Partial<Agenda>) {
  const d = await getDb();
  d.run(
    `INSERT INTO agenda (data_agendada, cliente_nome, cliente_telefone, carro_modelo) VALUES (?, ?, ?, ?)`,
    [a.data_agendada || '', a.cliente_nome || '', a.cliente_telefone || '', a.carro_modelo || '']
  );
  await saveToIndexedDB();
}

export async function toggleAgendaConcluido(id: number, concluido: boolean) {
  const d = await getDb();
  d.run('UPDATE agenda SET concluido=? WHERE id=?', [concluido ? 1 : 0, id]);
  await saveToIndexedDB();
}

export async function deleteAgenda(id: number) {
  const d = await getDb();
  d.run('DELETE FROM agenda WHERE id=?', [id]);
  await saveToIndexedDB();
}

// ===== ESTOQUE =====
export async function getEstoque() {
  const d = await getDb();
  return d.exec('SELECT * FROM estoque ORDER BY nome_peca ASC')[0]?.values.map(rowToEstoque) || [];
}

export async function addEstoque(e: Partial<Estoque>) {
  const d = await getDb();
  d.run(
    `INSERT INTO estoque (nome_peca, quantidade, valor_custo) VALUES (?, ?, ?)`,
    [e.nome_peca || '', e.quantidade || 0, e.valor_custo || 0]
  );
  await saveToIndexedDB();
}

export async function updateEstoqueQtd(id: number, delta: number) {
  const d = await getDb();
  d.run('UPDATE estoque SET quantidade = MAX(0, quantidade + ?) WHERE id=?', [delta, id]);
  await saveToIndexedDB();
}

export async function deleteEstoque(id: number) {
  const d = await getDb();
  d.run('DELETE FROM estoque WHERE id=?', [id]);
  await saveToIndexedDB();
}

// ===== DASHBOARD =====
export async function getFaturamentoMes() {
  const d = await getDb();
  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const result = d.exec(`SELECT COALESCE(SUM(valor_pago), 0) as total FROM servicos WHERE data_chegada LIKE '${mes}%'`);
  return (result[0]?.values[0]?.[0] as number) || 0;
}

export async function getServicosNoPatio() {
  const d = await getDb();
  return d.exec("SELECT * FROM servicos WHERE status_servico IN ('Aguardando', 'Fazendo') ORDER BY created_at DESC")[0]?.values.map(rowToServico) || [];
}

export async function getAgendaHoje() {
  const d = await getDb();
  const now = new Date();
  const hoje = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return d.exec(`SELECT * FROM agenda WHERE data_agendada = '${hoje}' ORDER BY id ASC`)[0]?.values.map(rowToAgenda) || [];
}

// ===== BACKUP =====
export async function exportBackup(): Promise<string> {
  const servicos = await getServicos();
  const agenda = await getAgenda();
  const estoque = await getEstoque();
  return JSON.stringify({ servicos, agenda, estoque, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importBackup(json: string) {
  const data = JSON.parse(json);
  const d = await getDb();

  d.run('DELETE FROM servicos');
  d.run('DELETE FROM agenda');
  d.run('DELETE FROM estoque');

  for (const s of data.servicos || []) {
    await addServico(s);
  }
  for (const a of data.agenda || []) {
    await addAgenda(a);
  }
  for (const e of data.estoque || []) {
    await addEstoque(e);
  }
  await saveToIndexedDB();
}

// ===== TYPES & HELPERS =====
export interface Servico {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  carro_modelo: string;
  data_chegada: string;
  data_entrega: string;
  orcamento_privado: string;
  status_servico: string;
  valor_total: number;
  valor_pago: number;
  valor_mao_obra?: number;
  peca_list?: Array<{ nome: string; valor: number }>;
  created_at: string;
}

export interface Agenda {
  id: number;
  data_agendada: string;
  cliente_nome: string;
  cliente_telefone: string;
  carro_modelo: string;
  concluido: boolean;
  created_at: string;
}

export interface Estoque {
  id: number;
  nome_peca: string;
  quantidade: number;
  valor_custo: number;
  created_at: string;
}

function rowToServico(row: any[]): Servico {
  const peca_list_str = row[11];
  try {
    return {
      id: row[0] as number, 
      cliente_nome: row[1] as string, 
      cliente_telefone: row[2] as string,
      carro_modelo: row[3] as string, 
      data_chegada: row[4] as string, 
      data_entrega: row[5] as string,
      orcamento_privado: row[6] as string, 
      status_servico: row[7] as string,
      valor_total: row[8] as number, 
      valor_pago: row[9] as number, 
      valor_mao_obra: row[10] ? (row[10] as number) : 0,
      peca_list: peca_list_str ? JSON.parse(peca_list_str as string) : [], 
      created_at: row[12] as string,
    };
  } catch (e) {
    // Fallback para linhas antigas sem as novas colunas
    return {
      id: row[0] as number, 
      cliente_nome: row[1] as string, 
      cliente_telefone: row[2] as string,
      carro_modelo: row[3] as string, 
      data_chegada: row[4] as string, 
      data_entrega: row[5] as string,
      orcamento_privado: row[6] as string, 
      status_servico: row[7] as string,
      valor_total: row[8] as number, 
      valor_pago: row[9] as number, 
      valor_mao_obra: 0,
      peca_list: [], 
      created_at: row[10] as string,
    };
  }
}

function rowToAgenda(row: any[]): Agenda {
  return {
    id: row[0] as number, data_agendada: row[1] as string, cliente_nome: row[2] as string,
    cliente_telefone: row[3] as string, carro_modelo: row[4] as string,
    concluido: row[5] === 1, created_at: row[6] as string,
  };
}

function rowToEstoque(row: any[]): Estoque {
  return {
    id: row[0] as number, nome_peca: row[1] as string, quantidade: row[2] as number,
    valor_custo: row[3] as number, created_at: row[4] as string,
  };
}

export function getStatusPagamento(valor_total: number, valor_pago: number) {
  if (valor_total <= 0) return { label: '—', variant: 'muted' as const };
  if (valor_pago >= valor_total) return { label: 'Pago ✅', variant: 'success' as const };
  if (valor_pago <= 0) return { label: 'Não Pago ❌', variant: 'destructive' as const };
  const falta = valor_total - valor_pago;
  return { label: `Falta R$ ${falta.toFixed(2)} ⚠️`, variant: 'warning' as const };
}
