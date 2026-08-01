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
    const downloadId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const API_URL = getApiUrl();
    const serverParam = opciones.preferredServer && opciones.preferredServer !== 'auto' ? `&server=${encodeURIComponent(opciones.preferredServer)}` : '';
    const excludeParam = opciones.excludeServer ? `&excludeServer=${encodeURIComponent(opciones.excludeServer)}` : '';
    const downloadStreamUrl = `${API_URL}/api/v1/anime/stream-download?url=${encodeURIComponent(urlEpisodio)}&variant=${opciones.variant || 'SUB'}${serverParam}${excludeParam}&apiKey=${encodeURIComponent(API_KEY)}`;

    // Build clean filename: e.g. kaguya-sama-season-3-ep1.mp4
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
        size: 'Descargando...',
        fileName: suggestedName,
      });

      // Use invisible iframe to trigger browser download attachment natively
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadStreamUrl;
      document.body.appendChild(iframe);

      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (_e) {}
      }, 60000);

      const completedData = {
        downloadId,
        title: nombreEpisodio,
        url: urlEpisodio,
        status: 'completed',
        progress: 100,
        size: 'Descargado',
        completedAt: Date.now(),
        fileName: suggestedName,
      };

      addOrUpdateDescarga(downloadId, completedData);
      await saveLocalDownload(completedData);
      return downloadId;
    } catch (err) {
      console.error('Download error:', err);
      addOrUpdateDescarga(downloadId, {
        status: 'failed',
        error: err.message || 'Error al descargar archivo',
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
