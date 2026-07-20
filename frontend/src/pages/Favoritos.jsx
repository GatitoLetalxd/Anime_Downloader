import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimeCard from '../components/AnimeCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Favoritos() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/user/favorites`);
      const data = await res.json();
      if (data.success) setFavorites(data.data);
    } catch (_err) {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (animeUrl) => {
    setRemovingId(animeUrl);
    try {
      await authFetch(`${API_BASE}/api/user/favorites`, {
        method: 'DELETE',
        body: JSON.stringify({ anime_url: animeUrl }),
      });
      setFavorites((prev) => prev.filter((f) => f.anime_url !== animeUrl));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center gap-4 bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/15 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] glow-cyan">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Mis Favoritos</h1>
          <p className="text-xs text-slate-300 font-medium">
            {favorites.length} anime{favorites.length !== 1 ? 's' : ''} guardado{favorites.length !== 1 ? 's' : ''} en tu cuenta
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#00f2ff]/30 border-t-[#00f2ff] animate-spin glow-cyan" />
          <span className="text-xs font-bold text-slate-400">Cargando tus favoritos...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 glass rounded-3xl border border-white/10">
          <svg className="w-16 h-16 text-[#00f2ff] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-lg font-black text-white">Sin favoritos aún</h2>
          <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
            Agrega animes a favoritos desde el botón "Agregar a Favoritos" en los detalles de cualquier anime.
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && favorites.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <AnimeCard
                anime={{
                  titulo: fav.anime_title,
                  imagen: fav.anime_cover,
                  url: fav.anime_url,
                }}
                onClick={() => navigate(`/buscar?url=${encodeURIComponent(fav.anime_url)}`)}
              />
              <button
                onClick={() => handleRemove(fav.anime_url)}
                disabled={removingId === fav.anime_url}
                className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-20 cursor-pointer"
                title="Quitar de favoritos"
              >
                {removingId === fav.anime_url ? (
                  <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  '✕'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
