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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl text-accent-red font-bold">♥</span>
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Mis Favoritos</h1>
          <p className="text-slate-400 text-sm">
            {favorites.length} anime{favorites.length !== 1 ? 's' : ''} guardado{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-4 border-t-accent-red border-r-accent-purple border-b-transparent border-l-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <span className="text-6xl opacity-30">💔</span>
          <h2 className="text-xl font-bold text-slate-300">Sin favoritos aún</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            Agrega animes a favoritos desde el modal de detalles haciendo clic en ♥
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
              {/* Remove button */}
              <button
                onClick={() => handleRemove(fav.anime_url)}
                disabled={removingId === fav.anime_url}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
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
