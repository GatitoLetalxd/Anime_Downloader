import React from 'react';

export const BarraProgreso = ({ descarga, onCancel }) => {
  const { title, progress, speed, size, status, error } = descarga;

  // Visual styling helpers
  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-amber-500';
      case 'preparing':
        return 'bg-accent-purple';
      case 'downloading':
        return 'bg-accent-red';
      case 'completed':
        return 'bg-emerald-500';
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
    <div className="bg-bg-card border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300 hover:border-white/10">
      {/* Background glow on active download */}
      {status === 'downloading' && (
        <div className="absolute inset-0 bg-accent-red/2 pointer-events-none" />
      )}

      {/* Top Details Row */}
      <div className="flex justify-between items-start mb-2 space-x-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            {getStatusLabel()}
          </span>
          <h4 className="text-sm font-semibold text-white line-clamp-1">
            {title}
          </h4>
        </div>

        {/* Action button */}
        {(status === 'downloading' || status === 'queued' || status === 'preparing') && onCancel ? (
          <button
            onClick={() => onCancel(descarga.downloadId)}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-slate-400"
            title="Cancelar descarga"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : status === 'completed' ? (
          <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        ) : status === 'failed' ? (
          <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : null}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-bg-secondary h-2.5 rounded-full overflow-hidden mb-3 border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getStatusColor()} ${
            status === 'downloading' ? 'shadow-[0_0_8px_rgba(232,57,90,0.5)]' : ''
          }`}
          style={{ width: `${progress || 0}%` }}
        />
      </div>

      {/* Footer Info Row */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
        <div>
          {status === 'downloading' && (
            <span className="text-white mr-3">{progress}%</span>
          )}
          {size && <span>{size}</span>}
        </div>

        <div>
          {status === 'downloading' && speed && (
            <span className="text-accent-blue font-bold px-2 py-0.5 rounded-md bg-accent-blue/10 border border-accent-blue/10">
              {speed}
            </span>
          )}
          {status === 'completed' && (
            <span className="text-emerald-400">Completado con éxito</span>
          )}
        </div>
      </div>

      {/* Error display */}
      {status === 'failed' && error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/15 text-xs text-rose-400 font-medium leading-relaxed">
          {error}
        </div>
      )}
    </div>
  );
};

export default BarraProgreso;
