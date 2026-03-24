#!/bin/bash

# Este script foi feito para rodar no Linux!
# Ele vai abrir a versão super rápida e offline do sistema.

# 1. Pega a pasta onde este script está localizado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================"
echo "    INICIANDO SISTEMA DA OFICINA...     "
echo "========================================"

# Mata algum servidor antigo que ficou preso (para evitar erro)
kill -9 $(lsof -t -i:8080) 2>/dev/null

# 2. Inicia o servidor local apontando para a pasta que foi compilada (dist)
# A flag -s garante que, se o usuário recarregar a página, não dê erro 404
./node_modules/.bin/serve -s dist -l 8080 &

# 3. Espera o servidor ligar
sleep 2

# 4. Abre o navegador automaticamente
echo "Abrindo o navegador..."
xdg-open "http://localhost:8080" 2>/dev/null || x-www-browser "http://localhost:8080" 2>/dev/null
