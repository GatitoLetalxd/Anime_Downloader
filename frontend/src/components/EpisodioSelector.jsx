import React, { useState, useMemo, useEffect } from 'react';

export const EpisodioSelector = ({ episodios, onSelectionChange, onDownloadSelected, onVerOnline }) => {
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset selection when episodes change
  useEffect(() => {
    setSelectedUrls(new Set());
    setRangeStart('');
    setRangeEnd('');
  }, [episodios]);

  const processedEpisodios = useMemo(() => {
    return episodios.map((ep) => {
      const numMatch = ep.nombre.match(/\d+/);
      const number = numMatch ? parseInt(numMatch[0], 10) : ep.numero || 0;
      return {
        ...ep,
        number,
      };
    });
  }, [episodios]);

  const filteredEpisodios = useMemo(() => {
    if (!searchQuery.trim()) return processedEpisodios;
    const q = searchQuery.toLowerCase();
    return processedEpisodios.filter((ep) =>
      ep.nombre.toLowerCase().includes(q)
    );
  }, [processedEpisodios, searchQuery]);

  const selectedCount = selectedUrls.size;

  const handleToggle = (url) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedUrls(next);
    onSelectionChange(Array.from(next));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const next = new Set(selectedUrls);
      filteredEpisodios.forEach((ep) => next.add(ep.url));
      setSelectedUrls(next);
      onSelectionChange(Array.from(next));
    } else {
      const next = new Set(selectedUrls);
      filteredEpisodios.forEach((ep) => next.delete(ep.url));
      setSelectedUrls(next);
      onSelectionChange(Array.from(next));
    }
  };

  const applyRangeSelection = () => {
    const start = parseInt(rangeStart, 10);
    const end = parseInt(rangeEnd, 10);
    if (isNaN(start) || isNaN(end)) return;

    const next = new Set(selectedUrls);
    processedEpisodios.forEach((ep) => {
      if (ep.number >= start && ep.number <= end) {
        next.add(ep.url);
      }
    });
    setSelectedUrls(next);
    onSelectionChange(Array.from(next));
  };

  const clearRangeSelection = () => {
    const start = parseInt(rangeStart, 10);
    const end = parseInt(rangeEnd, 10);
    if (isNaN(start) || isNaN(end)) return;

    const next = new Set(selectedUrls);
    processedEpisodios.forEach((ep) => {
      if (ep.number >= start && ep.number <= end) {
        next.delete(ep.url);
      }
    });
    setSelectedUrls(next);
    onSelectionChange(Array.from(next));
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredEpisodios.length === 0) return false;
    return filteredEpisodios.every((ep) => selectedUrls.has(ep.url));
  }, [filteredEpisodios, selectedUrls]);

  return (
    <div className="bg-[#0d1f42]/80 border border-[#00f2ff]/30 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-white/10 pb-5">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <input
            type="text"
            placeholder="Buscar número de episodio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 focus:border-[#00f2ff] focus:outline-none text-xs text-slate-200"
          />
        </div>

        {/* Range Selector */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Rango:</span>
          <input
            type="number"
            placeholder="Desde"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="w-16 px-2.5 py-2 rounded-xl bg-[#030b1e] border border-white/10 focus:border-[#00f2ff] focus:outline-none text-center text-xs font-bold text-slate-200"
          />
          <span className="text-slate-500">-</span>
          <input
            type="number"
            placeholder="Hasta"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="w-16 px-2.5 py-2 rounded-xl bg-[#030b1e] border border-white/10 focus:border-[#00f2ff] focus:outline-none text-center text-xs font-bold text-slate-200"
          />
          <button
            onClick={applyRangeSelection}
            className="px-3.5 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#70f3ff] text-black text-xs font-black transition-all shadow-md cursor-pointer"
          >
            Seleccionar
          </button>
          <button
            onClick={clearRangeSelection}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            Desmarcar
          </button>
        </div>

        {/* Selection Summary */}
        <div className="md:col-span-3 flex justify-start md:justify-end items-center space-x-3">
          <span className="text-xs text-[#00f2ff] font-extrabold">
            {selectedCount} seleccionados
          </span>
          {selectedCount > 0 && (
            <button
              onClick={() => onDownloadSelected(Array.from(selectedUrls))}
              className="px-4 py-2.5 rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black tracking-wide transition-all glow-cyan cursor-pointer"
            >
              Descargar
            </button>
          )}
        </div>
      </div>

      {/* Select All Checkbox Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#030b1e] border border-white/10 px-4 py-3 rounded-2xl gap-2">
        <label className="flex items-center space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded accent-[#00f2ff] cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-200">
            Seleccionar todos en esta lista
          </span>
        </label>
        <span className="text-xs text-slate-400 font-medium">
          Mostrando {filteredEpisodios.length} de {episodios.length} episodios
        </span>
      </div>

      {/* Episodes List Container */}
      <div className="max-h-[460px] overflow-y-auto pr-2 space-y-2 border border-white/10 rounded-2xl p-3 bg-[#030b1e]/60">
        {filteredEpisodios.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No se encontraron episodios que coincidan con la búsqueda.
          </div>
        ) : (
          filteredEpisodios.map((ep) => {
            const isSelected = selectedUrls.has(ep.url);
            return (
              <div
                key={ep.url}
                onClick={() => handleToggle(ep.url)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#00f2ff]/15 border-[#00f2ff]/50 text-white'
                    : 'bg-[#081631] border-white/5 hover:border-[#00f2ff]/30 hover:bg-[#0d1f42]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-[#00f2ff] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-slate-200 block">
                      {ep.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Episodio #{ep.number}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20">
                    HD 1080p
                  </span>

                  {onVerOnline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerOnline(ep);
                      }}
                      title="Ver Online"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00f2ff]/10 border border-[#00f2ff]/30 hover:bg-[#00f2ff] hover:text-black transition-colors text-[#00f2ff]"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSelected([ep.url]);
                    }}
                    title="Descargar Episodio"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-[#00f2ff] hover:text-black transition-colors text-slate-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EpisodioSelector;
