# LunielAnime Web - Documentación de la API del Backend

Esta es la documentación oficial de los endpoints de la API de **LunielAnime Web**, detallando métodos HTTP, parámetros, cuerpos de solicitud, requerimientos de autenticación y ejemplos de respuestas.

---

## Índice
1. [Configuración General](#configuración-general)
2. [Autenticación y Seguridad](#autenticación-y-seguridad)
3. [Endpoints de Autenticación (`/api/auth`)](#endpoints-de-autenticación-apiauth)
4. [Endpoints de Anime y Scrapers (`/api/v1/anime` o `/api/anime1v`)](#endpoints-de-anime-y-scrapers-apiv1anime-o-apianime1v)
5. [Endpoints de Usuario (`/api/user`)](#endpoints-de-usuario-apiuser)
6. [Endpoints de Administración (`/api/admin`)](#endpoints-de-administración-apiadmin)
7. [Archivos Estáticos y Descargas](#archivos-estáticos-y-descargas)

---

## Configuración General

- **URL Base por Defecto:** `http://localhost:3001`
- **Formato de Envío:** JSON (Content-Type: `application/json`) para cuerpos de peticiones.
- **Respuestas de Error:** Todas las respuestas de error devuelven un formato estructurado:
  ```json
  {
    "success": false,
    "message": "Descripción detallada del error"
  }
  ```

---

## Autenticación y Seguridad

La API utiliza dos mecanismos de protección independientes según la criticidad del recurso:

### 1. API Key (`x-api-key`)
Requerido por los endpoints de scrapers de anime y descarga directa de videos.
- **Vía Header (Recomendado):** `x-api-key: tu_api_key`
- **Vía Query Param:** `?apiKey=tu_api_key`
- *Nota:* Se puede deshabilitar en desarrollo configurando `DISABLE_AUTH=true` en el archivo `.env` del backend.

### 2. JWT Access Token (Bearer Token)
Requerido por las rutas de historial/favoritos de usuario y el panel de administración.
- **Formato:** `Authorization: Bearer <accessToken>`
- **Expiración:** Los tokens se actualizan llamando al endpoint `/refresh` utilizando una cookie segura (`httpOnly`) que almacena el `refreshToken`.

---

## Endpoints de Autenticación (`/api/auth`)

### `POST /api/auth/login`
Inicia sesión de usuario y devuelve el token de acceso JWT y una cookie segura de refresco.
* **Cuerpo (JSON):**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "mi_contraseña"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "username": "AnimeLover",
      "email": "usuario@ejemplo.com",
      "role": "user",
      "avatar": "avatar_1.png",
      "expires_at": null
    }
  }
  ```

### `POST /api/auth/refresh`
Genera un nuevo token de acceso JWT utilizando el Refresh Token almacenado en la cookie HTTP-Only.
* **Headers:** Requiere cookie con nombre `refresh_token`.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### `POST /api/auth/logout`
Limpia la cookie de sesión del Refresh Token en el cliente.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "message": "Sesión cerrada"
  }
  ```

### `GET /api/auth/me`
Obtiene la información del perfil del usuario actualmente autenticado.
* **Autenticación:** JWT Bearer Token.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "AnimeLover",
      "email": "usuario@ejemplo.com",
      "role": "user",
      "avatar": "avatar_1.png",
      "expires_at": null
    }
  }
  ```

---

## Endpoints de Anime y Scrapers (`/api/v1/anime` o `/api/anime1v`)

> [!NOTE]
> Todos estos endpoints (excepto `/image-proxy`) requieren autenticación mediante **API Key**.

### `GET /api/v1/anime/search`
Busca animes por texto y/o filtro de género combinando proveedores externos.
* **Parámetros Query:**
  - `q` *(opcional)*: Consulta de texto (nombre del anime).
  - `genre` *(opcional)*: Slug del género (ej. `accion`, `comedia`).
  - `domain` *(opcional)*: Dominio personalizado del scraper.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "query": "Solo Leveling",
      "genre": "",
      "results": [
        {
          "id": null,
          "title": "Solo Leveling",
          "slug": "solo-leveling",
          "url": "https://animeav1.com/anime/solo-leveling",
          "image": "http://localhost:3001/api/v1/anime/image-proxy?url=...",
          "type": "Anime",
          "year": 2024,
          "source": "animeav1"
        }
      ],
      "count": 1
    }
  }
  ```

### `GET /api/v1/anime/info`
Obtiene los detalles principales y el listado de episodios de un anime a partir de su URL externa.
* **Parámetros Query:**
  - `url` *(requerido)*: Enlace del anime en el proveedor (ej. `https://animeav1.com/anime/solo-leveling`).
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": null,
      "title": "Solo Leveling",
      "description": "En un mundo donde cazadores humanos deben...",
      "image": "https://...",
      "status": "Finalizado",
      "type": "Anime",
      "genres": ["Acción", "Fantasía"],
      "episodes": [
        {
          "id": null,
          "number": 1,
          "title": "Episodio 1",
          "url": "https://animeav1.com/ver/solo-leveling-1"
        }
      ]
    },
    "source": "animeav1"
  }
  ```

### `GET /api/v1/anime/episode`
Resuelve los servidores y enlaces incrustados de reproducción de un episodio.
* **Parámetros Query:**
  - `url` *(requerido)*: Enlace del episodio en el proveedor.
  - `includeMega` *(opcional)*: `true` o `false` para filtrar servidores de Mega.
  - `excludeServers` *(opcional)*: Lista separada por comas de servidores a excluir.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "episode": 1,
      "title": "Solo Leveling Episodio 1",
      "servers": {
        "sub": [
          { "server": "Streamwish", "url": "https://streamwish.to/e/..." },
          { "server": "Fembed", "url": "https://fembed.com/v/..." }
        ],
        "dub": []
      }
    },
    "source": "animeav1"
  }
  ```

### `GET /api/v1/anime/image-proxy`
Evita el bloqueo por hotlinking/CORS de las imágenes de proveedores externos sirviéndolas desde el servidor.
* **Autenticación:** Ninguna (Público).
* **Parámetros Query:**
  - `url` *(requerido)*: URL directa de la imagen (ej. `https://animeflv.net/uploads/animes/covers/4384.jpg`).
* **Respuesta:** Imagen original transmitida en formato binario (`image/jpeg`, `image/png`, etc.) con cabeceras de caché de 24 horas.

### `POST /api/v1/anime/download`
Crea una tarea asíncrona de descarga de un episodio al almacenamiento del servidor backend usando Puppeteer y FFmpeg.
* **Cuerpo (JSON):**
  ```json
  {
    "episodeUrl": "https://animeav1.com/ver/solo-leveling-1",
    "server": "Streamwish"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "abc-123-uuid",
      "episodeUrl": "https://...",
      "status": "pending",
      "progress": 0,
      "filename": null
    }
  }
  ```

### `GET /api/v1/anime/download/:id`
Obtiene el estado y progreso en tiempo real de una descarga en particular.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "abc-123-uuid",
      "status": "downloading",
      "progress": 45.5,
      "speed": "2.4 MB/s",
      "filename": "solo-leveling-ep1-streamwish.mp4"
    }
  }
  ```

### `POST /api/v1/anime/batch-download`
Crea una descarga en lote para múltiples episodios en cola.
* **Cuerpo (JSON):**
  ```json
  {
    "episodes": [
      { "url": "https://...", "server": "Streamwish" },
      { "url": "https://...", "server": "Streamwish" }
    ]
  }
  ```

### `GET /api/v1/anime/stream-download`
Descarga de manera directa en flujo (streaming) un episodio al navegador del cliente sin almacenarlo en el backend. Los flujos HLS (.m3u8) son recompilados automáticamente a MP4 al vuelo a través de FFmpeg.
* **Parámetros Query:**
  - `url` *(requerido)*: Enlace del episodio.
  - `server` *(opcional)*: Nombre del servidor (Streamwish, Vidhide, etc.).
  - `variant` *(opcional)*: `SUB` o `DUB`.

---

## Endpoints de Usuario (`/api/user`)

> [!IMPORTANT]
> Todos los endpoints de usuario requieren autenticación mediante **JWT Access Token**.

### `GET /api/user/favorites`
Obtiene la lista de animes guardados en favoritos por el usuario actual.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "anime_url": "https://...",
        "anime_title": "Solo Leveling",
        "anime_cover": "https://...",
        "provider": "animeav1",
        "added_at": "2026-06-18T23:00:00Z"
      }
    ]
  }
  ```

