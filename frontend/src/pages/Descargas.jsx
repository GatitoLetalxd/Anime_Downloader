import React, { useState, useMemo } from 'react';
import useDescargas from '../hooks/useDescargas';
import BarraProgreso from '../components/BarraProgreso';

export const Descargas = () => {
  const { descargas, cancelarDescarga, limpiarCompletadas, agregarDescarga } = useDescargas();
  const [activeTab, setActiveTab] = useState('en-curso');

  const items = Object.values(descargas);

  // Group items
  const enCurso = useMemo(() => {
    return items.filter(
      (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'preparing'
    );
  }, [items]);

  const completadas = useMemo(() => {
    return items.filter((d) => d.status === 'completed');
  }, [items]);

  const fallidas = useMemo(() => {
    return items.filter((d) => d.status === 'failed');
  }, [items]);

  // Combined speed calculation
  const totalSpeed = useMemo(() => {
    let total = 0;
    enCurso.forEach((d) => {
      if (d.status === 'downloading' && d.speed) {
        const match = d.speed.match(/[\d.]+/);
        if (match) {
          total += parseFloat(match[0]);
        }
      }
    });
    return total > 0 ? `${total.toFixed(2)} MB/s` : '0.00 MB/s';
  }, [enCurso]);

  const handleRetry = async (d) => {
    // Retry download by starting it again
    cancelarDescarga(d.downloadId);
    await agregarDescarga(d.url, d.title);
  };

  const tabs = [
    { id: 'en-curso', name: 'En curso', count: enCurso.length },
    { id: 'completadas', name: 'Completadas', count: completadas.length },
    { id: 'con-error', name: 'Con error', count: fallidas.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-secondary border border-white/5 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Administrador de Descargas</h2>
          <p className="text-xs text-slate-400 font-medium">
            Monitorea el progreso de tus descargas locales en tiempo real
          </p>
        </div>

        {/* Speed Stats & Action */}
        <div className="flex items-center space-x-6">
          {enCurso.length > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Velocidad Combinada
              </span>
              <span className="text-xl font-black text-accent-blue glow-purple">
                {totalSpeed}
              </span>
            </div>
          )}

          {completadas.length > 0 && (
            <button
              onClick={limpiarCompletadas}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5"
            >
              Limpiar completadas
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-accent-red border-accent-red'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 border border-white/5 text-slate-300">
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'en-curso' && (
          enCurso.length === 0 ? (
            <div className="text-center py-20 bg-bg-secondary border border-white/5 rounded-2xl text-slate-500 text-sm">
              No hay descargas en curso en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enCurso.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} onCancel={cancelarDescarga} />
              ))}
            </div>
          )
        )}

        {activeTab === 'completadas' && (
          completadas.length === 0 ? (
            <div className="text-center py-20 bg-bg-secondary border border-white/5 rounded-2xl text-slate-500 text-sm">
              No tienes descargas completadas en esta sesión.
            </div>
          ) : (
            <div className="space-y-3">
              {completadas.map((d) => (
                <div
                  key={d.id || d.downloadId}
                  className="bg-bg-secondary border border-white/5 p-4 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all duration-200"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{d.title}</h4>
                    <p className="text-xs text-slate-400 font-semibold flex items-center space-x-3">
                      <span>Tamaño: {d.size || d.fileSize || 'Desconocido'}</span>
                      <span className="text-slate-600">•</span>
                      <span>Completado a las: {new Date(d.completedAt || d.updatedAt).toLocaleTimeString()}</span>
                    </p>
                    {d.filePath && (
                      <p className="text-[10px] text-slate-500 font-mono line-clamp-1 break-all bg-bg-primary/50 px-2 py-1 rounded border border-white/5">
                        Ruta: {d.filePath}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Simulated directory open button */}
                    <button
                      onClick={() => alert(`Las descargas se guardan en el directorio del servidor: ${d.filePath || 'backend/downloads'}`)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center space-x-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span>Abrir carpeta</span>
                    </button>

                    <a
                      href={d.downloadUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 ${!d.downloadUrl && 'pointer-events-none opacity-50'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Descargar archivo</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'con-error' && (
          fallidas.length === 0 ? (
            <div className="text-center py-20 bg-bg-secondary border border-white/5 rounded-2xl text-slate-500 text-sm">
              ¡Genial! No hay descargas con error.
            </div>
          ) : (
            <div className="space-y-3">
              {fallidas.map((d) => (
                <div
                  key={d.id || d.downloadId}
                  className="bg-bg-secondary border border-rose-500/10 p-4 rounded-xl shadow-md flex flex-col justify-between gap-3 hover:border-rose-500/20 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{d.title}</h4>
                      <p className="text-xs text-rose-400 font-medium leading-relaxed bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10 mt-2">
                        Error: {d.error || 'Error desconocido'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRetry(d)}
                      className="px-4 py-2 rounded-xl bg-accent-red hover:bg-accent-red/90 text-white text-xs font-extrabold tracking-wide transition-all shadow-md flex items-center space-x-2 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 9h-2.22" />
                      </svg>
                      <span>Reintentar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Descargas;
