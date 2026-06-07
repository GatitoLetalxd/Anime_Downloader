# 🎬 AnimeDownloader — Plataforma de Streaming y Descargas Local

<p align="center">
  <img src="frontend/public/images/logo.png" alt="AnimeDownloader Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0, 229, 255, 0.25);" />
</p>

<h3 align="center">LunielAnime</h3>
<p align="center">
  Una sofisticada aplicación web auto-alojada (<i>self-hosted</i>) para buscar, reproducir en línea y descargar tus episodios de anime favoritos de forma local y 100% gratuita.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-00e5ff?style=for-the-badge&logo=react" alt="React & Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-0088ff?style=for-the-badge&logo=node.js" alt="Node & Express" />
  <img src="https://img.shields.io/badge/Base%20de%20Datos-PostgreSQL-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

---

## 🌟 Características Destacadas

*   **⚡ Buscador de Alta Velocidad**: Localiza al instante cualquier serie o película con tolerancia a tildes e indexación instantánea.
*   **📺 Streaming Integrado**: Reproducción fluida dentro de la plataforma con un modal premium *glassmorphism* de desenfoque de fondo.
*   **🌐 Selectores de Idioma y Servidor**: Alterna entre versiones subtituladas (**SUB**) y dobladas (**DUB**), eligiendo entre múltiples servidores de streaming rápidos (Streamwish, Vidhide, VOE, etc.).
*   **📥 Descargas Nativas HLS/m3u8**: Descarga directa de episodios a tu máquina en resoluciones de hasta 1080p, con soporte para descargas tradicionales MP4 y flujos HLS segmentados.
*   **📊 Monitor de Descargas en Tiempo Real**: Panel interactivo que muestra porcentaje, velocidad en MB/s y tiempo estimado a través de comunicación bidireccional mediante **Socket.io**.
*   **👤 Perfil de Usuario Custom**: Cambia tu avatar dinámicamente y gestiona tu perfil con cambio de contraseña encriptada (con Bcrypt.js e indicador dinámico de fortaleza).
*   **⏳ Control de Suscripción / Tiempo de Acceso**:
    *   Administradores con acceso ilimitado garantizado.
    *   Asignación de días de acceso temporales por parte del administrador (opciones rápidas de `+7d`, `+30d`, `+2m`, `+3m`, `+4m`, `+6m`, `+1y` o días personalizados).
    *   Bloqueo automático de cuentas expiradas con redirección segura y mensaje de alerta para contactar al administrador.
    *   Badge sutil de tiempo restante en la **Navbar** y panel de suscripción detallado en **Mi Perfil**.
*   **🎨 Diseño Premium Dark (Cian & Azul)**: Interfaz de usuario cinematográfica, moderna y responsiva con fondo negro azulado profundo y acentos de color cian neón vibrantes.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnologías Utilizadas |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router Dom, Socket.io-Client |
| **Backend** | Node.js, Express, Socket.io, Fluent-FFmpeg, FFmpeg-Static, Axios, Cheerio, Puppeteer |
| **Seguridad** | JWT (JSON Web Tokens), cookies seguras HTTP-Only, encriptación Bcrypt.js |
| **Persistencia** | PostgreSQL, pg Pool |

---

## 🚀 Guía de Instalación y Uso Rápido

### Requisitos Previos
*   Tener instalado [Node.js](https://nodejs.org/) (v18 o superior).
*   Tener instalado y ejecutándose una base de datos [PostgreSQL](https://www.postgresql.org/).

### Paso 1: Configurar Variables de Entorno `.env`
Crea un archivo `.env` en la carpeta `backend/` basado en `backend/.env.example` y rellena las credenciales de tu base de datos y tus secretos JWT:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=lunielanime
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt
```

### Paso 2: Instalar Dependencias
Instala los paquetes necesarios en ambas carpetas del proyecto:
```bash
# Dependencias de Servidor
cd backend
npm install

# Dependencias de Cliente
cd ../frontend
npm install
```

### Paso 3: Inicializar la Base de Datos
Ejecuta el script de migración para aplicar el esquema de tablas SQL en tu PostgreSQL:
```bash
cd ../backend
node src/db/migrate.js
```
*(Opcional) Ejecuta `node src/db/seed-admin.js` para registrar tu primer usuario administrador manualmente desde la consola.*

### Paso 4: Encender la Aplicación
Para iniciar el proyecto completo simultáneamente de forma sencilla:

*   **En Windows**: Haz doble clic en el archivo `start.bat` o ejecútalo en la terminal:
    ```cmd
    start.bat
    ```
*   **En Linux/macOS**: Ejecuta el script bash `start.sh`:
    ```bash
    chmod +x start.sh
    ./start.sh
    ```

Esto abrirá la aplicación automáticamente en tu navegador predeterminado:
*   **Frontend**: `http://localhost:5173`
*   **Backend**: `http://localhost:3001`

---

## 🤝 Créditos y Agradecimientos

*   **Autor y Desarrollador de la Plataforma**:  
    **Rogeero Daniel Montufar Merma** — [@GatitoLetalxd](https://github.com/GatitoLetalxd/)  
    *Diseño del frontend React, arquitectura de descarga/conversión HLS local, gestión de usuarios, seguridad, e integraciones Socket.io.*

*   **Creador de la API Engine y Scraper**:  
    [FxxMorgan](https://github.com/FxxMorgan) — Creador del excelente motor de scraping de código abierto [Anime1V API Engine](https://github.com/FxxMorgan).

> [!NOTE]  
> **Aclaración de la API**: El motor de scraping y la API que recopila los metadatos y enlaces de reproducción de los diferentes servidores son propiedad intelectual y autoría original de **FxxMorgan**.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Siéntete libre de clonarlo, modificarlo y compartirlo con la comunidad.
