import React, { useState, useEffect, useMemo } from 'react';
import { getAllLocalDownloads, deleteLocalDownload } from '../lib/db';

export const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileStatuses, setFileStatuses] = useState({});

  // Load combined history from IndexedDB and localStorage (legacy)
  const loadHistory = async () => {
    try {
      // 1. Load from IndexedDB
      let dbDownloads = [];
      try {
        dbDownloads = await getAllLocalDownloads();
      } catch (e) {
        console.error('Error reading from IndexedDB:', e);
      }

      // 2. Load from localStorage (legacy support)
      let lsDownloads = [];
      try {
        const raw = localStorage.getItem('anime-downloader-historial') || '[]';
        lsDownloads = JSON.parse(raw);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }

      // 3. Merge them, prioritizing IndexedDB entries (which contain file handles)
      const mergedMap = new Map();

      lsDownloads.forEach((item) => {
        if (item && item.downloadId) {
          mergedMap.set(item.downloadId, {
            ...item,
            status: item.status || 'completed',
          });
        }
      });

      dbDownloads.forEach((item) => {
        if (item && item.downloadId) {
          const existing = mergedMap.get(item.downloadId) || {};
          mergedMap.set(item.downloadId, {
            ...existing,
            ...item,
          });
        }
      });

      // Filter to display only completed or legacy completed items
      const mergedList = Array.from(mergedMap.values()).filter(
        (item) => item.status === 'completed' || !item.status
      );

      // Sort by completed date descending
      mergedList.sort((a, b) => {
        const dateA = a.completedAt || a.createdAt || 0;
        const dateB = b.completedAt || b.createdAt || 0;
        return dateB - dateA;
      });

      setHistorial(mergedList);
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  useEffect(() => {
    loadHistory();

    // Listen for storage events (e.g. from legacy updates in other windows)
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  // Verify local file handles
  useEffect(() => {
    const verifyFiles = async () => {
      const statuses = {};
      for (const d of historial) {
        if (d.handle) {
          try {
            const perm = await d.handle.queryPermission({ mode: 'read' });
            if (perm === 'granted') {
              await d.handle.getFile();
              statuses[d.downloadId] = 'available';
            } else {
              statuses[d.downloadId] = 'needs_permission';
            }
          } catch (err) {
            if (err.name === 'NotFoundError') {
              statuses[d.downloadId] = 'moved_or_deleted';
            } else {
              statuses[d.downloadId] = 'needs_permission';
            }
          }
        } else {
          statuses[d.downloadId] = 'native';
        }
      }
      setFileStatuses(statuses);
    };

    if (historial.length > 0) {
      verifyFiles();
    }
  }, [historial]);

  const handleRequestPermission = async (item) => {
    if (!item.handle) return;
    try {
      const perm = await item.handle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await item.handle.getFile();
        setFileStatuses((prev) => ({ ...prev, [item.downloadId]: 'available' }));
      } else {
        setFileStatuses((prev) => ({ ...prev, [item.downloadId]: 'needs_permission' }));
      }
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setFileStatuses((prev) => ({ ...prev, [item.downloadId]: 'moved_or_deleted' }));
        alert('El archivo no se encontró. Posiblemente fue movido o eliminado de su ubicación original.');
      } else {
        alert(`Error al acceder al archivo: ${err.message}`);
      }
    }
  };

  const handlePlayLocal = async (item) => {
    if (!item.handle) return;
    try {
      const file = await item.handle.getFile();
      const blobUrl = URL.createObjectURL(file);
      window.open(blobUrl, '_blank');
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setFileStatuses((prev) => ({ ...prev, [item.downloadId]: 'moved_or_deleted' }));
        alert('El archivo fue movido o eliminado.');
      } else {
        alert(`No se pudo reproducir: ${err.message}`);
      }
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
      // Clear localStorage
      localStorage.setItem('anime-downloader-historial', '[]');

      // Clear IndexedDB records
      try {
        const localItems = await getAllLocalDownloads();
        for (const item of localItems) {
          if (item.status === 'completed') {
            await deleteLocalDownload(item.downloadId);
          }
        }
      } catch (err) {
        console.error('Error clearing local downloads from IndexedDB:', err);
      }

      setHistorial([]);
      setFileStatuses({});
    }
  };

  const handleRemoveItem = async (downloadId) => {
    // Remove from localStorage
    try {
      const raw = localStorage.getItem('anime-downloader-historial') || '[]';
      const parsed = JSON.parse(raw);
      const next = parsed.filter((item) => item.downloadId !== downloadId);
      localStorage.setItem('anime-downloader-historial', JSON.stringify(next));
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

    // Remove from IndexedDB
    try {
      await deleteLocalDownload(downloadId);
    } catch (e) {
      console.error('Error deleting from IndexedDB:', e);
    }

    setHistorial((prev) => prev.filter((item) => item.downloadId !== downloadId));
    setFileStatuses((prev) => {
      const next = { ...prev };
      delete next[downloadId];
      return next;
    });
  };

  // Filter history
  const filteredHistorial = useMemo(() => {
    if (!searchQuery.trim()) return historial;
    const q = searchQuery.toLowerCase();
    return historial.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.fileName && item.fileName.toLowerCase().includes(q))
    );
  }, [historial, searchQuery]);

  // Compute stats
  const stats = useMemo(() => {
    let totalBytes = 0;
    historial.forEach((item) => {
      const sizeStr = String(item.size || '').toUpperCase();
      let bytes = 0;

      // Extract numeric part
      const numMatch = sizeStr.match(/[\d.]+/);
      if (numMatch) {
        const num = parseFloat(numMatch[0]);
        if (sizeStr.includes('GB')) {
          bytes = num * 1024 * 1024 * 1024;
        } else if (sizeStr.includes('MB')) {
          bytes = num * 1024 * 1024;
        } else if (sizeStr.includes('KB')) {
          bytes = num * 1024;
        } else {
          bytes = num;
        }
      }
      totalBytes += bytes;
    });

    const gb = totalBytes / (1024 * 1024 * 1024);
    return {
      episodios: historial.length,
      gb: gb.toFixed(2),
    };
  }, [historial]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left header column */}
        <div className="bg-bg-secondary border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <h2 className="text-2xl font-extrabold text-white">Historial de Descargas</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Registro acumulado de tus descargas locales guardadas en este navegador
          </p>
        </div>

        {/* Stats 1 */}
        <div className="bg-bg-secondary border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Episodios Descargados
            </span>
            <span className="text-3xl font-black text-accent-red glow-red">
              {stats.episodios}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-red/10 flex items-center justify-center text-accent-red">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Stats 2 */}
        <div className="bg-bg-secondary border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Ancho de Banda Ahorrado
            </span>
            <span className="text-3xl font-black text-accent-purple glow-purple">
              {stats.gb} <span className="text-sm font-semibold">GB</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-bg-secondary border border-white/5 p-4 rounded-xl shadow-md">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-bg-card border border-white/5 focus:border-accent-red/50 focus:outline-none text-sm text-slate-200"
          />
        </div>

        {/* Actions */}
        {historial.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/10 text-rose-400 text-xs font-bold transition-all"
          >
            Limpiar historial completo
          </button>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistorial.length === 0 ? (
          <div className="text-center py-20 bg-bg-secondary border border-white/5 rounded-2xl text-slate-500 text-sm">
            {historial.length === 0
              ? 'El historial está vacío. Comienza a descargar episodios para verlos aquí.'
              : 'No se encontraron resultados en el historial.'}
          </div>
        ) : (
          filteredHistorial.map((item) => (
            <div
              key={item.downloadId}
              className="bg-bg-secondary border border-white/5 p-4 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all duration-200"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 font-semibold flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Tamaño: {item.size || 'Desconocido'}</span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span>Descargado el: {new Date(item.completedAt || Date.now()).toLocaleDateString()} a las {new Date(item.completedAt || Date.now()).toLocaleTimeString()}</span>
                  
                  {/* Status badges without emojis */}
                  {fileStatuses[item.downloadId] === 'available' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      <svg className="w-3 h-3 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Disponible
                    </span>
                  )}
                  {fileStatuses[item.downloadId] === 'moved_or_deleted' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                      <svg className="w-3 h-3 mr-1 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Archivo movido o eliminado
                    </span>
                  )}
                  {fileStatuses[item.downloadId] === 'needs_permission' && (
                    <button
                      onClick={() => handleRequestPermission(item)}
                      className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 transition-all"
                    >
                      <svg className="w-3 h-3 mr-1 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Clic para verificar archivo
                    </button>
                  )}
                  {fileStatuses[item.downloadId] === 'native' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                      <svg className="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Descargado en Navegador
                    </span>
                  )}
                </p>
                {item.fileName && (
                  <p className="text-[10px] text-slate-500 font-mono line-clamp-1 break-all bg-bg-primary/50 px-2 py-1 rounded border border-white/5">
                    Archivo: {item.fileName}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-2 flex-shrink-0 mt-3 sm:mt-0">
                {item.handle && fileStatuses[item.downloadId] !== 'moved_or_deleted' && (
                  <button
                    onClick={() => handlePlayLocal(item)}
                    disabled={fileStatuses[item.downloadId] === 'needs_permission'}
                    className={`px-4 py-2 w-full sm:w-auto flex items-center justify-center rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-bold transition-all shadow-md space-x-2 ${fileStatuses[item.downloadId] === 'needs_permission' ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reproducir</span>
                  </button>
                )}

                {fileStatuses[item.downloadId] === 'needs_permission' && (
                  <button
                    onClick={() => handleRequestPermission(item)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Verificar archivo</span>
                  </button>
                )}

                {/* Delete from history button */}
                <button
                  onClick={() => handleRemoveItem(item.downloadId)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 text-slate-400 transition-colors duration-200 mx-auto sm:mx-0"
                  title="Eliminar del historial"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Historial;
