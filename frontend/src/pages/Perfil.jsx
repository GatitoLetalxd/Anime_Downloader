import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Dynamically import all avatar images from the assets/avatars folder
const avatarModules = import.meta.glob('../assets/avatars/*.png', { eager: true });
const AVATARS = Object.entries(avatarModules).map(([path, mod]) => ({
  name: path.split('/').pop(),
  src: mod.default,
}));

// Fallback if no avatars exist yet
const DEFAULT_AVATAR_EMOJI = '🎌';

// ── Icons ──────────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ── Password Input ─────────────────────────────────────────────────────────────
function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-red/60 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Perfil() {
  const { user, authFetch, refreshSession } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar_01.png');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  useEffect(() => {
    if (user?.avatar) setSelectedAvatar(user.avatar);
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
    const found = AVATARS.find((a) => a.name === name);
    return found?.src || null;
  };

  const currentAvatarSrc = getAvatarSrc(user?.avatar);
  const [avatarMsgType, avatarMsgText] = message.includes(':')
    ? message.split(':')
    : ['', message];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <span className="text-accent-red"><UserIcon /></span>
        Mi Perfil
      </h1>

      {/* Profile card */}
      <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6 mb-6 flex items-center gap-5">
        {/* Current avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-red/30 to-accent-purple/30 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {currentAvatarSrc ? (
            <img src={currentAvatarSrc} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{DEFAULT_AVATAR_EMOJI}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold text-white">{user?.username}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span
            className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
              user?.role === 'admin'
                ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            {user?.role === 'admin' ? '⚡ Admin' : 'Usuario'}
          </span>
        </div>
      </div>

      {/* Avatar selector */}
      <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-4">Elegir Avatar</h2>

        {AVATARS.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center">
            No hay avatares disponibles aún. Coloca imágenes en{' '}
            <code className="text-slate-400">frontend/src/assets/avatars/</code>
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-5">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.name}
                onClick={() => setSelectedAvatar(avatar.name)}
                className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                  selectedAvatar === avatar.name
                    ? 'border-accent-red shadow-lg shadow-accent-red/30 scale-105'
                    : 'border-white/10 hover:border-white/30'
                }`}
                title={avatar.name}
              >
                <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Feedback message */}
        {avatarMsgText && (
          <p className={`text-sm mb-3 flex items-center gap-1.5 ${avatarMsgType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {avatarMsgType === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            {avatarMsgText}
          </p>
        )}

        {/* Save button */}
        <button
          id="save-avatar-btn"
          onClick={handleSaveAvatar}
          disabled={isSaving || selectedAvatar === user?.avatar || AVATARS.length === 0}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-red to-accent-purple hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {isSaving ? 'Guardando...' : 'Guardar Avatar'}
        </button>
      </div>

      {/* ── Change Password ──────────────────────────────────────────────────── */}
      <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-accent-red"><ShieldIcon /></span>
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

          {/* Divider */}
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

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    newPassword.length >= i * 4
                      ? i === 1 ? 'bg-red-500' : i === 2 ? 'bg-yellow-400' : 'bg-green-400'
                      : 'bg-white/10'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1">
                {newPassword.length < 4 ? 'Débil' : newPassword.length < 8 ? 'Regular' : 'Fuerte'}
              </span>
            </div>
          )}

          {/* Feedback */}
          {pwdMessage.text && (
            <p className={`text-sm flex items-center gap-1.5 ${pwdMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {pwdMessage.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
              {pwdMessage.text}
            </p>
          )}

          <button
            id="change-password-btn"
            type="submit"
            disabled={pwdSaving}
            className="mt-1 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-red to-accent-purple hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-sm w-fit"
          >
            {pwdSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
