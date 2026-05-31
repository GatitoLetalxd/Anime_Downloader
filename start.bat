@echo off
echo Iniciando AnimeDownloader...
start cmd /k "cd backend && npm run dev"
timeout /t 3
start cmd /k "cd frontend && npm run dev"
timeout /t 3
start http://localhost:5173
echo Listo! Abriendo el navegador...
