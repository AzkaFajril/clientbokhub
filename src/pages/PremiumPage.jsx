import { useState, useEffect } from 'react';
import { API } from '../utils/api';

const DISCORD_URL = 'https://discord.gg/8qh4UsmVkx';
const GOLD = '#f5c451';

/* ---------- client id ---------- */
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* abaikan */ } },
};
const getClientId = () => {
  let id = store.get('bokhub_client_id');
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
    store.set('bokhub_client_id', id);
  }
  return id;
};
const headers = { 'Content-Type': 'application/json', 'x-client-id': getClientId() };

/* ---------- data ---------- */
const PLANS = [
  { id: 'weekly', title: '7 hari', note: 'Untuk mencoba' },
  { id: 'monthly', title: '30 hari', note: 'Untuk pemakaian rutin' },
  { id: 'lifetime', title: 'Lifetime', note: 'Tanpa batas waktu' },
];
const PLAN_LABEL = { weekly: '7 hari', monthly: '30 hari', lifetime: 'Lifetime' };

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

/* ---------- icons ---------- */
const Svg = ({ className = 'w-4 h-4', children, sw = 2 }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const CheckIcon = ({ className }) => <Svg className={className} sw={3}><path d="M5 13l4 4L19 7" /></Svg>;
const LockIcon = ({ className }) => (
  <Svg className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);
const BoltIcon = ({ className }) => <Svg className={className}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Svg>;
const GemIcon = ({ className }) => (
  <Svg className={className}>
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path d="M2 9h20M9 3l3 6 3-6M12 21L9 9m3 12l3-12" />
  </Svg>
);

/* ---------- page ---------- */
export default function PremiumPage() {
  const [plan, setPlan] = useState('monthly');
  const [name, setName] = useState(store.get('bokhub_premium_name') || '');
  const [myKeys, setMyKeys] = useState([]);
  const [freeMode, setFreeMode] = useState(true);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState('');
  const [fresh, setFresh] = useState(null);

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  };

  const loadMine = async () => {
    const res = await fetch(`${API}/premium/mine`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Gagal memuat kunci premium');
    setMyKeys(data.keys || []);
    setFreeMode(data.freeMode !== false);
  };

  useEffect(() => {
    loadMine()
      .catch((e) => setError(e.message))
      .finally(() => setBooting(false));
  }, []);

  const claim = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/premium/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal klaim premium');
      store.set('bokhub_premium_name', name.trim());
      setFresh(data.key); // Kunci baru
      await loadMine(); // Reload daftar
      showToast('Kunci premium berhasil dibuat!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDevice = async (key) => {
    setError('');
    try {
      const res = await fetch(`${API}/premium/${encodeURIComponent(key)}/reset-hwid`, { method: 'POST', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error + (data.nextResetAt ? ` (bisa lagi ${fmt(data.nextResetAt)})` : ''));
      await loadMine();
      showToast('Perangkat direset');
    } catch (e) {
      setError(e.message);
    }
  };

  const copy = (text, id) => {
    try { navigator.clipboard.writeText(text); } catch { /* abaikan */ }
    setCopied(id);
    setTimeout(() => setCopied(''), 1800);
  };

  const nameOk = name.trim().length >= 2;

  return (
    <div className="text-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1a1608] border border-[#f5c451]/40 text-[#f5c451] text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          <CheckIcon className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* HERO */}
        <header className="text-center max-w-2xl mx-auto mb-12">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-5 border"
            style={{ color: GOLD, borderColor: `${GOLD}55`, background: `${GOLD}12` }}
          >
            <GemIcon className="w-3.5 h-3.5" />
            Premium BOKHUB
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">Lewati semua checkpoint.</h1>
          <p className="text-gray-400 leading-relaxed">
            Ambil kunci 7 hari, 30 hari, atau lifetime langsung dari sini. Tanpa iklan, tanpa langkah tambahan, dan
            dengan akses ke script eksklusif.
          </p>
        </header>

        {/* KLAIM */}
        <section className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-1 text-center">Pilih paket</h2>
          <p className="text-sm text-gray-400 mb-6 text-center">
            {freeMode
              ? 'Selama masa pembukaan, semua paket gratis. Cukup isi nama Anda.'
              : 'Pembayaran belum tersedia. Segera hadir.'}
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {PLANS.map((p) => {
              const active = plan === p.id;
              const featured = p.id === 'lifetime';
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`text-left rounded-xl border p-4 transition-colors relative ${
                    active ? 'bg-[#f5c451]/10' : 'bg-white/[0.02] hover:border-white/30'
                  }`}
                  style={{ borderColor: active ? GOLD : 'rgba(255,255,255,0.1)' }}
                >
                  {featured && (
                    <span className="absolute -top-2.5 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full text-black" style={{ background: GOLD }}>
                      Sekali ambil
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">{p.title}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'text-black' : 'border-white/20'}`}
                      style={active ? { background: GOLD, borderColor: GOLD } : undefined}
                    >
                      {active && <CheckIcon className="w-2.5 h-2.5" />}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{p.note}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold" style={{ color: GOLD }}>Gratis</span>
                    <span className="text-[11px] text-gray-500">harga resmi menyusul</span>
                  </div>
                </button>
              );
            })}
          </div>

          <label className="block text-sm font-semibold mb-2" htmlFor="premium-name">Nama</label>
          <input
            id="premium-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nameOk && !loading && freeMode && claim()}
            maxLength={32}
            placeholder="Nama Anda atau username Roblox"
            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#f5c451]/70 outline-none rounded-lg px-3.5 py-2.5 text-sm placeholder:text-gray-500 mb-4"
          />

          {error && (
            <div className="mb-4 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>
          )}

          <button
            onClick={claim}
            disabled={loading || !nameOk || !freeMode}
            className="w-full flex items-center justify-center gap-2 text-black font-semibold py-3 rounded-lg text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: GOLD }}
          >
            <BoltIcon className="w-4 h-4" />
            {loading ? 'Memproses...' : `Dapatkan ${PLAN_LABEL[plan]} sekarang`}
          </button>
        </section>

        {/* KUNCI PREMIUM SAYA (TAMPIL DI SINI SETELAH DAPAT) */}
        {!booting && myKeys.length > 0 && (
          <section className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">Kunci Premium Anda</h2>
            <div className="space-y-3">
              {myKeys.map((k) => (
                <div
                  key={k.key}
                  className="rounded-xl border p-4 bg-white/[0.02]"
                  style={{ borderColor: k.key === fresh ? `${GOLD}99` : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="font-mono text-sm break-all select-all font-bold" style={{ color: GOLD }}>{k.key}</span>
                    <button
                      onClick={() => copy(k.key, k.key)}
                      className="shrink-0 text-[11px] bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 rounded transition-colors"
                    >
                      {copied === k.key ? 'Tersalin ✓' : 'Salin Kunci'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
                    <span>Paket: <span className="text-white font-medium">{PLAN_LABEL[k.plan] || k.plan}</span></span>
                    <span>Atas nama: <span className="text-white font-medium">{k.ownerName}</span></span>
                    <span>
                      Berlaku: <span className="text-white font-medium">{k.plan === 'lifetime' ? 'Selamanya' : `sampai ${fmt(k.expiresAt)}`}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <LockIcon className="w-3 h-3" />
                        {k.hwidLocked ? 'Terkunci di 1 perangkat' : 'Belum dipakai'}
                      </span>
                      <button
                        onClick={() => resetDevice(k.key)}
                        disabled={!k.hwidLocked || !!k.nextResetAt}
                        title={k.nextResetAt ? `Bisa reset lagi ${fmt(k.nextResetAt)}` : 'Reset perangkat'}
                        className="px-2.5 py-1 rounded border border-white/15 text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        Reset perangkat
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BANTUAN */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-400 mb-3">Ada pertanyaan soal Premium?</p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
          >
            Tanya di Discord
          </a>
        </div>
      </div>
    </div>
  );
}