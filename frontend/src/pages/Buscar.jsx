import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buscarAnime, obtenerInfo, getProxiedImageUrl, obtenerEnlacesEpisodio, obtenerGeneros } from '../lib/api';
import AnimeCard, { SkeletonAnimeCard } from '../components/AnimeCard';
import EpisodioSelector from '../components/EpisodioSelector';
import useDescargas from '../hooks/useDescargas';
import { useAuth } from '../contexts/AuthContext';

export const Buscar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { agregarTodos, agregarDescarga } = useDescargas();
  const { authFetch, isAuthenticated } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Abort controller refs to cancel out-of-order/stale requests
  const searchAbortControllerRef = useRef(null);
  const infoAbortControllerRef = useRef(null);

  // Abort all requests on unmount
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort();
      if (infoAbortControllerRef.current) infoAbortControllerRef.current.abort();
    };
  }, []);

  // Search view states
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [genres, setGenres] = useState([]);
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
  const [selectedServerName, setSelectedServerName] = useState('');

  // Favorites & progress states
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null); // { episode_num, episode_url }

  // 1. Load genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const list = await obtenerGeneros();
        setGenres(list || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  const handleAnimeClick = async (anime) => {
    if (infoAbortControllerRef.current) {
      infoAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    infoAbortControllerRef.current = controller;

    setSelectedAnime(anime);
    setFetchingInfo(true);
    setAnimeInfo(null);
    setIsFavorite(false);
    setSavedProgress(null);

    try {
      const data = await obtenerInfo(anime.url, controller.signal);
      if (data) {
        setAnimeInfo(data);
      }
    } catch (error) {
      console.error('Error fetching anime info:', error);
    } finally {
      if (infoAbortControllerRef.current === controller) {
        setFetchingInfo(false);
        infoAbortControllerRef.current = null;
      }
    }
  };

  // 2. Parse search parameters on mount or URL change
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const genreParam = searchParams.get('genre');
    const providerParam = searchParams.get('provider');
    const qParam = searchParams.get('q');

    if (urlParam) {
      handleAnimeClick({ url: urlParam, imagen: '' });
      return;
    }

    if (genreParam || providerParam || qParam) {
      if (qParam) setQuery(qParam);
      if (genreParam) setSelectedGenre(genreParam);
      if (providerParam) setSelectedProvider(providerParam);

      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;

      const runAutoSearch = async () => {
        setSearching(true);
        setSearched(true);
        setSelectedAnime(null);
        setAnimeInfo(null);
        try {
          const data = await buscarAnime(qParam || '', genreParam || '', providerParam || 'all', controller.signal);
          if (searchAbortControllerRef.current === controller) {
            setResults(data || []);
          }
        } catch (error) {
          console.error('Error in auto search:', error);
        } finally {
          if (searchAbortControllerRef.current === controller) {
            setSearching(false);
            searchAbortControllerRef.current = null;
          }
        }
      };
      runAutoSearch();
    }
  }, [searchParams]);

  // Check favorite & progress status when animeInfo loads
  useEffect(() => {
    if (!isAuthenticated || !selectedAnime?.url) return;

    const checkStatus = async () => {
      try {
        const [favRes, progRes] = await Promise.all([
          authFetch(`${API_BASE}/api/user/favorites`),
          authFetch(`${API_BASE}/api/user/progress`),
        ]);
        const favData = await favRes.json();
        const progData = await progRes.json();

        if (favData.success) {
          setIsFavorite(favData.data.some((f) => f.anime_url === selectedAnime.url));
        }
        if (progData.success) {
          const prog = progData.data.find((p) => p.anime_url === selectedAnime.url);
          setSavedProgress(prog || null);
        }
      } catch (_err) {
        // silent
      }
    };

    if (animeInfo) checkStatus();
  }, [animeInfo, selectedAnime?.url, isAuthenticated, authFetch, API_BASE]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated || !selectedAnime || !animeInfo) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await authFetch(`${API_BASE}/api/user/favorites`, {
          method: 'DELETE',
          body: JSON.stringify({ anime_url: selectedAnime.url }),
        });
        setIsFavorite(false);
      } else {
        await authFetch(`${API_BASE}/api/user/favorites`, {
          method: 'POST',
          body: JSON.stringify({
            anime_url: selectedAnime.url,
            anime_title: animeInfo.titulo,
            anime_cover: animeInfo.imagen || selectedAnime.imagen,
            provider: selectedAnime.provider,
          }),
        });
        setIsFavorite(true);
      }
    } finally {
      setFavLoading(false);
    }
  }, [isAuthenticated, isFavorite, selectedAnime, animeInfo, authFetch, API_BASE]);

  // Save watch progress
  const saveProgress = useCallback(async (ep) => {
    if (!isAuthenticated || !selectedAnime || !animeInfo) return;
    try {
      await authFetch(`${API_BASE}/api/user/progress`, {
        method: 'POST',
        body: JSON.stringify({
          anime_url: selectedAnime.url,
          anime_title: animeInfo.titulo,
          anime_cover: animeInfo.imagen || selectedAnime.imagen,
          provider: selectedAnime.provider,
          episode_num: ep.numero,
          episode_url: ep.url,
        }),
      });
      setSavedProgress({ episode_num: ep.numero, episode_url: ep.url });
    } catch (_err) {
      // silent
    }
  }, [isAuthenticated, selectedAnime, animeInfo, authFetch, API_BASE]);

  const sortedEpisodes = animeInfo?.episodios
    ? [...animeInfo.episodios].sort((a, b) => a.numero - b.numero)
    : [];
  const currentIdx = sortedEpisodes.findIndex(ep => ep.url === activeStreamingEpisode?.url);

  const handleVerOnline = useCallback(async (ep) => {
    if (!ep) return;
    setActiveStreamingEpisode(ep);
    setLoadingStream(true);
    setStreamingInfo(null);
    setSelectedServerUrl('');

    // Save progress automatically when user starts watching
    saveProgress(ep);

    try {
      const data = await obtenerEnlacesEpisodio(ep.url);
      setStreamingInfo(data);

      // Choose language, trying to preserve existing selected option
      const hasSub = data.servers?.sub && data.servers.sub.length > 0;
      const hasDub = data.servers?.dub && data.servers.dub.length > 0;
      
      let finalLang = selectedSubDub;
      if (finalLang === 'sub' && !hasSub && hasDub) {
        finalLang = 'dub';
      } else if (finalLang === 'dub' && !hasDub && hasSub) {
        finalLang = 'sub';
      } else if (!hasSub && !hasDub) {
        finalLang = 'sub';
      }
      setSelectedSubDub(finalLang);

      // Choose server, trying to preserve existing server name
      const availableServers = data.servers?.[finalLang] || [];
      if (availableServers.length > 0) {
        const matchingServer = availableServers.find(srv => srv.server === selectedServerName);
        if (matchingServer) {
          setSelectedServerUrl(matchingServer.url);
        } else {
          setSelectedServerUrl(availableServers[0].url);
          setSelectedServerName(availableServers[0].server);
        }
      }
    } catch (error) {
      console.error('Error loading stream links:', error);
    } finally {
      setLoadingStream(false);
    }
  }, [saveProgress, selectedSubDub, selectedServerName]);

  // Listen to keyboard shortcuts for player modal
  useEffect(() => {
    if (!activeStreamingEpisode) return;

    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInput) return;

      if (e.key === 'Escape') {
        setActiveStreamingEpisode(null);
        setStreamingInfo(null);
        setSelectedServerUrl('');
      } else if (e.key.toLowerCase() === 'n') {
        if (currentIdx !== -1 && currentIdx < sortedEpisodes.length - 1) {
          handleVerOnline(sortedEpisodes[currentIdx + 1]);
        }
      } else if (e.key.toLowerCase() === 'p') {
        if (currentIdx > 0) {
          handleVerOnline(sortedEpisodes[currentIdx - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStreamingEpisode, currentIdx, sortedEpisodes, handleVerOnline]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() && !selectedGenre) return;

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setSearching(true);
    setSearched(true);
    setSelectedAnime(null);
    setAnimeInfo(null);

    // Sync searchParams with browser address bar
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedProvider !== 'all') params.provider = selectedProvider;
    setSearchParams(params);

    try {
      const data = await buscarAnime(query.trim(), selectedGenre, selectedProvider, controller.signal);
      if (searchAbortControllerRef.current === controller) {
        setResults(data || []);
      }
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      if (searchAbortControllerRef.current === controller) {
        setSearching(false);
        searchAbortControllerRef.current = null;
      }
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto max-w-sm z-50 glass-premium glow-red px-4 sm:px-6 py-4 rounded-xl flex items-center space-x-3 text-white transition-all duration-300 transform animate-bounce shadow-2xl">
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
            onClick={() => {
              setSelectedAnime(null);
              setSearchParams({});
            }}
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
                      src={getProxiedImageUrl(animeInfo?.imagen || selectedAnime.imagen)}
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
                      <div className="pt-2 flex flex-col sm:flex-row justify-center md:justify-start gap-4 flex-wrap">
                        <button
                          onClick={handleDownloadAll}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-red to-accent-purple hover:from-accent-red/90 hover:to-accent-purple/90 text-white text-sm font-extrabold tracking-wide transition-all duration-300 glow-red shadow-lg transform hover:scale-[1.02]"
                        >
                          Descargar todos los episodios
                        </button>
                        <button
                          onClick={() => {
                            // If there's saved progress, continue from that episode; otherwise start from beginning
                            const sorted = [...animeInfo.episodios].sort((a, b) => a.numero - b.numero);
                            if (savedProgress) {
                              const epToContinue = sorted.find(ep => ep.url === savedProgress.episode_url) || sorted[0];
                              handleVerOnline(epToContinue);
                            } else if (sorted.length > 0) {
                              handleVerOnline(sorted[0]);
                            }
                          }}
                          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-extrabold tracking-wide transition-all duration-300 shadow-lg transform hover:scale-[1.02] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-accent-red" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span>{savedProgress ? `Continuar Ep. ${savedProgress.episode_num}` : 'Empezar a Ver Online'}</span>
                        </button>

                        {/* Favorite button */}
                        {isAuthenticated && (
                          <button
                            id="toggle-favorite-btn"
                            onClick={toggleFavorite}
                            disabled={favLoading}
                            className={`px-5 py-3 rounded-xl border text-sm font-extrabold tracking-wide transition-all duration-200 shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                              isFavorite
                                ? 'bg-accent-red/20 border-accent-red/50 text-accent-red hover:bg-accent-red/30'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:border-accent-red/40 hover:text-accent-red'
                            } disabled:opacity-50`}
                          >
                            {favLoading ? (
                              <span className="w-4 h-4 border-2 border-t-accent-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-base">{isFavorite ? '♥' : '♡'}</span>
                            )}
                            {isFavorite ? 'En Favoritos' : 'Agregar a Favoritos'}
                          </button>
                        )}
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
              Selecciona tus capítulos preferidos y descárgalos directo.
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Escribe el nombre del anime..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-2xl bg-bg-secondary border border-white/5 focus:border-accent-red/50 focus:outline-none text-base text-slate-200 placeholder-slate-500 shadow-inner"
                />
                
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl bg-accent-red hover:bg-accent-red/95 text-white font-extrabold text-sm tracking-wide transition-all shadow-md glow-red"
                >
                  Buscar
                </button>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap gap-3 items-center justify-center text-xs">
                {/* Genre Selector */}
                <div className="flex items-center space-x-2 bg-bg-secondary border border-white/5 px-4 py-2 rounded-2xl shadow-inner">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Categoría:</span>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="" className="bg-bg-secondary text-slate-200">Todas las categorías</option>
                    {genres.map((genre) => (
                      <option key={genre.slug} value={genre.slug} className="bg-bg-secondary text-slate-200">
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider Selector */}
                <div className="flex items-center space-x-2 bg-bg-secondary border border-white/5 px-4 py-2 rounded-2xl shadow-inner">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Proveedor:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="all" className="bg-bg-secondary text-slate-200">Todos los Proveedores</option>
                    <option value="animeav1" className="bg-bg-secondary text-slate-200">AnimeAV1 (Recomendado)</option>
                    <option value="animeflv" className="bg-bg-secondary text-slate-200">AnimeFLV</option>
                    <option value="tioanime" className="bg-bg-secondary text-slate-200">TioAnime</option>
                    <option value="jkanime" className="bg-bg-secondary text-slate-200">JKAnime</option>
                    <option value="hentaila" className="bg-bg-secondary text-slate-200">HentaiLA (+18)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Results section */}
          {searched && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">
                Resultados de la búsqueda
              </h3>

              {searching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonAnimeCard key={i} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl text-slate-500 text-sm">
                  No se encontraron resultados para tu búsqueda. Intenta con otra palabra clave.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-0 sm:p-6">
          <div className="relative w-full h-full max-h-screen sm:max-h-[90vh] sm:max-w-4xl glass-premium rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex justify-between items-center bg-bg-secondary/50">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-accent-blue block mb-0.5">
                  Reproduciendo en Línea
                </span>
                <h3 className="text-sm sm:text-lg font-bold text-white line-clamp-1 leading-tight">
                  {animeInfo?.titulo} — {activeStreamingEpisode.nombre}
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded hidden sm:inline-block">ESC</span>
                <button
                  onClick={() => {
                    setActiveStreamingEpisode(null);
                    setStreamingInfo(null);
                    setSelectedServerUrl('');
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-accent-red hover:text-white transition-colors duration-200 text-slate-400 font-bold"
                  title="Cerrar reproductor (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-6 space-y-4 sm:space-y-6">
              {loadingStream ? (
                <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border-y sm:border border-white/5 space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-accent-blue/30 border-t-accent-blue animate-spin" />
                  <span className="text-sm font-semibold text-slate-400">Resolviendo enlaces de streaming...</span>
                </div>
              ) : streamingInfo ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Iframe Video Container */}
                  {selectedServerUrl ? (
                    <div className="relative w-full aspect-video rounded-none sm:rounded-2xl overflow-hidden bg-black border-y sm:border border-white/5 shadow-2xl">
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
                    <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border-y sm:border border-white/5">
                      <span className="text-sm font-semibold text-slate-400">No hay servidores disponibles para este idioma.</span>
                    </div>
                  )}

                  {/* Player controls: Navigation & Server Info wrapped in mobile padding */}
                  <div className="p-4 sm:p-0 space-y-4 sm:space-y-6">
                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => handleVerOnline(sortedEpisodes[currentIdx - 1])}
                        disabled={currentIdx <= 0}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed cursor-pointer"
                        title="Episodio Anterior (P)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Anterior [P]</span>
                      </button>

                      <span className="text-xs font-semibold text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 hidden sm:inline-block">
                        Episodio {activeStreamingEpisode?.numero} de {sortedEpisodes.length}
                      </span>

                      <button
                        onClick={() => handleVerOnline(sortedEpisodes[currentIdx + 1])}
                        disabled={currentIdx === -1 || currentIdx >= sortedEpisodes.length - 1}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-red to-accent-purple hover:from-accent-red/90 hover:to-accent-purple/90 text-white text-xs font-bold transition-all duration-200 disabled:opacity-30 disabled:from-white/5 disabled:to-white/5 disabled:border-white/10 disabled:cursor-not-allowed glow-red shadow-lg cursor-pointer"
                        title="Siguiente Episodio (N)"
                      >
                        <span>Siguiente [N]</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Language and Servers Grid */}
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
                              if (subs.length > 0) {
                                const matchingServer = subs.find(srv => srv.server === selectedServerName);
                                if (matchingServer) {
                                  setSelectedServerUrl(matchingServer.url);
                                } else {
                                  setSelectedServerUrl(subs[0].url);
                                  setSelectedServerName(subs[0].server);
                                }
                              } else {
                                setSelectedServerUrl('');
                              }
                            }}
                            disabled={!streamingInfo.servers?.sub || streamingInfo.servers.sub.length === 0}
                            className={`flex-1 py-2 text-xs font-extrabold uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer ${selectedSubDub === 'sub'
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
                              if (dubs.length > 0) {
                                const matchingServer = dubs.find(srv => srv.server === selectedServerName);
                                if (matchingServer) {
                                  setSelectedServerUrl(matchingServer.url);
                                } else {
                                  setSelectedServerUrl(dubs[0].url);
                                  setSelectedServerName(dubs[0].server);
                                }
                              } else {
                                setSelectedServerUrl('');
                              }
                            }}
                            disabled={!streamingInfo.servers?.dub || streamingInfo.servers.dub.length === 0}
                            className={`flex-1 py-2 text-xs font-extrabold uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer ${selectedSubDub === 'dub'
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
                                onClick={() => {
                                  setSelectedServerUrl(srv.url);
                                  setSelectedServerName(srv.server);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border cursor-pointer ${isActive
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
                </div>
              ) : (
                <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-bg-secondary flex flex-col justify-center items-center py-20 border-y sm:border border-white/5">
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
