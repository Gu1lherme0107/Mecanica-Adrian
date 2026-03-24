import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Configurar pasta de backups
const BACKUP_DIR = process.env.BACKUP_DIR || '/home/laiz/Downloads';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log(`📁 Pasta de backups: ${BACKUP_DIR}`);

// Garantir que a pasta existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✓ Pasta criada: ${BACKUP_DIR}`);
}

/**
 * GET /api/latest-backup
 * Retorna o arquivo JSON mais recente da pasta de backups
 */
app.get('/api/latest-backup', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('mecanica-backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.log('⚠️  Nenhum backup encontrado');
      return res.json({ data: null, message: 'Nenhum backup encontrado' });
    }

    const latestFile = files[0];
    const data = fs.readFileSync(latestFile.path, 'utf-8');
    const parsed = JSON.parse(data);

    console.log(`✓ Backup carregado: ${latestFile.name}`);
    res.json({
      success: true,
      file: latestFile.name,
      data: parsed,
      timestamp: latestFile.time
    });
  } catch (error) {
    console.error('❌ Erro ao carregar backup:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-backup
 * Salva um novo arquivo JSON com timestamp
 */
app.post('/api/save-backup', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'Campo "data" é obrigatório' });
    }

    // Criar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mecanica-backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Escrever arquivo
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✓ Backup salvo: ${filename}`);
    res.json({
      success: true,
      file: filename,
      path: filepath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao salvar backup:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/backups
 * Lista todos os backups disponíveis
 */
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('mecanica-backup-') && f.endsWith('.json'))
      .map(f => {
        const filepath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filepath);
        return {
          name: f,
          size: stats.size,
          timestamp: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`✓ Listados ${files.length} backups`);
    res.json({ success: true, backups: files });
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Verifica se o servidor está rodando
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de backup rodando em: http://localhost:${PORT}`);
  console.log(`📦 Endpoints disponíveis:`);
  console.log(`   GET  /api/health          - Verifica status`);
  console.log(`   GET  /api/latest-backup   - Carrega backup mais recente`);
  console.log(`   POST /api/save-backup     - Salva novo backup`);
  console.log(`   GET  /api/backups         - Lista todos os backups\n`);
});
