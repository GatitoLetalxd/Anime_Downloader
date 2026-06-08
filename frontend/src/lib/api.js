import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
if (typeof window !== 'undefined' && API_URL.includes('localhost')) {
  API_URL = API_URL.replace('localhost', window.location.hostname);
}
const API_KEY = import.meta.env.VITE_API_KEY || 'luniel_api_secure_key_2026_9b8c7d6e5a4f3c2b';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

/**
 * Returns a backend-proxied image URL to bypass anime site hotlinking protection.
 * Passes through data URIs, blob URLs, and localhost URLs unchanged.
 */
export const getProxiedImageUrl = (originalUrl) => {
  if (!originalUrl) return null;
  if (
    originalUrl.startsWith('data:') ||
    originalUrl.startsWith('blob:') ||
    originalUrl.includes('localhost') ||
    originalUrl.includes('127.0.0.1') ||
    originalUrl.includes('unsplash.com') // fallback images — don't proxy
  ) {
    return originalUrl;
  }
  return `${API_URL}/api/v1/anime/image-proxy?url=${encodeURIComponent(originalUrl)}`;
};

export const pingAPI = async () => {
  try {
    const response = await client.get('/health');
    return response.data && response.data.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export const buscarAnime = async (query, genre = '', domain = '', signal = null) => {
  try {
    const response = await client.get(`/api/v1/anime/search`, {
      params: { q: query, genre, domain },
      signal,
    });
    const backendResults = response.data?.data?.results || [];
    return backendResults.map((item) => ({
      id: item.url,
      titulo: item.title,
      url: item.url,
      imagen: item.image,
      tipo: item.type,
      año: item.year,
      source: item.source,
    }));
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Search request cancelled');
      return [];
    }
    console.error('Error searching anime:', error);
    throw error;
  }
};

export const obtenerRecomendaciones = async (domain = '') => {
  try {
    const response = await client.get(`/api/v1/anime/recommendations`, {
      params: { domain },
    });
    const backendResults = response.data?.data?.results || [];
    return backendResults.map((item) => ({
      id: item.url,
      titulo: item.title,
      url: item.url,
      imagen: item.image,
      tipo: item.type,
      año: item.year,
      source: item.source,
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

export const obtenerGeneros = async () => {
  try {
    const response = await client.get(`/api/v1/anime/genres`);
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

export const obtenerInfo = async (url, signal = null) => {
  try {
    const response = await client.get(`/api/v1/anime/info`, {
      params: { url },
      signal,
    });
    const resData = response.data?.data || {};
    return {
      titulo: resData.title || '',
      descripcion: resData.description || '',
      imagen: resData.image || '',
      generos: (resData.genres || []).map((g) => (typeof g === 'string' ? g : g.name || '')),
      episodios: (resData.episodes || []).map((e) => ({
        nombre: e.title || `Episodio ${e.number}`,
        url: e.url,
        numero: e.number,
      })),
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Info request cancelled');
      return null;
    }
    console.error('Error fetching anime info:', error);
    throw error;
  }
};

export const obtenerEnlacesEpisodio = async (url) => {
  try {
    const response = await client.get(`/api/v1/anime/episode`, {
      params: { url },
    });
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching episode links:', error);
    throw error;
  }
};

export const iniciarDescarga = async (urlEpisodio, opciones = {}) => {
  try {
    const response = await client.post(`/api/v1/anime/download`, {
      url: urlEpisodio,
      variant: opciones.variant || 'SUB',
      quality: opciones.quality || '1080p',
    });
    return response.data.data; // contains downloadId/id
  } catch (error) {
    console.error('Error initiating download:', error);
    throw error;
  }
};

export const obtenerProgreso = async (downloadId) => {
  try {
    const response = await client.get(`/api/v1/anime/download/${downloadId}`);
    return response.data.data; // contains status, progress, speed, size, error, etc.
  } catch (error) {
    console.error('Error getting download progress:', error);
    throw error;
  }
};

export default {
  pingAPI,
  buscarAnime,
  obtenerInfo,
  obtenerEnlacesEpisodio,
  iniciarDescarga,
  obtenerProgreso,
  getProxiedImageUrl,
  obtenerRecomendaciones,
  obtenerGeneros,
};