### `POST /api/user/favorites`
Agrega un anime a la lista de favoritos.
* **Cuerpo (JSON):**
  ```json
  {
    "anime_url": "https://...",
    "anime_title": "Solo Leveling",
    "anime_cover": "https://...",
    "provider": "animeav1"
  }
  ```

### `DELETE /api/user/favorites`
Elimina un anime de favoritos.
* **Cuerpo (JSON):**
  ```json
  {
    "anime_url": "https://..."
  }
  ```

### `GET /api/user/progress`
Obtiene el historial de progreso de reproducción del usuario.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 5,
        "anime_url": "https://...",
        "anime_title": "Solo Leveling",
        "anime_cover": "https://...",
        "provider": "animeav1",
        "episode_num": 1,
        "episode_url": "https://...",
        "updated_at": "2026-06-18T23:15:00Z"
      }
    ]
  }
  ```

### `POST /api/user/progress`
Guarda o actualiza el progreso de un episodio visualizado.
* **Cuerpo (JSON):**
  ```json
  {
    "anime_url": "https://...",
    "anime_title": "Solo Leveling",
    "anime_cover": "https://...",
    "provider": "animeav1",
    "episode_num": 1,
    "episode_url": "https://..."
  }
  ```

### `PATCH /api/user/profile`
Actualiza el icono de avatar del perfil del usuario.
* **Cuerpo (JSON):**
  ```json
  {
    "avatar": "avatar_3.png"
  }
  ```

### `PATCH /api/user/password`
Cambia la contraseña de acceso del usuario.
* **Cuerpo (JSON):**
  ```json
  {
    "currentPassword": "contraseña_vieja",
    "newPassword": "nueva_contraseña_123",
    "confirmPassword": "nueva_contraseña_123"
  }
  ```

---

## Endpoints de Administración (`/api/admin`)

> [!WARNING]
> Todos estos endpoints requieren que el usuario esté autenticado con el rol `admin`.

### `GET /api/admin/stats`
Obtiene estadísticas globales del uso del sitio (total usuarios, activos, registros de hoy/semana, total favoritos y progresos).
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "total_users": 150,
      "new_today": 3,
      "new_this_week": 15,
      "active_last_week": 42,
      "total_banned": 2,
      "total_favorites": 489,
      "total_progress_entries": 1250
    }
  }
  ```

