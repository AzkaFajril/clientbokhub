import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../utils/api';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const getClientId = () => {
  let id = store.get('bokhub_client_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    store.set('bokhub_client_id', id);
  }
  return id;
};
const headers = { 'Content-Type': 'application/json', 'x-client-id': getClientId() };

const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const CheckIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const LockIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;

export default function ResetPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const loadKeys = async () => {
    setLoading(true); setError('');
    try {
      // Fetch free keys (checkpoint) and premium keys (purchase)
      const [resFree, resPrem] = await Promise.all([
        fetch(`${API}/keys/mine`, { headers }),
        fetch(`${API}/premium/mine`, { headers })
      ]);

      const dataFree = await resFree.json().catch(() => ({}));
      const dataPrem = await resPrem.json().catch(() => ({}));

      const freeKeys = (dataFree.keys || []).map(k => ({ ...k, type: 'free' }));
      const premKeys = (dataPrem.keys || []).map(k => ({ ...k, type: 'premium' }));

      // Combine them (sorting is optional)
      setKeys([...freeKeys, ...premKeys]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(); }, []);

  // RESET HANDLER (fixed)
  const handleReset = async (keyString, type) => {
    if (!window.confirm(`Are you sure you want to reset the device for this ${type === 'free' ? 'Free' : 'Premium'} key?`)) return;
    setError('');

    try {
      // Pick the correct endpoint based on the key type
      const endpoint = type === 'free'
        ? `${API}/keys/${encodeURIComponent(keyString)}/reset-hwid`
        : `${API}/premium/${encodeURIComponent(keyString)}/reset-hwid`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error + (data.nextResetAt ? ` (You can reset again: ${fmt(data.nextResetAt)})` : '')
        );
      }

      showToast('Device reset successfully!');
      await loadKeys(); // Refresh the list after reset
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0d1a13] border border-[#8bff5e]/40 text-[#8bff5e] text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          <CheckIcon /> {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-3">Reset Device</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Use this page to unlink your key from your old device.<br/>
            <strong className="text-gray-300">Free:</strong> Only once. <strong className="text-gray-300">Premium:</strong> Once every 7 days.
          </p>
        </div>

        {error && <div className="mb-6 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">{error}</div>}

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Your Keys</h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Loading data...</div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">You don't have any keys yet.</p>
              <Link to="/key" className="text-xs bg-[#8bff5e] text-black font-semibold hover:bg-[#7be652] px-4 py-2 rounded-md transition-colors">
                Get a Free Key
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k, index) => {
                // Use this specific key based on the item k
                const isLocked = k.hwidLocked || k.hwid;
                const isFreeLimit = k.type === 'free' && k.hwidResetCount >= 1;
                const isPremLimit = k.type === 'premium' && !!k.nextResetAt;

                return (
                  <div key={`${k.key}-${index}`} className="p-3 rounded-lg border border-[#262626] bg-[#0a0a0a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${k.type === 'free' ? 'bg-[#8bff5e]/20 text-[#8bff5e]' : 'bg-[#f5c451]/20 text-[#f5c451]'}`}>
                          {k.type}
                        </span>
                        <span className={`font-mono text-sm break-all ${k.type === 'free' ? 'text-[#8bff5e]' : 'text-[#f5c451]'}`}>
                          {k.key}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        {isLocked ? <><LockIcon /> Locked to 1 device</> : <><span className="w-4 h-4 flex items-center justify-center">-</span> Not used yet</>}
                      </span>
                    </div>
                    <button
                      // IMPORTANT: onClick calls handleReset with this item's k.key and k.type
                      onClick={() => handleReset(k.key, k.type)}
                      disabled={!isLocked || isFreeLimit || isPremLimit}
                      className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${k.type === 'free' ? 'border-[#8bff5e]/30 text-[#8bff5e] bg-[#8bff5e]/10 hover:bg-[#8bff5e]/20' : 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20'}`}
                    >
                      {!isLocked ? 'Not Locked Yet' : isFreeLimit ? 'Limit Reached' : isPremLimit ? `Wait until ${fmt(k.nextResetAt)}` : 'Reset Device'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}