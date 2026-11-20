import { Link } from 'react-router-dom';

const games = [
  { name: 'DI ATAS', status: 'Working', img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300&q=80' },
  { name: 'URBAN RELOAD', status: 'Working', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80' },
  { name: 'Lompat Menara untuk Hewan', status: 'Working', img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&q=80' },
  { name: 'MENDAKI UNTUK MENGUMPULKAN TELUR', status: 'Working', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=80' },
];

export default function HomePage() {
  const loaderScript = `loadstring(game:HttpGet("https://raw.githubusercontent.com/SlimexDev/LoaderScript/refs/heads/main/LoaderScript.lua"))()`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      
      {/* Hero Section (Kiri Teks, Kanan Gambar) */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10 mb-24">
        
        {/* Kiri: Teks & Loader */}
        <div className="w-full md:w-1/2 flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1a22] border border-[#2a2a35] text-[10px] text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            BOKHUB × Roblox
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6">
            Satu skrip.<br />
            Setiap<br />
            pertandingan
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-sm">
            Dapatkan kunci gratis, salin loader, dan mulai main.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/key" className="bg-[#8bff5e] hover:bg-[#7be652] text-black font-semibold py-2 px-5 rounded-md text-sm transition-colors">
              Dapatkan kunci
            </Link>
            <Link to="/premium" className="bg-transparent border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10 font-semibold py-2 px-5 rounded-md text-sm transition-colors">
              Dapatkan Premium
            </Link>
          </div>

          {/* Loader Box Hijau */}
          <div className="w-full bg-[#0d1a13] border border-[#1e3a2b] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400">Skrip pemuat</span>
              <span className="text-[10px] bg-[#1a1a22] text-gray-500 px-2 py-0.5 rounded border border-[#2a2a35]">Salin</span>
            </div>
            <div className="bg-black/50 rounded p-3 mb-3 font-mono text-xs text-[#8bff5e] break-all border border-[#1e3a2b]">
              {loaderScript}
            </div>
            <p className="text-[11px] text-gray-500">
              Tempelkan ke executor Anda, lalu masukkan kunci Anda di jendela BOKHUB.
            </p>
          </div>
        </div>

        {/* Kanan: Visual / Gambar 3D */}
        <div className="w-full md:w-1/2 flex justify-center relative">
          {/* Efek Glow di belakang gambar */}
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full w-3/4 h-3/4 m-auto"></div>
          
          {/* Placeholder Gambar Karakter (Bisa diganti dengan file PNG Anda) */}
          <img 
            src="https://i.ibb.co/6P9Z5q9/slime-character.png" 
            alt="BOKHUB Character" 
            className="relative z-10 w-full max-w-md object-contain drop-shadow-2xl opacity-90"
            onError={(e) => {
              // Fallback jika gambar gagal load
              e.target.src = "https://cdn-icons-png.flaticon.com/512/3401/3401100.png";
              e.target.style.opacity = "0.5";
              e.target.style.filter = "hue-rotate(90deg)"; 
            }}
          />
        </div>
      </section>

      {/* Game yang didukung */}
      <section className="mb-16">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">Game yang didukung</h2>
          <a href="#" className="text-xs text-gray-400 bg-[#1a1a22] px-3 py-1.5 rounded-md border border-[#2a2a35] hover:text-white">Lihat semua game</a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games.map((g) => (
            <div key={g.name} className="bg-[#1a1a22] border border-[#2a2a35] rounded-lg overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-colors">
              {/* Thumbnail Game */}
              <div className="h-28 w-full bg-gray-800 relative overflow-hidden">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2 bg-emerald-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1 h-1 bg-black rounded-full"></span>
                  Working
                </div>
              </div>
              {/* Title */}
              <div className="p-3">
                <p className="text-xs font-semibold truncate">{g.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bagian Bawah: "Dari nol hingga masuk" */}
      <section className="text-center py-12 border-t border-[#2a2a35]">
        <h2 className="text-2xl font-bold mb-2">Dari nol hingga masuk</h2>
        <p className="text-gray-400 text-sm">Tiga langkah mudah untuk memulai.</p>
      </section>

    </div>
  );
}