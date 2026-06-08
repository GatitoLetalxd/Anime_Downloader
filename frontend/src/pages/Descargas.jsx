import React, { useState, useMemo, useEffect } from 'react';
import useDescargas from '../hooks/useDescargas';
import BarraProgreso from '../components/BarraProgreso';

export const Descargas = () => {
  const { descargas, cancelarDescarga, limpiarCompletadas, agregarDescarga } = useDescargas();
  const [activeTab, setActiveTab] = useState('en-curso');
  const [fileStatuses, setFileStatuses] = useState({});

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
        total += d.speed;
      } else if (d.status === 'downloading' && d.speedText) {
        const match = d.speedText.match(/[\d.]+/);
        if (match) {
          total += parseFloat(match[0]);
        }
      }
    });
    return total > 0 ? `${total.toFixed(2)} MB/s` : '0.00 MB/s';
  }, [enCurso]);

  // Verify local file handles
  useEffect(() => {
    const verifyFiles = async () => {
      const statuses = {};
      for (const d of completadas) {
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

    if (completadas.length > 0) {
      verifyFiles();
    }
  }, [completadas]);

  const handleRequestPermission = async (d) => {
    if (!d.handle) return;
    try {
      const perm = await d.handle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await d.handle.getFile();
        setFileStatuses((prev) => ({ ...prev, [d.downloadId]: 'available' }));
      } else {
        setFileStatuses((prev) => ({ ...prev, [d.downloadId]: 'needs_permission' }));
      }
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setFileStatuses((prev) => ({ ...prev, [d.downloadId]: 'moved_or_deleted' }));
        alert('El archivo no se encontró. Posiblemente fue movido o eliminado de su ubicación original.');
      } else {
        alert(`Error al acceder al archivo: ${err.message}`);
      }
    }
  };

  const handlePlayLocal = async (d) => {
    if (!d.handle) return;
    try {
      const file = await d.handle.getFile();
      const blobUrl = URL.createObjectURL(file);
      window.open(blobUrl, '_blank');
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setFileStatuses((prev) => ({ ...prev, [d.downloadId]: 'moved_or_deleted' }));
        alert('El archivo fue movido o eliminado.');
      } else {
        alert(`No se pudo reproducir: ${err.message}`);
      }
    }
  };

  const handleRetry = async (d) => {
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
            Monitorea el progreso de tus descargas locales directas a tu equipo
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
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs text-slate-400 font-semibold">
                        <span>Tamaño: {d.size || 'Desconocido'}</span>
                        <span className="text-slate-600 mx-2">•</span>
                        <span>Completado: {new Date(d.completedAt || Date.now()).toLocaleTimeString()}</span>
                      </p>
                      {/* Status badges */}
                      {fileStatuses[d.downloadId] === 'available' && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          <svg className="w-3 h-3 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Disponible
                        </span>
                      )}
                      {fileStatuses[d.downloadId] === 'moved_or_deleted' && (
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                          <svg className="w-3 h-3 mr-1 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Archivo movido o eliminado
                        </span>
                      )}
                      {fileStatuses[d.downloadId] === 'needs_permission' && (
                        <button
                          onClick={() => handleRequestPermission(d)}
                          className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 transition-all"
                        >
                          <svg className="w-3 h-3 mr-1 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Clic para verificar archivo
                        </button>
                      )}
                      {fileStatuses[d.downloadId] === 'native' && (
                        <span className="inline-flex items-center text-[10px] font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                          <svg className="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Descargado en Navegador
                        </span>
                      )}
                    </div>
                    {d.fileName && (
                      <p className="text-[10px] text-slate-500 font-mono line-clamp-1 break-all bg-bg-primary/50 px-2 py-1 rounded border border-white/5">
                        Nombre: {d.fileName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-2 flex-shrink-0 mt-3 sm:mt-0">
                    {d.handle && fileStatuses[d.downloadId] !== 'moved_or_deleted' && (
                      <button
                        onClick={() => handlePlayLocal(d)}
                        disabled={fileStatuses[d.downloadId] === 'needs_permission'}
                        className={`px-4 py-2 w-full sm:w-auto flex items-center justify-center rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-bold transition-all shadow-md space-x-2 ${fileStatuses[d.downloadId] === 'needs_permission' ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Reproducir</span>
                      </button>
                    )}

                    {fileStatuses[d.downloadId] === 'needs_permission' && (
                      <button
                        onClick={() => handleRequestPermission(d)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Verificar archivo</span>
                      </button>
                    )}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 w-full">
                      <h4 className="text-sm font-bold text-white">{d.title}</h4>
                      <p className="text-xs text-rose-400 font-medium leading-relaxed bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10 mt-2">
                        Error: {d.error || 'Error desconocido'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRetry(d)}
                      className="px-4 py-2 w-full sm:w-auto rounded-xl bg-accent-red hover:bg-accent-red/90 text-white text-xs font-extrabold tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 flex-shrink-0"
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
