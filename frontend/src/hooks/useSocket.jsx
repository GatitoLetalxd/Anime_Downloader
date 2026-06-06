import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [descargas, setDescargas] = useState({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (typeof window !== 'undefined' && API_URL.includes('localhost')) {
      API_URL = API_URL.replace('localhost', window.location.hostname);
    }
    
    // Connect to WebSocket
    const socket = io(API_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket.io connected to backend');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.io disconnected from backend');
    });

    // Listen to download progress
    socket.on('descarga:progreso', (data) => {
      setDescargas((prev) => {
        const current = prev[data.downloadId] || {};
        return {
          ...prev,
          [data.downloadId]: {
            ...current,
            id: data.downloadId,
            downloadId: data.downloadId,
            status: 'downloading',
            progress: data.porcentaje,
            speed: data.velocidad,
            size: data.tamaño,
            updatedAt: Date.now(),
          },
        };
      });
    });

    // Listen to download complete
    socket.on('descarga:completa', (data) => {
      setDescargas((prev) => {
        const current = prev[data.downloadId] || {};
        
        // Add to localStorage history
        try {
          const rawHistorial = localStorage.getItem('anime-downloader-historial') || '[]';
          const historial = JSON.parse(rawHistorial);
          
          if (!historial.some(item => item.downloadId === data.downloadId)) {
            const historyItem = {
              downloadId: data.downloadId,
              title: current.title || data.nombreArchivo || 'Episodio de Anime',
              fileName: data.nombreArchivo,
              filePath: data.ruta,
              size: current.size || 'Desconocido',
              completedAt: Date.now(),
            };
            historial.push(historyItem);
            localStorage.setItem('anime-downloader-historial', JSON.stringify(historial));
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {
          console.error('Error saving to history localStorage', e);
        }

        return {
          ...prev,
          [data.downloadId]: {
            ...current,
            id: data.downloadId,
            downloadId: data.downloadId,
            status: 'completed',
            progress: 100,
            filePath: data.ruta,
            fileName: data.nombreArchivo,
            completedAt: Date.now(),
          },
        };
      });
    });

    // Listen to download error
    socket.on('descarga:error', (data) => {
      setDescargas((prev) => {
        const current = prev[data.downloadId] || {};
        return {
          ...prev,
          [data.downloadId]: {
            ...current,
            id: data.downloadId,
            downloadId: data.downloadId,
            status: 'failed',
            progress: 0,
            error: data.mensaje,
            updatedAt: Date.now(),
          },
        };
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const addOrUpdateDescarga = (downloadId, initialData) => {
    setDescargas((prev) => ({
      ...prev,
      [downloadId]: {
        id: downloadId,
        downloadId,
        progress: 0,
        status: 'queued',
        createdAt: Date.now(),
        ...prev[downloadId],
        ...initialData,
      },
    }));
  };

  const removeDescarga = (downloadId) => {
    setDescargas((prev) => {
      const copy = { ...prev };
      delete copy[downloadId];
      return copy;
    });
  };

  const clearCompleted = () => {
    setDescargas((prev) => {
      const active = {};
      Object.entries(prev).forEach(([id, item]) => {
        if (item.status !== 'completed' && item.status !== 'failed') {
          active[id] = item;
        }
      });
      return active;
    });
  };

  return (
    <SocketContext.Provider value={{ descargas, connected, addOrUpdateDescarga, removeDescarga, clearCompleted }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
