import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Public
import Login from './pages/Login';

// Lazy load protected pages for code splitting
const Inicio     = lazy(() => import('./pages/Inicio'));
const Buscar     = lazy(() => import('./pages/Buscar'));
const Descargas  = lazy(() => import('./pages/Descargas'));
const Historial  = lazy(() => import('./pages/Historial'));
const Favoritos  = lazy(() => import('./pages/Favoritos'));
const Perfil     = lazy(() => import('./pages/Perfil'));
const Admin      = lazy(() => import('./pages/Admin'));

// Custom premium loading component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-t-accent-red border-r-accent-purple border-b-transparent border-l-transparent animate-spin"></div>
    <p className="text-slate-400 text-sm font-semibold tracking-wider animate-pulse">Cargando...</p>
  </div>
);

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-slate-200 gradient-bg selection:bg-accent-red/30 selection:text-white">
      {/* Header Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Protected routes — require login */}
            <Route path="/" element={<PrivateRoute><Inicio /></PrivateRoute>} />
            <Route path="/buscar" element={<PrivateRoute><Buscar /></PrivateRoute>} />
            <Route path="/descargas" element={<PrivateRoute><Descargas /></PrivateRoute>} />
            <Route path="/historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
            <Route path="/favoritos" element={<PrivateRoute><Favoritos /></PrivateRoute>} />
            <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

            {/* Admin only */}
            <Route path="/admin" element={<PrivateRoute requireAdmin><Admin /></PrivateRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 bg-bg-secondary text-center text-xs text-slate-500 font-semibold">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>LunielAnime - Desarrollado por GatitoLetalxd</span>
          <span>Todos los derechos reservados © 2026.</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public route — login page has its own layout (no navbar) */}
            <Route path="/login" element={<Login />} />
            {/* All other routes go through the app layout with auth protection */}
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
