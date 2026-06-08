import { useState } from 'react';
import { useSocket } from './useSocket';
import { saveLocalDownload } from '../lib/db';

const API_KEY = import.meta.env.VITE_API_KEY || 'luniel_api_secure_key_2026_9b8c7d6e5a4f3c2b';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useDescargas = () => {
  const { addOrUpdateDescarga, removeDescarga, clearCompleted, descargas } = useSocket();
  const [loading, setLoading] = useState(false);

  const agregarDescarga = async (urlEpisodio, nombreEpisodio, opciones = {}) => {
    // Generate a unique ID for this download
    const downloadId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (typeof window !== 'undefined' && API_URL.includes('localhost')) {
      API_URL = API_URL.replace('localhost', window.location.hostname);
    }
    const downloadStreamUrl = `${API_URL}/api/v1/anime/stream-download?url=${encodeURIComponent(urlEpisodio)}&variant=${opciones.variant || 'SUB'}&apiKey=${encodeURIComponent(API_KEY)}`;

    const slug = urlEpisodio.split('/').filter(Boolean).pop() || 'anime';
    const suggestedName = `${slug}.mp4`;

    const supportsFileAccess = 'showSaveFilePicker' in window;

    if (supportsFileAccess) {
      try {
        // Ask user where to save the file
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'Video MP4',
            accept: { 'video/mp4': ['.mp4'] }
          }]
        });

        // Initialize progress
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
          throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
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

        const completedData = {
          downloadId,
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'completed',
          progress: 100,
          size: totalBytes ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` : 'Desconocido',
          completedAt: Date.now(),
          handle,
          fileName: handle.name,
        };

        // Update in-memory state
        addOrUpdateDescarga(downloadId, completedData);

        // Save to IndexedDB
        await saveLocalDownload(completedData);

        return downloadId;
      } catch (err) {
        console.error('Local download error:', err);
        addOrUpdateDescarga(downloadId, {
          status: 'failed',
          error: err.message || 'Descarga cancelada por el usuario',
        });
        return null;
      }
    } else {
      // Fallback to standard browser download
      try {
        addOrUpdateDescarga(downloadId, {
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'downloading',
          progress: 50,
          size: 'Desconocido',
        });

        const a = document.createElement('a');
        a.href = downloadStreamUrl;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const completedData = {
          downloadId,
          title: nombreEpisodio,
          url: urlEpisodio,
          status: 'completed',
          progress: 100,
          size: 'Desconocido (Nativo)',
          completedAt: Date.now(),
          handle: null,
          fileName: suggestedName,
        };

        // Update in-memory state
        addOrUpdateDescarga(downloadId, completedData);

        // Save to IndexedDB
        await saveLocalDownload(completedData);

        return downloadId;
      } catch (err) {
        console.error('Fallback download error:', err);
        addOrUpdateDescarga(downloadId, {
          status: 'failed',
          error: err.message || 'Error en descarga nativa',
        });
        return null;
      }
    }
  };

  const agregarTodos = async (episodios, opciones = {}) => {
    setLoading(true);
    for (let i = 0; i < episodios.length; i++) {
      const ep = episodios[i];
      await agregarDescarga(ep.url, ep.nombre || `Episodio ${ep.numero}`, opciones);
      if (i < episodios.length - 1) {
        await sleep(1500);
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
