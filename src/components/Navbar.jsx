import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="border-b border-[#262626]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Menu Kiri */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#8bff5e] flex items-center justify-center font-bold text-black text-sm">
              B
            </div>
            <span className="font-semibold text-sm">BOKHUB</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors">Beranda</Link>
            <Link to="/key" className="text-sm text-gray-300 hover:text-white transition-colors">Dapatkan Kunci</Link>
            <Link to="/premium" className="text-sm text-gray-300 hover:text-white transition-colors">Premium</Link>
            {/* Menu Baru untuk Reset HWID */}
            <Link to="/reset" className="text-sm text-gray-300 hover:text-white transition-colors">Reset Perangkat</Link>
            <Link to="#" className="text-sm text-gray-300 hover:text-white transition-colors">F.A.Q</Link>
          </div>
        </div>

        {/* Kanan: Sosmed & Tombol Discord */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 hidden sm:inline-block">12 <span className="text-[10px]">Online</span></span>
          <a href="#" className="bg-[#8bff5e] hover:bg-[#7be652] text-black text-xs font-semibold px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors">
            Gabung Discord
          </a>
        </div>
      </div>
    </nav>
  );
}