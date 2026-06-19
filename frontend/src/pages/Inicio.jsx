import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerRecomendaciones, obtenerGeneros, getProxiedImageUrl } from '../lib/api';
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

  // Fetch data
  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [recomData, genreData] = await Promise.all([
          obtenerRecomendaciones(activeProvider),
          obtenerGeneros()
        ]);
        // Backend now returns shuffled results from random catalog pages
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
          // Show max 6 most recently watched
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
    setCurrentSlide(0); // Reset index on data change
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(recommendations.length, 5));
    }, 4000); // 4 seconds for a more active page feel
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

  // Get the current slide anime info
  const featuredAnime = recommendations.slice(0, 5);
  const activeFeatured = featuredAnime[currentSlide];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 relative">
      {/* 18+ Warning Modal */}
      {showAdultWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md glass-premium border border-accent-red/20 rounded-3xl overflow-hidden shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red flex items-center justify-center mx-auto text-accent-red font-extrabold text-2xl animate-pulse">
              18+
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Advertencia de Contenido
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Estás a punto de acceder a contenido explícito para adultos (+18) hospedado en HentaiLA.
                ¿Confirmas que tienes la edad legal necesaria en tu país para ver este contenido?
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowAdultWarning(false)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-bold transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdultContent}
                className="flex-1 py-3.5 rounded-2xl bg-accent-red hover:bg-accent-red/90 text-white font-extrabold transition-all text-sm shadow-lg glow-red"
              >
                Confirmar e Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Featured Section / Slider */}
      {loading ? (
        <div className="w-full h-[460px] md:h-[420px] rounded-3xl skeleton" />
      ) : featuredAnime.length > 0 ? (
        <div className="relative w-full min-h-[620px] md:min-h-0 md:h-[420px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Slide image background */}
          <div className="absolute inset-0 select-none overflow-hidden z-0">
            <img
              src={getProxiedImageUrl(activeFeatured?.imagen)}
              alt={activeFeatured?.titulo}
              className="w-full h-full object-cover object-center filter blur-xl brightness-[0.20] scale-110 transition-all duration-1000 ease-out"
              referrerPolicy="no-referrer"
              decoding="async"
            />
            {/* Dark gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-transparent to-transparent hidden md:block" />
          </div>

          {/* Slide content */}
          <div className="relative w-full flex-1 p-5 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-center md:justify-between z-10 pb-12 md:pb-8">
            {/* Info */}
            <div className="flex-1 space-y-2.5 md:space-y-4 text-center md:text-left max-w-2xl order-2 md:order-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent-red/10 border border-accent-red/25 text-[10px] md:text-xs font-bold text-accent-red tracking-wider uppercase">
                {activeFeatured?.tipo || 'Destacado'}
              </span>
              <h2 className="text-xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                {activeFeatured?.titulo}
              </h2>
              <p className="text-[11px] md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed opacity-90">
                {activeFeatured?.descripcion || 'Haz clic en el botón de abajo para ver la ficha técnica, los episodios disponibles y comenzar la descarga directa de esta excelente serie en alta definición.'}
              </p>
              <div className="pt-1 md:pt-2 flex justify-center md:justify-start gap-4">
                <button
                  onClick={() => navigate(`/buscar?url=${encodeURIComponent(activeFeatured.url)}`)}
                  className="px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-accent-red to-accent-purple hover:from-accent-red/90 hover:to-accent-purple/90 text-white text-[11px] md:text-sm font-extrabold tracking-wide transition-all duration-300 glow-red shadow-lg transform hover:scale-[1.03]"
                >
                  Ver Detalles
                </button>
              </div>
            </div>

            {/* Poster cover */}
            <div className="w-52 h-72 sm:w-56 sm:h-80 md:w-56 md:h-80 lg:w-60 lg:h-84 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 flex-shrink-0 order-1 md:order-2">
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

          {/* Slider indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
            {featuredAnime.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-3.5 h-1.5 md:w-6 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'bg-accent-red' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── Continuar Viendo ─────────────────────────────────────────────── */}
      {isAuthenticated && continueWatching.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">▶</span>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Continuar Viendo</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-36 cursor-pointer group"
                onClick={() => navigate(`/buscar?url=${encodeURIComponent(item.anime_url)}`)}
              >
                <div className="relative w-36 h-52 rounded-xl overflow-hidden border border-white/10 shadow-lg mb-2">
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
                    <div className="w-full h-full bg-gradient-to-br from-accent-red/20 to-accent-purple/20 flex items-center justify-center">
                      <span className="text-3xl">🎌</span>
                    </div>
                  )}
                  {/* Episode badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Ep. {item.episode_num}
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-accent-red/90 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-300 truncate group-hover:text-white transition-colors">{item.anime_title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Popular Categories Section */}
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center space-x-2 tracking-wide">
          <svg className="w-5 h-5 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Explorar por Categoría</span>
        </h3>
        <div className="flex md:flex-wrap gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {genres.length === 0 ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-20 h-8 rounded-full skeleton flex-shrink-0 snap-start" />
            ))
          ) : (
            genres.map((genre) => {
              const isAdult = genre.slug === 'hentaila';
              return (
                <button
                  key={genre.slug}
                  onClick={() => handleGenreClick(genre)}
                  className={`flex-shrink-0 snap-start px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    isAdult
                      ? 'bg-accent-red/5 border-accent-red/20 text-accent-red hover:bg-accent-red/20 hover:border-accent-red/40 hover:text-white'
                      : 'bg-bg-secondary border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10 hover:text-white hover:scale-105'
                  }`}
                >
                  {genre.name}
                  {isAdult && <span className="ml-1 text-[9px] font-black tracking-wide bg-accent-red text-white px-1.5 py-0.5 rounded">18+</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Recommendations Grid Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center space-x-2.5 tracking-wide">
              <svg className="w-6 h-6 text-accent-purple animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Recomendados y Novedades</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Últimas actualizaciones agregadas a la cartelera.
            </p>
          </div>

          {/* Provider selector tab */}
          <div className="flex bg-bg-secondary/40 border border-white/5 p-1 rounded-2xl self-end">
            <button
              onClick={() => setActiveProvider('animeav1')}
              className={`px-4 py-2 text-xs font-bold rounded-xl tracking-wider transition-all ${
                activeProvider === 'animeav1'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              AnimeAV1
            </button>
            <button
              onClick={() => setActiveProvider('animeflv')}
              className={`px-4 py-2 text-xs font-bold rounded-xl tracking-wider transition-all ${
                activeProvider === 'animeflv'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-slate-500 hover:text-slate-300'
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
          <div className="text-center py-24 glass rounded-3xl text-slate-500 text-sm">
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
    </div>
  );
};

export default Inicio;
