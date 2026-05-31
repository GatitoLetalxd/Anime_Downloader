import React, { useState, useEffect, useMemo } from 'react';

export const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load history from localStorage
  const loadHistory = () => {
    try {
      const raw = localStorage.getItem('anime-downloader-historial') || '[]';
      setHistorial(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  useEffect(() => {
    loadHistory();

    // Listen for storage events (e.g. from useSocket in other pages)
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
      localStorage.setItem('anime-downloader-historial', '[]');
      setHistorial([]);
    }
  };

  const handleRemoveItem = (downloadId) => {
    const next = historial.filter((item) => item.downloadId !== downloadId);
    localStorage.setItem('anime-downloader-historial', JSON.stringify(next));
    setHistorial(next);
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
          // Assume bytes or fallback
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
                <p className="text-xs text-slate-400 font-semibold flex items-center space-x-3">
                  <span>Tamaño: {item.size || 'Desconocido'}</span>
                  <span className="text-slate-600">•</span>
                  <span>Descargado el: {new Date(item.completedAt).toLocaleDateString()} a las {new Date(item.completedAt).toLocaleTimeString()}</span>
                </p>
                {item.filePath && (
                  <p className="text-[10px] text-slate-500 font-mono line-clamp-1 break-all bg-bg-primary/50 px-2 py-1 rounded border border-white/5">
                    Archivo: {item.fileName} ({item.filePath})
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Delete from history button */}
                <button
                  onClick={() => handleRemoveItem(item.downloadId)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 text-slate-400 transition-colors duration-200"
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
