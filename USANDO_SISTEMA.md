# 🚀 Usando o Sistema de Persistência de Dados

## Novo Sistema: Arquivo JSON em Backup

O sistema agora **persiste dados em arquivo JSON** ao invés de depender apenas do IndexedDB (que não estava funcionando).

### 🔄 Como Funciona

1. **Na Inicialização:**
   - O sistema busca o backup JSON **mais recente** em `/home/laiz/Downloads/`
   - Carrega automaticamente os dados (servicos, agenda, estoque)
   - Se não encontrar nada, começa com banco vazio

2. **Ao Salvar Dados:**
   - Cada operação (adicionar, editar, deletar) é imediatamente salva em:
     - IndexedDB (localStorage da sessão atual)
     - localStorage (fallback)
     - **Arquivo JSON no servidor** (persistência confiável)

3. **Recarregando o Sistema:**
   - Fecha e abre novamente → dados carregados automaticamente ✅

---

## 📋 Como Iniciar (Windows)

### Abra **2 terminais** (espaços em branco):

**Terminal 1 - Servidor de Backup:**
```bash
npm run dev:server
```
Deve mostrar:
```
🚀 Servidor de backup rodando em: http://localhost:3001
```

**Terminal 2 - Aplicação Web:**
```bash
npm run dev
```
Deve mostrar:
```
VITE v5.4.19 ready in XXX ms
➜  Local: http://localhost:5173/
```

---

## 🐧 Como Iniciar (Linux - /home/laiz/)

Se estiver rodando no Linux DEPOIS de deployar, configure a pasta de backups:

```bash
# Terminal 1
BACKUP_DIR=/home/laiz/Downloads npm run dev:server

# Terminal 2
npm run dev
```

---

## 📝 Fluxo Completo de Teste

1. **Inicie os 2 terminais** (conforme acima)
2. Abra a aplicação em `http://localhost:5173`
3. **Adicione um novo Serviço:**
   - Vá para **Serviços**
   - Clique em **Novo Serviço**
   - Preencha os dados
   - Clique em **Salvar**
4. **Veja o indicador de sincronização:**
   - Deve aparecer ✓ verde no canto inferior direito
   - Indica que arquivo JSON foi atualizado
5. **Verifique o arquivo criado:**
   - Em `/home/laiz/Downloads/` (Linux)
   - Ou `C:\Users\vipgu\Mecanica-Adrian\backups\` (Windows)
   - Arquivo: `mecanica-backup-YYYY-MM-DD...json`
6. **Feche a aplicação** completamente
7. **Reabra:** `http://localhost:5173`
   - Seu serviço deve estar lá! ✅

---

## 📡 Endpoints do Servidor de Backup

O servidor roda na porta **3001**:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Verifica se servidor está online |
| GET | `/api/latest-backup` | Carrega o backup JSON mais recente |
| POST | `/api/save-backup` | Salva um novo arquivo JSON |
| GET | `/api/backups` | Lista todos os backups disponíveis |

---

## 🔎 Verificando o Status (Debugging)

### Console da Aplicação (F12)

Procure por mensagens como:
```
✓ Backup carregado do servidor: mecanica-backup-2026-03-24T14-32-15-123Z.json (5 serviços, 3 agendas, 12 peças)
✓ Dados importados do servidor...
✓ Banco salvo no IndexedDB
✓ Banco salvo no servidor: mecanica-backup-...json
```

### Se der erro:

**"Servidor de backup não disponível"**
- Terminal 1 não está rodando
- Execute: `npm run dev:server`

**"Nenhum backup encontrado no servidor"**
- Normal na primeira execução
- Após salvar dados uma vez, arquivo será criado

**Arquivo não está sendo salvo**
- Verifique se terminal 1 mostrou ✓ (sucesso) nas mensagens
- Verifique permissões de escrita em `/home/laiz/Downloads/`

---

## 🎯 Script Único (Futuro)

Quando estiver no Linux, pode rodar tudo de uma vez:
```bash
npm run dev:all
```
Isso iniciará servidor + aplicação simultaneamente (em breve).

---

## 📦 Próximos Passos

- [ ] Testar em Linux `/home/laiz/Downloads/` 
- [ ] Criar script shell para rodar `npm run dev:all`
- [ ] Atualizar atalho do desktop para iniciar tudo automaticamente
- [ ] Implementar sincronização periódica (backup automático a cada 5 min)

---

**Alguma dúvida? Me avisa! 🚀**
