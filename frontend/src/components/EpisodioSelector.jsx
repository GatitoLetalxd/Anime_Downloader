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

  // Extract numeric index for sorting and range filtering
  const processedEpisodios = useMemo(() => {
    return episodios.map((ep) => {
      // Find numbers in string like "Episodio 12", "12", "12-sub"
      const numMatch = ep.nombre.match(/\d+/);
      const number = numMatch ? parseInt(numMatch[0], 10) : ep.numero || 0;
      return {
        ...ep,
        number,
      };
    });
  }, [episodios]);

  // Filter episodes by search query
  const filteredEpisodios = useMemo(() => {
    if (!searchQuery.trim()) return processedEpisodios;
    const q = searchQuery.toLowerCase();
    return processedEpisodios.filter((ep) =>
      ep.nombre.toLowerCase().includes(q)
    );
  }, [processedEpisodios, searchQuery]);

  // Selected count helper
  const selectedCount = selectedUrls.size;

  // Toggle individual selection
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

  // Toggle select all on filtered list
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

  // Apply Range Selector
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

  // Clear range selection
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
    <div className="bg-bg-secondary border border-white/5 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-white/5 pb-5">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <input
            type="text"
            placeholder="Buscar episodio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-bg-card border border-white/5 focus:border-accent-red/50 focus:outline-none text-sm text-slate-200"
          />
        </div>

        {/* Range Selector */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Rango:</span>
          <input
            type="number"
            placeholder="Desde"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="w-16 px-2 py-2 rounded-xl bg-bg-card border border-white/5 focus:border-accent-red/50 focus:outline-none text-center text-sm text-slate-200"
          />
          <span className="text-slate-500">-</span>
          <input
            type="number"
            placeholder="Hasta"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="w-16 px-2 py-2 rounded-xl bg-bg-card border border-white/5 focus:border-accent-red/50 focus:outline-none text-center text-sm text-slate-200"
          />
          <button
            onClick={applyRangeSelection}
            className="px-3 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/80 text-white text-xs font-bold transition-all shadow-md"
          >
            Seleccionar
          </button>
          <button
            onClick={clearRangeSelection}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/5"
          >
            Desmarcar
          </button>
        </div>

        {/* Selection summary and submit */}
        <div className="md:col-span-3 flex justify-start md:justify-end items-center space-x-3 mt-2 md:mt-0">
          <span className="text-xs text-slate-400 font-semibold">
            {selectedCount} seleccionados
          </span>
          {selectedCount > 0 && (
            <button
              onClick={() => onDownloadSelected(Array.from(selectedUrls))}
              className="px-4 py-2.5 rounded-xl bg-accent-red hover:bg-accent-red/95 text-white text-xs font-extrabold tracking-wide transition-all glow-red"
            >
              Descargar
            </button>
          )}
        </div>
      </div>

      {/* Select All Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-card border border-white/5 px-4 py-3 rounded-xl gap-2">
        <label className="flex items-center space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded accent-accent-red cursor-pointer"
          />
          <span className="text-sm font-semibold text-slate-200">
            Seleccionar todo en esta vista
          </span>
        </label>
        <span className="text-xs text-slate-400">
          Mostrando {filteredEpisodios.length} de {episodios.length} episodios
        </span>
      </div>

      {/* Episode List Container */}
      <div className="max-h-[450px] overflow-y-auto pr-2 space-y-2 border border-white/5 rounded-xl p-3 bg-bg-card/50">
        {filteredEpisodios.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
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
                    ? 'bg-accent-red/5 border-accent-red/20 hover:bg-accent-red/10'
                    : 'bg-bg-card border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Controlled by outer div click
                    className="w-4 h-4 rounded accent-accent-red cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      {ep.nombre}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Número: {ep.number}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/10">
                    SUB
                  </span>
                  {onVerOnline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerOnline(ep);
                      }}
                      title="Ver Online"
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-accent-blue hover:text-white transition-colors duration-200 text-slate-400 touch-manipulation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSelected([ep.url]);
                    }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-accent-red hover:text-white transition-colors duration-200 text-slate-400 touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
