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
    const serverParam = opciones.preferredServer ? `&server=${encodeURIComponent(opciones.preferredServer)}` : '';
    const downloadStreamUrl = `${API_URL}/api/v1/anime/stream-download?url=${encodeURIComponent(urlEpisodio)}&variant=${opciones.variant || 'SUB'}${serverParam}&apiKey=${encodeURIComponent(API_KEY)}`;

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
        status: 'preparing',
        progress: 0,
        fileName: suggestedName,
      });

      const response = await fetch(downloadStreamUrl);
      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
      const reader = response.body.getReader();
      const chunks = [];
      let downloadedBytes = 0;
      let lastUpdateTime = Date.now();
      let lastUpdateBytes = 0;

      addOrUpdateDescarga(downloadId, {
        status: 'downloading',
        size: totalBytes ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` : 'Calculando...',
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;

        const now = Date.now();
        const elapsed = (now - lastUpdateTime) / 1000;

        if (elapsed >= 0.5) {
          const progress = totalBytes
            ? Math.round((downloadedBytes / totalBytes) * 100)
            : Math.min(95, Math.round((downloadedBytes / (35 * 1024 * 1024)) * 100));
          const bytesDiff = downloadedBytes - lastUpdateBytes;
          const speed = bytesDiff / elapsed;
          const speedMb = `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;

          addOrUpdateDescarga(downloadId, {
            progress,
            speedText: speedMb,
            downloadedBytes,
            size: `${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB`,
          });

          lastUpdateTime = now;
          lastUpdateBytes = downloadedBytes;
        }
      }

      // Combine chunks into a single video Blob
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = window.URL.createObjectURL(blob);

      // Trigger browser download dialog for the blob
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 2000);

      const completedData = {
        downloadId,
        title: nombreEpisodio,
        url: urlEpisodio,
        status: 'completed',
        progress: 100,
        size: `${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB`,
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
