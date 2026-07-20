import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 rounded-2xl p-5 flex flex-col gap-2 shadow-xl hover:border-[#00f2ff] transition-all">
      <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/30">
        {icon}
      </div>
      <p className="text-3xl font-black text-white mt-1">{value ?? '—'}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in">
      <div className="bg-[#0d1f42] border border-[#00f2ff]/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center">
        <p className="text-white text-sm font-bold leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors border border-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-colors shadow-lg"
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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user', durationDays: '0', customDays: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '', role: 'user', expires_at: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

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
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await authFetch(`${API_BASE}/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authFetch, filter, debouncedSearch]);

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

    const parsedDays = createForm.durationDays === 'custom'
      ? parseInt(createForm.customDays) || 0
      : parseInt(createForm.durationDays);

    const payload = {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      durationDays: createForm.role === 'admin' ? 0 : parsedDays
    };

    try {
      const res = await authFetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Usuario '${createForm.username}' creado con éxito`, 'success');
        setCreateForm({ username: '', email: '', password: '', role: 'user', durationDays: '0', customDays: '' });
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

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsEditing(true);

    const payload = {
      username: editForm.username,
      email: editForm.email,
      role: editForm.role,
      expires_at: editForm.role === 'admin' || !editForm.expires_at ? null : new Date(editForm.expires_at).toISOString()
    };

    if (editForm.password && editForm.password.trim().length > 0) {
      payload.password = editForm.password;
    }

    try {
      const res = await authFetch(`${API_BASE}/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Usuario '${editForm.username}' actualizado`, 'success');
        setEditingUser(null);
        fetchUsers(pagination.page);
        fetchStats();
      } else {
        setEditError(data.message || 'Error al actualizar usuario');
      }
    } catch (_err) {
      setEditError('Error de conexión');
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getExpirationStatus = (user) => {
    if (user.role === 'admin' || !user.expires_at) return { text: 'Ilimitado', style: 'text-[#00f2ff] font-bold' };
    const expiry = new Date(user.expires_at);
    const now = new Date();
    if (expiry < now) return { text: 'Expirado', style: 'text-rose-400 font-bold' };

    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { text: 'Expira mañana', style: 'text-amber-400 font-bold animate-pulse' };

    return { text: `Expira en ${diffDays} días`, style: diffDays <= 5 ? 'text-amber-400 font-bold' : 'text-slate-300 font-semibold' };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-[#0d1f42]/90 border border-[#00f2ff]/30 p-6 rounded-3xl shadow-2xl flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-[#00f2ff]"><Icons.Lightning className="w-6 h-6" /></span> Panel de Administración
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">Gestión completa de usuarios y métricas de LunielAnime</p>
        </div>

        <button
          id="admin-create-user-btn"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-6 py-3 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black font-black text-xs uppercase tracking-wider transition-all glow-cyan shadow-xl cursor-pointer"
        >
          {showCreateForm ? '✕ Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-premium border border-[#00f2ff]/40 text-white text-xs font-black px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2.5 glow-cyan">
          {toast.type === 'success' ? (
            <span className="text-[#00f2ff]"><Icons.Check className="w-4 h-4" /></span>
          ) : (
            <span className="text-rose-400"><Icons.AlertCircle className="w-4 h-4" /></span>
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Confirm modal */}
      {modal && (
        <ConfirmModal
          message={
            modal.type === 'ban'
              ? `¿Suspender a @${modal.username}? No podrá ingresar a la plataforma.`
              : modal.type === 'unban'
              ? `¿Reactivar la cuenta de @${modal.username}?`
              : `¿Eliminar permanentemente a @${modal.username}? Esta acción no se puede deshacer.`
          }
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Crear Nuevo Usuario</h2>
          {createError && (
            <p className="text-rose-300 text-xs font-bold p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">{createError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'cu-username', label: 'Username', key: 'username', type: 'text', placeholder: 'usuario' },
              { id: 'cu-email', label: 'Email', key: 'email', type: 'email', placeholder: 'correo@ejemplo.com' },
              { id: 'cu-password', label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ id, label, key, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
                <input
                  id={id}
                  type={type}
                  required
                  placeholder={placeholder}
                  value={createForm[key]}
                  onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff]"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cu-role" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rol</label>
              <select
                id="cu-role"
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff] cursor-pointer"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {createForm.role === 'user' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cu-duration" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Duración de Acceso</label>
                <select
                  id="cu-duration"
                  value={createForm.durationDays}
                  onChange={(e) => setCreateForm((f) => ({ ...f, durationDays: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                >
                  <option value="0">Ilimitado</option>
                  <option value="7">7 Días</option>
                  <option value="30">30 Días</option>
                  <option value="60">2 Meses (+60d)</option>
                  <option value="90">3 Meses (+90d)</option>
                  <option value="180">6 Meses (+180d)</option>
                  <option value="365">1 Año (+365d)</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-3 rounded-2xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black font-black text-xs uppercase tracking-wider transition-all glow-cyan cursor-pointer"
          >
            {isCreating ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {/* Stats Grid */}
      {isLoadingStats ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-t-[#00f2ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin glow-cyan" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Icons.Users />} label="Total usuarios" value={stats?.total_users} />
          <StatCard icon={<Icons.UserPlus />} label="Nuevos hoy" value={stats?.new_today} />
          <StatCard icon={<Icons.Calendar />} label="Esta semana" value={stats?.new_this_week} />
          <StatCard icon={<Icons.Activity />} label="Activos (7d)" value={stats?.active_last_week} />
          <StatCard icon={<Icons.Banned />} label="Suspendidos" value={stats?.total_banned} />
          <StatCard icon={<Icons.Heart />} label="Favoritos" value={stats?.total_favorites} />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#0d1f42]/90 border border-[#00f2ff]/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <h2 className="text-sm font-black text-white whitespace-nowrap">
              Usuarios ({pagination.total})
            </h2>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs bg-[#030b1e] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00f2ff]"
            />
          </div>

          <div className="flex gap-2">
            {['', 'banned', 'admin'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-[#00f2ff] text-black shadow-md glow-cyan'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {f === '' ? 'Todos' : f === 'banned' ? 'Suspendidos' : 'Admins'}
              </button>
            ))}
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-[#00f2ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin glow-cyan" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-16">Sin usuarios que mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-white/10 bg-[#081631]">
                  <th className="text-left px-6 py-3.5">Usuario</th>
                  <th className="text-left px-6 py-3.5 hidden md:table-cell">Email</th>
                  <th className="text-left px-6 py-3.5 hidden sm:table-cell">Rol</th>
                  <th className="text-left px-6 py-3.5 hidden md:table-cell">Acceso</th>
                  <th className="text-left px-6 py-3.5">Estado</th>
                  <th className="text-right px-6 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#00f2ff]/5 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-white">@{u.username}</td>
                    <td className="px-6 py-3.5 text-slate-300 hidden md:table-cell">{u.email}</td>
                    <td className="px-6 py-3.5 hidden sm:table-cell">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase ${
                        u.role === 'admin'
                          ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30'
                          : 'bg-white/5 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      {(() => {
                        const status = getExpirationStatus(u);
                        return <span className={status.style}>{status.text}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                        u.is_banned ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.is_banned ? 'Suspendido' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({
                              username: u.username,
                              email: u.email,
                              password: '',
                              role: u.role,
                              expires_at: u.expires_at ? u.expires_at.split('T')[0] : ''
                            });
                          }}
                          className="text-[#00f2ff] font-bold text-xs hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => setModal({ type: 'unban', userId: u.id, username: u.username })}
                            className="text-emerald-400 font-bold text-xs hover:underline cursor-pointer"
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ type: 'ban', userId: u.id, username: u.username })}
                            className="text-amber-400 font-bold text-xs hover:underline cursor-pointer"
                          >
                            Suspender
                          </button>
                        )}
                        <button
                          onClick={() => setModal({ type: 'delete', userId: u.id, username: u.username })}
                          className="text-rose-400 font-bold text-xs hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in">
          <div className="bg-[#0d1f42] border border-[#00f2ff]/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span className="text-[#00f2ff]">✏️</span> Editar Usuario: @{editingUser.username}
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500 hover:text-white flex items-center justify-center text-slate-400 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <p className="text-rose-300 text-xs font-bold p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">{editError}</p>
            )}

            <form onSubmit={handleEditUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-username" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Username</label>
                  <input
                    id="edit-username"
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-email" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-role" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rol</label>
                  <select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-password" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nueva Contraseña (Opcional)</label>
                  <input
                    id="edit-password"
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    value={editForm.password}
                    onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl bg-[#030b1e] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00f2ff]"
                  />
                </div>
              </div>

              {/* Expiration Settings (Only for users) */}
              {editForm.role === 'user' && (
                <div className="flex flex-col gap-2.5 p-4 bg-[#030b1e] border border-white/10 rounded-2xl">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Duración del Acceso</label>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setDate(now.getDate() + 7);
                        setEditForm(f => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                      }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-[#00f2ff]/20 hover:text-[#00f2ff] text-slate-300 transition-all border border-white/10 cursor-pointer"
                    >
                      +7 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setDate(now.getDate() + 30);
                        setEditForm(f => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                      }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-[#00f2ff]/20 hover:text-[#00f2ff] text-slate-300 transition-all border border-white/10 cursor-pointer"
                    >
                      +30 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, expires_at: '' }))}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-[#00f2ff]/20 hover:text-[#00f2ff] text-slate-300 transition-all border border-white/10 cursor-pointer"
                    >
                      Ilimitado
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const now = new Date();
                        if (val === '2m') now.setMonth(now.getMonth() + 2);
                        else if (val === '3m') now.setMonth(now.getMonth() + 3);
                        else if (val === '4m') now.setMonth(now.getMonth() + 4);
                        else if (val === '6m') now.setMonth(now.getMonth() + 6);
                        else if (val === '1y') now.setFullYear(now.getFullYear() + 1);
                        setEditForm(f => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                        e.target.value = '';
                      }}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#081631] border border-white/10 text-slate-300 focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                    >
                      <option value="" className="bg-[#081631] text-slate-400">➕ Añadir meses / año...</option>
                      <option value="2m" className="bg-[#081631] text-white">+2 Meses</option>
                      <option value="3m" className="bg-[#081631] text-white">+3 Meses</option>
                      <option value="4m" className="bg-[#081631] text-white">+4 Meses</option>
                      <option value="6m" className="bg-[#081631] text-white">+6 Meses</option>
                      <option value="1y" className="bg-[#081631] text-white">+1 Año</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-expiry-date" className="text-[10px] font-bold text-slate-400">Fecha de Expiración Directa</label>
                    <input
                      id="edit-expiry-date"
                      type="date"
                      value={editForm.expires_at}
                      onChange={(e) => setEditForm(f => ({ ...f, expires_at: e.target.value }))}
                      className="px-4 py-2 rounded-xl bg-[#081631] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00f2ff]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all border border-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-6 py-2.5 rounded-xl bg-[#00f2ff] hover:bg-[#70f3ff] text-black font-black text-xs uppercase tracking-wider transition-all glow-cyan cursor-pointer"
                >
                  {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
