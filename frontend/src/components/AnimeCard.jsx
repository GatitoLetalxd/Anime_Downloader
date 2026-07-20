import React, { memo } from 'react';
import { getProxiedImageUrl } from '../lib/api';

export const AnimeCard = memo(({ anime, onClick }) => {
  if (!anime) return <SkeletonAnimeCard />;

  const { titulo, imagen, tipo, año } = anime;
  const imagenUrl = getProxiedImageUrl(imagen);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:scale-[1.03] hover:border-[#00f2ff]/60 hover:shadow-[0_0_25px_rgba(0,242,255,0.25)]"
    >
      {/* Aspect ratio box for image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#030b1e]">
        <img
          src={imagenUrl}
          alt={titulo}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
          }}
        />

        {/* Cyber overlay with Play Button on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b1e] via-[#030b1e]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]">
              HD
            </span>
          </div>

          {/* Central Play Icon Overlay */}
          <div className="mx-auto my-auto w-12 h-12 rounded-full bg-[#00f2ff]/90 text-black flex items-center justify-center shadow-[0_0_20px_#00f2ff] transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
            {titulo}
          </h3>
        </div>

        {/* Badges container */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start pointer-events-none z-10">
          <div className="flex flex-col gap-1 items-start">
            {tipo && (
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#00f2ff]/90 text-black shadow-md backdrop-blur-md">
                {tipo}
              </span>
            )}
            {anime.source && (
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#38bdf8]/90 text-black shadow-md backdrop-blur-md">
                {anime.source}
              </span>
            )}
          </div>
          {año && (
            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#030b1e]/85 backdrop-blur-md text-[#a5f3fc] border border-[#00f2ff]/20">
              {año}
            </span>
          )}
        </div>
      </div>

      {/* Under-card title label */}
      <div className="p-3 bg-[#0d1f42]/90 flex flex-col border-t border-white/5">
        <h4 className="text-xs font-extrabold text-slate-200 line-clamp-1 group-hover:text-[#00f2ff] transition-colors duration-200">
          {titulo}
        </h4>
      </div>
    </div>
  );
});

export const SkeletonAnimeCard = memo(() => {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0d1f42] shadow-lg">
      <div className="aspect-[3/4] w-full skeleton relative" />
      <div className="p-3 bg-[#0d1f42]">
        <div className="h-4 w-3/4 rounded bg-white/5 skeleton mb-1" />
      </div>
    </div>
  );
});

export default AnimeCard;
