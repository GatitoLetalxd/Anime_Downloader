import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarAnime, obtenerInfo, getProxiedImageUrl, obtenerEnlacesEpisodio } from '../lib/api';
import AnimeCard, { SkeletonAnimeCard } from '../components/AnimeCard';
import EpisodioSelector from '../components/EpisodioSelector';
import useDescargas from '../hooks/useDescargas';

export const Buscar = () => {
  const navigate = useNavigate();
  const { agregarTodos, agregarDescarga } = useDescargas();

  // Search view states
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Episode view states
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);

  // Download selection states
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Streaming online states
  const [activeStreamingEpisode, setActiveStreamingEpisode] = useState(null);
  const [streamingInfo, setStreamingInfo] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [selectedSubDub, setSelectedSubDub] = useState('sub'); // 'sub' or 'dub'
  const [selectedServerUrl, setSelectedServerUrl] = useState('');

  const handleVerOnline = async (ep) => {
    setActiveStreamingEpisode(ep);
    setLoadingStream(true);
    setStreamingInfo(null);
    setSelectedServerUrl('');

    try {
      const data = await obtenerEnlacesEpisodio(ep.url);
      setStreamingInfo(data);

      // Choose preferred default language: sub if available, else dub
      const hasSub = data.servers?.sub && data.servers.sub.length > 0;
      const hasDub = data.servers?.dub && data.servers.dub.length > 0;
      const defaultLanguage = hasSub ? 'sub' : hasDub ? 'dub' : 'sub';
      setSelectedSubDub(defaultLanguage);

      // Select first server if available
      const availableServers = data.servers?.[defaultLanguage] || [];
      if (availableServers.length > 0) {
        setSelectedServerUrl(availableServers[0].url);
      }
    } catch (error) {
      console.error('Error loading stream links:', error);
    } finally {
      setLoadingStream(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);
    setSelectedAnime(null);
    setAnimeInfo(null);

    try {
      const data = await buscarAnime(query);
      setResults(data || []);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAnimeClick = async (anime) => {
    setSelectedAnime(anime);
    setFetchingInfo(true);
    setAnimeInfo(null);

    try {
      const data = await obtenerInfo(anime.url);
      setAnimeInfo(data);
    } catch (error) {
      console.error('Error fetching anime info:', error);
    } finally {
      setFetchingInfo(false);
    }
  };

  const triggerToastAndRedirect = (count) => {
    setToastMessage(`${count} episodio${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} a la cola de descargas.`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/descargas');
    }, 1500);
  };

  const handleDownloadSelected = async (urls) => {
    if (urls.length === 0 || !animeInfo) return;

    // Find the actual episode objects matching the selected URLs
    const episodesToDownload = animeInfo.episodios.filter((ep) =>
      urls.includes(ep.url)
    );

    // Call hook to queue download
    triggerToastAndRedirect(episodesToDownload.length);
    
    // Asynchronously trigger downloading so the redirect happens fast
    agregarTodos(episodesToDownload);
  };

  const handleDownloadAll = () => {
    if (!animeInfo || !animeInfo.episodios || animeInfo.episodios.length === 0) return;

    triggerToastAndRedirect(animeInfo.episodios.length);
    agregarTodos(animeInfo.episodios);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-premium glow-red px-6 py-4 rounded-xl flex items-center space-x-3 text-white transition-all duration-300 transform animate-bounce">
          <div className="w-8 h-8 rounded-full bg-accent-red flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* STATE 2: Anime Info & Episode Selector */}
      {selectedAnime && (
        <div className="space-y-8 animate-fade-in">
          {/* Header row */}
          <button
            onClick={() => setSelectedAnime(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a los resultados</span>
          </button>

          {fetchingInfo ? (
            <div className="glass-premium rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center justify-center py-20">
              <div className="w-40 h-56 rounded-xl skeleton" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-8 w-1/3 rounded skeleton" />
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-4 w-full rounded skeleton" />
                <div className="h-4 w-5/6 rounded skeleton" />
              </div>
            </div>
          ) : (
            animeInfo && (
              <div className="space-y-8">
                {/* Anime Details Banner */}
                <div className="glass-premium rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-2xl">
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent-red/5 blur-3xl pointer-events-none" />

                  {/* Portada */}
                  <div className="w-40 h-56 md:w-48 md:h-68 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 mx-auto md:mx-0">
                    <img
                      src={getProxiedImageUrl(selectedAnime.imagen)}
                      alt={animeInfo.titulo}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  {/* Info text */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                      {animeInfo.titulo}
                    </h2>

                    {/* Genres badges */}
                    {animeInfo.generos && animeInfo.generos.length > 0 && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {animeInfo.generos.map((gen) => (
                          <span
                            key={gen}
                            className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-semibold text-slate-300"
                          >
                            {gen}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {animeInfo.descripcion || 'Sin descripción disponible.'}
                    </p>

                    {/* Actions */}
                    {animeInfo.episodios && animeInfo.episodios.length > 0 && (
                      <div className="pt-2 flex justify-center md:justify-start">
                        <button
                          onClick={handleDownloadAll}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-red to-accent-purple hover:from-accent-red/90 hover:to-accent-purple/90 text-white text-sm font-extrabold tracking-wide transition-all duration-300 glow-red shadow-lg transform hover:scale-[1.02]"
                        >
                          Descargar todos los episodios
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Episode Selector */}
                {animeInfo.episodios && animeInfo.episodios.length > 0 ? (
                  <EpisodioSelector
                    episodios={animeInfo.episodios}
                    onSelectionChange={setSelectedUrls}
                    onDownloadSelected={handleDownloadSelected}
                    onVerOnline={handleVerOnline}
                  />
                ) : (
                  <div className="glass rounded-2xl p-10 text-center text-slate-400 text-sm">
                    No se encontraron episodios disponibles para descargar.
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* STATE 1: Search Landing */}
      {!selectedAnime && (
        <div className="space-y-12 py-10">
          {/* Main search bar */}
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Busca tu <span className="bg-gradient-to-r from-accent-red to-accent-purple bg-clip-text text-transparent">Anime</span> Favorito
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Todo corre 100% en tu máquina local. Busca, selecciona tus capítulos preferidos y descárgalos directo.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe el nombre del anime..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl bg-bg-secondary border border-white/5 focus:border-accent-red/50 focus:outline-none text-base text-slate-200 placeholder-slate-500 shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-4 rounded-2xl bg-accent-red hover:bg-accent-red/95 text-white font-extrabold text-sm tracking-wide transition-all shadow-md glow-red"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Results section */}
          {searched && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">
                Resultados de la búsqueda
              </h3>

              {searching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonAnimeCard key={i} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl text-slate-500 text-sm">
                  No se encontraron resultados para tu búsqueda. Intenta con otra palabra clave.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {results.map((anime) => (
                    <AnimeCard
                      key={anime.url}
                      anime={anime}
                      onClick={() => handleAnimeClick(anime)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    {/* Immersive Online Video Player Modal */}
    {activeStreamingEpisode && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 sm:p-6">
        <div className="relative w-full max-w-4xl glass-premium rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-bg-secondary/50">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent-blue block mb-0.5">
                Reproduciendo en Línea
              </span>
              <h3 className="text-lg font-bold text-white line-clamp-1 leading-tight">
                {animeInfo?.titulo} — {activeStreamingEpisode.nombre}
              </h3>
            </div>
            <button
              onClick={() => {
                setActiveStreamingEpisode(null);
                setStreamingInfo(null);
                setSelectedServerUrl('');
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-accent-red hover:text-white transition-colors duration-200 text-slate-400 font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {loadingStream ? (
              <div className="aspect-video w-full rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border border-white/5 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-accent-blue/30 border-t-accent-blue animate-spin" />
                <span className="text-sm font-semibold text-slate-400">Resolviendo enlaces de streaming...</span>
              </div>
            ) : streamingInfo ? (
              <div className="space-y-6">
                {/* Iframe Video Container */}
                {selectedServerUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl">
                    <iframe
                      src={selectedServerUrl}
                      title="Video Player"
                      referrerPolicy="no-referrer"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      className="absolute inset-0 w-full h-full border-none"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border border-white/5">
                    <span className="text-sm font-semibold text-slate-400">No hay servidores disponibles para este idioma.</span>
                  </div>
                )}

                {/* Player Controls (Language and Servers) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-bg-secondary/40 border border-white/5 p-4 rounded-2xl">
                  {/* Language Selector */}
                  <div className="md:col-span-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Idioma / Versión:
                    </span>
                    <div className="flex bg-bg-card p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => {
                          setSelectedSubDub('sub');
                          const subs = streamingInfo.servers?.sub || [];
                          if (subs.length > 0) setSelectedServerUrl(subs[0].url);
                          else setSelectedServerUrl('');
                        }}
                        disabled={!streamingInfo.servers?.sub || streamingInfo.servers.sub.length === 0}
                        className={`flex-1 py-2 text-xs font-extrabold uppercase rounded-lg tracking-wider transition-all duration-200 ${
                          selectedSubDub === 'sub'
                            ? 'bg-accent-blue text-white shadow-md glow-blue'
                            : 'text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500'
                        }`}
                      >
                        Subtitulado (SUB)
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubDub('dub');
                          const dubs = streamingInfo.servers?.dub || [];
                          if (dubs.length > 0) setSelectedServerUrl(dubs[0].url);
                          else setSelectedServerUrl('');
                        }}
                        disabled={!streamingInfo.servers?.dub || streamingInfo.servers.dub.length === 0}
                        className={`flex-1 py-2 text-xs font-extrabold uppercase rounded-lg tracking-wider transition-all duration-200 ${
                          selectedSubDub === 'dub'
                            ? 'bg-accent-purple text-white shadow-md glow-purple'
                            : 'text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500'
                        }`}
                      >
                        Doblado (DUB)
                      </button>
                    </div>
                  </div>

                  {/* Server List */}
                  <div className="md:col-span-8 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Servidor de Streaming:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {((streamingInfo.servers?.[selectedSubDub]) || []).map((srv, index) => {
                        const isActive = selectedServerUrl === srv.url;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedServerUrl(srv.url)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border ${
                              isActive
                                ? 'bg-accent-blue border-accent-blue/30 text-white shadow-md'
                                : 'bg-bg-card border-white/5 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {srv.server}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border border-white/5">
                <span className="text-sm font-semibold text-slate-400">Error al cargar la información de streaming de este episodio.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Buscar;
