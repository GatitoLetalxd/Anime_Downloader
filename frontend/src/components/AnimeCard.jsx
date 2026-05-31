import React from 'react';
import { getProxiedImageUrl } from '../lib/api';

export const AnimeCard = ({ anime, onClick }) => {
  if (!anime) return <SkeletonAnimeCard />;

  const { titulo, imagen, tipo, año } = anime;
  const imagenUrl = getProxiedImageUrl(imagen);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-bg-card border border-white/5 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:border-accent-red/30 hover:shadow-accent-red/10"
    >
      {/* Aspect ratio box for image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-secondary">
        <img
          src={imagenUrl}
          alt={titulo}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
          }}
        />

        {/* Hover overlay with title */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
          <h3 className="text-base font-bold text-white line-clamp-2 leading-tight">
            {titulo}
          </h3>
        </div>

        {/* Badges container */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          {tipo && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-accent-red/90 text-white shadow-md">
              {tipo}
            </span>
          )}
          {año && (
            <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-bg-primary/80 backdrop-blur-sm text-slate-300 border border-white/10">
              {año}
            </span>
          )}
        </div>
      </div>

      {/* Under-card text content for fallback list viewing */}
      <div className="p-3 bg-bg-card flex flex-col">
        <h4 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-accent-red transition-colors duration-200">
          {titulo}
        </h4>
      </div>
    </div>
  );
};

export const SkeletonAnimeCard = () => {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-bg-card shadow-lg">
      <div className="aspect-[3/4] w-full skeleton relative" />
      <div className="p-3 bg-bg-card">
        <div className="h-4 w-3/4 rounded bg-white/5 skeleton mb-1" />
      </div>
    </div>
  );
};

export default AnimeCard;
