import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerRecomendaciones, obtenerGeneros, getProxiedImageUrl, getAdultContentState, toggleAdultContentState } from '../lib/api';
import AnimeCard, { SkeletonAnimeCard } from '../components/AnimeCard';
import { useAuth } from '../contexts/AuthContext';

export const Inicio = () => {
  const navigate = useNavigate();
  const { authFetch, isAuthenticated } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // State
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeProvider, setActiveProvider] = useState('animeav1');
  const [showAdultWarning, setShowAdultWarning] = useState(false);
  const [continueWatching, setContinueWatching] = useState([]);
  const [showAdultContent, setShowAdultContent] = useState(getAdultContentState);

  useEffect(() => {
    const handleAdultToggle = (e) => {
      setShowAdultContent(e.detail !== undefined ? e.detail : getAdultContentState());
    };
    window.addEventListener('luniel_adult_toggle', handleAdultToggle);
    return () => window.removeEventListener('luniel_adult_toggle', handleAdultToggle);
  }, []);

  // Fetch data
  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [recomData, genreData] = await Promise.all([
          obtenerRecomendaciones(activeProvider),
          obtenerGeneros()
        ]);
        setRecommendations(recomData || []);
        setGenres(genreData || []);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [activeProvider]);

  // Fetch continue watching for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProgress = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/user/progress`);
        const data = await res.json();
        if (data.success) {
          setContinueWatching(data.data.slice(0, 6));
        }
      } catch (_err) {
        // silent
      }
    };
    fetchProgress();
  }, [isAuthenticated, authFetch, API_BASE]);

  // Autoplay slider
  useEffect(() => {
    if (recommendations.length <= 1) return;
    setCurrentSlide(0);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(recommendations.length, 5));
    }, 4500);
    return () => clearInterval(timer);
  }, [recommendations]);

  const handleGenreClick = (genre) => {
    if (genre.slug === 'hentaila') {
      setShowAdultWarning(true);
    } else {
      navigate(`/buscar?genre=${genre.slug}`);
    }
  };

  const confirmAdultContent = () => {
    setShowAdultWarning(false);
    navigate('/buscar?genre=hentaila&provider=hentaila');
  };

  const featuredAnime = recommendations.slice(0, 5);
  const activeFeatured = featuredAnime[currentSlide];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 relative">
      
      {/* 18+ Adult Content Warning Modal */}
      {showAdultWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md glass-premium border border-rose-500/40 rounded-3xl overflow-hidden shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500 flex items-center justify-center mx-auto text-rose-400 font-extrabold text-2xl animate-pulse">
              18+
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Advertencia de Contenido
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estás a punto de acceder a contenido explícito (+18) hospedado en HentaiLA.
                ¿Confirmas que tienes la edad legal para ver este contenido?
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowAdultWarning(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold transition-all text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdultContent}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold transition-all text-xs shadow-lg shadow-rose-500/30"
              >
                Confirmar e Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Featured Slider */}
      {loading ? (
        <div className="w-full h-[460px] md:h-[420px] rounded-3xl skeleton" />
      ) : featuredAnime.length > 0 ? (
        <div className="relative w-full min-h-[620px] md:min-h-0 md:h-[430px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-[#00f2ff]/30 glow-cyan-lg bg-[#081631]">
          
          {/* Background image blur */}
          <div className="absolute inset-0 select-none overflow-hidden z-0">
            <img
              src={getProxiedImageUrl(activeFeatured?.imagen)}
              alt={activeFeatured?.titulo}
              className="w-full h-full object-cover filter blur-xl brightness-[0.25] scale-110 transition-all duration-1000 ease-out"
              referrerPolicy="no-referrer"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030b1e] via-[#030b1e]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030b1e]/95 via-[#030b1e]/70 to-transparent hidden md:block" />
          </div>

          {/* Slide Content */}
          <div className="relative w-full flex-1 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-end justify-between z-10 pb-12 md:pb-8">
            
            {/* Info */}
            <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left max-w-2xl order-2 md:order-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-[#00f2ff]/15 border border-[#00f2ff]/40 text-[10px] md:text-xs font-black text-[#00f2ff] tracking-wider uppercase">
                  ⚡ {activeFeatured?.tipo || 'Destacado'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[10px] font-extrabold text-[#38bdf8]">
                  {activeFeatured?.año || 'HD 1080p'}
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                {activeFeatured?.titulo}
              </h2>

              <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed opacity-90">
                {activeFeatured?.descripcion || 'Mira los episodios disponibles, ficha técnica y descarga directa en alta definición.'}
              </p>

              <div className="pt-2 flex justify-center md:justify-start gap-4">
                <button
                  onClick={() => navigate(`/buscar?url=${encodeURIComponent(activeFeatured.url)}`)}
                  className="px-6 py-3 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs md:text-sm font-black tracking-wide transition-all duration-300 glow-cyan shadow-xl transform hover:scale-[1.03] flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Ver Detalles y Episodios</span>
                </button>
              </div>
            </div>

            {/* Poster cover */}
            <div className="w-48 h-68 sm:w-56 sm:h-80 md:w-56 md:h-80 rounded-2xl overflow-hidden border border-[#00f2ff]/30 shadow-2xl transform hover:scale-[1.03] transition-transform duration-300 flex-shrink-0 order-1 md:order-2 glow-cyan">
              <img
                src={getProxiedImageUrl(activeFeatured?.imagen)}
                alt={activeFeatured?.titulo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                decoding="async"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
                }}
              />
            </div>
          </div>

          {/* Slider Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
            {featuredAnime.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-8 bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* 2. Continuar Viendo Section */}
      {isAuthenticated && continueWatching.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00f2ff]/15 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff]">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">Continuar Viendo</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-36 cursor-pointer group"
                onClick={() => navigate(`/buscar?url=${encodeURIComponent(item.anime_url)}`)}
              >
                <div className="relative w-36 h-52 rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-2 group-hover:border-[#00f2ff]/50 transition-all">
                  {item.anime_cover ? (
                    <img
                      src={getProxiedImageUrl(item.anime_cover)}
                      alt={item.anime_title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0d1f42] flex items-center justify-center">
                      <span className="text-3xl">🎌</span>
                    </div>
                  )}

                  {/* Episode badge */}
                  <div className="absolute bottom-2 right-2 bg-[#030b1e]/90 border border-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-black px-2 py-0.5 rounded-md">
                    Ep. {item.episode_num}
                  </div>

                  {/* Cyber Play Overlay */}
                  <div className="absolute inset-0 bg-[#030b1e]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#00f2ff] text-black flex items-center justify-center shadow-[0_0_15px_#00f2ff]">
                      <svg className="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-300 truncate group-hover:text-[#00f2ff] transition-colors">
                  {item.anime_title}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Popular Categories Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center space-x-2.5 tracking-wide">
            <svg className="w-5 h-5 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Explorar Categorías</span>
          </h3>

          {/* Red toggle button (+ / -) without text */}
          <button
            onClick={() => {
              const next = toggleAdultContentState();
              setShowAdultContent(next);
            }}
            title={showAdultContent ? "Ocultar +18" : "Mostrar +18"}
            className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-lg flex items-center justify-center transition-all duration-200 shadow-md border border-rose-400/40 cursor-pointer"
          >
            {showAdultContent ? '−' : '+'}
          </button>
        </div>

        <div className="flex md:flex-wrap gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {genres.length === 0 ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-24 h-9 rounded-xl skeleton flex-shrink-0 snap-start" />
            ))
          ) : (
            genres
              .filter((genre) => showAdultContent || (genre.slug !== 'hentaila' && genre.slug !== 'hentai'))
              .map((genre) => {
                const isAdult = genre.slug === 'hentaila' || genre.slug === 'hentai';
                return (
                  <button
                    key={genre.slug}
                    onClick={() => handleGenreClick(genre)}
                    className={`flex-shrink-0 snap-start px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 border ${
                      isAdult
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50'
                        : 'bg-[#0d1f42]/70 border-white/10 text-slate-300 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/40 hover:text-white hover:scale-105'
                    }`}
                  >
                    {genre.name}
                    {isAdult && <span className="ml-1.5 text-[9px] font-black tracking-wide bg-rose-500 text-white px-1.5 py-0.5 rounded">18+</span>}
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* 4. Recommendations & Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center space-x-2.5 tracking-wide">
              <svg className="w-6 h-6 text-[#00f2ff] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Recomendados y Cartelera</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Catálogo actualizado directamente desde los servidores principales.
            </p>
          </div>

          {/* Provider selector tab */}
          <div className="flex bg-[#081631] border border-white/10 p-1.5 rounded-2xl self-end">
            <button
              onClick={() => setActiveProvider('animeav1')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl tracking-wider transition-all ${
                activeProvider === 'animeav1'
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AnimeAV1
            </button>
            <button
              onClick={() => setActiveProvider('animeflv')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl tracking-wider transition-all ${
                activeProvider === 'animeflv'
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AnimeFLV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonAnimeCard key={i} />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl text-slate-400 text-sm">
            No se pudieron cargar recomendaciones en este momento. Intenta cambiar de proveedor arriba.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {recommendations.slice(5).map((anime) => (
              <AnimeCard
                key={anime.url}
                anime={anime}
                onClick={() => navigate(`/buscar?url=${encodeURIComponent(anime.url)}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Android App Promo Banner */}
      <div className="glass-premium rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between relative overflow-hidden shadow-2xl border border-[#00f2ff]/30">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#00f2ff]/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-left">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#00f2ff]/15 border border-[#00f2ff]/30 flex items-center justify-center shrink-0 shadow-lg glow-cyan">
            <svg className="w-8 h-8 md:w-9 md:h-9 text-[#00f2ff] fill-current" viewBox="0 0 24 24">
              <path d="M16.62 19.14l1.54 2.66c.16.27.06.61-.21.77-.27.16-.61.06-.77-.21l-1.56-2.7c-2.32.9-4.92.9-7.24 0l-1.56 2.7c-.16.27-.5.37-.77.21-.27-.16-.37-.5-.21-.77l1.54-2.66C3.99 16.71 2 13.58 2 10h20c0 3.58-1.99 6.71-4.38 9.14zM7 7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm10 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" />
            </svg>
          </div>
          
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-lg font-black text-white tracking-wide">
              Disfruta LunielAnime en tu móvil Android
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descarga la app oficial para Android: navegación ultrarrápida, descargas directas en segundo plano y reproducción en alta definición.
            </p>
          </div>
        </div>

        <a
          href="/LunielAnime.apk"
          download
          className="px-6 py-3 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black text-xs font-black tracking-wide transition-all duration-300 shadow-xl glow-cyan flex items-center space-x-2 shrink-0 transform hover:scale-[1.03]"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          <span>Descargar APK</span>
        </a>
      </div>

    </div>
  );
};

export default Inicio;
