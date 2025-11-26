#!/bin/bash
set -e

echo ""
echo "====================[ DEPLOY BIBLIOTECA FISI - NGROK ]===================="
echo ""

################################################################################
# 1) MATAR PROCESOS QUE OCUPAN PUERTOS (dotnet, node, http-server, ngrok)
################################################################################
echo "[CLEAN] Matando procesos previos..."

sudo pkill -f dotnet 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true
sudo pkill -f http-server 2>/dev/null || true
sudo pkill -f ngrok 2>/dev/null || true

sleep 1

echo "[CLEAN] Verificando puertos..."

sudo lsof -t -i:5000 | xargs -r sudo kill -9 || true
sudo lsof -t -i:4200 | xargs -r sudo kill -9 || true

echo "[CLEAN] Puertos 5000 y 4200 liberados ✔"
echo ""

################################################################################
# 2) COMPILAR BACKEND (.NET)
################################################################################
echo "[BACKEND] Compilando API .NET..."

cd backend/NeoLibro.WebAPI

dotnet build --nologo

echo "[BACKEND] OK ✔"
echo ""

################################################################################
# 3) INICIAR BACKEND
################################################################################
echo "[BACKEND] Iniciando API en segundo plano: http://0.0.0.0:5000..."

nohup dotnet run --urls "http://0.0.0.0:5000" > ../../logs-backend.txt 2>&1 &

sleep 3

echo "[BACKEND] Backend ejecutándose ✔"
echo ""

################################################################################
# 4) COMPILAR FRONTEND (Vite)
################################################################################
echo "[FRONTEND] Construyendo frontend..."

cd ../../frontend/frontend

npm install --silent

npm run build

echo "[FRONTEND] OK ✔"
echo ""

################################################################################
# 5) INICIAR FRONTEND ESTÁTICO
################################################################################
echo "[FRONTEND] Iniciando servidor estático en http://0.0.0.0:4200..."

cd dist

nohup npx http-server . -p 4200 --cors -P http://localhost:5000 --fallback index.html \
    > ../../../logs-frontend.txt 2>&1 &

sleep 2

echo "[FRONTEND] Frontend ejecutándose ✔"
echo ""

################################################################################
# 6) INICIAR NGROK
################################################################################
echo "[NGROK] Iniciando túnel http -> 4200..."

nohup ngrok http 4200 > ../../logs-ngrok.txt 2>&1 &

sleep 4

echo ""
echo "====================[ ESTADO ]===================="
echo "Frontend local:       http://localhost:4200"
echo "Backend local:        http://localhost:5000"
echo ""
echo "URL pública NGROK:"
echo ""

# Mostrar URL pública de NGROK
curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*'

echo ""
echo "==================================================="
echo "[DEPLOY] Todo listo."
echo "==================================================="
