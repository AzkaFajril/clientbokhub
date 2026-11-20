import { useState, useEffect, useCallback } from 'react';
import { getClientId } from '../utils/clientId';
import { API } from '../utils/api';

const LIFETIME_HOURS = 9999999;
const EMPTY_KEY = { keyString: '', durationHours: 24, type: 'premium', maxDevices: 1 };

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [keys, setKeys] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState(EMPTY_KEY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken('');
    setStats(null);
    setKeys([]);
  }, []);

  const apiFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
        'x-client-id': getClientId(),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request gagal');
    return data;
  }, [token, handleLogout]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password salah');
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      setStats(await apiFetch('/admin/stats'));
    } catch (err) { console.error(err); }
  }, [token, apiFetch]);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch(`/admin/keys?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setKeys(data.keys);
      setTotalPages(data.totalPages);
    } catch (err) { console.error(err); }
  }, [token, page, search, apiFetch]);

  useEffect(() => {
    if (token) {
      loadStats();
      loadKeys();
    }
  }, [token, loadStats, loadKeys]);

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiFetch('/admin/keys', {
        method: 'POST',
        body: JSON.stringify({
          ...newKey,
          keyString: newKey.keyString.trim(),
          durationHours: Number(newKey.durationHours),
          maxDevices: Number(newKey.maxDevices),
        }),
      });
      setShowModal(false);
      setNewKey(EMPTY_KEY);
      loadKeys();
      loadStats();
      alert('✅ Key berhasil dibuat!');
    } catch (err) {
      alert('❌ GAGAL: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus key ini?')) return;
    try {
      await apiFetch(`/admin/keys/${id}`, { method: 'DELETE' });
      loadKeys();
      loadStats();
    } catch (err) { alert(err.message); }
  };

  const handleEditDevices = async (k) => {
    const cur = k.maxDevices ?? 1;
    const input = window.prompt('Batas perangkat untuk key ini (0 = tanpa batas):', String(cur));
    if (input === null) return;
    const n = Number(input);
    if (!Number.isInteger(n) || n < 0) return alert('Isi angka bulat 0 atau lebih.');
    try {
      await apiFetch(`/admin/keys/${k.id}`, { method: 'PATCH', body: JSON.stringify({ maxDevices: n }) });
      loadKeys();
    } catch (err) { alert(err.message); }
  };

  const handleResetHwid = async (id) => {
    if (!window.confirm('Reset semua perangkat (HWID) yang terkunci di key ini?')) return;
    try {
      await apiFetch(`/admin/keys/${id}/reset-hwid`, { method: 'POST' });
      loadKeys();
    } catch (err) { alert(err.message); }
  };

  const deviceLabel = (k) => {
    const max = k.maxDevices ?? 1;
    return `${k.deviceCount ?? 0}/${max === 0 ? '∞' : max}`;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">Admin Login</h2>
          <input
            type="password"
            placeholder="Masukkan Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black mb-4 focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-black">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
          <div className="space-x-2">
            <button onClick={() => { loadStats(); loadKeys(); }} className="px-4 py-2 bg-gray-200 text-black rounded-lg text-sm hover:bg-gray-300">Refresh</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Logout</button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Hari Ini" value={stats?.today?.visits || 0} sub={`${stats?.today?.uniqueVisitors || 0} Unique`} />
          <StatCard title="Get Key" value={stats?.today?.getKeyClicks || 0} sub="Klik Hari Ini" />
          <StatCard title="Minggu Ini" value={stats?.week?.visits || 0} sub={`${stats?.week?.uniqueVisitors || 0} Unique`} />
          <StatCard title="Bulan Ini" value={stats?.month?.visits || 0} sub={`${stats?.month?.uniqueVisitors || 0} Unique`} />
          <StatCard title="Total Key" value={stats?.keys?.total || 0} sub={`${stats?.keys?.active || 0} Aktif`} />
        </div>

        {/* TABEL KEY */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Manajemen Key</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Cari key..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-black w-full"
              />
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">
                + Add Key
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm">
                  <th className="p-4 font-semibold border-b">Key</th>
                  <th className="p-4 font-semibold border-b">Status</th>
                  <th className="p-4 font-semibold border-b">Tipe</th>
                  <th className="p-4 font-semibold border-b">Perangkat</th>
                  <th className="p-4 font-semibold border-b">Expired</th>
                  <th className="p-4 font-semibold border-b text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {keys.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Belum ada key.</td></tr>
                ) : keys.map((k) => (
                  <tr key={k.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold">{k.key}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${k.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {String(k.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 uppercase">{k.type}</td>
                    <td className="p-4 font-mono">{deviceLabel(k)}</td>
                    <td className="p-4">{new Date(k.expiresAt).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <button onClick={() => handleEditDevices(k)} className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200">
                        Batas
                      </button>
                      <button onClick={() => handleResetHwid(k.id)} className="px-3 py-1 bg-yellow-100 text-yellow-800 font-bold rounded hover:bg-yellow-200">
                        Reset HWID
                      </button>
                      <button onClick={() => handleDelete(k.id)} className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 border-t flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-600">Halaman {page} dari {totalPages}</span>
            <div className="space-x-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-white border rounded text-sm disabled:opacity-50 text-black hover:bg-gray-100">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-white border rounded text-sm disabled:opacity-50 text-black hover:bg-gray-100">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ADD KEY */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 text-black">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Buat Custom Key</h2>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Key String</label>
                <input
                  type="text"
                  required
                  placeholder="CONTOH-KEY-123"
                  value={newKey.keyString}
                  onChange={(e) => setNewKey({ ...newKey, keyString: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Durasi (Jam)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newKey.durationHours}
                  onChange={(e) => setNewKey({ ...newKey, durationHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[[24, '1 Hari'], [168, '7 Hari'], [720, '30 Hari'], [LIFETIME_HOURS, 'Lifetime']].map(([h, label]) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setNewKey({ ...newKey, durationHours: h })}
                      className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Batas Perangkat (HWID)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={newKey.maxDevices}
                  onChange={(e) => setNewKey({ ...newKey, maxDevices: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 = satu orang. Isi 5 kalau key boleh dipakai 5 perangkat. 0 = tanpa batas.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe</label>
                <select
                  value={newKey.type}
                  onChange={(e) => setNewKey({ ...newKey, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
                >
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-black font-bold rounded-lg hover:bg-gray-300">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
      <div className="text-sm font-bold text-gray-500 mb-1">{title}</div>
      <div className="text-3xl font-extrabold text-black">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}