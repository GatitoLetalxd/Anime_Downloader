import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { pingAPI } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Dynamically import avatars
const avatarModules = import.meta.glob('../assets/avatars/*.png', { eager: true });
function getAvatarSrc(name) {
  const key = Object.keys(avatarModules).find((k) => k.endsWith(`/${name}`));
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

  // Periodic API health check — pause when tab is hidden
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
    <nav className="sticky top-0 z-50 glass px-4 md:px-6 py-4 flex flex-col shadow-xl border-b border-white/5">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden flex items-center justify-center glow-red transition-transform duration-300 group-hover:scale-110">
            <img
              src="/images/logo.png"
              alt="LunielAnime Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                parent.className += " bg-gradient-to-tr from-accent-red to-accent-purple";
                parent.innerHTML = '<svg class="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
              }}
            />
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-accent-red bg-clip-text text-transparent">
            Luniel<span className="text-accent-red">Anime</span>
          </span>
        </Link>

        {/* Desktop Nav Links & Status */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive
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
          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400 pl-4 border-l border-white/10">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">API:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${apiConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-accent-red shadow-[0_0_10px_rgba(232,57,90,0.5)]'}`} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">Sockets:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${socketConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-accent-red shadow-[0_0_10px_rgba(232,57,90,0.5)]'}`} />
            </div>
          </div>

          {/* User menu */}
          {isAuthenticated && (
            <div className="relative" ref={userMenuRef}>
              <button
                id="navbar-user-menu-btn"
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-red/40 to-accent-purple/40 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{user?.username?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  {user?.username}
                </span>
                <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden animate-fade-in">
                  <Link to="/perfil" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <span>👤</span> Mi Perfil
                  </Link>
                  <Link to="/favoritos" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <span>♥</span> Favoritos
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-red hover:text-red-300 hover:bg-white/5 transition-colors">
                      <span>⚡</span> Panel Admin
                    </Link>
                  )}
                  <div className="my-1 border-t border-white/5" />
                  <button
                    id="navbar-logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors text-left"
                  >
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile avatar */}
          {isAuthenticated && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-red/40 to-accent-purple/40 border border-white/20 overflow-hidden flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{user?.username?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/5 flex flex-col space-y-1 animate-fade-in">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 flex items-center justify-between ${isActive
                  ? 'text-accent-red bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                {item.name}
                {item.badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {isAuthenticated && (
            <>
              <Link to="/perfil" className="px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                <span>👤</span> Mi Perfil
              </Link>
              {isAdmin && (
                <Link to="/admin" className="px-4 py-3 rounded-lg text-base font-medium text-accent-red hover:bg-white/5 transition-all flex items-center gap-2">
                  <span>⚡</span> Panel Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </>
          )}

          {/* Mobile Connection Status */}
          <div className="px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 mt-2 bg-black/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">API:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-accent-red'}`} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-wider uppercase opacity-80">Sockets:</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-accent-red'}`} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
