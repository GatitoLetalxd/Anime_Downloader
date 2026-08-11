import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { pingAPI } from '../lib/api';

import logoImg from '../assets/logo.png';

// Dynamically import avatars
const avatarModules = import.meta.glob('../assets/avatars/*.png', { eager: true });
function getAvatarSrc(name) {
  if (!name) return null;
  const cleanName = name.replace(/^avatar_?0*(\d+)/, (match, p1) => `avatar${p1}`);
  const key = Object.keys(avatarModules).find((k) => k.endsWith(`/${cleanName}`));
  return key ? avatarModules[key].default : null;
}

export const Navbar = () => {
  const { descargas, connected: socketConnected } = useSocket();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [apiConnected, setApiConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Periodic API health check
  useEffect(() => {
    const checkHealth = async () => {
      if (document.visibilityState === 'hidden') return;
      const isOk = await pingAPI();
      setApiConnected(isOk);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    document.addEventListener('visibilitychange', checkHealth);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkHealth);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Calculate active downloads
  const activeCount = Object.values(descargas).filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'preparing'
  ).length;

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Buscar', path: '/buscar' },
    { name: 'Descargas', path: '/descargas', badge: activeCount },
    { name: 'Historial', path: '/historial' },
    { name: 'Favoritos', path: '/favoritos' },
  ];

  const avatarSrc = user ? getAvatarSrc(user.avatar) : null;

  return (
    <nav className="sticky top-0 z-50 glass px-4 md:px-8 py-3.5 flex flex-col shadow-2xl border-b border-[#00f2ff]/15 backdrop-blur-2xl">
      <div className="flex items-center justify-between w-full">

        {/* Logo with Cyber Anime Emblem */}
        <Link to="/" className="flex items-center space-x-3.5 group">
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden flex items-center justify-center border border-[#00f2ff]/40 bg-[#081631] glow-cyan transition-all duration-300 group-hover:scale-105 group-hover:border-[#00f2ff]">
            <img
              src={logoImg}
              alt="LunielAnime Emblem"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2ff]/10 to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-widest text-gradient-cyan group-hover:brightness-125 transition-all">
              LUNIEL<span className="text-[#00f2ff]">ANIME</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#38bdf8] -mt-1 opacity-90">
              ONLINE • TV
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links & Connection Status */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-1.5 bg-[#030b1e]/60 p-1.5 rounded-2xl border border-white/5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 ${isActive
                      ? 'text-white bg-[#00f2ff]/15 border border-[#00f2ff]/40 glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {item.name}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00f2ff] text-[10px] font-black text-black animate-pulse shadow-[0_0_10px_#00f2ff]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Download Android APK Link */}
            <a
              href="/LunielAnime-v1.2.apk"
              download
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#38bdf8] hover:text-white hover:bg-[#38bdf8]/15 border border-transparent hover:border-[#38bdf8]/30 transition-all duration-300"
              title="Descargar App Móvil (Android)"
            >
              <svg className="w-4 h-4 text-[#00f2ff] fill-current animate-pulse" viewBox="0 0 24 24">
                <path d="M16.62 19.14l1.54 2.66c.16.27.06.61-.21.77-.27.16-.61.06-.77-.21l-1.56-2.7c-2.32.9-4.92.9-7.24 0l-1.56 2.7c-.16.27-.5.37-.77.21-.27-.16-.37-.5-.21-.77l1.54-2.66C3.99 16.71 2 13.58 2 10h20c0 3.58-1.99 6.71-4.38 9.14zM7 7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm10 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" />
              </svg>
              <span>App Android</span>
            </a>
          </div>

          {/* Connection Indicators */}
          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400 pl-4 border-l border-white/10">
            <div className="flex items-center space-x-2" title="API Status">
              <span className="text-[9px] tracking-widest uppercase font-bold text-slate-400">API:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-500 ${apiConnected ? 'bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
            </div>
            <div className="flex items-center space-x-2" title="Sockets Status">
              <span className="text-[9px] tracking-widest uppercase font-bold text-slate-400">WS:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-500 ${socketConnected ? 'bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
            </div>
          </div>

          {/* User Profile Menu */}
          {isAuthenticated && (
            <div className="relative" ref={userMenuRef}>
              <button
                id="navbar-user-menu-btn"
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#081631]/80 border border-[#00f2ff]/20 hover:border-[#00f2ff]/50 hover:bg-[#0d1f42] transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl bg-[#00f2ff]/20 border border-[#00f2ff]/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-extrabold text-[#00f2ff]">{user?.username?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-extrabold text-slate-200 group-hover:text-white transition-colors">
                  {user?.username}
                </span>

                {user?.role !== 'admin' && user?.expires_at && (
                  (() => {
                    const expiry = new Date(user.expires_at);
                    const now = new Date();
                    const diffTime = expiry - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      return (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md leading-none ${diffDays <= 5
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30'
                          }`}>
                          {diffDays}d
                        </span>
                      );
                    }
                    return null;
                  })()
                )}

                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-[#00f2ff]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 glass-premium border border-[#00f2ff]/30 rounded-2xl shadow-2xl py-2 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conectado como</p>
                    <p className="text-xs font-black text-[#00f2ff] truncate">{user?.username}</p>
                  </div>

                  <Link to="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#00f2ff]/10 transition-colors">
                    <span className="text-[#00f2ff]">👤</span> Mi Perfil
                  </Link>
                  <Link to="/favoritos" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#00f2ff]/10 transition-colors">
                    <span className="text-[#00f2ff]">♥</span> Mis Favoritos
                  </Link>

                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-xs font-extrabold text-[#00f2ff] hover:bg-[#00f2ff]/15 transition-colors">
                      <span>⚡</span> Panel Administración
                    </Link>
                  )}

                  <div className="my-1.5 border-t border-white/10" />

                  <button
                    id="navbar-logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger & Avatar */}
        <div className="flex md:hidden items-center gap-3">
          {isAuthenticated && (
            <div className="w-8 h-8 rounded-xl bg-[#00f2ff]/20 border border-[#00f2ff]/40 overflow-hidden flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-extrabold text-[#00f2ff]">{user?.username?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#00f2ff]/10 focus:outline-none border border-white/10"
          >
            <svg className="w-6 h-6 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-[#00f2ff]/20 flex flex-col space-y-1.5 animate-fade-in">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${isActive
                    ? 'text-white bg-[#00f2ff]/15 border border-[#00f2ff]/40 glow-cyan'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span>{item.name}</span>
                {item.badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00f2ff] text-[10px] font-black text-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <a
            href="/LunielAnime.apk"
            download
            className="px-4 py-3 rounded-xl text-sm font-extrabold text-[#38bdf8] hover:text-white hover:bg-[#38bdf8]/10 flex items-center gap-2.5"
          >
            <svg className="w-5 h-5 text-[#00f2ff] fill-current" viewBox="0 0 24 24">
              <path d="M16.62 19.14l1.54 2.66c.16.27.06.61-.21.77-.27.16-.61.06-.77-.21l-1.56-2.7c-2.32.9-4.92.9-7.24 0l-1.56 2.7c-.16.27-.5.37-.77.21-.27-.16-.37-.5-.21-.77l1.54-2.66C3.99 16.71 2 13.58 2 10h20c0 3.58-1.99 6.71-4.38 9.14zM7 7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm10 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" />
            </svg>
            <span>Descargar App Android APK</span>
          </a>

          {isAuthenticated && (
            <>
              <Link to="/perfil" className="px-4 py-3 rounded-xl text-sm font-extrabold text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="text-[#00f2ff]">👤</span> Mi Perfil
                </span>
              </Link>

              {isAdmin && (
                <Link to="/admin" className="px-4 py-3 rounded-xl text-sm font-extrabold text-[#00f2ff] hover:bg-[#00f2ff]/10 flex items-center gap-2.5">
                  <span>⚡</span> Panel Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5"
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </>
          )}

          {/* Mobile Connection Status */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-400 mt-2 bg-[#030b1e]/80 rounded-xl border border-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">API:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]' : 'bg-rose-500'}`} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">Sockets:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]' : 'bg-rose-500'}`} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
