import React, { useState, useMemo, useEffect } from 'react';
import useDescargas from '../hooks/useDescargas';
import BarraProgreso from '../components/BarraProgreso';

export const Descargas = () => {
  const { descargas, cancelarDescarga, limpiarCompletadas, agregarDescarga } = useDescargas();
  const [activeTab, setActiveTab] = useState('en-curso');
  const [fileStatuses, setFileStatuses] = useState({});

  const items = Object.values(descargas);

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
        alert('El archivo no se encontró. Posiblemente fue movido o eliminado.');
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
    await agregarDescarga(d.url, d.title, {
      preferredServer: 'auto',
      excludeServer: d.failedServer || 'hls',
    });
  };

  const tabs = [
    { id: 'en-curso', name: 'En curso', count: enCurso.length },
    { id: 'completadas', name: 'Completadas', count: completadas.length },
    { id: 'con-error', name: 'Con error', count: fallidas.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-white">Administrador de Descargas</h2>
          <p className="text-xs text-slate-300 font-medium">
            Monitorea el progreso de tus descargas locales directas a tu equipo
          </p>
        </div>

        {/* Speed Stats & Clean Actions */}
        <div className="flex items-center space-x-6">
          {enCurso.length > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Velocidad Combinada
              </span>
              <span className="text-2xl font-black text-[#00f2ff] glow-cyan">
                {totalSpeed}
              </span>
            </div>
          )}

          {completadas.length > 0 && (
            <button
              onClick={limpiarCompletadas}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-[#00f2ff]/15 text-slate-300 hover:text-[#00f2ff] text-xs font-bold transition-all border border-white/10 hover:border-[#00f2ff]/40 cursor-pointer"
            >
              Limpiar completadas
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'text-[#00f2ff] border-[#00f2ff] glow-cyan'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#00f2ff]/15 border border-[#00f2ff]/30 text-[#00f2ff]">
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
            <div className="text-center py-20 bg-[#0d1f42]/70 border border-white/10 rounded-3xl text-slate-400 text-sm">
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
            <div className="text-center py-20 bg-[#0d1f42]/70 border border-white/10 rounded-3xl text-slate-400 text-sm">
              No tienes descargas completadas en esta sesión.
            </div>
          ) : (
            <div className="space-y-3">
              {completadas.map((d) => (
                <div
                  key={d.id || d.downloadId}
                  className="bg-[#0d1f42]/90 border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#00f2ff]/40 transition-all duration-200"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white line-clamp-1">{d.title}</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs text-slate-400 font-semibold">
                        <span>Tamaño: {d.size || 'Desconocido'}</span>
                        <span className="text-slate-600 mx-2">•</span>
                        <span>Completado: {new Date(d.completedAt || Date.now()).toLocaleTimeString()}</span>
                      </p>

                      {fileStatuses[d.downloadId] === 'available' && (
                        <span className="inline-flex items-center text-[10px] font-black text-[#00f2ff] bg-[#00f2ff]/10 px-2.5 py-0.5 rounded-md border border-[#00f2ff]/30">
                          ✓ Disponible
                        </span>
                      )}
                      {fileStatuses[d.downloadId] === 'moved_or_deleted' && (
                        <span className="inline-flex items-center text-[10px] font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/30">
                          ⚠ Movido o eliminado
                        </span>
                      )}
                      {fileStatuses[d.downloadId] === 'needs_permission' && (
                        <button
                          onClick={() => handleRequestPermission(d)}
                          className="inline-flex items-center text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30 transition-all"
                        >
                          🔓 Clic para verificar
                        </button>
                      )}
                      {fileStatuses[d.downloadId] === 'native' && (
                        <span className="inline-flex items-center text-[10px] font-black text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-0.5 rounded-md border border-[#38bdf8]/30">
                          Descargado por Navegador
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-2 flex-shrink-0 mt-3 sm:mt-0">
                    {d.handle && fileStatuses[d.downloadId] !== 'moved_or_deleted' && (
                      <button
                        onClick={() => handlePlayLocal(d)}
                        disabled={fileStatuses[d.downloadId] === 'needs_permission'}
                        className={`px-5 py-2.5 w-full sm:w-auto flex items-center justify-center rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black transition-all glow-cyan cursor-pointer ${fileStatuses[d.downloadId] === 'needs_permission' ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <svg className="w-4 h-4 fill-current mr-1.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Reproducir</span>
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
            <div className="text-center py-20 bg-[#0d1f42]/70 border border-white/10 rounded-3xl text-slate-400 text-sm">
              ¡Excelente! No hay descargas con error.
            </div>
          ) : (
            <div className="space-y-3">
              {fallidas.map((d) => (
                <div
                  key={d.id || d.downloadId}
                  className="bg-[#0d1f42]/90 border border-rose-500/30 p-5 rounded-2xl shadow-xl flex flex-col justify-between gap-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 w-full">
                      <h4 className="text-sm font-black text-white">{d.title}</h4>
                      <p className="text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 mt-2">
                        Error: {d.error || 'Error desconocido'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRetry(d)}
                      className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black transition-all glow-cyan flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
