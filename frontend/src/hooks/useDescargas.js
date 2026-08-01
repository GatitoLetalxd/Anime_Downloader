import { useState } from 'react';
import { useSocket } from './useSocket';
import { saveLocalDownload } from '../lib/db';

import { getApiUrl } from '../lib/api';

const API_KEY = import.meta.env.VITE_API_KEY || 'luniel_api_secure_key_2026_9b8c7d6e5a4f3c2b';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useDescargas = () => {
  const { addOrUpdateDescarga, removeDescarga, clearCompleted, descargas } = useSocket();
  const [loading, setLoading] = useState(false);

  const agregarDescarga = async (urlEpisodio, nombreEpisodio, opciones = {}) => {
    // Generate a unique ID for this download
    const downloadId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const API_URL = getApiUrl();
    const serverParam = opciones.preferredServer ? `&server=${encodeURIComponent(opciones.preferredServer)}` : '';
    const downloadStreamUrl = `${API_URL}/api/v1/anime/stream-download?url=${encodeURIComponent(urlEpisodio)}&variant=${opciones.variant || 'SUB'}${serverParam}&apiKey=${encodeURIComponent(API_KEY)}`;

    const parts = urlEpisodio.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'anime';
    const secondLastPart = parts[parts.length - 2] || 'anime';
    let animeName = 'anime';
    let epNum = '';

    if (/^\d+$/.test(lastPart)) {
      epNum = `ep${lastPart}`;
      animeName = secondLastPart !== 'media' && secondLastPart !== 'ver' ? secondLastPart : 'anime';
    } else {
      animeName = lastPart;
    }

    const suggestedName = `${animeName}${epNum ? '-' + epNum : ''}.mp4`;

    try {
      addOrUpdateDescarga(downloadId, {
        title: nombreEpisodio,
        url: urlEpisodio,
        status: 'downloading',
        progress: 100,
        size: 'Nativo',
      });

      const a = document.createElement('a');
      a.href = downloadStreamUrl;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 1000);

      const completedData = {
        downloadId,
        title: nombreEpisodio,
        url: urlEpisodio,
        status: 'completed',
        progress: 100,
        size: 'Completado',
        completedAt: Date.now(),
        handle: null,
        fileName: suggestedName,
      };

      addOrUpdateDescarga(downloadId, completedData);
      await saveLocalDownload(completedData);

      return downloadId;
    } catch (err) {
      console.error('Download error:', err);
      addOrUpdateDescarga(downloadId, {
        status: 'failed',
        error: err.message || 'Error en descarga',
      });
      return null;
    }
  };

  const agregarTodos = async (episodios, opciones = {}) => {
    setLoading(true);
    const delayMs = episodios.length > 12 ? 3000 : 1500;
    for (let i = 0; i < episodios.length; i++) {
      const ep = episodios[i];
      await agregarDescarga(ep.url, ep.nombre || `Episodio ${ep.numero}`, opciones);
      if (i < episodios.length - 1) {
        await sleep(delayMs);
      }
    }
    setLoading(false);
  };

  const cancelarDescarga = async (downloadId) => {
    removeDescarga(downloadId);
  };

  const limpiarCompletadas = () => {
    clearCompleted();
  };

  return {
    agregarDescarga,
    agregarTodos,
    cancelarDescarga,
    limpiarCompletadas,
    descargas,
    loading,
  };
};

export default useDescargas;
