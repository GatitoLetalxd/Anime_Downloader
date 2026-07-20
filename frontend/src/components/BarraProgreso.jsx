import React from 'react';

export const BarraProgreso = ({ descarga, onCancel }) => {
  const { title, progress, speed, speedText, size, status, error } = descarga;

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-amber-400';
      case 'preparing':
        return 'bg-[#38bdf8]';
      case 'downloading':
        return 'bg-[#00f2ff] shadow-[0_0_12px_#00f2ff]';
      case 'completed':
        return 'bg-[#00f2ff]';
      case 'failed':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'queued':
        return 'En Cola';
      case 'preparing':
        return 'Preparando enlace...';
      case 'downloading':
        return 'Descargando';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/20 p-4 rounded-2xl shadow-xl relative overflow-hidden transition-all duration-300 hover:border-[#00f2ff]/40">
      {status === 'downloading' && (
        <div className="absolute inset-0 bg-[#00f2ff]/5 pointer-events-none" />
      )}

      {/* Top Details Row */}
      <div className="flex justify-between items-start mb-2 space-x-3">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00f2ff] block mb-0.5">
            {getStatusLabel()}
          </span>
          <h4 className="text-xs font-bold text-white line-clamp-1">
            {title}
          </h4>
        </div>

        {(status === 'downloading' || status === 'queued' || status === 'preparing') && onCancel ? (
          <button
            onClick={() => onCancel(descarga.downloadId)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-400"
            title="Cancelar descarga"
          >
            ✕
          </button>
        ) : status === 'completed' ? (
          <span className="w-6 h-6 rounded-full bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center font-bold text-xs">
            ✓
          </span>
        ) : status === 'failed' ? (
          <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
            ✕
          </span>
        ) : null}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#030b1e] h-2.5 rounded-full overflow-hidden mb-3 border border-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress || 0}%` }}
        />
      </div>

      {/* Footer Info Row */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
        <div>
          {status === 'downloading' && (
            <span className="text-white mr-3 font-extrabold">{progress}%</span>
          )}
          {size && <span>{size}</span>}
        </div>

        <div>
          {status === 'downloading' && (speed || speedText) && (
            <span className="text-[#00f2ff] font-black px-2.5 py-0.5 rounded-md bg-[#00f2ff]/10 border border-[#00f2ff]/30">
              {speed || speedText}
            </span>
          )}
          {status === 'completed' && (
            <span className="text-[#00f2ff] font-bold">Descarga finalizada</span>
          )}
        </div>
      </div>

      {/* Error display */}
      {status === 'failed' && error && (
        <div className="mt-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-bold leading-relaxed">
          {error}
        </div>
      )}
    </div>
  );
};

export default BarraProgreso;
