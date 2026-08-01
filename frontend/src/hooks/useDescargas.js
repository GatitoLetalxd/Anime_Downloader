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
      if ('showSaveFilePicker' in window) {
        let handle;
        try {
          handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{
              description: 'Video MP4',
              accept: { 'video/mp4': ['.mp4'] }
            }]
          });
        } catch (pickerErr) {
          // User cancelled file picker
          if (pickerErr.name === 'AbortError') {
            return null;
          }
          throw pickerErr;
        }

        addOrUpdateDescarga(downloadId, {
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'preparing',
          progress: 0,
          handle,
          fileName: handle.name,
        });

        const response = await fetch(downloadStreamUrl);
        if (!response.ok) {
          throw new Error(`Error en el servidor (${response.status})`);
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

        const writable = await handle.createWritable();
        const reader = response.body.getReader();

        let downloadedBytes = 0;
        let lastUpdateTime = Date.now();
        let lastUpdateBytes = 0;

        addOrUpdateDescarga(downloadId, {
          status: 'downloading',
          size: totalBytes ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` : 'Desconocido',
        });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            await writable.write(value);
            downloadedBytes += value.length;

            const now = Date.now();
            const elapsed = (now - lastUpdateTime) / 1000;

            if (elapsed >= 0.5) {
              const progress = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 50;
              const bytesDiff = downloadedBytes - lastUpdateBytes;
              const speed = bytesDiff / elapsed;
              const speedMb = `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;

              addOrUpdateDescarga(downloadId, {
                progress,
                speedText: speedMb,
                downloadedBytes,
              });

              lastUpdateTime = now;
              lastUpdateBytes = downloadedBytes;
            }
          }

          await writable.close();
        } catch (streamErr) {
          try { await writable.abort(); } catch (_e) {}
          throw streamErr;
        }

        const completedData = {
          downloadId,
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'completed',
          progress: 100,
          size: `${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB`,
          completedAt: Date.now(),
          handle,
          fileName: handle.name,
        };

        addOrUpdateDescarga(downloadId, completedData);
        await saveLocalDownload(completedData);
        return downloadId;
      } else {
        // Direct browser fallback download
        addOrUpdateDescarga(downloadId, {
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'downloading',
          progress: 100,
          size: 'Nativo',
        });

        window.location.href = downloadStreamUrl;

        const completedData = {
          downloadId,
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'completed',
          progress: 100,
          size: 'Descargado',
          completedAt: Date.now(),
          handle: null,
          fileName: suggestedName,
        };

        addOrUpdateDescarga(downloadId, completedData);
        await saveLocalDownload(completedData);
        return downloadId;
      }
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
