import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/logo.png';

const phrases = [
  "Tu portal privado de anime en alta definición.",
  "Explora mundos y aventuras míticas sin límites.",
  "Descarga directa en lote y reproducción sin anuncios.",
  "Sincroniza tus favoritos y tu historial de reproducción."
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('opacity-0 -translate-y-2');
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setFadeClass('opacity-100 translate-y-0');
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[62%_38%] bg-[#030b1e] text-white overflow-hidden font-sans relative">
      
      {/* Left Panel: Cyber Anime Artwork & Branding */}
      <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-[#030b1e] bg-cyber-grid">
        
        {/* Background Image in Full Vibrant Color with Gradient Vignette */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out hover:scale-105 opacity-90"
          style={{ 
            backgroundImage: "url('/images/login-bg.png')",
            backgroundColor: '#030b1e'
          }}
        />
        
        {/* Soft Radial Cyan Ambient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030b1e]/40 via-[#030b1e]/30 to-[#030b1e] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#00f2ff]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[450px] h-[450px] bg-[#38bdf8]/15 rounded-full blur-[110px] pointer-events-none" />

        {/* Top Brand Signature with Emblem Logo */}
        <div className="relative z-10 flex items-center gap-3.5 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#081631] border border-[#00f2ff]/40 overflow-hidden flex items-center justify-center glow-cyan">
            <img 
              src={logoImg} 
              alt="LunielAnime Emblem" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gradient-cyan tracking-widest">
              LUNIEL<span className="text-[#00f2ff]">ANIME</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#38bdf8]">
              ONLINE • TV
            </span>
          </div>
        </div>

        {/* Dynamic Quote Slideshow */}
        <div className="relative z-10 max-w-lg my-auto select-none space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-xs font-bold text-[#00f2ff] tracking-wider uppercase">
            ⚡ Servidor Privado de Streaming
          </div>

          <div className="h-28 flex flex-col justify-center">
            <h2 className={`text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white transition-all duration-300 ${fadeClass}`}>
              {phrases[phraseIndex]}
            </h2>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed animate-fade-in opacity-90">
            Accede a tu catálogo exclusivo de anime. Descargas a máxima velocidad, calidad HD/AV1 sin interrupciones y sincronización multi-dispositivo.
          </p>
        </div>

        {/* Quality Feature Pills */}
        <div className="relative z-10 flex flex-wrap gap-3 animate-fade-in">
          <div className="px-4 py-2 rounded-xl bg-[#0d1f42]/80 border border-[#00f2ff]/30 backdrop-blur-md text-xs font-extrabold tracking-wide uppercase text-slate-200 hover:border-[#00f2ff] transition-all">
            ⚡ Descargas en Lote
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#0d1f42]/80 border border-[#38bdf8]/30 backdrop-blur-md text-xs font-extrabold tracking-wide uppercase text-slate-200 hover:border-[#38bdf8] transition-all">
            🎬 Calidad 1080p / AV1
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#0d1f42]/80 border border-white/10 backdrop-blur-md text-xs font-extrabold tracking-wide uppercase text-slate-200 hover:border-[#00f2ff] transition-all">
            🔒 Servidor Privado
          </div>
        </div>
      </div>

      {/* Right Panel: Cyber Login Form */}
      <div className="relative flex items-center justify-center p-6 md:p-12 overflow-hidden bg-[#030b1e] border-l border-white/10">
        
        {/* Mobile Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden block pointer-events-none opacity-40 filter blur-md scale-105"
          style={{ 
            backgroundImage: "url('/images/login-bg.png')",
            backgroundColor: '#030b1e'
          }}
        />

        {/* Form Glow */}
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-[#00f2ff]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Login Card Container */}
        <div className="relative w-full max-w-md bg-[#0d1f42]/95 backdrop-blur-2xl border border-[#00f2ff]/30 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,242,255,0.12)] z-10 animate-fade-in">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 rounded-2xl bg-[#081631] border border-[#00f2ff]/50 overflow-hidden flex items-center justify-center mb-4 glow-cyan">
              <img 
                src={logoImg} 
                alt="LunielAnime Emblem" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <h1 className="text-2xl font-black text-[#00f2ff] tracking-widest">
              LUNIEL<span className="text-white">ANIME</span>
            </h1>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-[0.2em] font-extrabold">
              Acceso a Servidor Privado
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-3 animate-shake">
              <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Email Input */}
            <div className="relative">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-[#030b1e]/80 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/40 transition-all duration-200"
              />
              <label
                htmlFor="login-email"
                className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all duration-200 pointer-events-none 
                peer-focus:text-xs peer-focus:text-[#00f2ff] peer-focus:top-1.5
                peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00f2ff] peer-[:not(:placeholder-shown)]:top-1.5"
              >
                Email
              </label>
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 pr-12 rounded-xl bg-[#030b1e]/80 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/40 transition-all duration-200"
              />
              <label
                htmlFor="login-password"
                className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all duration-200 pointer-events-none 
                peer-focus:text-xs peer-focus:text-[#00f2ff] peer-focus:top-1.5
                peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00f2ff] peer-[:not(:placeholder-shown)]:top-1.5"
              >
                Contraseña
              </label>
              
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00f2ff] transition-colors focus:outline-none p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Cyber Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="mt-3 w-full py-3.5 rounded-xl font-extrabold text-black bg-[#00f2ff] hover:bg-[#70f3ff] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-cyan shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-xs text-slate-400 mt-8 font-medium">
            ¿No tienes cuenta? Contacta al administrador para obtener acceso.
          </p>

          {/* APK Link */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center">
            <a
              href="/LunielAnime.apk"
              download
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-[#00f2ff]/10 border border-white/10 hover:border-[#00f2ff]/30 text-xs font-bold text-[#38bdf8] hover:text-white transition-all duration-200"
            >
              <svg className="w-4 h-4 text-[#00f2ff] fill-current" viewBox="0 0 24 24">
                <path d="M16.62 19.14l1.54 2.66c.16.27.06.61-.21.77-.27.16-.61.06-.77-.21l-1.56-2.7c-2.32.9-4.92.9-7.24 0l-1.56 2.7c-.16.27-.5.37-.77.21-.27-.16-.37-.5-.21-.77l1.54-2.66C3.99 16.71 2 13.58 2 10h20c0 3.58-1.99 6.71-4.38 9.14zM7 7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm10 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" />
              </svg>
              <span>Descargar App Android (APK)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
