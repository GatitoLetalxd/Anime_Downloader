# AnimeDownloader — Prompt para agente de código

> Copia y pega este prompt completo en Claude Code, Cursor, o cualquier agente de código.
> Todo corre 100% local, sin servidores externos ni pagos.

---

## Contexto del proyecto

Construye **AnimeDownloader**, una app de escritorio web para buscar y descargar animes
completos o por episodios. Usa la API open source `anime1v-api` de FxxMorgan como backend
de scraping. Todo corre localmente en la máquina del usuario, sin necesidad de VPS,
base de datos externa ni autenticación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend/API | anime1v-api (Node.js + Express — ya existe, solo clonar) |
| Comunicación en tiempo real | Socket.io (para progreso de descarga en vivo) |
| Estilos | TailwindCSS |
| Tema | Oscuro, estética anime |

---

## Paso 0 — Clonar y preparar anime1v-api

Antes de crear el frontend, clonar el repositorio de la API:

```bash
git clone https://github.com/FxxMorgan/anime1v-api.git backend
cd backend
cp .env.example .env
npm install
```

En el archivo `backend/.env` configurar:
```env
PORT=3001
API_KEYS=mi_clave_local_123
```

Agregar Socket.io al backend para emitir progreso de descargas en tiempo real:

```bash
npm install socket.io
```

Modificar `backend/src/index.js` (o el archivo principal) para:
1. Montar Socket.io sobre el servidor HTTP existente
2. Configurar CORS para permitir `http://localhost:5173`
3. En el endpoint de descarga, emitir eventos de progreso por Socket.io:
   - `descarga:progreso` → `{ downloadId, porcentaje, velocidad, tamaño }`
   - `descarga:completa` → `{ downloadId, ruta, nombreArchivo }`
   - `descarga:error` → `{ downloadId, mensaje }`

---

## Estructura de carpetas del proyecto completo

```
anime-downloader/
├── backend/          ← anime1v-api clonada y modificada
│   ├── src/
│   ├── downloads/    ← aquí se guardan los archivos descargados
│   ├── .env
│   └── package.json
└── frontend/         ← app React nueva
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Buscar.jsx
    │   │   ├── Descargas.jsx
    │   │   └── Historial.jsx
    │   ├── components/
    │   │   ├── AnimeCard.jsx
    │   │   ├── EpisodioSelector.jsx
    │   │   ├── BarraProgreso.jsx
    │   │   ├── ColaDescargas.jsx
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   ├── useSocket.js
    │   │   └── useDescargas.js
    │   ├── lib/
    │   │   └── api.js
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## Variables de entorno del frontend

### frontend/.env
```env
VITE_API_URL=http://localhost:3001
VITE_API_KEY=mi_clave_local_123
```

---

## Lo que debe hacer cada parte

### `frontend/src/lib/api.js`
Cliente HTTP para comunicarse con la API. Todas las llamadas incluyen el header
`X-API-Key` con la clave del `.env`. Exportar estas funciones:

```js
buscarAnime(query)
// GET /api/v1/anime/search?q={query}
// Retorna: [{ id, titulo, url, imagen, tipo, año }]

obtenerInfo(url)
// GET /api/v1/anime/info?url={url}
// Retorna: { titulo, descripcion, generos, episodios: [{ nombre, url, numero }] }

iniciarDescarga(urlEpisodio, opcionesOpcionales)
// POST /api/v1/anime/download
// Body: { url: urlEpisodio, variant: 'SUB' }
// Retorna: { downloadId }

obtenerProgreso(downloadId)
// GET /api/v1/anime/download/:id
// Retorna: { porcentaje, velocidad, tamaño, estado, ruta }
```

### `frontend/src/hooks/useSocket.js`
Hook que conecta a Socket.io en `http://localhost:3001` y escucha:
- `descarga:progreso` → actualiza el estado de la descarga en curso
- `descarga:completa` → marca la descarga como terminada y muestra notificación
- `descarga:error` → muestra el error correspondiente

Exportar: `{ descargas, estado }` donde `descargas` es un Map de `downloadId → estado`.

### `frontend/src/hooks/useDescargas.js`
Hook que gestiona la cola de descargas. Funciones:
- `agregarDescarga(urlEpisodio, nombreEpisodio)` → llama a `iniciarDescarga` y agrega a la cola
- `agregarTodos(episodios)` → descarga toda la lista con un pequeño delay entre cada uno
- `cancelarDescarga(downloadId)` → cancela si es posible
- `limpiarCompletadas()` → limpia las descargas terminadas de la lista

### `frontend/src/pages/Buscar.jsx` — Página principal
Flujo completo en una sola página con tres estados visuales:

**Estado 1 — Búsqueda:**
- Input de búsqueda grande centrado con placeholder "Busca tu anime favorito..."
- Botón de buscar o Enter para confirmar
- Mientras carga: skeleton cards animadas
- Resultados: grid de AnimeCards (portada, título, tipo, año)

**Estado 2 — Episodios (al hacer clic en un anime):**
- Header con portada grande, título, descripción, géneros en badges
- Botón "← Volver" para regresar a resultados
- Botón "Descargar todo" prominente
- Lista de episodios con checkbox individual en cada uno
- Botón "Descargar seleccionados" cuando hay checkboxes marcados
- Cada episodio muestra: número, nombre, badge SUB/DUB

**Estado 3 — Confirmación:**
- Al iniciar descarga(s), mostrar toast/notificación "X episodios agregados a la cola"
- Redirigir automáticamente a la página de Descargas tras 1.5 segundos

### `frontend/src/components/AnimeCard.jsx`
Tarjeta de anime con:
- Imagen de portada con lazy loading
- Overlay oscuro con título al hacer hover
- Badge de tipo (Serie/Película/OVA)
- Badge de año
- Efecto hover con escala sutil
- Skeleton loader cuando está cargando

