import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API } from '../utils/api';

const MAX_KEYS = 3;
const durations = [6, 12, 24];
const CHECKPOINTS_BY_DURATION = {
  6: 2,
  12: 3,
  24: 4,
};
const LOADER = `loadstring(game:HttpGet("https://raw.githubusercontent.com/AzkaFajril/123123213/refs/heads/main/rbx.lua"))()`;
const DISCORD_URL = 'https://discord.gg/8qh4UsmVkx';

const PROVIDERS = [
  { id: 'LootLabs', available: true },
  { id: 'Work.ink', available: false },
];
const AVAILABLE_PROVIDERS = PROVIDERS.filter((p) => p.available).map((p) => p.id);

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

// Token klaim manual (hanya dipakai kalau server memakai link fallback).
// Disimpan di localStorage supaya tetap ada setelah halaman dimuat ulang.
const FALLBACK_STORE_KEY = 'bokhub_fallback_tokens';
const loadFallbackTokens = () => {
  try {
    const parsed = JSON.parse(store.get(FALLBACK_STORE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};
const saveFallbackTokens = (obj) => store.set(FALLBACK_STORE_KEY, JSON.stringify(obj));

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
const CLIENT_ID = getClientId();
const headers = { 'Content-Type': 'application/json', 'x-client-id': CLIENT_ID };

const HIDDEN_TEXT = 'Hidden until checkpoints are completed';
const getItemId = (k) => k?.keyId || k?.maskedKey || k?.key || '';

/* ---------- Icons ---------- */
const Svg = ({ className = 'w-4 h-4', children, sw = 2 }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const CheckIcon = ({ className }) => <Svg className={className} sw={3}><path d="M5 13l4 4L19 7" /></Svg>;
const TrashIcon = ({ className }) => (
  <Svg className={className}>
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </Svg>
);
const KeyIcon = ({ className }) => (
  <Svg className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2L20 3m-3 3l3 3m-5-1l2 2" />
  </Svg>
);
const LayersIcon = ({ className }) => (
  <Svg className={className}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Svg>
);
const CodeIcon = ({ className }) => (
  <Svg className={className}>
    <path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />
  </Svg>
);
const ShieldIcon = ({ className }) => (
  <Svg className={className}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const DiscordIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} text-indigo-400`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.3 5.4A16.4 16.4 0 0015.2 4l-.2.4a15 15 0 013.7 1.8 14.6 14.6 0 00-13.4 0A15 15 0 019 4.4L8.8 4a16.4 16.4 0 00-4.1 1.4C2.1 9.3 1.4 13.1 1.7 16.9a16.5 16.5 0 005 2.5l1.1-1.7a10.6 10.6 0 01-1.7-.8l.4-.3a11.7 11.7 0 0010.1 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.4 16.4 0 005-2.5c.4-4.4-.7-8.2-3.1-11.5zM8.7 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
  </svg>
);
const ProviderIcon = ({ type, className = 'w-4 h-4' }) =>
  type === 'LootLabs' ? (
    <svg className={`${className} text-purple-400`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ) : (
    <svg className={`${className} text-sky-400`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.9 12a5 5 0 015-5h3v2.2h-3a2.8 2.8 0 000 5.6h3V17h-3a5 5 0 01-5-5zm16.2 0a5 5 0 01-5 5h-3v-2.2h3a2.8 2.8 0 000-5.6h-3V7h3a5 5 0 015 5zM8 11h8v2H8z" />
    </svg>
  );

const formatExpiry = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

/* ---------- Reusable pieces ---------- */
const TABS = [
  { id: 'get', label: 'Get key', Icon: KeyIcon },
  { id: 'mine', label: 'My keys', Icon: LayersIcon },
  { id: 'check', label: 'Check key', Icon: ShieldIcon },
  { id: 'script', label: 'Script', Icon: CodeIcon },
];

function TabBar({ tab, setTab, count }) {
  return (
    <div className="flex justify-center mb-10">
      <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
              tab === id ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === 'mine' && count > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-white/10 text-gray-300">{count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckpointPlan({ total, completed = 0, provider, allDone = false }) {
  const rows = Array.from({ length: total });
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl font-semibold">Checkpoint plan</h3>
        <span className="text-xs text-gray-500">{total} CP</span>
      </div>
      <div className="border-t border-white/10">
        {rows.map((_, i) => {
          const done = allDone || i < completed;
          const next = !allDone && i === completed;
          return (
            <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/10">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border text-xs ${
                  done
                    ? 'bg-[#8bff5e] border-[#8bff5e] text-black'
                    : next
                    ? 'border-white/40 text-white'
                    : 'border-white/10 text-gray-500'
                }`}
              >
                {done ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <ProviderIcon type={provider} className="w-4 h-4" />
              <span className={`text-sm font-semibold ${done ? 'text-[#8bff5e]' : next ? 'text-white' : 'text-gray-400'}`}>
                {provider} {i + 1}/{total}
              </span>
              <span className="ml-auto text-[11px] text-gray-500">
                {done ? 'Completed' : next ? 'Next' : 'Locked'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProviderPicker({ provider, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PROVIDERS.map(({ id: p, available }) => (
        <button
          key={p}
          onClick={() => available && onChange(p)}
          disabled={!available}
          title={available ? '' : 'Coming soon'}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-colors ${
            provider === p
              ? 'border-[#8bff5e] bg-[#8bff5e]/5 text-white'
              : 'border-white/10 text-gray-400 hover:border-white/30'
          } ${available ? '' : 'opacity-50 cursor-not-allowed hover:border-white/10'}`}
        >
          <ProviderIcon type={p} />
          {p}
          {!available && <span className="text-[10px] text-gray-500">Soon</span>}
        </button>
      ))}
    </div>
  );
}

const PrimaryButton = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full bg-[#8bff5e] hover:bg-[#7be652] text-black font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

/* ---------- Page ---------- */
export default function KeyPage() {
  const [tab, setTab] = useState('get');
  const [duration, setDuration] = useState(6);
  const [provider, setProvider] = useState(() => {
    const saved = store.get('bokhub_provider');
    return AVAILABLE_PROVIDERS.includes(saved) ? saved : AVAILABLE_PROVIDERS[0];
  });
  const [keys, setKeys] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Token klaim manual per keyId (hanya terisi kalau server memakai link fallback)
  const [fallbackTokens, setFallbackTokens] = useState(loadFallbackTokens);

  // Check key
  const [checkInput, setCheckInput] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const ran = useRef(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const changeProvider = (p) => {
    setProvider(p);
    store.set('bokhub_provider', p);
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
  };

  const setFallbackToken = (id, token) => {
    setFallbackTokens((cur) => {
      const next = { ...cur };
      if (token) next[id] = token;
      else delete next[id];
      saveFallbackTokens(next);
      return next;
    });
  };

  const loadKeys = async (preferredId) => {
    const res = await fetch(`${API}/keys/mine`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to load keys');

    const sorted = [...(data.keys || [])].sort((a, b) => {
      if (a.status === 'ready' && b.status !== 'ready') return 1;
      if (a.status !== 'ready' && b.status === 'ready') return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setKeys(sorted);
    setSelected((cur) => {
      const want = preferredId || cur;
      if (want && sorted.some((k) => getItemId(k) === want)) return want;
      const pending = sorted.find((k) => k.status !== 'ready');
      return getItemId(pending || sorted[0]) || null;
    });
    return sorted;
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const init = async () => {
      const fromCheckpoint = searchParams.get('checkpoint_success') === 'true';
      const targetId = searchParams.get('keyId');
      const token = searchParams.get('token');

      // Bersihkan parameter dari URL secepatnya supaya token tidak tertinggal di history/refresh
      if (fromCheckpoint || targetId || token) setSearchParams({}, { replace: true });

      try {
        if (fromCheckpoint && targetId && token) {
          setTab('mine');

          const res = await fetch(`${API}/keys/${encodeURIComponent(targetId)}/checkpoint`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token }),
          });
          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            setFallbackToken(targetId, null);
            showToast(
              data.status === 'ready'
                ? 'All checkpoints completed! Your key is ready.'
                : `Checkpoint ${data.checkpointsCompleted} completed ✓`
            );
          } else {
            setError(data.error || 'Checkpoint gagal');
          }

          // Selalu muat ulang daftar key, berhasil atau tidak
          await loadKeys(targetId);
        } else {
          const list = await loadKeys();
          if (list.length > 0) setTab('mine');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setBooting(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const generateKey = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/keys/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ durationHours: Number(duration) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to create key (${res.status})`);
      store.set('bokhub_provider', provider);
      const createdId = getItemId(data);
      await loadKeys(createdId);
      setTab('mine');
      showToast('Key created. Complete the checkpoints to unlock it.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/keys/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete key');
      }
      setFallbackToken(deleteTarget, null);
      showToast('Key deleted successfully');
      setDeleteTarget(null);
      await loadKeys();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setLoading(false);
    }
  };

  const goToProvider = async (keyItem) => {
    const targetId = getItemId(keyItem);
    if (!targetId) return;

    setLoading(true);
    setError('');
    setRedirectUrl('');
    store.set('bokhub_pending_key_id', targetId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${API}/keys/${encodeURIComponent(targetId)}/redirect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ provider }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      clearTimeout(timeoutId);
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || `Failed to get checkpoint link (${res.status})`);
      }

      // Server memakai link fallback: simpan token untuk klaim manual setelah kembali
      if (data.fallback && data.token) setFallbackToken(targetId, data.token);
      else setFallbackToken(targetId, null);

      setRedirectUrl(data.redirectUrl);
      window.location.assign(data.redirectUrl);
      setTimeout(() => setLoading(false), 4000);
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') setError('Connection timed out. Please try again.');
      else setError(e.message);
      setLoading(false);
    }
  };

  // Klaim manual: hanya tersedia kalau ada token fallback untuk key ini
  const claimCheckpoint = async (keyItem) => {
    const targetId = getItemId(keyItem);
    if (!targetId) return;
    const token = fallbackTokens[targetId];
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/keys/${encodeURIComponent(targetId)}/checkpoint`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Checkpoint gagal');

      setFallbackToken(targetId, null);
      showToast(
        data.status === 'ready'
          ? 'All checkpoints completed! Your key is ready.'
          : `Checkpoint ${data.checkpointsCompleted} completed ✓`
      );
      await loadKeys(targetId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkKey = async () => {
    const value = checkInput.trim();
    if (!value) return;
    setChecking(true);
    setCheckResult(null);
    try {
      let info = null;
      try {
        const res = await fetch(`${API}/keys/${encodeURIComponent(value)}/status`, { headers });
        if (res.ok) info = await res.json();
      } catch (err) {
        console.warn('Failed to check with server', err);
      }

      const mine = keys.find((k) => k.key === value);
      if (!info && mine) info = mine;

      if (!info) {
        setCheckResult({ found: false });
      } else {
        const expired = info.expiresAt && new Date(info.expiresAt) < new Date();
        const isReady = info.status === 'ready' || info.checkpointsCompleted >= info.checkpointsRequired;

        setCheckResult({
          found: true,
          key: info.key || (isReady ? value : null),
          status: expired ? 'expired' : isReady ? 'ready' : 'pending',
          durationHours: info.durationHours,
          expiresAt: info.expiresAt,
          done: info.checkpointsCompleted || 0,
          total: info.checkpointsRequired || 1,
          devices: info.deviceCount ?? (info.hwidLocked ? 1 : 0),
          maxDevices: info.maxDevices ?? 1,
        });
      }
    } catch (e) {
      console.error(e);
      setCheckResult({ found: false });
    } finally {
      setChecking(false);
    }
  };

  const copy = (text, id) => {
    if (!text) return;
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(id);
    setTimeout(() => setCopied(''), 1800);
  };

  const isReadyKey = (k) => k.status === 'ready' && !!k.key;
  const progressOf = (k) => ({
    done: k.checkpointsCompleted || 0,
    total: k.checkpointsRequired || CHECKPOINTS_BY_DURATION[Number(k.durationHours)] || 2,
  });

  const current = keys.find((k) => getItemId(k) === selected) || null;
  const ready = current ? isReadyKey(current) : false;
  const providersDone = current ? current.checkpointsCompleted >= current.checkpointsRequired : false;
  const currentProgress = current ? progressOf(current) : { done: 0, total: 2 };
  const percent = Math.round((currentProgress.done / currentProgress.total) * 100);
  const canCreate = keys.length < MAX_KEYS;
  const previewTotal = CHECKPOINTS_BY_DURATION[Number(duration)] ?? 2;
  const deviceText = (n, max) => `${n}/${max === 0 ? '∞' : max} devices`;
  const canManualClaim = current ? !!fallbackTokens[getItemId(current)] : false;

  return (
    <div className="min-h-screen bg-[#060b10] text-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0d1a13] border border-[#8bff5e]/40 text-[#8bff5e] text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          <CheckIcon className="w-4 h-4" />
          {toast}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#0d1319] border border-white/10 rounded-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-semibold mb-2">Delete key?</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              This key will be permanently deleted and your quota will be restored.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 rounded-md border border-white/10 text-gray-300 text-xs hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={loading} className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50">{loading ? 'Deleting...' : 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-10">
        <TabBar tab={tab} setTab={switchTab} count={keys.length} />

        {error && <div className="mb-5 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

        {booting ? (
          <div className="py-20 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
        ) : (
          <>
            {/* GET KEY */}
            {tab === 'get' && (
              <div>
                <h1 className="text-3xl font-bold mb-2">Get your free key</h1>
                <p className="text-sm text-gray-400 mb-8">Choose a duration, then complete the checkpoints to unlock your BOKHUB key.</p>

                <label className="block text-sm font-semibold mb-3">Key duration</label>
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {durations.map((d) => {
                    const cp = CHECKPOINTS_BY_DURATION[d] ?? 2;
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex flex-col items-center py-3 rounded-lg border transition-colors ${
                          duration === d ? 'border-[#8bff5e] bg-[#8bff5e]/5 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        <span className="text-sm font-semibold">{d} hrs</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{cp} CP</span>
                      </button>
                    );
                  })}
                </div>

                <label className="block text-sm font-semibold mb-3">Provider</label>
                <div className="mb-8"><ProviderPicker provider={provider} onChange={changeProvider} /></div>
                <div className="mb-8"><CheckpointPlan total={previewTotal} provider={provider} /></div>

                <PrimaryButton onClick={generateKey} disabled={loading || !canCreate}>{loading ? 'Processing...' : canCreate ? 'Create key now' : `Active key limit reached (${MAX_KEYS})`}</PrimaryButton>
                <p className="text-[11px] text-gray-500 mt-3 text-center">{keys.length}/{MAX_KEYS} active keys</p>
              </div>
            )}

            {/* MY KEYS */}
            {tab === 'mine' && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">My keys</h1>
                    <p className="text-sm text-gray-400">{keys.length}/{MAX_KEYS} active keys</p>
                  </div>
                  <button onClick={() => switchTab('get')} disabled={!canCreate} className="text-xs px-3 py-1.5 rounded-md border border-[#8bff5e]/40 text-[#8bff5e] hover:bg-[#8bff5e]/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent">+ New key</button>
                </div>

                {keys.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl py-14 text-center">
                    <p className="text-sm text-gray-400 mb-4">No keys yet.</p>
                    <button onClick={() => switchTab('get')} className="text-xs px-4 py-2 rounded-md bg-[#8bff5e] text-black font-semibold hover:bg-[#7be652] transition-colors">Create your first key</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-8">
                      {keys.map((k) => {
                        const itemId = getItemId(k);
                        const isReady = isReadyKey(k);
                        const prog = progressOf(k);
                        const active = itemId === selected;
                        return (
                          <div key={itemId} onClick={() => { setSelected(itemId); setError(''); }} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-[#8bff5e]/60 bg-[#8bff5e]/5' : 'border-white/10 hover:border-white/30'}`}>
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border text-[10px] ${isReady ? 'bg-[#8bff5e] border-[#8bff5e] text-black' : 'border-white/20 text-gray-400'}`}>
                              {isReady ? <CheckIcon className="w-3.5 h-3.5" /> : `${prog.done}/${prog.total}`}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] break-all ${isReady ? 'font-mono text-white' : 'text-gray-400'}`}>{isReady ? k.key : HIDDEN_TEXT}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{k.durationHours} hrs · until {formatExpiry(k.expiresAt)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] ${isReady ? 'text-[#8bff5e]' : 'text-gray-400'}`}>{isReady ? 'Ready' : 'In progress'}</span>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(itemId); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete key"><TrashIcon className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {current && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Progress</span>
                          <span className="text-xs text-gray-400">{currentProgress.done}/{currentProgress.total} completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-5">
                          <div className="h-full bg-[#8bff5e] transition-all duration-700" style={{ width: `${percent}%` }} />
                        </div>

                        {ready && (
                          <div className="rounded-lg border border-[#8bff5e]/20 bg-[#8bff5e]/5 p-3 mb-5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-[#8bff5e] break-all select-all">{current.key}</span>
                              <button onClick={() => copy(current.key, 'key')} className="shrink-0 text-[11px] text-gray-200 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition-colors">{copied === 'key' ? 'Copied ✓' : 'Copy'}</button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">Valid until {formatExpiry(current.expiresAt)}</p>
                            <p className="text-[11px] text-gray-500 mt-1">Devices used: {deviceText(current.deviceCount ?? 0, current.maxDevices ?? 1)}</p>
                          </div>
                        )}

                        <div className="mb-6">
                          <CheckpointPlan total={current.checkpointsRequired} completed={current.checkpointsCompleted} provider={provider} allDone={ready} />
                        </div>

                        {!ready && !providersDone && (
                          <>
                            <div className="mb-3"><ProviderPicker provider={provider} onChange={changeProvider} /></div>

                            {/* Pergi ke checkpoint. Setelah selesai, user otomatis kembali ke halaman ini
                                dan checkpoint langsung terhitung (token ada di URL). */}
                            <PrimaryButton onClick={() => goToProvider(current)} disabled={loading}>
                              {loading ? 'Redirecting...' : `Pergi ke Checkpoint ${current.checkpointsCompleted + 1}/${current.checkpointsRequired}`}
                            </PrimaryButton>

                            {/* Klaim manual: hanya muncul kalau server memakai link fallback */}
                            {canManualClaim && (
                              <button
                                onClick={() => claimCheckpoint(current)}
                                disabled={loading}
                                className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Memproses...' : 'Saya sudah selesai (Klaim Checkpoint)'}
                              </button>
                            )}

                            <p className="text-[11px] text-gray-500 mt-3 text-center">
                              {canManualClaim
                                ? 'Link utama sedang bermasalah, jadi dipakai link cadangan. Setelah selesai, kembali ke halaman ini lalu klik "Klaim Checkpoint".'
                                : 'Selesaikan semua langkah di halaman iklan. Setelah selesai kamu akan otomatis kembali ke halaman ini dan checkpoint langsung terhitung.'}
                            </p>

                            {redirectUrl && (
                              <p className="text-[11px] text-gray-400 mt-2 text-center">
                                Tidak terarah otomatis?{' '}
                                <a href={redirectUrl} className="text-[#8bff5e] underline">Klik di sini</a>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* CHECK KEY */}
            {tab === 'check' && (
              <div>
                <h1 className="text-3xl font-bold mb-2">Check key</h1>
                <p className="text-sm text-gray-400 mb-8">Paste a key to see its status and expiration.</p>

                <div className="flex gap-2 mb-5">
                  <input value={checkInput} onChange={(e) => setCheckInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkKey()} placeholder="Enter your key" spellCheck={false} className="flex-1 min-w-0 bg-white/[0.03] border border-white/10 focus:border-[#8bff5e]/60 outline-none rounded-lg px-3.5 py-2.5 text-sm font-mono placeholder:font-sans placeholder:text-gray-500" />
                  <button onClick={checkKey} disabled={checking || !checkInput.trim()} className="shrink-0 bg-[#8bff5e] hover:bg-[#7be652] text-black font-semibold px-5 rounded-lg text-sm transition-colors disabled:opacity-50">{checking ? 'Checking...' : 'Check'}</button>
                </div>

                {checkResult && !checkResult.found && (
                  <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">
                    <p className="font-semibold mb-1">Key not found.</p>
                    <p className="text-xs">Make sure you typed it correctly. The key may also have been deleted or expired.</p>
                  </div>
                )}

                {checkResult?.found && (
                  <div className={`rounded-lg border p-4 ${checkResult.status === 'expired' ? 'border-red-400/30 bg-red-400/5 text-red-400' : checkResult.status === 'ready' ? 'border-[#8bff5e]/30 bg-[#8bff5e]/5 text-[#8bff5e]' : 'border-amber-300/30 bg-amber-300/5 text-amber-300'}`}>
                    <p className="text-sm font-semibold mb-3">
                      {checkResult.status === 'expired' ? '❌ Key Expired' : checkResult.status === 'ready' ? '✅ Key Valid & Ready to Use' : '⏳ Checkpoints Not Completed Yet'}
                    </p>
                    <p className={`text-xs break-all mb-3 ${checkResult.status === 'ready' ? 'font-mono text-white' : 'text-gray-300'}`}>{checkResult.status === 'ready' ? checkResult.key : HIDDEN_TEXT}</p>
                    <dl className="grid grid-cols-2 gap-y-2 text-xs">
                      {checkResult.durationHours != null && (
                        <><dt className="text-gray-400">Duration</dt><dd className="text-white text-right">{checkResult.durationHours} hrs</dd></>
                      )}
                      {checkResult.expiresAt && (
                        <><dt className="text-gray-400">Valid until</dt><dd className="text-white text-right">{formatExpiry(checkResult.expiresAt)}</dd></>
                      )}
                      {checkResult.total != null && checkResult.status !== 'expired' && (
                        <><dt className="text-gray-400">Checkpoints</dt><dd className="text-white text-right">{checkResult.done}/{checkResult.total}</dd></>
                      )}
                      {checkResult.status !== 'expired' && (
                        <>
                          <dt className="text-gray-400">Devices (HWID)</dt>
                          <dd className={`text-right font-semibold ${checkResult.devices > 0 ? 'text-[#8bff5e]' : 'text-amber-300'}`}>
                            {checkResult.devices > 0
                              ? deviceText(checkResult.devices, checkResult.maxDevices)
                              : `Not locked yet (max ${checkResult.maxDevices === 0 ? '∞' : checkResult.maxDevices})`}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {/* SCRIPT */}
            {tab === 'script' && (
              <div>
                <h1 className="text-3xl font-bold mb-2">Loader script</h1>
                <p className="text-sm text-gray-400 mb-8">Copy the script, paste it into your executor, then enter your key in the BOKHUB window.</p>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold">Script</span>
                    <button onClick={() => copy(LOADER, 'script')} className="text-[11px] bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1 rounded transition-colors">{copied === 'script' ? 'Copied ✓' : 'Copy script'}</button>
                  </div>
                  <div className="bg-black/50 rounded-lg p-3 font-mono text-[11px] text-[#8bff5e] break-all border border-white/5 select-all">{LOADER}</div>
                </div>

                <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-colors">
                  <DiscordIcon className="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Join the BOKHUB Discord</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Script updates, support, and the latest news.</p>
                  </div>
                  <span className="text-[11px] text-gray-400">Open</span>
                </a>
              </div>
            )}
          </>
        )}

        <div className="mt-14">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Have questions? Check the FAQ or ask directly on Discord.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}