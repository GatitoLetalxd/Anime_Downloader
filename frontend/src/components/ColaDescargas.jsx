import React from 'react';
import BarraProgreso from './BarraProgreso';

export const ColaDescargas = ({ descargas, onCancel, onClearCompleted }) => {
  const items = Object.values(descargas);

  // Group downloads
  const activeDownloads = items.filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'preparing'
  );

  const completedDownloads = items.filter((d) => d.status === 'completed');
  const failedDownloads = items.filter((d) => d.status === 'failed');

  return (
    <div className="bg-bg-secondary border border-white/5 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white">Cola de Descargas</h3>
          <p className="text-xs text-slate-400 font-medium">
            {activeDownloads.length} activas en cola
          </p>
        </div>
        {completedDownloads.length > 0 && onClearCompleted && (
          <button
            onClick={onClearCompleted}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/5"
          >
            Limpiar completadas
          </button>
        )}
      </div>

      {/* Downloads list */}
      {items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            No hay descargas en curso
          </p>
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
            Busca y selecciona capítulos para ver su descarga en tiempo real aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {/* Active section */}
          {activeDownloads.length > 0 && (
            <div className="space-y-3">
              {activeDownloads.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} onCancel={onCancel} />
              ))}
            </div>
          )}

          {/* Failed section */}
          {failedDownloads.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                Descargas fallidas ({failedDownloads.length})
              </span>
              {failedDownloads.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} onCancel={onCancel} />
              ))}
            </div>
          )}

          {/* Completed section */}
          {completedDownloads.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">
                Descargas completadas ({completedDownloads.length})
              </span>
              {completedDownloads.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColaDescargas;
