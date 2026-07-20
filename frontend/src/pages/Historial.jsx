import React, { useState, useEffect, useMemo } from 'react';
import { getAllLocalDownloads, deleteLocalDownload } from '../lib/db';

export const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileStatuses, setFileStatuses] = useState({});

  const loadHistory = async () => {
    try {
      let dbDownloads = [];
      try {
        dbDownloads = await getAllLocalDownloads();
      } catch (e) {
        console.error('Error reading from IndexedDB:', e);
      }

      let lsDownloads = [];
      try {
        const raw = localStorage.getItem('anime-downloader-historial') || '[]';
        lsDownloads = JSON.parse(raw);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }

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

      const mergedList = Array.from(mergedMap.values()).filter(
        (item) => item.status === 'completed' || !item.status
      );

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
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

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
        alert('El archivo no se encontró. Posiblemente fue movido o eliminado.');
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
      localStorage.setItem('anime-downloader-historial', '[]');
      try {
        const localItems = await getAllLocalDownloads();
        for (const item of localItems) {
          if (item.status === 'completed') {
            await deleteLocalDownload(item.downloadId);
          }
        }
      } catch (err) {
        console.error('Error clearing local downloads:', err);
      }

      setHistorial([]);
      setFileStatuses({});
    }
  };

  const handleRemoveItem = async (downloadId) => {
    try {
      const raw = localStorage.getItem('anime-downloader-historial') || '[]';
      const parsed = JSON.parse(raw);
      const next = parsed.filter((item) => item.downloadId !== downloadId);
      localStorage.setItem('anime-downloader-historial', JSON.stringify(next));
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

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

  const filteredHistorial = useMemo(() => {
    if (!searchQuery.trim()) return historial;
    const q = searchQuery.toLowerCase();
    return historial.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.fileName && item.fileName.toLowerCase().includes(q))
    );
  }, [historial, searchQuery]);

  const stats = useMemo(() => {
    let totalBytes = 0;
    historial.forEach((item) => {
      const sizeStr = String(item.size || '').toUpperCase();
      let bytes = 0;
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
        <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl flex flex-col justify-center">
          <h2 className="text-2xl font-black text-white">Historial de Descargas</h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Registro acumulado de descargas guardadas en tu equipo
          </p>
        </div>

        <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Episodios Descargados
            </span>
            <span className="text-3xl font-black text-[#00f2ff] glow-cyan">
              {stats.episodios}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/15 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Espacio Almacenado
            </span>
            <span className="text-3xl font-black text-[#38bdf8] glow-sky">
              {stats.gb} <span className="text-xs font-bold text-slate-300">GB</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0d1f42]/80 border border-white/10 p-4 rounded-2xl shadow-md">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 focus:border-[#00f2ff] focus:outline-none text-xs text-white"
          />
        </div>

        {historial.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          >
            Limpiar historial completo
          </button>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistorial.length === 0 ? (
          <div className="text-center py-20 bg-[#0d1f42]/70 border border-white/10 rounded-3xl text-slate-400 text-sm">
            {historial.length === 0
              ? 'El historial está vacío.'
              : 'No se encontraron resultados en el historial.'}
          </div>
        ) : (
          filteredHistorial.map((item) => (
            <div
              key={item.downloadId}
              className="bg-[#0d1f42]/90 border border-white/10 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#00f2ff]/40 transition-all duration-200"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="text-sm font-black text-white line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Tamaño: {item.size || 'Desconocido'}</span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span>{new Date(item.completedAt || Date.now()).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-2 flex-shrink-0">
                {item.handle && fileStatuses[item.downloadId] !== 'moved_or_deleted' && (
                  <button
                    onClick={() => handlePlayLocal(item)}
                    className="px-4 py-2 rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black transition-all glow-cyan flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <span>Reproducir</span>
                  </button>
                )}

                <button
                  onClick={() => handleRemoveItem(item.downloadId)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                  title="Eliminar del historial"
                >
                  ✕
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
