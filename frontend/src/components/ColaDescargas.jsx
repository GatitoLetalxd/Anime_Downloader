import React from 'react';
import BarraProgreso from './BarraProgreso';

export const ColaDescargas = ({ descargas, onCancel, onClearCompleted }) => {
  const items = Object.values(descargas);

  const activeDownloads = items.filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'preparing'
  );

  const completedDownloads = items.filter((d) => d.status === 'completed');
  const failedDownloads = items.filter((d) => d.status === 'failed');

  return (
    <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-black text-white">Cola de Descargas</h3>
          <p className="text-xs text-slate-300 font-medium">
            {activeDownloads.length} activas en cola
          </p>
        </div>
        {completedDownloads.length > 0 && onClearCompleted && (
          <button
            onClick={onClearCompleted}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#00f2ff]/15 text-slate-300 hover:text-[#00f2ff] text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            Limpiar completadas
          </button>
        )}
      </div>

      {/* Downloads list */}
      {items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center mx-auto text-[#00f2ff]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <p className="text-sm font-black text-white">
            No hay descargas en curso
          </p>
          <p className="text-xs text-slate-400 max-w-[220px] mx-auto">
            Busca y selecciona capítulos para ver su descarga en tiempo real aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {activeDownloads.length > 0 && (
            <div className="space-y-3">
              {activeDownloads.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} onCancel={onCancel} />
              ))}
            </div>
          )}

          {failedDownloads.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                Descargas fallidas ({failedDownloads.length})
              </span>
              {failedDownloads.map((d) => (
                <BarraProgreso key={d.id || d.downloadId} descarga={d} onCancel={onCancel} />
              ))}
            </div>
          )}

          {completedDownloads.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00f2ff] block">
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
