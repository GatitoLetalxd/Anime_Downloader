import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket';
import Navbar from './components/Navbar';
import Buscar from './pages/Buscar';
import Descargas from './pages/Descargas';
import Historial from './pages/Historial';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-bg-primary text-slate-200 gradient-bg selection:bg-accent-red/30 selection:text-white">
          {/* Header Navigation */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 w-full pb-16">
            <Routes>
              <Route path="/" element={<Buscar />} />
              <Route path="/descargas" element={<Descargas />} />
              <Route path="/historial" element={<Historial />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="py-6 border-t border-white/5 bg-bg-secondary text-center text-xs text-slate-500 font-semibold">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>AnimeDownloader - Desarrollado por GatitoLetalxd</span>
              <span>Todos los derechos reservados © 2026.</span>
            </div>
          </footer>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
