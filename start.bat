@echo off
echo Iniciando AnimeDownloader...

echo [1/3] Verificando dependencias del Backend...
cd backend
if not exist "node_modules" (
    echo Instalando dependencias del backend...
    npm install
)
if not exist ".env" (
    echo Creando archivo .env por defecto para el backend...
    copy .env.example .env
)
cd ..

echo [2/3] Verificando dependencias del Frontend...
cd frontend
if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    npm install
)
cd ..

echo [3/3] Iniciando servidores...
start cmd /k "cd backend && npm run dev"
timeout /t 3 >nul
start cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo ===================================================
echo   El servidor se ha configurado para acceso en red!
echo   Para abrirlo en tu CELULAR, revisa la ventana
echo   negra de Vite y busca la direccion 'Network'
echo   (Ejemplo: http://192.168.x.x:5173)
echo ===================================================

start http://localhost:5173
echo Listo! Abriendo el navegador...