### `frontend/src/components/EpisodioSelector.jsx`
Componente de lista de episodios con:
- Checkbox "Seleccionar todos"
- Checkboxes individuales por episodio
- Filtro por rango: "Del episodio X al Y"
- Contador de seleccionados: "3 episodios seleccionados"
- Scroll virtual si hay más de 50 episodios

### `frontend/src/components/BarraProgreso.jsx`
Barra de progreso para cada descarga activa:
- Nombre del episodio
- Barra animada con porcentaje
- Velocidad de descarga (MB/s)
- Tamaño total y descargado
- Estado: Descargando / Completado / Error
- Botón X para cancelar si está en curso
- Ícono de check verde si completó
- Ícono de error rojo si falló

### `frontend/src/components/ColaDescargas.jsx`
Panel lateral o sección que muestra:
- Contador de descargas activas
- Lista de BarraProgreso por cada descarga
- Descargas completadas con opción de limpiar
- Vacío state: "No hay descargas en curso"

### `frontend/src/pages/Descargas.jsx`
Página completa de gestión de descargas:
- Tabs: "En curso" / "Completadas" / "Con error"
- En curso: lista de BarraProgreso activas
- Completadas: lista con nombre, tamaño, fecha y botón "Abrir carpeta"
- Con error: lista con mensaje de error y botón "Reintentar"
- Botón "Limpiar completadas"
- Indicador de velocidad total combinada

### `frontend/src/pages/Historial.jsx`
Historial de descargas guardado en localStorage:
- Lista de todo lo descargado con fecha
- Búsqueda por nombre
- Opción de limpiar historial
- Total de episodios y GB descargados

### `frontend/src/components/Navbar.jsx`
Navegación superior con:
- Logo "AnimeDownloader" con ícono
- Links: Buscar / Descargas / Historial
- Badge con número de descargas activas en el link de Descargas
- Indicador de estado de conexión con la API (punto verde/rojo)

---

## Diseño y estilos

Tema completamente oscuro estilo anime con TailwindCSS:

```js
// tailwind.config.js
colors: {
  bg: {
    primary: '#0a0a0f',
    secondary: '#111118',
    card: '#1a1a24',
  },
  accent: {
    red: '#e8395a',
    purple: '#7c3aed',
    blue: '#38bdf8',
  }
}
```

- Fondo principal `#0a0a0f`
- Cards con `#1a1a24` y borde sutil
- Acento principal rojo `#e8395a`
- Fuente principal: Inter o sistema
- Bordes redondeados generosos (8-12px)
- Sombras sutiles en cards
- Animaciones suaves (200-300ms)
- Skeleton loaders animados mientras carga

---

## Dependencias a instalar

### Frontend
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install socket.io-client axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Backend (agregar a anime1v-api)
```bash
cd backend
npm install socket.io cors
```

---

## Scripts de arranque

Crear un archivo `start.bat` en la raíz para Windows que inicie todo con doble clic:

```bat
@echo off
echo Iniciando AnimeDownloader...
start cmd /k "cd backend && npm run dev"
timeout /t 2
start cmd /k "cd frontend && npm run dev"
timeout /t 2
start http://localhost:5173
echo Listo! Abriendo el navegador...
```

Y un `start.sh` para Mac/Linux:
```bash
#!/bin/bash
echo "Iniciando AnimeDownloader..."
cd backend && npm run dev &
cd frontend && npm run dev &
sleep 2
open http://localhost:5173
```

---

## Flujo completo de uso

```
1. Usuario ejecuta start.bat
2. Se abren dos terminales (backend en :3001, frontend en :5173)
3. El navegador abre automáticamente localhost:5173
4. Usuario escribe "Demon Slayer" y busca
5. Aparecen los resultados con portadas
6. Hace clic en la serie que quiere
7. Ve la lista de episodios
8. Marca los que quiere o hace clic en "Descargar todo"
9. Ve el progreso en tiempo real en la página de Descargas
10. Los archivos quedan en backend/downloads/
```

---

## Notas importantes para el agente

1. **No modificar la lógica core de anime1v-api** — solo agregar Socket.io encima para el progreso en tiempo real. La lógica de scraping ya funciona.

2. **localStorage para historial** — no se necesita base de datos. Guardar el historial de descargas en `localStorage` con la key `anime-downloader-historial`.

3. **Cola de descargas con delay** — al descargar "todos los episodios", agregar un delay de 1-2 segundos entre cada descarga para no saturar el servidor fuente y evitar bloqueos por rate limiting.

4. **Manejo de errores visual** — si un episodio falla, mostrar el error claramente y ofrecer reintentar sin afectar las otras descargas en cola.

5. **Lazy loading de imágenes** — las portadas de anime pueden ser lentas, usar `loading="lazy"` en todas las imágenes.

6. **El archivo `start.bat`** es prioritario — el usuario debe poder arrancar todo con doble clic sin tocar la terminal.

7. **Verificar conexión con la API** — al cargar la app, hacer un ping a `http://localhost:3001/health` y mostrar en el Navbar si la API está activa o no.

---

## Orden de implementación sugerido

1. Clonar anime1v-api y verificar que funciona con `npm run dev`
2. Agregar Socket.io al backend y emitir eventos de progreso
3. Crear frontend con Vite + TailwindCSS configurado
4. Implementar `api.js` y verificar que las llamadas funcionan
5. Implementar `useSocket.js` y `useDescargas.js`
6. Construir página de Búsqueda con AnimeCard
7. Construir selector de episodios
8. Construir página de Descargas con barras de progreso
9. Construir Historial con localStorage
10. Crear `start.bat` y `start.sh`
11. Probar flujo completo end-to-end
