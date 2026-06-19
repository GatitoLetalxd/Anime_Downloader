import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const phrases = [
  "Tu portal privado de anime.",
  "Explora mundos y aventuras sin límites.",
  "Descarga y transmite en alta definición.",
  "Tus favoritos sincronizados en todo momento."
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
      // Fade out
      setFadeClass('opacity-0 -translate-y-2');
      
      // Wait for transition, update text, then fade in
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[64%_36%] bg-bg-primary text-white overflow-hidden font-sans relative">
      
      {/* Left Panel: Cinematic Artwork (hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-bg-primary">
        {/* Background image container - highly visible (opacity-90) with interactive scale zoom */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out hover:scale-105 opacity-90"
          style={{ 
            backgroundImage: "url('/images/login-bg.png')",
            backgroundColor: '#0a0a0f'
          }}
        />
        {/* Soft cinematic gradient overlay fading into the dark theme only at the very right edge */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg-primary/20 to-bg-primary pointer-events-none" />
        
        {/* Ambient glows for atmosphere */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-red/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top brand signature */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(232,57,90,0.4)]"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="font-heading text-xl font-bold bg-gradient-to-r from-accent-red via-accent-purple to-accent-blue bg-clip-text text-transparent tracking-widest">
            LUNIELANIME
          </span>
        </div>

        {/* Dynamic quote slideshow */}
        <div className="relative z-10 max-w-md my-auto select-none">
          <div className="h-24 flex flex-col justify-center">
            <h2 className={`text-3xl font-extrabold tracking-tight font-heading leading-tight text-white transition-all duration-300 ${fadeClass}`}>
              {phrases[phraseIndex]}
            </h2>
          </div>
          <p className="text-slate-200 text-base leading-relaxed mt-2 animate-fade-in drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ animationDelay: '0.2s' }}>
            Accede a tu servidor de streaming y descargas privado. Sincroniza tus favoritos, guarda tu progreso y continúa viendo donde lo dejaste.
          </p>
        </div>

        {/* Quality pills / features */}
        <div className="relative z-10 flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-slate-200 hover:border-accent-red/40 hover:bg-black/60 transition-all duration-300">
            ⚡ Descargas Rápidas
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-slate-200 hover:border-accent-purple/40 hover:bg-black/60 transition-all duration-300">
            🎬 Calidad Ultra HD
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-slate-200 hover:border-accent-blue/40 hover:bg-black/60 transition-all duration-300">
            🔒 Servidor Privado
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="relative flex items-center justify-center p-6 md:p-12 overflow-hidden bg-bg-primary border-l border-white/5">
        
        {/* Mobile Background Image (Visible on mobile only, with blur and reduced opacity) */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden block pointer-events-none opacity-65"
          style={{ 
            backgroundImage: "url('/images/login-bg.png')",
            backgroundColor: '#0a0a0f',
            filter: 'blur(5px) brightness(0.65)',
            transform: 'scale(1.08)'
          }}
        />
        <div className="absolute inset-0 bg-[#0a0a0f]/50 md:hidden block pointer-events-none" />

        {/* Ambient glows behind the form */}
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[350px] h-[350px] bg-accent-red/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Login Card Container - High Opacity (bg-bg-secondary/95) to protect text readability from image bleed */}
        <div className="relative w-full max-w-md bg-bg-secondary/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl z-10 animate-fade-in">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-red to-accent-purple flex items-center justify-center mb-4 shadow-lg shadow-accent-red/20">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-2xl font-black font-heading text-white tracking-widest bg-gradient-to-r from-accent-red via-accent-purple to-accent-blue bg-clip-text text-transparent">
              LUNIELANIME
            </h1>
            <p className="text-slate-400 text-[10px] mt-1.5 uppercase tracking-widest font-bold">
              Panel de Acceso
            </p>
          </div>

          {/* Professional Error Alert with Shake Animation */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 animate-shake">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Email Field with Floating Label and solid focus border */}
            <div className="relative">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-white/[0.08] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-red/35 focus:border-accent-red/50 transition-all duration-200"
              />
              <label
                htmlFor="login-email"
                className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all duration-200 pointer-events-none 
                peer-focus:text-xs peer-focus:text-accent-red peer-focus:top-1.5
                peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-accent-red peer-[:not(:placeholder-shown)]:top-1.5"
              >
                Email
              </label>
            </div>

            {/* Password Field with Floating Label & SVG Toggle */}
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 pr-12 rounded-xl bg-white/[0.08] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-red/35 focus:border-accent-red/50 transition-all duration-200"
              />
              <label
                htmlFor="login-password"
                className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all duration-200 pointer-events-none 
                peer-focus:text-xs peer-focus:text-accent-red peer-focus:top-1.5
                peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-accent-red peer-[:not(:placeholder-shown)]:top-1.5"
              >
                Contraseña
              </label>
              
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none p-1"
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

            {/* Premium Submit Button with Scale Interaction & Custom Spinner */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="mt-3 w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-red to-accent-purple hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-red/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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

          {/* Footer Text */}
          <p className="text-center text-xs text-slate-500 mt-8 font-medium">
            ¿No tienes cuenta? Contacta al administrador para obtener acceso.
          </p>

          {/* Mobile App Download Link */}
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
            <a
              href="/LunielAnime.apk"
              download
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all duration-200"
            >
              <svg className="w-4 h-4 text-emerald-500 fill-current" viewBox="0 0 24 24">
                <path d="M16.62 19.14l1.54 2.66c.16.27.06.61-.21.77-.27.16-.61.06-.77-.21l-1.56-2.7c-2.32.9-4.92.9-7.24 0l-1.56 2.7c-.16.27-.5.37-.77.21-.27-.16-.37-.5-.21-.77l1.54-2.66C3.99 16.71 2 13.58 2 10h20c0 3.58-1.99 6.71-4.38 9.14zM7 7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm10 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" />
              </svg>
              <span>Descargar App para Android (APK)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Styles for custom animations */}
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
