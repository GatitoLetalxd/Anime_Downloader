# LunielAnime Web — Documentación de la API del Backend

Documentación oficial de los endpoints de la API de **LunielAnime Web** (Backend v2). Incluye métodos HTTP, parámetros, requerimientos de autenticación y ejemplos de respuesta actualizados al estado real del sistema.

---

## Índice

1. [Configuración General](#configuración-general)
2. [Autenticación y Seguridad](#autenticación-y-seguridad)
3. [Endpoints de Autenticación (`/api/auth`)](#endpoints-de-autenticación-apiauth)
4. [Endpoints de Anime y Scrapers (`/api/v1/anime`)](#endpoints-de-anime-y-scrapers-apiv1anime)
5. [Endpoints de Usuario (`/api/user`)](#endpoints-de-usuario-apiuser)
6. [Endpoints de Administración (`/api/admin`)](#endpoints-de-administración-apiadmin)
7. [Archivos Estáticos y Descargas](#archivos-estáticos-y-descargas)
8. [Proveedores Soportados](#proveedores-soportados)
9. [Notas de Comportamiento](#notas-de-comportamiento)

---

## Configuración General

| Campo | Valor |
|-------|-------|
| **URL Base** | `http://localhost:3001` (dev) |
| **Formato de envío** | `application/json` |
| **Versión** | v2.0.0 |

**Formato de error estándar:**
```json
{
  "success": false,
  "message": "Descripción detallada del error"
}
```

---

## Autenticación y Seguridad

### 1. API Key (`x-api-key`)
Requerido por los endpoints de scrapers de anime (`/api/v1/anime/*` excepto `/image-proxy`).
- **Vía Header (Recomendado):** `x-api-key: tu_api_key`
- **Vía Query Param:** `?apiKey=tu_api_key`
- Deshabilitable en desarrollo con `DISABLE_AUTH=true` en `.env`.

### 2. JWT Access Token (Bearer Token)
Requerido por las rutas de usuario y administración.
- **Formato:** `Authorization: Bearer <accessToken>`
- Los tokens se actualizan llamando a `/api/auth/refresh` con la cookie `httpOnly` del refresh token.

---

## Endpoints de Autenticación (`/api/auth`)

### `POST /api/auth/login`
Inicia sesión y devuelve el access token JWT + cookie de refresco.

**Cuerpo:**
```json
{ "email": "usuario@ejemplo.com", "password": "mi_contraseña" }
```

**Respuesta (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "user": { "id": "uuid", "username": "AnimeLover", "email": "...", "role": "user", "avatar": "avatar_1.png", "expires_at": null }
}
```

### `POST /api/auth/refresh`
Genera un nuevo access token desde el refresh token en cookie `httpOnly`.

### `POST /api/auth/logout`
Limpia la cookie de sesión del refresh token.

### `GET /api/auth/me`
Obtiene el perfil del usuario autenticado (requiere JWT Bearer Token).

---

## Endpoints de Anime y Scrapers (`/api/v1/anime`)

> **Nota:** Todos estos endpoints (excepto `/image-proxy`) requieren **API Key**. También disponibles en `/api/anime1v/*` como alias.

### `GET /api/v1/anime/image-proxy`
Sirve imágenes de proveedores externos para evitar bloqueos por hotlinking/CORS. **No requiere API Key.**

**Query params:** `url` *(requerido)* — URL directa de la imagen.

**Respuesta:** Imagen binaria con caché de 24h.

---

### `GET /api/v1/anime/search`
Busca animes por texto y/o género. Combina proveedores en paralelo si `domain=all`.

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `q` | string | Nombre del anime |
| `genre` | string | Slug de género (`accion`, `isekai`, etc.) |
| `domain` | string | ID/dominio del proveedor o `all` (default) |

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "query": "Solo Leveling",
    "genre": "",
    "results": [
      {
        "id": null, "title": "Solo Leveling", "slug": "solo-leveling",
        "url": "https://tvanime.tv/anime/solo-leveling",
        "image": "https://cdn.tvanime.tv/...", "backdrop": null,
        "type": "Anime", "score": null, "status": null, "year": null, "source": "tvanime"
      }
    ],
    "count": 1
  },
  "source": "all"
}
```

---

### `GET /api/v1/anime/genres`
Devuelve la lista de géneros disponibles para filtrado.

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Acción", "slug": "accion" },
    { "name": "Isekai", "slug": "isekai" },
    { "name": "Hentai +18 (HentaiLA)", "slug": "hentaila" }
  ]
}
```

---

### `GET /api/v1/anime/info`
Obtiene metadatos completos y episodios de un anime. Usa caché en PostgreSQL (TTL: 24h).

**Query params:** `url` *(requerido)* — URL del anime en el proveedor.

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": null, "title": "Solo Leveling", "titleJapanese": null,
    "description": "En un mundo donde cazadores humanos...",
    "image": "https://cdn.tvanime.tv/...", "backdrop": null,
    "status": "Finalizado", "type": "Anime", "year": 2024,
    "startDate": null, "endDate": null, "score": 9.1, "votes": null,
    "totalEpisodes": 12, "malId": null, "trailer": null,
    "genres": [{ "id": null, "name": "Acción", "slug": "accion", "malId": null }],
    "episodes": [
      { "id": null, "number": 1, "title": "Episodio 1", "url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-1" }
    ]
  },
  "source": "tvanime"
}
```

---

### `GET /api/v1/anime/episode`
Resuelve los servidores de reproducción de un episodio. Usa caché en PostgreSQL (TTL: 4h).

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `url` | string | URL del episodio *(requerido)* |
| `includeMega` | boolean | Incluir servidores Mega |
| `excludeServers` | string | Servidores a excluir (separados por coma) |

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": null, "episode": 1, "title": "Solo Leveling Episodio 1",
    "season": null, "variants": { "SUB": 1, "DUB": 0 }, "publishedAt": null,
    "servers": {
      "sub": [
        { "server": "Mp4Upload", "url": "https://www.mp4upload.com/embed-xxx.html" },
        { "server": "Voe", "url": "https://voe.sx/e/xxx" },
        { "server": "UPNShare", "url": "https://upnshare.com/embed/xxx" }
      ],
      "dub": []
    },
    "streamLinks": { "SUB": [{ "server": "Mp4Upload", "url": "https://..." }], "DUB": [] },
    "downloadLinks": { "SUB": [], "DUB": [] }
  },
  "source": "tvanime"
}
```

---

### `GET /api/v1/anime/direct-stream`
Resuelve la URL de video directa (MP4) para el reproductor nativo sin anuncios.

> **Importante:** No soporta servidores HLS (`.m3u8`). Los descarta automáticamente.

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `url` | string | URL del episodio *(requerido)* |
| `variant` | string | `SUB` o `DUB` (default: `SUB`) |
| `server` | string | Servidor preferido |
| `excludeServer` | string | Servidor a excluir |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "directUrl": "https://s3.mp4upload.com/storage/xxx/video.mp4",
    "server": "Mp4Upload", "isHls": false, "referer": "https://www.mp4upload.com/"
  }
}
```

**Respuesta fallida (200):**
```json
{ "success": false, "message": "No se pudo resolver ningún servidor...", "data": null }
```

> Este endpoint siempre devuelve HTTP 200. El campo `success` en el cuerpo indica si se resolvió.

---

### `POST /api/v1/anime/download`
Crea una tarea asíncrona de descarga al servidor (guarda en `DOWNLOADS_DIR`).

**Cuerpo:**
```json
{
  "url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-1",
  "quality": "1080p", "variant": "SUB", "preferredServer": "auto"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc-uuid", "downloadId": "abc-uuid", "status": "queued",
    "statusUrl": "/api/v1/anime/download/abc-uuid",
    "url": "https://...", "quality": "1080p", "variant": "SUB"
  }
}
```

> **Advertencia:** Las descargas HLS están **deshabilitadas permanentemente**. Se descartan automáticamente.

---

### `GET /api/v1/anime/download/:id`
Estado y progreso de una tarea de descarga.

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc-uuid", "status": "downloading", "progress": 45,
    "url": "https://...", "quality": "1080p", "variant": "SUB",
    "downloadUrl": null, "fileSize": null,
    "sourceUrl": "https://s3.mp4upload.com/...", "currentServer": "Mp4Upload",
    "downloadedBytes": 47185920, "totalBytes": 104857600,
    "error": null, "createdAt": 1728000000000, "updatedAt": 1728000030000, "completedAt": null
  }
}
```

**Estados:** `queued` → `preparing` → `downloading` → `completed` | `failed`

---

### `POST /api/v1/anime/batch-download`
Cola de descargas para múltiples episodios.

**Cuerpo — Formato objeto (recomendado, compatible con todos los proveedores):**
```json
{
  "animeUrl": "https://tvanime.tv/anime/solo-leveling",
  "episodes": [
    { "url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-1", "number": 1 },
    { "url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-2", "number": 2 }
  ],
  "variant": "SUB", "quality": "1080p"
}
```

**Cuerpo — Formato numérico (legacy, para proveedores con URL tipo `/anime-N`):**
```json
{
  "animeUrl": "https://animeav1.com/anime/solo-leveling",
  "episodes": [1, 2, 3], "variant": "SUB"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-uuid", "status": "queued", "total": 2,
    "statusUrl": "/api/v1/anime/batch/batch-uuid",
    "items": [
      { "episode": 1, "downloadId": "uuid-1", "status": "queued" },
      { "episode": 2, "downloadId": "uuid-2", "status": "queued" }
    ]
  }
}
```

---

### `GET /api/v1/anime/batch/:id`
Estado agregado de un lote de descargas.

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-uuid", "status": "downloading", "progress": 50,
    "total": 2, "completed": 1, "failed": 0,
    "items": [
      { "episode": 1, "downloadId": "uuid-1", "status": "completed", "progress": 100, "downloadUrl": "/downloads/solo-leveling-ep1.mp4", "error": null },
      { "episode": 2, "downloadId": "uuid-2", "status": "downloading", "progress": 30, "downloadUrl": null, "error": null }
    ]
  }
}
```

---

### `GET /api/v1/anime/stream-download`
Descarga en flujo directamente hacia el navegador sin guardar en servidor.

> **Advertencia:** Los flujos HLS devuelven error HTTP 400.

**Query params:** `url` *(requerido)*, `server`, `variant`, `direct` (`1` para redirect directo al cliente).

---

## Endpoints de Usuario (`/api/user`)

> **Importante:** Todos requieren **JWT Bearer Token**.

### `GET /api/user/favorites`
Lista de animes favoritos del usuario.

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12, "anime_url": "https://tvanime.tv/anime/solo-leveling",
      "anime_title": "Solo Leveling", "anime_cover": "https://...",
      "provider": "tvanime", "added_at": "2026-10-01T23:00:00Z"
    }
  ]
}
```

### `POST /api/user/favorites`
Agrega anime a favoritos.

**Cuerpo:**
```json
{
  "anime_url": "https://tvanime.tv/anime/solo-leveling",
  "anime_title": "Solo Leveling", "anime_cover": "https://...", "provider": "tvanime"
}
```

### `DELETE /api/user/favorites`
Elimina anime de favoritos. **Cuerpo:** `{ "anime_url": "..." }`

---

### `GET /api/user/progress`
Historial de progreso de reproducción del usuario.

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5, "anime_url": "https://tvanime.tv/anime/solo-leveling",
      "anime_title": "Solo Leveling", "anime_cover": "https://...", "provider": "tvanime",
      "episode_num": 3,
      "episode_url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-3",
      "progress_seconds": 654, "duration_seconds": 1440,
      "updated_at": "2026-10-05T20:15:00Z"
    }
  ]
}
```

### `POST /api/user/progress`
Guarda o actualiza el progreso de un episodio (upsert por `user_id + anime_url`).

**Cuerpo:**
```json
{
  "anime_url": "https://tvanime.tv/anime/solo-leveling",
  "anime_title": "Solo Leveling", "anime_cover": "https://...", "provider": "tvanime",
  "episode_num": 3,
  "episode_url": "https://tvanime.tv/anime/solo-leveling/episodio/episodio-3",
  "progress_seconds": 654,
  "duration_seconds": 1440
}
```

> `progress_seconds` y `duration_seconds` permiten al reproductor reanudar desde donde se quedó.

### `DELETE /api/user/progress`
Elimina el progreso de un anime. **Cuerpo:** `{ "anime_url": "..." }`

### `PATCH /api/user/profile`
Actualiza el avatar. **Cuerpo:** `{ "avatar": "avatar_3.png" }` (formato: `avatar_N.png`).

### `PATCH /api/user/password`
Cambia la contraseña.

**Cuerpo:**
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña_123",
  "confirmPassword": "nueva_contraseña_123"
}
```

---

## Endpoints de Administración (`/api/admin`)

> **Advertencia:** Requieren autenticación con rol `admin`.

### `GET /api/admin/stats`
Estadísticas globales de uso.

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 150, "new_today": 3, "new_this_week": 15,
    "active_last_week": 42, "total_banned": 2,
    "total_favorites": 489, "total_progress_entries": 1250
  }
}
```

---

### `GET /api/admin/scraper-health`
Verifica el estado de cada proveedor de scraping en tiempo real.

**Respuesta (200):**
```json
{
  "success": true,
  "timestamp": "2026-10-05T22:00:00.000Z",
  "data": [
    { "id": "tvanime", "label": "TVAnime", "status": "healthy", "latencyMs": 843, "count": 24, "error": null },
    { "id": "animeav1", "label": "AnimeAV1", "status": "unhealthy", "latencyMs": 15001, "count": 0, "error": "ETIMEDOUT" },
    { "id": "tioanime", "label": "TioAnime", "status": "healthy", "latencyMs": 1200, "count": 18, "error": null }
  ]
}
```

**Valores de `status`:** `healthy` | `warning` (sin resultados) | `unhealthy` (error).

---

### `GET /api/admin/users`
Lista paginada de usuarios.

**Query params:** `page` (default: 1), `limit` (default: 20, máx: 50), `search`, `filter` (`banned` | `admin`).

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid", "username": "Pepito", "email": "pepito@ejemplo.com",
        "role": "user", "avatar": "avatar_2.png", "is_banned": false,
        "created_at": "2026-05-10T12:00:00Z", "last_seen": "2026-10-05T19:00:00Z",
        "expires_at": "2027-01-31T23:59:59Z"
      }
    ],
    "pagination": { "total": 150, "page": 1, "limit": 20, "pages": 8 }
  }
}
```

### `POST /api/admin/users`
Crea usuario con membresía configurable.

**Cuerpo:**
```json
{
  "username": "nuevoUsuario", "email": "nuevo@ejemplo.com",
  "password": "passwordSegura123", "role": "user", "durationDays": 30
}
```

### `PATCH /api/admin/users/:id`
Edita datos de usuario (campos parciales: `username`, `email`, `password`, `role`, `expires_at`).

### `PATCH /api/admin/users/:id/ban`
Suspende un usuario.

### `PATCH /api/admin/users/:id/unban`
Reactiva un usuario suspendido.

### `DELETE /api/admin/users/:id`
Elimina permanentemente un usuario y sus registros (favoritos, progreso).

---

## Archivos Estáticos y Descargas

| Ruta | Descripción |
|------|-------------|
| `/downloads/:filename` | Acceso directo al archivo descargado |
| `/api/downloads/:filename` | Alias alternativo |

Ambas responden con `Content-Disposition: attachment`. Archivos se purgan automáticamente cada 30 minutos si tienen más de 6 horas.

---

## Proveedores Soportados

| ID | Nombre | Dominio Principal | Estado | Servidores de Video |
|----|--------|-------------------|--------|---------------------|
| `tvanime` | TVAnime | `tvanime.tv` | ✅ Activo (default) | Mp4Upload, Voe, UPNShare |
| `animeav1` | AnimeAV1 | `animeav1.com` | ✅ Activo | UPNShare, Voe, Mp4Upload |
| `tioanime` | TioAnime | `tioanime.com` | ✅ Activo | Variado |
| `hentaila` | HentaiLA | `hentaila.com` | ✅ Activo (+18) | Variado |

**Proveedor por defecto:** TVAnime (configurable con `DEFAULT_ANIME_DOMAIN` en `.env`).

---

## Notas de Comportamiento

### Caché Persistente (PostgreSQL)
- `/info` → TTL: **24 horas**
- `/episode` → TTL: **4 horas**
- Reduce latencia de ~1.5s a <10ms en lecturas calientes.
- Filas expiradas se purgan automáticamente.

### Proxy de Imágenes
Las imágenes de portada se sirven vía `/api/v1/anime/image-proxy?url=...` para evitar CORS y restricciones de hotlinking.

### HLS Deshabilitado
Las descargas y streams HLS (`.m3u8`) están **bloqueadas permanentemente**. El sistema los descarta en la resolución de candidatos y usa el siguiente servidor MP4 disponible.

### Reproducción Nativa
`/direct-stream` resuelve la URL MP4 final para el reproductor nativo del frontend. Si ningún servidor responde, el frontend cae en fallback al iframe del servidor.

### Rate Limiting
Límite diario de requests por API Key. Configurable con variables `RATE_LIMIT_*` en `.env`.
