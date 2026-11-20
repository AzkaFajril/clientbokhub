import { useState } from 'react';

export default function LoaderBox() {
  const [copied, setCopied] = useState(false);
  const loaderUrl = 'https://raw.githubusercontent.com/Anda/BOKHUB/main/loader.lua';
  const script = `loadstring(game:HttpGet("${loaderUrl}"))()`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin. Salin manual ya.');
    }
  };

  return (
    <div className="bg-bok-card border border-bok-border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-1">Loader Script</h2>
      <p className="text-sm text-gray-400 mb-4">Paste di executor Anda, lalu masukkan key di window BOKHUB.</p>
      <div className="bg-black/50 border border-bok-border rounded-lg p-4 font-mono text-xs md:text-sm text-green-300 break-all mb-4">
        {script}
      </div>
      <button onClick={copy} className="w-full bg-bok-border hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
        {copied ? '✓ Tersalin!' : 'Salin Loader'}
      </button>
    </div>
  );
}