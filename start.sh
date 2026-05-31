#!/bin/bash
echo "Iniciando AnimeDownloader..."

echo "[1/3] Verificando dependencias del Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install
fi
if [ ! -f ".env" ]; then
    echo "Creando archivo .env por defecto para el backend..."
    cp .env.example .env
fi
cd ..

echo "[2/3] Verificando dependencias del Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    npm install
fi
cd ..

echo "[3/3] Iniciando servidores..."
cd backend && npm run dev &
cd frontend && npm run dev &
sleep 3
if [ -x "$(command -v open)" ]; then
  open http://localhost:5173
elif [ -x "$(command -v xdg-open)" ]; then
  xdg-open http://localhost:5173
else
  echo "Listo! Por favor abre http://localhost:5173 en tu navegador."
fi
