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

# Mata qualquer servidor antigo que ficou preso (porta 8080)
echo "🔄 Limpando portas antigas..."
kill -9 $(lsof -t -i:8080) 2>/dev/null

# Se houver pasta dist, usa ela. Se não, compila primeiro
if [ ! -d "dist" ]; then
    echo "🔨 Compilando projeto em modo otimizado..."
    npm run build > /dev/null 2>&1
fi

# Inicia o servidor local com a pasta compilada
# A flag -s garante Single Page Application (sem erro 404 ao recarregar)
echo "⚡ Iniciando servidor na porta 8080..."
./node_modules/.bin/serve -s dist -l 8080 > /dev/null 2>&1 &

# Espera o servidor estar pronto
sleep 2

# Abre automaticamente no navegador
echo "🌐 Abrindo navegador..."
xdg-open "http://localhost:8080" 2>/dev/null || x-www-browser "http://localhost:8080" 2>/dev/null || echo "Acesse manualmente: http://localhost:8080"

echo ""
echo "✅ Sistema rodando em http://localhost:8080"
echo "   Funciona 100% sem internet!"
echo "   Pressione Ctrl+C para parar o servidor"
echo ""
