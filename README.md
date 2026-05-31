# 🎬 AnimeDownloader — Plataforma de Streaming y Descargas Local

¡Bienvenido a **AnimeDownloader**! Una sofisticada aplicación web auto-alojada (*self-hosted*) diseñada para buscar, reproducir en línea y descargar tus episodios de anime favoritos con la máxima calidad, de manera 100% gratuita y ejecutándose enteramente en tu máquina local.

Este proyecto ha sido creado y diseñado por **Rogeero Daniel Montufar Merma**, con el objetivo de ofrecer una experiencia multimedia premium, fluida y sin anuncios molestos.

> [!NOTE]  
> **Aclaración sobre la API**: El motor de scraping y la API subyacente que recopila los enlaces y metadatos no son de autoría propia; pertenecen al excelente proyecto de código abierto **Anime1V API Engine** creado y mantenido por **FxxMorgan**.

---

## 🌟 Características Destacadas

*   **⚡ Buscador Avanzado**: Encuentra cualquier anime en segundos con indexación rápida y tolerante a tildes o variaciones de nombre.
*   **📺 Ver Online (Streaming Integrado) [¡NUEVO!]**: Modal interactivo premium con desenfoque de fondo (*glassmorphic backdrop*) que te permite reproducir capítulos en línea directamente en la app.
*   **🌐 Selectores de Idioma y Servidor**: Alterna instantáneamente entre versiones subtituladas (**SUB**) y dobladas (**DUB**), y escoge entre múltiples servidores de streaming de alta velocidad (como *Streamwish*, *Vidhide*, *VOE*, etc.).
*   **📥 Descargas de Alta Velocidad**: Descarga episodios directamente a tu disco local en resoluciones de hasta 1080p, con soporte para transmisiones HLS (m3u8) y descargas tradicionales mp4.
*   **📊 Cola de Descargas en Tiempo Real**: Panel interactivo con progreso en porcentaje, velocidad de descarga en MB/s e integración de comunicación en tiempo real mediante **Socket.io**.
*   **🎨 Interfaz Estética Premium**: Diseño moderno con modo oscuro profundo, acentos vibrantes (rojo carmesí y morado neón), animaciones fluidas y componentes interactivos responsivos.

---

## 🛠️ Tecnologías Utilizadas

La plataforma está construida utilizando un moderno stack de desarrollo web dividido en dos componentes robustos:

### Frontend (Interfaz de Usuario)
*   **React 19** & **Vite 8** para un rendimiento ultrarrápido en desarrollo y producción.
*   **Tailwind CSS v4** para un sistema de diseño moderno con variables de tema nativas.
*   **React Router Dom** para una navegación SPA suave y sin recargas de página.
*   **Socket.io-Client** para recibir actualizaciones en tiempo real del progreso de las descargas.

### Backend (Servidor y Procesamiento)
*   **Node.js** & **Express** como núcleo del servidor API local.
*   **Socket.io** para la comunicación bidireccional y streaming de progreso de descarga.
*   **Fluent-FFmpeg** & **FFmpeg-Static** para descargar y ensamblar flujos de vídeo HLS/m3u8 de forma nativa.
*   **Axios** & **Cheerio** para peticiones web y análisis de selectores HTML en los proveedores.
*   **Puppeteer** como motor de contingencia para resolver enlaces protegidos por JS.

---

## 🚀 Guía de Inicio Rápido

¡Comenzar a usar **AnimeDownloader** en tu PC local es extremadamente fácil y no requiere configuraciones complejas!

### Requisitos Previos
*   Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### Paso 1: Instalación de Dependencias
Abre tu terminal favorita en la carpeta raíz del proyecto e instala las dependencias en ambos directorios:

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Paso 2: Ejecución del Proyecto (Fácil)
Para iniciar tanto el frontend como el backend y abrir automáticamente la aplicación en tu navegador, simplemente ejecuta el archivo de lote incluido en la raíz:

*   **En Windows**: Haz doble clic en `start.bat` o ejecútalo desde la consola:
    ```cmd
    start.bat
    ```
*   **En Linux/macOS**: Ejecuta el script bash `start.sh`:
    ```bash
    chmod +x start.sh
    ./start.sh
    ```

El script iniciará el backend en `http://localhost:3001`, el frontend en `http://localhost:5173` y abrirá tu navegador por defecto automáticamente.

---

## 🤝 Créditos y Agradecimientos

*   **Creador del Proyecto / Frontend / Integraciones**: [Rogeero Daniel Montufar Merma](https://github.com/tu-usuario-si-deseas-colocarlo)
*   **Creador de la API y Scraper**: [FxxMorgan](https://github.com/FxxMorgan) (por su excelente motor [Anime1V API Engine](https://github.com/FxxMorgan)).

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Siéntete libre de clonarlo, modificarlo y compartirlo.
