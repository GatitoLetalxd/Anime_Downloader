import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const avatarModules = import.meta.glob('../assets/avatars/*.png', { eager: true });
const AVATARS = Object.entries(avatarModules).map(([path, mod]) => ({
  name: path.split('/').pop(),
  src: mod.default,
}));

const DEFAULT_AVATAR_EMOJI = '🎌';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[#030b1e] border border-white/10 rounded-xl px-4 py-3 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00f2ff] transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00f2ff] transition-colors"
          tabIndex={-1}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

export default function Perfil() {
  const { user, authFetch, refreshSession } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1.png');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user?.avatar) {
      const clean = user.avatar.replace(/^avatar_?0*(\d+)/, (match, p1) => `avatar${p1}`);
      setSelectedAvatar(clean);
    }
  }, [user?.avatar]);

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE}/api/user/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar: selectedAvatar }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSession();
        setMessage('success:Avatar actualizado correctamente');
      } else {
        setMessage('error:' + (data.message || 'Error al guardar'));
      }
    } catch (_err) {
      setMessage('error:Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage({ text: '', type: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPwdMessage({ text: 'Completa todos los campos', type: 'error' });
    }
    if (newPassword !== confirmPassword) {
      return setPwdMessage({ text: 'Las nuevas contraseñas no coinciden', type: 'error' });
    }
    if (newPassword.length < 6) {
      return setPwdMessage({ text: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' });
    }

    setPwdSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/api/user/password`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMessage({ text: data.message || 'Error al cambiar contraseña', type: 'error' });
      }
    } catch (_err) {
      setPwdMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setPwdSaving(false);
    }
  };

  const getAvatarSrc = (name) => {
    if (!name) return null;
    const cleanName = name.replace(/^avatar_?0*(\d+)/, (match, p1) => `avatar${p1}`);
    const found = AVATARS.find((a) => a.name === cleanName);
    return found?.src || null;
  };

  const currentAvatarSrc = getAvatarSrc(user?.avatar);
  const [avatarMsgType, avatarMsgText] = message.includes(':')
    ? message.split(':')
    : ['', message];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#00f2ff]/15 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] glow-cyan">
          <UserIcon />
        </div>
        <h1 className="text-2xl font-black text-white">Mi Perfil</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 rounded-3xl p-6 flex items-center gap-5 shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-[#030b1e] border border-[#00f2ff]/40 flex items-center justify-center overflow-hidden flex-shrink-0 glow-cyan">
          {currentAvatarSrc ? (
            <img src={currentAvatarSrc} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{DEFAULT_AVATAR_EMOJI}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xl font-black text-white">{user?.username}</p>
          <p className="text-slate-300 text-xs font-semibold">{user?.email}</p>
          <span
            className={`mt-1.5 inline-block text-[10px] font-black px-2.5 py-0.5 rounded-md w-fit uppercase tracking-wider ${
              user?.role === 'admin'
                ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 glow-cyan'
                : 'bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            {user?.role === 'admin' ? '⚡ Administrador' : 'Usuario'}
          </span>
        </div>
      </div>

      {/* Access Status Card */}
      <div className="bg-[#0d1f42]/90 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span className="text-[#00f2ff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            Estado de Acceso a la Plataforma
          </h2>
          <p className="text-slate-300 text-xs font-medium mt-1">
            {user?.role === 'admin'
              ? 'Acceso administrativo ilimitado.'
              : !user?.expires_at
              ? 'Acceso activo ilimitado.'
              : `Programado para finalizar el ${new Date(user.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}.`}
          </p>
        </div>

        <div className="flex-shrink-0">
          {(() => {
            if (user?.role === 'admin' || !user?.expires_at) {
              return (
                <span className="px-4 py-2 rounded-xl text-xs font-black bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 uppercase tracking-wide glow-cyan">
                  Ilimitado
                </span>
              );
            }

            const expiry = new Date(user.expires_at);
            const now = new Date();
            const diffTime = expiry - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
              return (
                <span className="px-4 py-2 rounded-xl text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wide">
                  Expirado
                </span>
              );
            }

            return (
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border ${
                diffDays <= 5
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40'
              }`}>
                {diffDays} Días Restantes
              </span>
            );
          })()}
        </div>
      </div>

      {/* Avatar Selector Card */}
      <div className="bg-[#0d1f42]/90 border border-white/10 rounded-3xl p-6 shadow-xl">
        <h2 className="text-sm font-black text-white mb-4">Seleccionar Avatar</h2>

        {AVATARS.length > 0 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-5">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.name}
                onClick={() => setSelectedAvatar(avatar.name)}
                className={`w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-150 cursor-pointer ${
                  selectedAvatar === avatar.name
                    ? 'border-[#00f2ff] glow-cyan scale-105'
                    : 'border-white/10 hover:border-white/30'
                }`}
                title={avatar.name}
              >
                <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {avatarMsgText && (
          <p className={`text-xs font-bold mb-3 flex items-center gap-1.5 ${avatarMsgType === 'success' ? 'text-[#00f2ff]' : 'text-rose-400'}`}>
            {avatarMsgText}
          </p>
        )}

        <button
          id="save-avatar-btn"
          onClick={handleSaveAvatar}
          disabled={isSaving || selectedAvatar === user?.avatar || AVATARS.length === 0}
          className="px-6 py-3 rounded-2xl font-black text-black bg-[#00f2ff] hover:bg-[#70f3ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-wider glow-cyan cursor-pointer"
        >
          {isSaving ? 'Guardando...' : 'Guardar Avatar'}
        </button>
      </div>

      {/* Change Password Card */}
      <div className="bg-[#0d1f42]/90 border border-white/10 rounded-3xl p-6 shadow-xl">
        <h2 className="text-sm font-black text-white mb-5 flex items-center gap-2">
          <span className="text-[#00f2ff]"><ShieldIcon /></span>
          Cambiar Contraseña
        </h2>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <PasswordInput
            id="current-password"
            label="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="border-t border-white/5 pt-1" />

          <PasswordInput
            id="new-password"
            label="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <PasswordInput
            id="confirm-password"
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
          />

          {pwdMessage.text && (
            <p className={`text-xs font-bold ${pwdMessage.type === 'success' ? 'text-[#00f2ff]' : 'text-rose-400'}`}>
              {pwdMessage.text}
            </p>
          )}

          <button
            id="change-password-btn"
            type="submit"
            disabled={pwdSaving}
            className="mt-2 px-6 py-3 rounded-2xl font-black text-black bg-[#00f2ff] hover:bg-[#70f3ff] transition-all disabled:opacity-40 text-xs uppercase tracking-wider glow-cyan w-fit cursor-pointer"
          >
            {pwdSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