### `GET /api/admin/users`
Obtiene una lista paginada de usuarios con soporte para búsqueda y filtrado.
* **Parámetros Query:**
  - `page` *(opcional, default 1)*: Número de página.
  - `limit` *(opcional, default 20)*: Cantidad de resultados.
  - `search` *(opcional)*: Búsqueda por email o nombre.
  - `filter` *(opcional)*: `banned` o `admin`.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": 2,
          "username": "Pepito",
          "email": "pepito@ejemplo.com",
          "role": "user",
          "avatar": "avatar_2.png",
          "is_banned": false,
          "created_at": "2026-05-10T12:00:00Z",
          "last_seen": "2026-06-18T19:00:00Z",
          "expires_at": "2026-12-31T23:59:59Z"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

### `POST /api/admin/users`
Registra un nuevo usuario con una duración de membresía específica.
* **Cuerpo (JSON):**
  ```json
  {
    "username": "nuevoUsuario",
    "email": "nuevo@ejemplo.com",
    "password": "passwordSegura123",
    "role": "user",
    "durationDays": 30
  }
  ```

### `PATCH /api/admin/users/:id`
Edita los detalles de un usuario existente (nombre de usuario, correo, contraseña, rol o expiración).
* **Cuerpo (JSON):**
  ```json
  {
    "username": "usuarioModificado",
    "expires_at": "2027-01-01T00:00:00Z"
  }
  ```

### `PATCH /api/admin/users/:id/ban`
Suspende a un usuario bloqueando su acceso a la plataforma.
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": { "id": 5, "username": "Spammer", "is_banned": true },
    "message": "Usuario suspendido"
  }
  ```

### `PATCH /api/admin/users/:id/unban`
Reactiva a un usuario suspendido.

### `DELETE /api/admin/users/:id`
Elimina de forma permanente un usuario y sus registros asociados del sistema.

---

## Archivos Estáticos y Descargas

El backend sirve los archivos descargados a través del disco duro de manera directa:

- **URLs de Acceso:**
  - `/downloads/:filename`
  - `/api/downloads/:filename`
- **Comportamiento:** Devuelve el archivo multimedia con cabecera `Content-Disposition: attachment` forzando la descarga local del video en el navegador del cliente.
