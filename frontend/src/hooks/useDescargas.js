import { useState } from 'react';
import { useSocket } from './useSocket';
import { iniciarDescarga } from '../lib/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useDescargas = () => {
  const { addOrUpdateDescarga, removeDescarga, clearCompleted, descargas } = useSocket();
  const [loading, setLoading] = useState(false);

  const agregarDescarga = async (urlEpisodio, nombreEpisodio, opciones = {}) => {
    try {
      // 1. Generate local placeholder ID to show queue immediately
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      addOrUpdateDescarga(tempId, {
        title: nombreEpisodio,
        url: urlEpisodio,
        status: 'queued',
        progress: 0,
      });

      // 2. Call API to start download on backend
      const data = await iniciarDescarga(urlEpisodio, opciones);
      const downloadId = data.downloadId || data.id;

      // 3. Remove temp item and replace it with real backend download item
      removeDescarga(tempId);
      addOrUpdateDescarga(downloadId, {
        title: nombreEpisodio,
        url: urlEpisodio,
        status: data.status || 'preparing',
        progress: 0,
      });

      return downloadId;
    } catch (error) {
      console.error('Error adding single download:', error);
      // Update with error
      return null;
    }
  };

  const agregarTodos = async (episodios, opciones = {}) => {
    setLoading(true);
    // episodios: [{ nombre, url, numero }]
    for (let i = 0; i < episodios.length; i++) {
      const ep = episodios[i];
      await agregarDescarga(ep.url, ep.nombre || `Episodio ${ep.numero}`, opciones);
      
      // Delay of 1.5 seconds between each addition
      if (i < episodios.length - 1) {
        await sleep(1500);
      }
    }
    setLoading(false);
  };

  const cancelarDescarga = async (downloadId) => {
    // For local visual tracking, mark as failed/cancelled
    // In our backend, there is no cancel endpoint, so we remove/mark it locally
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
