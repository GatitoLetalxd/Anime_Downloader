import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Professional Lucide-based SVG icons
const Icons = {
  Users: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  UserPlus: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Activity: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h2l2 9-4-18 2 9h2" />
    </svg>
  ),
  Banned: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  Heart: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Lightning: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  AlertCircle: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

function StatCard({ icon, label, value, color = 'red' }) {
  const colorMap = {
    red: 'from-accent-red/20 to-accent-red/5 border-accent-red/30 text-accent-red',
    purple: 'from-accent-purple/20 to-accent-purple/5 border-accent-purple/30 text-accent-purple',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-current">
        {icon}
      </div>
      <p className="text-3xl font-black text-white mt-1">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-white text-base font-semibold mb-6 text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null); // { type: 'ban'|'unban'|'delete', userId, username }
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null); // { text, type: 'success' | 'error' }

  // Create user form
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/admin/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } finally {
      setIsLoadingStats(false);
    }
  }, [authFetch]);

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter) params.set('filter', filter);
      const res = await authFetch(`${API_BASE}/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authFetch, filter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(modal.userId);
    setModal(null);
    try {
      let url, method;
      if (modal.type === 'ban') { url = `/api/admin/users/${modal.userId}/ban`; method = 'PATCH'; }
      else if (modal.type === 'unban') { url = `/api/admin/users/${modal.userId}/unban`; method = 'PATCH'; }
      else { url = `/api/admin/users/${modal.userId}`; method = 'DELETE'; }

      const res = await authFetch(`${API_BASE}${url}`, { method });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Acción completada', 'success');
        fetchUsers(pagination.page);
        fetchStats();
      } else {
        showToast(data.message || 'Error', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Usuario '${createForm.username}' creado con éxito`, 'success');
        setCreateForm({ username: '', email: '', password: '', role: 'user' });
        setShowCreateForm(false);
        fetchUsers(1);
        fetchStats();
      } else {
        setCreateError(data.message || 'Error al crear usuario');
      }
    } catch (_err) {
      setCreateError('Error de conexión');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-accent-red"><Icons.Lightning className="w-6 h-6 text-accent-red" /></span> Panel de Administración
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestión de usuarios y estadísticas de LunielAnime</p>
        </div>
        <button
          id="admin-create-user-btn"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-red to-accent-purple text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          {showCreateForm ? '✕ Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-bg-secondary border border-white/20 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2.5">
          {toast.type === 'success' ? (
            <span className="text-green-400"><Icons.Check className="w-4 h-4 text-green-400" /></span>
          ) : (
            <span className="text-red-400"><Icons.AlertCircle className="w-4 h-4 text-red-400" /></span>
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Confirm modal */}
      {modal && (
        <ConfirmModal
          message={
            modal.type === 'ban'
              ? `¿Suspender a @${modal.username}? No podrá iniciar sesión.`
              : modal.type === 'unban'
              ? `¿Reactivar la cuenta de @${modal.username}?`
              : `¿Eliminar permanentemente a @${modal.username}? Esta acción no se puede deshacer.`
          }
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Create user form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="bg-bg-secondary border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-bold text-white mb-4">Crear nuevo usuario</h2>
          {createError && (
            <p className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">{createError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { id: 'cu-username', label: 'Username', key: 'username', type: 'text', placeholder: 'johndoe' },
              { id: 'cu-email', label: 'Email', key: 'email', type: 'email', placeholder: 'john@email.com' },
              { id: 'cu-password', label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ id, label, key, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                <input
                  id={id}
                  type={type}
                  required
                  placeholder={placeholder}
                  value={createForm[key]}
                  onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-accent-red/60 transition-all"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cu-role" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
              <select
                id="cu-role"
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-red/60 transition-all appearance-none"
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-red to-accent-purple text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isCreating ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {/* Stats grid */}
      {isLoadingStats ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-t-accent-red border-r-accent-purple border-b-transparent border-l-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <StatCard icon={<Icons.Users />} label="Total usuarios" value={stats?.total_users} color="red" />
          <StatCard icon={<Icons.UserPlus />} label="Nuevos hoy" value={stats?.new_today} color="purple" />
          <StatCard icon={<Icons.Calendar />} label="Esta semana" value={stats?.new_this_week} color="blue" />
          <StatCard icon={<Icons.Activity />} label="Activos (7 días)" value={stats?.active_last_week} color="green" />
          <StatCard icon={<Icons.Banned />} label="Suspendidos" value={stats?.total_banned} color="orange" />
          <StatCard icon={<Icons.Heart />} label="Favoritos totales" value={stats?.total_favorites} color="pink" />
        </div>
      )}

      {/* Users table */}
      <div className="bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 gap-4 flex-wrap">
          <h2 className="text-sm font-bold text-white">
            Usuarios ({pagination.total})
          </h2>
          <div className="flex gap-2">
            {['', 'banned', 'admin'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filter === f
                    ? 'bg-accent-red text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {f === '' ? (
                  'Todos'
                ) : f === 'banned' ? (
                  <>
                    <Icons.Banned className="w-3.5 h-3.5" />
                    <span>Suspendidos</span>
                  </>
                ) : (
                  <>
                    <Icons.Lightning className="w-3.5 h-3.5" />
                    <span>Admins</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-accent-red border-r-accent-purple border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">Sin usuarios que mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Rol</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Registro</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-red/40 to-accent-purple/40 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white font-semibold">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        u.role === 'admin'
                          ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        {u.role === 'admin' && <Icons.Lightning className="w-3 h-3 text-accent-red" />}
                        <span>{u.role === 'admin' ? 'Admin' : 'Usuario'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                        u.is_banned
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {u.is_banned ? (
                          <>
                            <Icons.Banned className="w-3.5 h-3.5 text-red-400" />
                            <span>Suspendido</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span>Activo</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === u.id ? (
                          <span className="w-5 h-5 border-2 border-t-accent-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {u.is_banned ? (
                              <button
                                onClick={() => setModal({ type: 'unban', userId: u.id, username: u.username })}
                                title="Reactivar"
                                className="text-green-400 hover:text-green-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-green-500/10 transition-all"
                              >
                                Reactivar
                              </button>
                            ) : (
                              <button
                                onClick={() => setModal({ type: 'ban', userId: u.id, username: u.username })}
                                title="Suspender"
                                className="text-orange-400 hover:text-orange-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-orange-500/10 transition-all"
                              >
                                Suspender
                              </button>
                            )}
                            <button
                              onClick={() => setModal({ type: 'delete', userId: u.id, username: u.username })}
                              title="Eliminar"
                              className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-white/10">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchUsers(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  pagination.page === p
                    ? 'bg-accent-red text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
