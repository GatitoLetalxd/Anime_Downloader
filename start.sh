#!/bin/bash
echo "Iniciando AnimeDownloader..."
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
