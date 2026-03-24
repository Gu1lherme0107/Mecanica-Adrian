import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Configurar pasta e arquivo alvo
const BACKUP_DIR = '/home/laiz/Downloads';
const TARGET_FILE = path.join(BACKUP_DIR, 'mecanica_dados.json');

// Para testes no Windows, tentar usar uma pasta local se a do Linux não existir
const IS_WINDOWS = process.platform === 'win32';
const FINAL_DIR = IS_WINDOWS ? path.join(process.cwd(), 'backups') : BACKUP_DIR;
const FINAL_FILE = path.join(FINAL_DIR, 'mecanica_dados.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log(`📁 Pasta de dados configurada para: ${FINAL_DIR}`);

// Garantir que a pasta existe
if (!fs.existsSync(FINAL_DIR)) {
  fs.mkdirSync(FINAL_DIR, { recursive: true });
  console.log(`✓ Pasta criada: ${FINAL_DIR}`);
}

/**
 * GET /api/latest-backup
 * Retorna o arquivo de dados
 */
app.get('/api/latest-backup', (req, res) => {
  try {
    if (!fs.existsSync(FINAL_FILE)) {
      console.log('⚠️ Arquivo de dados não encontrado (primeira vez)');
      return res.json({ data: null, message: 'Nenhum backup encontrado' });
    }

    const data = fs.readFileSync(FINAL_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    console.log(`✓ Dados carregados: ${FINAL_FILE}`);
    res.json({
      success: true,
      file: 'mecanica_dados.json',
      data: parsed
    });
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-backup
 * Salva/Atualiza o arquivo JSON
 */
app.post('/api/save-backup', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'Campo "data" é obrigatório' });
    }

    // Escrever (substituir) arquivo único
    fs.writeFileSync(FINAL_FILE, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✓ Dados atualizados em: ${FINAL_FILE}`);
    res.json({
      success: true,
      file: 'mecanica_dados.json'
    });
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de dados rodando em: http://localhost:${PORT}`);
  console.log(`📦 Arquivo de banco de dados central: ${FINAL_FILE}\n`);
});
