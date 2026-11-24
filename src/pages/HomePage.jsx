import { Link } from 'react-router-dom';

// Put above.jpg inside the /public folder
const games = [
  { name: 'ABOVE', status: 'Working', img: '/above.jpg' },
];

export default function HomePage() {
  const loaderScript = `https://raw.githubusercontent.com/AzkaFajril/123123213/refs/heads/main/rbx.lua"))()`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10 mb-24">

        {/* Left: Text & Loader */}
        <div className="w-full md:w-1/2 flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1a22] border border-[#2a2a35] text-[10px] text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            BOKHUB × Roblox
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6">
           BokHub
          </h1>

          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-sm">
            Get a free key, copy the loader, and start playing.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/key" className="bg-[#8bff5e] hover:bg-[#7be652] text-black font-semibold py-2 px-5 rounded-md text-sm transition-colors">
              Get Key
            </Link>
            <Link to="/premium" className="bg-transparent border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10 font-semibold py-2 px-5 rounded-md text-sm transition-colors">
              Get Premium
            </Link>
          </div>

          {/* Loader Box */}
          <div className="w-full bg-[#0d1a13] border border-[#1e3a2b] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400">Loader script</span>
              <button
                onClick={() => navigator.clipboard.writeText(loaderScript)}
                className="text-[10px] bg-[#1a1a22] text-gray-500 hover:text-white px-2 py-0.5 rounded border border-[#2a2a35] transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-black/50 rounded p-3 mb-3 font-mono text-xs text-[#8bff5e] break-all border border-[#1e3a2b]">
              {loaderScript}
            </div>
            <p className="text-[11px] text-gray-500">
              Paste it into your executor, then enter your key in the BOKHUB window.
            </p>
          </div>
        </div>

        {/* Right: Themed image */}
        <div className="w-full md:w-1/2 flex justify-center relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full w-3/4 h-3/4 m-auto"></div>
          <img
            src="/above.jpg"
            alt="Farm and mine scene from ABOVE"
            className="relative z-10 w-full max-w-md rounded-2xl border border-[#1e3a2b] object-cover shadow-2xl"
          />
        </div>
      </section>

      {/* Supported Games */}
      <section className="mb-16">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">Supported Games</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games.map((g) => (
            <div key={g.name} className="bg-[#1a1a22] border border-[#2a2a35] rounded-lg overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-colors">
              <div className="h-28 w-full bg-gray-800 relative overflow-hidden">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2 bg-emerald-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1 h-1 bg-black rounded-full"></span>
                  {g.status}
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold truncate">{g.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom section */}
      <section className="text-center py-12 border-t border-[#2a2a35]">
        <h2 className="text-2xl font-bold mb-2">From zero to in-game</h2>
        <p className="text-gray-400 text-sm">Three easy steps to get started.</p>
      </section>

    </div>
  );
}