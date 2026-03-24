#!/bin/bash

# 🔧 SISTEMA DE GESTÃO DA OFICINA - LINUX
# Este script inicia o sistema em modo offline (PWA)
# Você pode simular estar sem internet e o sistema funcionará normalmente!

# Pega a pasta onde este script está localizado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================"
echo "  🚀  INICIANDO MECÂNICA ADRIAN ERP    "
echo "========================================"
echo ""

# Verifica se as dependências foram instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --quiet
fi

# Mata qualquer servidor antigo que ficou preso (porta 8080 e porta 3001)
echo "🔄 Limpando portas antigas..."
kill -9 $(lsof -t -i:8080) 2>/dev/null
kill -9 $(lsof -t -i:3001) 2>/dev/null

# Tenta criar a pasta Downloads caso não exista (prevenção)
mkdir -p /home/laiz/Downloads

# Se houver pasta dist, usa ela. Se não, compila primeiro
if [ ! -d "dist" ]; then
    echo "🔨 Compilando projeto em modo otimizado..."
    npm run build > /dev/null 2>&1
fi

# Inicia o servidor de dados (que lê/salva o arquivo mecanica_dados.json na pasta Downloads)
echo "📂 Iniciando servidor de Banco de Dados local..."
node backup-server.js > /dev/null 2>&1 &
BACKUP_PID=$!

# Inicia o servidor Web com a pasta compilada
# A flag -s garante Single Page Application (sem erro 404 ao recarregar)
echo "⚡ Iniciando servidor Web na porta 8080..."
./node_modules/.bin/serve -s dist -l 8080 > /dev/null 2>&1 &
SERVER_PID=$!

# Espera os servidores estarem prontos
sleep 2

# Abre automaticamente no navegador
echo "🌐 Abrindo navegador..."
xdg-open "http://localhost:8080" 2>/dev/null || x-www-browser "http://localhost:8080" 2>/dev/null || echo "Acesse manualmente: http://localhost:8080"

echo ""
echo "✅ Sistema rodando em http://localhost:8080"
echo "✅ Os dados estão sendo salvos em: /home/laiz/Downloads/mecanica_dados.json"
echo "   Pressione Ctrl+C nesta tela preta para desligar tudo corretamente."
echo ""

# Previne que processos fiquem rodando no fundo após fechar
trap 'echo "\n🛑 Desligando sistema..."; kill $BACKUP_PID; kill $SERVER_PID; kill -9 $(lsof -t -i:8080) 2>/dev/null; kill -9 $(lsof -t -i:3001) 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

wait
