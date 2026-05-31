import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { pingAPI } from '../lib/api';

export const Navbar = () => {
  const { descargas, connected: socketConnected } = useSocket();
  const location = useLocation();
  const [apiConnected, setApiConnected] = useState(false);

  // Periodic API health check
  useEffect(() => {
    const checkHealth = async () => {
      const isOk = await pingAPI();
      setApiConnected(isOk);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate active downloads
  const activeCount = Object.values(descargas).filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'preparing'
  ).length;

  const navItems = [
    { name: 'Buscar', path: '/' },
    { name: 'Descargas', path: '/descargas', badge: activeCount },
    { name: 'Historial', path: '/historial' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between shadow-xl border-b border-white/5">
      {/* Logo */}
      <Link to="/" className="flex items-center space-x-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-red to-accent-purple flex items-center justify-center glow-red transition-transform duration-300 group-hover:scale-110">
          {/* Custom play icon SVG */}
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-accent-red bg-clip-text text-transparent">
          Anime<span className="text-accent-red">Downloader</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center space-x-1 sm:space-x-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'text-accent-red bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.name}
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Connection Indicators */}
      <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400">
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-[10px] tracking-wider uppercase opacity-80">API Status:</span>
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
              apiConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-accent-red shadow-[0_0_10px_rgba(232,57,90,0.5)]'
            }`}
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] tracking-wider uppercase opacity-80">Sockets:</span>
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
              socketConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-accent-red shadow-[0_0_10px_rgba(232,57,90,0.5)]'
            }`}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
