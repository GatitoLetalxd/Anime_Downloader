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

  // Abort controller refs
  const searchAbortControllerRef = useRef(null);
  const infoAbortControllerRef = useRef(null);

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
  const [selectedSubDub, setSelectedSubDub] = useState('sub');
  const [selectedServerUrl, setSelectedServerUrl] = useState('');
  const [selectedServerName, setSelectedServerName] = useState('');

  // Favorites & progress states
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  // Load genres
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

  // Parse search parameters from URL
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

  // Check favorite & progress status
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

    saveProgress(ep);

    try {
      const data = await obtenerEnlacesEpisodio(ep.url);
      setStreamingInfo(data);

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

  // Keyboard shortcuts
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

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);
  const [availableVariants, setAvailableVariants] = useState({ SUB: false, DUB: false });
  const [checkingVariants, setCheckingVariants] = useState(false);
  const [dlVariant, setDlVariant] = useState('SUB');
  const [dlServer, setDlServer] = useState('');
  const [episodeDetails, setEpisodeDetails] = useState(null);
  const [detectedServers, setDetectedServers] = useState([]);

  const openDownloadModal = async (type, urls = []) => {
    setPendingDownload({ type, urls });
    setDlVariant('SUB');
    setDlServer('');
    setEpisodeDetails(null);
    setDetectedServers([]);
    setCheckingVariants(true);
    setShowDownloadModal(true);

    // Detect available variants & servers from first episode
    try {
      const firstEp = animeInfo?.episodios?.[0];
      if (firstEp) {
        const epData = await obtenerEnlacesEpisodio(firstEp.url);
        setEpisodeDetails(epData);

        const streamSub = epData?.streamLinks?.SUB || epData?.servers?.sub || [];
        const streamDub = epData?.streamLinks?.DUB || epData?.servers?.dub || [];
        const downloadSub = epData?.downloadLinks?.SUB || [];
        const downloadDub = epData?.downloadLinks?.DUB || [];
        const variants = epData?.variants || {};

        const hasSub = !!variants.SUB || streamSub.length > 0 || downloadSub.length > 0;
        const hasDub = !!variants.DUB || streamDub.length > 0 || downloadDub.length > 0;

        setAvailableVariants({
          SUB: hasSub,
          DUB: hasDub,
        });

        if (hasDub && !hasSub) setDlVariant('DUB');
        else setDlVariant('SUB');

        // Dynamically build detected servers from actual episode links
        const serverMap = new Map();
        const allLinks = [...streamSub, ...streamDub, ...downloadSub, ...downloadDub];
        allLinks.forEach((l) => {
          if (!l || !l.server) return;
          const name = l.server.trim();
          const key = name.toLowerCase();
          if (!serverMap.has(key)) {
            let label = name;
            if (key.includes('hls')) label = 'HLS (Streaming HLS)';
            else if (key.includes('mp4upload')) label = 'MP4Upload';
            else if (key.includes('yourupload')) label = 'YourUpload';
            else if (key.includes('pdrain')) label = 'PDrain';
            else if (key.includes('1fichier')) label = '1Fichier';
            else if (key.includes('mega')) label = 'Mega';
            serverMap.set(key, { value: key, label });
          }
        });

        setDetectedServers(Array.from(serverMap.values()));
      }
    } catch (err) {
      console.error('Error checking variants:', err);
      setAvailableVariants({ SUB: true, DUB: false });
    } finally {
      setCheckingVariants(false);
    }
  };

  const serverOptions = [
    { value: '', label: 'Automático (HLS / Mejor Servidor)' },
    ...(detectedServers.length > 0
      ? detectedServers
      : [
          { value: 'hls', label: 'HLS (Streaming)' },
          { value: 'mp4upload', label: 'MP4Upload' },
          { value: 'yourupload', label: 'YourUpload' },
          { value: 'pdrain', label: 'PDrain' },
          { value: '1fichier', label: '1Fichier' },
          { value: 'mega', label: 'Mega' },
        ]),
  ];

  const isVariantAvailable = (variantKey) => {
    if (!episodeDetails) return availableVariants[variantKey];

    const stream = variantKey === 'SUB'
      ? (episodeDetails?.streamLinks?.SUB || episodeDetails?.servers?.sub || [])
      : (episodeDetails?.streamLinks?.DUB || episodeDetails?.servers?.dub || []);
    const download = variantKey === 'SUB'
      ? (episodeDetails?.downloadLinks?.SUB || [])
      : (episodeDetails?.downloadLinks?.DUB || []);

    if (!dlServer) {
      return stream.length > 0 || download.length > 0 || (variantKey === 'SUB' ? !!episodeDetails?.variants?.SUB : !!episodeDetails?.variants?.DUB);
    }

    const matchServer = (l) => (l?.server || '').toLowerCase().includes(dlServer.toLowerCase());
    return stream.some(matchServer) || download.some(matchServer);
  };

  const confirmDownload = () => {
    if (!pendingDownload || !animeInfo) return;
    setShowDownloadModal(false);

    const opciones = { variant: dlVariant };
    if (dlServer) opciones.preferredServer = dlServer;

    if (pendingDownload.type === 'all') {
      triggerToastAndRedirect(animeInfo.episodios.length);
      agregarTodos(animeInfo.episodios, opciones);
    } else {
      const episodesToDownload = animeInfo.episodios.filter((ep) =>
        pendingDownload.urls.includes(ep.url)
      );
      triggerToastAndRedirect(episodesToDownload.length);
      agregarTodos(episodesToDownload, opciones);
    }
  };

  const triggerToastAndRedirect = (count) => {
    setToastMessage(`${count} episodio${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} a la cola.`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/descargas');
    }, 1500);
  };

  const handleDownloadSelected = async (urls) => {
    if (urls.length === 0 || !animeInfo) return;
    openDownloadModal('selected', urls);
  };

  const handleDownloadAll = () => {
    if (!animeInfo || !animeInfo.episodios || animeInfo.episodios.length === 0) return;
    openDownloadModal('all');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto max-w-sm z-50 glass-premium glow-cyan px-5 py-4 rounded-2xl flex items-center space-x-3 text-white transition-all duration-300 transform animate-bounce shadow-2xl border border-[#00f2ff]/40">
          <div className="w-8 h-8 rounded-full bg-[#00f2ff] text-black flex items-center justify-center font-extrabold">
            ✓
          </div>
          <span className="text-xs font-extrabold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Download Options Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in">
          <div className="bg-[#0d1f42] border border-[#00f2ff]/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Opciones de Descarga
              </h2>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500 hover:text-white flex items-center justify-center text-slate-400 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Episode count */}
            <div className="text-xs text-slate-300 font-medium">
              {pendingDownload?.type === 'all'
                ? `Descargando todos los ${animeInfo?.episodios?.length || 0} episodios`
                : `Descargando ${pendingDownload?.urls?.length || 0} episodio(s) seleccionado(s)`
              }
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Idioma</label>
              {checkingVariants ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-4 h-4 border-2 border-t-[#00f2ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  Detectando idiomas disponibles...
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setDlVariant('SUB')}
                    disabled={!isVariantAvailable('SUB')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black tracking-wide transition-all border cursor-pointer flex items-center justify-center gap-2 ${
                      dlVariant === 'SUB'
                        ? 'bg-[#00f2ff] text-black border-[#00f2ff] glow-cyan shadow-lg'
                        : isVariantAvailable('SUB')
                          ? 'bg-[#081631] text-slate-200 border-white/10 hover:border-[#00f2ff]/50'
                          : 'bg-[#081631]/50 text-slate-500 border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>🇯🇵</span>
                    <span>Subtitulado</span>
                    {!isVariantAvailable('SUB') && <span className="text-[9px] opacity-60">(No disp.)</span>}
                  </button>

                  <button
                    onClick={() => setDlVariant('DUB')}
                    disabled={!isVariantAvailable('DUB')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black tracking-wide transition-all border cursor-pointer flex items-center justify-center gap-2 ${
                      dlVariant === 'DUB'
                        ? 'bg-[#00f2ff] text-black border-[#00f2ff] glow-cyan shadow-lg'
                        : isVariantAvailable('DUB')
                          ? 'bg-[#081631] text-slate-200 border-white/10 hover:border-[#00f2ff]/50'
                          : 'bg-[#081631]/50 text-slate-500 border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>🇪🇸</span>
                    <span>Español Latino</span>
                    {!isVariantAvailable('DUB') && <span className="text-[9px] opacity-60">(No disp.)</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Server Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Servidor de Descarga</label>
              <select
                value={dlServer}
                onChange={(e) => {
                  const val = e.target.value;
                  setDlServer(val);
                  // Ensure selected variant is available for this server
                  if (val) {
                    if (dlVariant === 'SUB' && !isVariantAvailable('SUB')) {
                      if (isVariantAvailable('DUB')) setDlVariant('DUB');
                    } else if (dlVariant === 'DUB' && !isVariantAvailable('DUB')) {
                      if (isVariantAvailable('SUB')) setDlVariant('SUB');
                    }
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#00f2ff] cursor-pointer"
              >
                {serverOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#081631] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Predeterminado: Automático (prioriza HLS / el servidor más óptimo).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all border border-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDownload}
                disabled={checkingVariants || (!isVariantAvailable('SUB') && !isVariantAvailable('DUB'))}
                className="flex-1 py-3 rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black font-black text-xs uppercase tracking-wider transition-all glow-cyan cursor-pointer disabled:opacity-50"
              >
                Iniciar Descarga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: Anime Info & Episode Selector */}
      {selectedAnime && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Back Button */}
          <button
            onClick={() => {
              setSelectedAnime(null);
              setSearchParams({});
            }}
            className="flex items-center space-x-2 text-slate-300 hover:text-[#00f2ff] transition-colors duration-200 text-xs font-black uppercase tracking-wider"
          >
            <svg className="w-4 h-4 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a los Resultados</span>
          </button>

          {fetchingInfo ? (
            <div className="glass-premium rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center justify-center py-20">
              <div className="w-40 h-56 rounded-2xl skeleton" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-8 w-1/3 rounded-xl skeleton" />
                <div className="h-4 w-2/3 rounded-xl skeleton" />
                <div className="h-4 w-full rounded-xl skeleton" />
                <div className="h-4 w-5/6 rounded-xl skeleton" />
              </div>
            </div>
          ) : (
            animeInfo && (
              <div className="space-y-8">
                {/* Anime Details Card */}
                <div className="glass-premium rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-2xl border border-[#00f2ff]/30">
                  <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#00f2ff]/10 blur-3xl pointer-events-none" />

                  {/* Poster Image */}
                  <div className="w-44 h-64 md:w-52 md:h-76 rounded-2xl overflow-hidden border border-[#00f2ff]/30 shadow-2xl flex-shrink-0 mx-auto md:mx-0 glow-cyan">
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

                  {/* Info Text */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                      {animeInfo.titulo}
                    </h2>

                    {/* Genre Badges */}
                    {animeInfo.generos && animeInfo.generos.length > 0 && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {animeInfo.generos.map((gen) => (
                          <span
                            key={gen}
                            className="px-3 py-1 rounded-xl bg-[#081631] border border-[#00f2ff]/20 text-xs font-extrabold text-[#a5f3fc]"
                          >
                            {gen}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl opacity-90">
                      {animeInfo.descripcion || 'Sin descripción disponible.'}
                    </p>

                    {/* Action Buttons */}
                    {animeInfo.episodios && animeInfo.episodios.length > 0 && (
                      <div className="pt-2 flex flex-col sm:flex-row justify-center md:justify-start gap-4 flex-wrap">
                        {/* 1. Primary Button: Empezar a Ver Online */}
                        <button
                          onClick={() => {
                            const sorted = [...animeInfo.episodios].sort((a, b) => a.numero - b.numero);
                            if (savedProgress) {
                              const epToContinue = sorted.find(ep => ep.url === savedProgress.episode_url) || sorted[0];
                              handleVerOnline(epToContinue);
                            } else if (sorted.length > 0) {
                              handleVerOnline(sorted[0]);
                            }
                          }}
                          className="px-6 py-3.5 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black tracking-wide transition-all duration-300 glow-cyan shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span>{savedProgress ? `Continuar Ep. ${savedProgress.episode_num}` : 'Empezar a Ver Online'}</span>
                        </button>

                        {/* 2. Secondary Button: Descargar todos los episodios */}
                        <button
                          onClick={handleDownloadAll}
                          className="px-6 py-3.5 rounded-2xl bg-[#081631] hover:bg-[#0d1f42] border border-[#00f2ff]/40 text-white text-xs font-black tracking-wide transition-all duration-300 shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Descargar Todos los Episodios</span>
                        </button>

                        {/* 3. Favorite Button */}
                        {isAuthenticated && (
                          <button
                            id="toggle-favorite-btn"
                            onClick={toggleFavorite}
                            disabled={favLoading}
                            className={`px-5 py-3.5 rounded-2xl border text-xs font-black tracking-wide transition-all duration-200 shadow-xl flex items-center justify-center gap-2 ${
                              isFavorite
                                ? 'bg-[#00f2ff]/20 border-[#00f2ff]/60 text-[#00f2ff] glow-cyan'
                                : 'bg-[#081631] border-white/10 text-slate-300 hover:border-[#00f2ff]/40 hover:text-[#00f2ff]'
                            } disabled:opacity-50 cursor-pointer`}
                          >
                            {favLoading ? (
                              <span className="w-4 h-4 border-2 border-t-[#00f2ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-sm">{isFavorite ? '♥' : '♡'}</span>
                            )}
                            {isFavorite ? 'En Favoritos' : 'Agregar a Favoritos'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Episode Selector Component */}
                {animeInfo.episodios && animeInfo.episodios.length > 0 ? (
                  <EpisodioSelector
                    episodios={animeInfo.episodios}
                    onSelectionChange={setSelectedUrls}
                    onDownloadSelected={handleDownloadSelected}
                    onVerOnline={handleVerOnline}
                  />
                ) : (
                  <div className="glass rounded-2xl p-10 text-center text-slate-400 text-sm">
                    No se encontraron episodios disponibles.
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* STATE 1: Main Search View */}
      {!selectedAnime && (
        <div className="space-y-12 py-8">
          
          {/* Main Search Bar Box */}
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Busca tu Anime <span className="text-gradient-cyan">Favorito</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto">
              Selecciona tus capítulos y descárgalos directo en alta calidad.
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Escribe el nombre del anime..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-2xl bg-[#081631] border border-[#00f2ff]/20 focus:border-[#00f2ff] focus:ring-2 focus:ring-[#00f2ff]/30 focus:outline-none text-sm text-white placeholder-slate-400 shadow-inner"
                />
                
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black font-black text-xs uppercase tracking-wider transition-all shadow-xl glow-cyan cursor-pointer"
                >
                  Buscar
                </button>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap gap-3 items-center justify-center text-xs">
                {/* Category Dropdown */}
                <div className="flex items-center space-x-2 bg-[#081631] border border-white/10 px-4 py-2.5 rounded-2xl">
                  <span className="text-[#00f2ff] font-extrabold uppercase tracking-wider text-[10px]">Categoría:</span>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-transparent text-slate-200 focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="" className="bg-[#081631] text-slate-200">Todas las categorías</option>
                    {genres.map((genre) => (
                      <option key={genre.slug} value={genre.slug} className="bg-[#081631] text-slate-200">
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider Dropdown */}
                <div className="flex items-center space-x-2 bg-[#081631] border border-white/10 px-4 py-2.5 rounded-2xl">
                  <span className="text-[#00f2ff] font-extrabold uppercase tracking-wider text-[10px]">Proveedor:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="bg-transparent text-slate-200 focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="all" className="bg-[#081631] text-slate-200">Todos los Proveedores</option>
                    <option value="animeav1" className="bg-[#081631] text-slate-200">AnimeAV1 (Recomendado)</option>
                    <option value="animeflv" className="bg-[#081631] text-slate-200">AnimeFLV</option>
                    <option value="tioanime" className="bg-[#081631] text-slate-200">TioAnime</option>
                    <option value="jkanime" className="bg-[#081631] text-slate-200">JKAnime</option>
                    <option value="hentaila" className="bg-[#081631] text-slate-200">HentaiLA (+18)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Results grid */}
          {searched && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <span>Resultados de la búsqueda</span>
                {results.length > 0 && (
                  <span className="text-xs font-bold text-[#00f2ff] bg-[#00f2ff]/10 px-2.5 py-0.5 rounded-full border border-[#00f2ff]/30">
                    {results.length} encontrados
                  </span>
                )}
              </h3>

              {searching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonAnimeCard key={i} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl text-slate-400 text-sm border border-white/10">
                  No se encontraron resultados para tu búsqueda. Intenta con otro término o proveedor.
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

      {/* Online Streaming Video Player Modal */}
      {activeStreamingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-0 sm:p-6">
          <div className="relative w-full h-full max-h-screen sm:max-h-[92vh] sm:max-w-4xl glass-premium border border-[#00f2ff]/30 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#081631]/80">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#00f2ff] block">
                  Reproduciendo en Línea
                </span>
                <h3 className="text-xs sm:text-base font-bold text-white line-clamp-1">
                  {animeInfo?.titulo} — {activeStreamingEpisode.nombre}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded hidden sm:inline-block border border-white/10">
                  ESC para salir
                </span>
                <button
                  onClick={() => {
                    setActiveStreamingEpisode(null);
                    setStreamingInfo(null);
                    setSelectedServerUrl('');
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-rose-500 hover:text-white transition-colors text-slate-400 font-bold"
                  title="Cerrar reproductor"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Container & Controls */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-6 space-y-4 sm:space-y-6">
              {loadingStream ? (
                <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-[#030b1e] flex flex-col justify-center items-center py-20 border-y sm:border border-white/10 space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-[#00f2ff]/30 border-t-[#00f2ff] animate-spin glow-cyan" />
                  <span className="text-xs font-extrabold text-slate-300">Resolviendo enlaces de video en vivo...</span>
                </div>
              ) : streamingInfo ? (
                <div className="space-y-4 sm:space-y-6">
                  
                  {/* Iframe */}
                  {selectedServerUrl ? (
                    <div className="relative w-full aspect-video rounded-none sm:rounded-2xl overflow-hidden bg-black border-y sm:border border-[#00f2ff]/30 shadow-2xl">
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
                    <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-[#081631] flex flex-col justify-center items-center py-20 border-y sm:border border-white/10">
                      <span className="text-xs font-bold text-slate-400">No hay servidores disponibles para esta opción.</span>
                    </div>
                  )}

                  <div className="p-4 sm:p-0 space-y-4 sm:space-y-6">
                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => handleVerOnline(sortedEpisodes[currentIdx - 1])}
                        disabled={currentIdx <= 0}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Anterior [P]</span>
                      </button>

                      <span className="text-xs font-extrabold text-[#00f2ff] bg-[#030b1e] px-3.5 py-1.5 rounded-xl border border-[#00f2ff]/20 hidden sm:inline-block">
                        Episodio {activeStreamingEpisode?.numero} de {sortedEpisodes.length}
                      </span>

                      <button
                        onClick={() => handleVerOnline(sortedEpisodes[currentIdx + 1])}
                        disabled={currentIdx === -1 || currentIdx >= sortedEpisodes.length - 1}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black transition-all disabled:opacity-30 disabled:bg-white/5 disabled:text-slate-500 glow-cyan cursor-pointer"
                      >
                        <span>Siguiente [N]</span>
                      </button>
                    </div>

                    {/* Language & Server Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-[#081631]/60 border border-white/10 p-4 rounded-2xl">
                      {/* Language */}
                      <div className="md:col-span-4 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Audio / Versión:
                        </span>
                        <div className="flex bg-[#030b1e] p-1 rounded-xl border border-white/10">
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
                            className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                              selectedSubDub === 'sub'
                                ? 'bg-[#00f2ff] text-black shadow-md glow-cyan'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Subtitulado
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
                            className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                              selectedSubDub === 'dub'
                                ? 'bg-[#38bdf8] text-black shadow-md glow-sky'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Doblado
                          </button>
                        </div>
                      </div>

                      {/* Servers */}
                      <div className="md:col-span-8 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Servidor de Video:
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
                                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                                  isActive
                                    ? 'bg-[#00f2ff] border-[#00f2ff] text-black shadow-md glow-cyan'
                                    : 'bg-[#030b1e] border-white/10 text-slate-300 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/30'
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
                <div className="aspect-video w-full rounded-none sm:rounded-2xl bg-[#081631] flex flex-col justify-center items-center py-20 border-y sm:border border-white/10">
                  <span className="text-xs font-bold text-slate-400">Error al obtener enlaces de streaming para este episodio.</span>
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
