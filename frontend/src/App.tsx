import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { WelcomePage } from './pages/WelcomePage';
import { BracketPage } from './pages/BracketPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { CardPage } from './pages/CardPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col font-body text-white selection:bg-saff-green selection:text-white relative">
      {/* Fixed Stadium Viewport Background (Guarantees identical gradient depth across all pages) */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'linear-gradient(180deg, #1A2BD6 0%, #0A1270 100%)',
        }}
      />

      {/* Top Bar for public pages */}
      {!isAdmin && <TopBar />}

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/bracket" element={<BracketPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/card" element={<CardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Catch-all fallback */}
          <Route path="*" element={<WelcomePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
