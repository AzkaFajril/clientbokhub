import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import KeyPage from './pages/KeyPage';
import PremiumPage from './pages/PremiumPage';
import ResetPage from './pages/ResetPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const location = useLocation();
  
  // Cek apakah sedang di halaman admin
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col bg-bok-bg text-white">
      {/* Sembunyikan Navbar jika di halaman admin */}
      {!isAdminPage && <Navbar />}
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/key" element={<KeyPage />} />
          <Route path="/keyy" element={<KeyPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/reset" element={<ResetPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Sembunyikan Footer juga jika di halaman admin (opsional) */}
      {!isAdminPage && <Footer />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-400 mb-6">Halaman tidak ditemukan.</p>
      <a href="/" className="bg-bok-accent hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg">Kembali ke Beranda</a>
    </div>
  );
}