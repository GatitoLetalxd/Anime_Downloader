import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function ReproductorNativo({
  src,
  poster,
  title,
  initialTime = 0,
  onProgress,
  onEnded,
  onPrevEpisode,
  onNextEpisode,
  hasPrev = false,
  hasNext = false,
  onSwitchToIframe,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSavedTimeRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef(null);

  // Initialize Video & HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream = src.includes('.m3u8');

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 5) {
          video.currentTime = initialTime;
        }
      });
    } else {
      video.src = src;
      if (initialTime > 5) {
        video.currentTime = initialTime;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialTime]);

  // Handle time update & progress syncing
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const curr = Math.floor(video.currentTime);
    const dur = Math.floor(video.duration || 0);
    setCurrentTime(curr);
    setDuration(dur);

    // Throttle progress save to every 5 seconds
    if (Math.abs(curr - lastSavedTimeRef.current) >= 5) {
      lastSavedTimeRef.current = curr;
      if (onProgress) {
        onProgress(curr, dur);
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInput) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          video.muted = !video.muted;
          setIsMuted(video.muted);
          break;
        case 'n':
          if (hasNext && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
          }
          break;
        case 'p':
          if (hasPrev && onPrevEpisode) {
            e.preventDefault();
            onPrevEpisode();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNextEpisode, onPrevEpisode]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 85;
    }
  };

  const handleSkipOutro = () => {
    if (videoRef.current) {
      if (hasNext && onNextEpisode) {
        onNextEpisode();
      } else {
        videoRef.current.currentTime += 85;
      }
    }
  };

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  const formatTime = (secs) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video rounded-none sm:rounded-2xl overflow-hidden bg-black border-y sm:border border-[#00f2ff]/30 shadow-2xl group select-none"
    >
      <video
        ref={videoRef}
        poster={poster}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        onClick={() => {
          const v = videoRef.current;
          if (v) {
            if (v.paused) v.play();
            else v.pause();
          }
        }}
      />

      {/* Top Banner Options (Switch to Iframe & Title) */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] text-[10px] font-black uppercase tracking-wider">
            Nativo ⚡ Sin Anuncios
          </span>
          <span className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-md drop-shadow">
            {title}
          </span>
        </div>

        {onSwitchToIframe && (
          <button
            onClick={onSwitchToIframe}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Cambiar al reproductor embebido si el stream nativo no carga"
          >
            <span>🔄 Modo Iframe</span>
          </button>
        )}
      </div>

      {/* Quick Skip Intro Badge (Top Right Below Banner) */}
      <div className="absolute top-14 right-4 z-20 flex gap-2">
        <button
          onClick={handleSkipIntro}
          className="px-3 py-1.5 rounded-xl bg-[#00f2ff]/90 hover:bg-[#00f2ff] text-black font-black text-xs backdrop-blur-md shadow-lg border border-[#00f2ff] transition-all transform hover:scale-105 cursor-pointer flex items-center gap-1"
          title="Saltar opening (+85s)"
        >
          <span>⏩ Saltar Intro (+85s)</span>
        </button>

        {hasNext && (
          <button
            onClick={handleSkipOutro}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            title="Saltar al siguiente episodio"
          >
            <span>Siguiente Ep. ⏭</span>
          </button>
        )}
      </div>

      {/* Center Play/Pause Indicator (when paused) */}
      {!isPlaying && (
        <div
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
        >
          <div className="w-16 h-16 rounded-full bg-[#00f2ff]/90 text-black flex items-center justify-center shadow-[0_0_25px_#00f2ff] transform hover:scale-110 transition-transform">
            <svg className="w-8 h-8 ml-1 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              if (videoRef.current) {
                videoRef.current.currentTime = val;
              }
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00f2ff] hover:h-2 transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) {
                  if (v.paused) v.play();
                  else v.pause();
                }
              }}
              className="text-white hover:text-[#00f2ff] transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Rewind 5s */}
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 5;
              }}
              className="text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              title="-5s"
            >
              -5s
            </button>

            {/* Forward 5s */}
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime += 5;
              }}
              className="text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              title="+5s"
            >
              +5s
            </button>

            {/* Time Stamp */}
            <span className="text-[11px] font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-[#0d1f42] border border-[#00f2ff]/30 rounded-xl p-1 shadow-xl flex flex-col gap-1 z-30 min-w-[70px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => changePlaybackRate(r)}
                      className={`px-2 py-1 text-left text-[11px] rounded-lg cursor-pointer ${
                        playbackRate === r
                          ? 'bg-[#00f2ff] text-black font-black'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={() => {
                if (document.pictureInPictureElement) {
                  document.exitPictureInPicture().catch(() => {});
                } else if (videoRef.current) {
                  videoRef.current.requestPictureInPicture().catch(() => {});
                }
              }}
              className="text-slate-300 hover:text-[#00f2ff] transition-colors cursor-pointer"
              title="Picture in Picture"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h6m4-8h6m0 0v6m0-6L13 19" />
              </svg>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-slate-300 hover:text-[#00f2ff] transition-colors cursor-pointer"
              title="Pantalla completa [F]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
