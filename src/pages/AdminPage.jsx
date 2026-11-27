import { useState, useEffect, useCallback } from 'react';
import { getClientId } from '../utils/clientId';
import { API } from '../utils/api';

/* ------------------------------------------------------------------ */
/* Konstanta & helper                                                  */
/* ------------------------------------------------------------------ */
const DAY = 24 * 60 * 60 * 1000;
const LIFETIME_HOURS = 9999999; // dipakai saat membuat key baru (sama seperti sebelumnya)
const LIFETIME_ISO = '2099-12-31T23:59:59.999Z'; // dipakai saat mengedit key
const NAME_RE = /^[A-Za-z0-9_-]{4,64}$/;
const EMPTY_KEY = { keyString: '', durationHours: 24, type: 'premium', maxDevices: 1 };

const isLifetime = (d) => new Date(d).getFullYear() >= 2099;

function remaining(expiresAt) {
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return '—';
  if (isLifetime(expiresAt)) return 'Lifetime';
  const ms = t - Date.now();
  if (ms <= 0) return 'Sudah expired';
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d} hari ${h} jam lagi`;
  if (h > 0) return `${h} jam ${m % 60} menit lagi`;
  return `${m} menit lagi`;
}

function fmtDate(expiresAt) {
  if (isLifetime(expiresAt)) return 'Tidak pernah';
  return new Date(expiresAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const pad = (n) => String(n).padStart(2, '0');
function toLocalInput(value) {
  const x = new Date(value);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const deviceMax = (k) => (k.maxDevices ?? 1);
const deviceText = (k) => `${k.deviceCount ?? 0}/${deviceMax(k) === 0 ? '∞' : deviceMax(k)}`;

/* ------------------------------------------------------------------ */
/* Ikon (SVG inline, tanpa dependensi)                                 */
/* ------------------------------------------------------------------ */
const ICONS = {
  menu: 'M3 12h18M3 6h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12',
  grid: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  plus: 'M12 5v14M5 12h14',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  edit: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  reset: 'M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10',
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Style                                                               */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@500&family=Sora:wght@600;700&display=swap');

.adm{
  --ink:#1c1633; --ink-soft:#2b2250; --paper:#f4f2f8; --card:#fff; --line:#e5e0ee;
  --text:#1f1a33; --muted:#6b6580; --violet:#6c4cf5; --violet-soft:#ece8ff;
  --gold:#8a5a00; --gold-bg:#fdf0cf; --ok:#14733a; --ok-bg:#dcf5e4; --bad:#b4232a; --bad-bg:#fde4e4;
  font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:var(--text); background:var(--paper); min-height:100vh; line-height:1.45;
}
.adm *{box-sizing:border-box}
.adm button{font:inherit;cursor:pointer}
.adm h1,.adm h2,.adm h3{font-family:'Sora','DM Sans',system-ui,sans-serif;margin:0}
.adm :focus-visible{outline:2px solid var(--violet);outline-offset:2px}
.adm .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;font-weight:500}

/* ---------- shell ---------- */
.adm-shell{display:flex;min-height:100vh}
.adm-side{width:264px;flex:none;background:var(--ink);color:#cfc8e8;display:flex;flex-direction:column;
  padding:22px 14px 18px;position:fixed;inset:0 auto 0 0;z-index:40;transition:transform .22s ease}
.adm-brand{padding:4px 10px 22px}
.adm-brand b{font-family:'Sora',sans-serif;font-size:22px;color:#fff;letter-spacing:.2px}
.adm-brand span{display:block;font-size:13px;color:#9d95bd;margin-top:2px}
.adm-nav{display:flex;flex-direction:column;gap:4px}
.adm-navbtn{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;border:0;border-radius:9px;
  background:transparent;color:#cfc8e8;text-align:left;font-weight:500;transition:background .15s,color .15s}
.adm-navbtn:hover{background:var(--ink-soft);color:#fff}
.adm-navbtn.on{background:var(--ink-soft);color:#fff;box-shadow:inset 3px 0 0 #f0b429}
.adm-side-foot{margin-top:auto;display:flex;flex-direction:column;gap:4px;border-top:1px solid #36295f;padding-top:14px}
.adm-main{flex:1;min-width:0;margin-left:264px}
.adm-top{display:none}
.adm-scrim{display:none}
.adm-content{padding:30px 34px 56px;max-width:1200px}

/* ---------- page header ---------- */
.adm-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap}
.adm-head h1{font-size:26px}
.adm-head p{margin:4px 0 0;color:var(--muted)}

/* ---------- cards & grid ---------- */
.adm-card{background:var(--card);border:1px solid var(--line);border-radius:14px}
.adm-pad{padding:20px}
.adm-two{display:grid;grid-template-columns:1.35fr 1fr;gap:16px;margin-bottom:16px}
.adm-three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.adm-label{font-size:13px;color:var(--muted);font-weight:500}
.adm-num{font-family:'Sora',sans-serif;font-weight:700;font-size:30px;line-height:1.15;margin-top:4px}
.adm-sub{font-size:13px;color:var(--muted);margin-top:2px}
.adm-meter{height:14px;border-radius:99px;background:#ece7f6;overflow:hidden;margin:16px 0 14px;display:flex}
.adm-meter i{display:block;background:var(--violet);transition:width .4s ease}
.adm-legend{display:flex;gap:22px;flex-wrap:wrap}
.adm-legend div{font-size:13px;color:var(--muted)}
.adm-legend b{display:block;font-family:'Sora',sans-serif;font-size:18px;color:var(--text)}

/* ---------- toolbar ---------- */
.adm-tools{display:flex;gap:10px;padding:16px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.adm-search{position:relative;flex:1;min-width:200px}
.adm-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)}
.adm-search .inp{padding-left:38px}

/* ---------- inputs & buttons ---------- */
.inp{width:100%;height:42px;border:1px solid var(--line);border-radius:9px;padding:0 12px;background:#fff;
  color:var(--text);font:inherit}
.inp:focus{border-color:var(--violet);outline:none;box-shadow:0 0 0 3px var(--violet-soft)}
.inp:disabled{background:#f4f2f8;color:var(--muted)}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:18px}
.field > label,.field > .lbl{font-size:14px;font-weight:700}
.hint{font-size:13px;color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 15px;border-radius:9px;
  border:1px solid var(--line);background:#fff;color:var(--text);font-weight:700;white-space:nowrap;transition:background .15s,border-color .15s}
.btn:hover{background:#f7f5fb}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn-primary{background:var(--violet);border-color:var(--violet);color:#fff}
.btn-primary:hover{background:#5a3be0}
.btn-danger{color:var(--bad)}
.btn-danger:hover{background:var(--bad-bg);border-color:#f3c0c0}
.btn-sm{height:34px;padding:0 11px;font-size:14px}
.btn-icon{width:34px;padding:0}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.chip{height:32px;padding:0 12px;border-radius:99px;border:1px solid var(--line);background:#fff;font-size:13px;font-weight:700;color:var(--text)}
.chip:hover{border-color:var(--violet)}
.chip.on{background:var(--violet-soft);border-color:var(--violet);color:var(--violet)}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;width:fit-content}
.seg button{height:38px;padding:0 18px;border:0;background:#fff;font-weight:700;color:var(--muted)}
.seg button.on{background:var(--violet);color:#fff}
.check{display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;cursor:pointer}
.check input{width:18px;height:18px;accent-color:var(--violet)}

/* ---------- badges ---------- */
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:12.5px;font-weight:700}
.badge.gold{background:var(--gold-bg);color:var(--gold)}
.badge.slate{background:#e8e6ef;color:#4a4560}
.badge.ok{background:var(--ok-bg);color:var(--ok)}
.badge.bad{background:var(--bad-bg);color:var(--bad)}
.badge.ok::before,.badge.bad::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}

/* ---------- table (desktop) ---------- */
.adm-tablewrap{overflow-x:auto}
.adm-table{width:100%;border-collapse:collapse;min-width:820px}
.adm-table th{text-align:left;font-size:13px;font-weight:500;color:var(--muted);padding:12px 16px;border-bottom:1px solid var(--line);background:#faf9fd}
.adm-table td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:middle;font-size:14.5px}
.adm-table tr:last-child td{border-bottom:0}
.adm-table tbody tr:hover{background:#faf9fd}
.keycell{display:flex;align-items:center;gap:8px}
.keycell .mono{font-size:13px;word-break:break-all}
.subline{font-size:12.5px;color:var(--muted)}
.devmeter{width:70px;height:6px;background:#ece7f6;border-radius:99px;overflow:hidden;margin-top:5px}
.devmeter i{display:block;height:100%;background:var(--violet)}
.devmeter i.full{background:#d97706}
.actions{display:flex;gap:6px;justify-content:flex-end}

/* ---------- cards (mobile) ---------- */
.adm-cards{display:none}
.kcard{padding:16px;border-bottom:1px solid var(--line)}
.kcard:last-child{border-bottom:0}
.kcard .mono{font-size:13px;word-break:break-all}
.kcard-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.kcard-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.kcard-meta .adm-label{font-size:12.5px}
.kcard-actions{display:flex;gap:8px}
.kcard-actions .btn{flex:1}

.adm-pager{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-top:1px solid var(--line);gap:10px}
.adm-empty{padding:44px 20px;text-align:center;color:var(--muted)}

/* ---------- modal ---------- */
.adm-overlay{position:fixed;inset:0;background:rgba(28,22,51,.55);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}
.adm-overlay.top{z-index:80}
.adm-modal{background:#fff;border-radius:16px;width:100%;max-width:540px;max-height:92vh;overflow:auto;display:flex;flex-direction:column}
.adm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--line)}
.adm-modal-head h2{font-size:19px}
.adm-modal-body{padding:22px}
.adm-modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:16px 22px;border-top:1px solid var(--line);background:#faf9fd;position:sticky;bottom:0}
.adm-danger{border:1px solid #f3c0c0;border-radius:12px;padding:14px;background:#fff8f8;margin-top:6px}
.adm-danger h3{font-size:14px;margin-bottom:10px;color:var(--bad)}
.adm-danger .row{display:flex;gap:8px;flex-wrap:wrap}
.adm-err{background:var(--bad-bg);color:var(--bad);padding:10px 12px;border-radius:9px;font-size:14px;margin-bottom:16px}
.adm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}

/* ---------- toast ---------- */
.adm-toast{position:fixed;right:20px;bottom:20px;z-index:99;background:var(--ink);color:#fff;padding:12px 16px;border-radius:10px;
  font-weight:500;max-width:min(360px,calc(100vw - 32px));box-shadow:0 8px 24px rgba(28,22,51,.28);border-left:4px solid #4ade80}
.adm-toast.bad{border-left-color:#f87171}

/* ---------- login ---------- */
.adm-login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--ink)}
.adm-login form{width:100%;max-width:400px;background:#fff;border-radius:18px;padding:30px}
.adm-login h1{font-size:24px;margin-bottom:4px}
.adm-login p{color:var(--muted);margin:0 0 22px}

/* ---------- mobile ---------- */
@media (max-width:899px){
  .adm-side{transform:translateX(-100%);box-shadow:0 0 40px rgba(0,0,0,.35)}
  .adm-side.open{transform:none}
  .adm-scrim{display:block;position:fixed;inset:0;background:rgba(28,22,51,.5);z-index:35}
  .adm-main{margin-left:0}
  .adm-top{display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:30;background:var(--ink);color:#fff;padding:10px 14px}
  .adm-top b{font-family:'Sora',sans-serif;font-size:18px}
  .adm-top button{background:transparent;border:0;color:#fff;width:40px;height:40px;display:grid;place-items:center;border-radius:9px}
  .adm-top button:hover{background:var(--ink-soft)}
  .adm-content{padding:18px 14px 40px}
  .adm-head h1{font-size:22px}
  .adm-two{grid-template-columns:1fr}
  .adm-three{grid-template-columns:1fr}
  .adm-tablewrap{display:none}
  .adm-cards{display:block}
  .adm-toast{left:16px;right:16px;bottom:16px;max-width:none}
}
@media (max-width:600px){
  .adm-overlay{align-items:flex-end;padding:0}
  .adm-modal{max-width:none;border-radius:18px 18px 0 0;max-height:94vh}
  .adm-grid2{grid-template-columns:1fr}
  .adm-modal-foot .btn{flex:1}
  .adm-tools .btn-primary{width:100%}
}
@media (prefers-reduced-motion:reduce){
  .adm *{transition:none !important;animation:none !important}
}
`;

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */
function TypeBadge({ type }) {
  return type === 'premium'
    ? <span className="badge gold">Premium</span>
    : <span className="badge slate">Free</span>;
}

function StatusBadge({ status }) {
  return status === 'active'
    ? <span className="badge ok">Aktif</span>
    : <span className="badge bad">Expired</span>;
}

function DeviceMeter({ k }) {
  const max = deviceMax(k);
  const used = k.deviceCount ?? 0;
  if (max === 0) return <div className="mono">{deviceText(k)}</div>;
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="mono">{deviceText(k)}</div>
      <div className="devmeter"><i className={used >= max ? 'full' : ''} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Modal({ title, onClose, children, footer, top }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`adm-overlay ${top ? 'top' : ''}`}>
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-sm btn-icon" onClick={onClose} aria-label="Tutup"><Icon name="close" /></button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: edit key                                                     */
/* ------------------------------------------------------------------ */
function EditKeyModal({ item, onClose, onSave, onReset, onDelete }) {
  const life0 = isLifetime(item.expiresAt);
  const [form, setForm] = useState(() => ({
    keyString: item.key,
    type: item.type === 'premium' ? 'premium' : 'free',
    maxDevices: String(item.maxDevices ?? 1),
    lifetime: life0,
    expiresLocal: toLocalInput(life0 ? Date.now() + 30 * DAY : item.expiresAt),
  }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const addDays = (n) => {
    const cur = new Date(form.expiresLocal).getTime();
    const base = Math.max(Number.isNaN(cur) ? 0 : cur, Date.now());
    set({ lifetime: false, expiresLocal: toLocalInput(base + n * DAY) });
  };

  const preview = form.lifetime ? 'Lifetime' : remaining(new Date(form.expiresLocal));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const body = {};

    const name = form.keyString.trim();
    if (name !== item.key) {
      if (!NAME_RE.test(name)) return setErr('Nama key 4–64 karakter: huruf, angka, - dan _.');
      body.keyString = name;
    }
    if (form.type !== item.type) body.type = form.type;

    const max = Number(form.maxDevices);
    if (!Number.isInteger(max) || max < 0 || max > 9999) return setErr('Batas perangkat harus angka bulat 0–9999.');
    if (max !== (item.maxDevices ?? 1)) body.maxDevices = max;

    if (form.lifetime) {
      if (!life0) body.expiresAt = LIFETIME_ISO;
    } else {
      const d = new Date(form.expiresLocal);
      if (Number.isNaN(d.getTime())) return setErr('Tanggal expired tidak valid.');
      if (life0 || Math.abs(d.getTime() - new Date(item.expiresAt).getTime()) > 60000) {
        body.expiresAt = d.toISOString();
      }
    }

    if (!Object.keys(body).length) return onClose();

    setBusy(true);
    try {
      await onSave(item.id, body);
    } catch (e2) {
      setErr(e2.message || 'Gagal menyimpan');
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Edit key"
      onClose={onClose}
      footer={
        <div className="adm-modal-foot">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" form="edit-key-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan perubahan'}
          </button>
        </div>
      }
    >
      <form id="edit-key-form" className="adm-modal-body" onSubmit={submit}>
        {err && <div className="adm-err" role="alert">{err}</div>}

        <div className="field">
          <label htmlFor="ek-name">Nama key</label>
          <input
            id="ek-name" className="inp mono" value={form.keyString} spellCheck={false}
            onChange={(e) => set({ keyString: e.target.value })}
          />
          <span className="hint">Mengganti nama membuat key lama tidak berlaku lagi. Beri tahu pemiliknya.</span>
        </div>

        <div className="field">
          <span className="lbl">Tipe</span>
          <div className="seg" role="group" aria-label="Tipe key">
            <button type="button" className={form.type === 'premium' ? 'on' : ''} onClick={() => set({ type: 'premium' })}>Premium</button>
            <button type="button" className={form.type === 'free' ? 'on' : ''} onClick={() => set({ type: 'free' })}>Free</button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ek-dev">Batas perangkat (HWID)</label>
          <input
            id="ek-dev" type="number" min="0" max="9999" step="1" className="inp"
            value={form.maxDevices} onChange={(e) => set({ maxDevices: e.target.value })}
          />
          <div className="chips">
            {[1, 2, 3, 5].map((n) => (
              <button type="button" key={n} className={`chip ${form.maxDevices === String(n) ? 'on' : ''}`} onClick={() => set({ maxDevices: String(n) })}>{n} perangkat</button>
            ))}
            <button type="button" className={`chip ${form.maxDevices === '0' ? 'on' : ''}`} onClick={() => set({ maxDevices: '0' })}>Tanpa batas</button>
          </div>
          <span className="hint">Terpakai sekarang: {item.deviceCount ?? 0}. Isi 0 untuk tanpa batas.</span>
        </div>

        <div className="field">
          <label htmlFor="ek-exp">Masa aktif sampai</label>
          <input
            id="ek-exp" type="datetime-local" className="inp" disabled={form.lifetime}
            value={form.expiresLocal} onChange={(e) => set({ expiresLocal: e.target.value })}
          />
          <div className="chips">
            <button type="button" className="chip" onClick={() => addDays(1)}>+1 hari</button>
            <button type="button" className="chip" onClick={() => addDays(7)}>+7 hari</button>
            <button type="button" className="chip" onClick={() => addDays(30)}>+30 hari</button>
          </div>
          <label className="check" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={form.lifetime} onChange={(e) => set({ lifetime: e.target.checked })} />
            Lifetime (tidak pernah expired)
          </label>
          <span className="hint">Sisa waktu: <b>{preview}</b></span>
        </div>

        <div className="adm-danger">
          <h3>Tindakan lain</h3>
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={() => onReset(item)}><Icon name="reset" size={16} /> Reset HWID</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(item)}><Icon name="trash" size={16} /> Hapus key</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: tambah key                                                   */
/* ------------------------------------------------------------------ */
function CreateKeyModal({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_KEY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const name = form.keyString.trim();
    if (!name) return setErr('Nama key wajib diisi.');
    setBusy(true);
    try {
      await onCreate({
        ...form,
        keyString: name,
        durationHours: Number(form.durationHours),
        maxDevices: Number(form.maxDevices),
      });
    } catch (e2) {
      setErr(e2.message || 'Gagal membuat key');
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Tambah key"
      onClose={onClose}
      footer={
        <div className="adm-modal-foot">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" form="create-key-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan key'}
          </button>
        </div>
      }
    >
      <form id="create-key-form" className="adm-modal-body" onSubmit={submit}>
        {err && <div className="adm-err" role="alert">{err}</div>}

        <div className="field">
          <label htmlFor="ck-name">Nama key</label>
          <input
            id="ck-name" className="inp mono" placeholder="CONTOH-KEY-123" value={form.keyString}
            spellCheck={false} onChange={(e) => set({ keyString: e.target.value })}
          />
        </div>

        <div className="field">
          <span className="lbl">Tipe</span>
          <div className="seg" role="group" aria-label="Tipe key">
            <button type="button" className={form.type === 'premium' ? 'on' : ''} onClick={() => set({ type: 'premium' })}>Premium</button>
            <button type="button" className={form.type === 'free' ? 'on' : ''} onClick={() => set({ type: 'free' })}>Free</button>
          </div>
        </div>

        <div className="adm-grid2">
          <div className="field">
            <label htmlFor="ck-dur">Durasi (jam)</label>
            <input
              id="ck-dur" type="number" min="1" className="inp" value={form.durationHours}
              onChange={(e) => set({ durationHours: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ck-dev">Batas perangkat</label>
            <input
              id="ck-dev" type="number" min="0" step="1" className="inp" value={form.maxDevices}
              onChange={(e) => set({ maxDevices: e.target.value })}
            />
          </div>
        </div>

        <div className="chips" style={{ marginTop: -6 }}>
          {[[24, '1 hari'], [168, '7 hari'], [720, '30 hari'], [LIFETIME_HOURS, 'Lifetime']].map(([h, label]) => (
            <button
              type="button" key={h}
              className={`chip ${Number(form.durationHours) === h ? 'on' : ''}`}
              onClick={() => set({ durationHours: h })}
            >{label}</button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Batas perangkat: 1 untuk satu orang, isi 5 kalau boleh dipakai 5 perangkat, 0 untuk tanpa batas.
        </p>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman utama                                                       */
/* ------------------------------------------------------------------ */
export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [view, setView] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((text, kind = 'ok') => setToast({ text, kind, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken('');
    setStats(null);
    setKeys([]);
    setMenuOpen(false);
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
      throw new Error('Sesi habis. Silakan login lagi.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Permintaan gagal');
    return data;
  }, [token, handleLogout]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Password salah');
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginBusy(false);
    }
  };

  const loadStats = useCallback(async () => {
    if (!token) return;
    try { setStats(await apiFetch('/admin/stats')); } catch (err) { console.error(err); }
  }, [token, apiFetch]);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    setLoadingKeys(true);
    try {
      const data = await apiFetch(`/admin/keys?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setKeys(data.keys);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  }, [token, page, search, apiFetch]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (token) { loadStats(); loadKeys(); }
  }, [token, loadStats, loadKeys]);

  const refreshAll = () => { loadStats(); loadKeys(); };

  /* ----- aksi key ----- */
  const handleCreate = async (payload) => {
    await apiFetch('/admin/keys', { method: 'POST', body: JSON.stringify(payload) });
    setCreateOpen(false);
    refreshAll();
    notify('Key dibuat');
  };

  const handleSaveEdit = async (id, body) => {
    await apiFetch(`/admin/keys/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    setEditItem(null);
    refreshAll();
    notify('Perubahan disimpan');
  };

  const askReset = (k) => setConfirm({
    title: 'Reset HWID?',
    message: `Semua perangkat yang terkunci di key ${k.key} akan dihapus. Pemilik bisa login lagi dari perangkat baru.`,
    label: 'Reset HWID',
    danger: false,
    run: async () => {
      await apiFetch(`/admin/keys/${k.id}/reset-hwid`, { method: 'POST' });
      refreshAll();
      notify('HWID direset');
    },
  });

  const askDelete = (k) => setConfirm({
    title: 'Hapus key?',
    message: `Key ${k.key} akan dihapus permanen dan tidak bisa dikembalikan.`,
    label: 'Hapus key',
    danger: true,
    run: async () => {
      await apiFetch(`/admin/keys/${k.id}`, { method: 'DELETE' });
      setEditItem(null);
      refreshAll();
      notify('Key dihapus');
    },
  });

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try { await confirm.run(); } catch (err) { notify(err.message, 'bad'); }
    setConfirmBusy(false);
    setConfirm(null);
  };

  const copyKey = async (text) => {
    try { await navigator.clipboard.writeText(text); notify('Key disalin'); }
    catch { notify('Gagal menyalin', 'bad'); }
  };

  const go = (v) => { setView(v); setMenuOpen(false); };

  /* ----- layar login ----- */
  if (!token) {
    return (
      <div className="adm">
        <style>{CSS}</style>
        <div className="adm-login">
          <form onSubmit={handleLogin}>
            <h1>BokHUB Admin</h1>
            <p>Masuk untuk mengelola key.</p>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw" type="password" className="inp" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && <div className="adm-err" role="alert">{loginError}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loginBusy}>
              {loginBusy ? 'Masuk…' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const total = stats?.keys?.total || 0;
  const active = stats?.keys?.active || 0;
  const expired = Math.max(0, total - active);
  const activePct = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="adm">
      <style>{CSS}</style>

      <div className="adm-shell">
        {/* ---------- sidebar ---------- */}
        <aside className={`adm-side ${menuOpen ? 'open' : ''}`} aria-label="Menu utama">
          <div className="adm-brand">
            <b>BokHUB</b>
            <span>Panel admin</span>
          </div>
          <nav className="adm-nav">
            <button className={`adm-navbtn ${view === 'overview' ? 'on' : ''}`} onClick={() => go('overview')}>
              <Icon name="grid" /> Ringkasan
            </button>
            <button className={`adm-navbtn ${view === 'keys' ? 'on' : ''}`} onClick={() => go('keys')}>
              <Icon name="key" /> Key
            </button>
          </nav>
          <div className="adm-side-foot">
            <button className="adm-navbtn" onClick={() => { refreshAll(); setMenuOpen(false); }}>
              <Icon name="refresh" /> Muat ulang data
            </button>
            <button className="adm-navbtn" onClick={handleLogout}>
              <Icon name="logout" /> Keluar
            </button>
          </div>
        </aside>
        {menuOpen && <div className="adm-scrim" onClick={() => setMenuOpen(false)} />}

        {/* ---------- konten ---------- */}
        <div className="adm-main">
          <header className="adm-top">
            <button onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Icon name="menu" size={22} /></button>
            <b>BokHUB</b>
          </header>

          <main className="adm-content">
            {view === 'overview' && (
              <>
                <div className="adm-head">
                  <div>
                    <h1>Ringkasan</h1>
                    <p>Kondisi key dan lalu lintas situs.</p>
                  </div>
                  <button className="btn" onClick={refreshAll}><Icon name="refresh" size={16} /> Muat ulang</button>
                </div>

                <div className="adm-two">
                  <section className="adm-card adm-pad">
                    <div className="adm-label">Key aktif dari seluruh key</div>
                    <div className="adm-num">{active} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 500 }}>dari {total}</span></div>
                    <div className="adm-meter" role="img" aria-label={`${activePct} persen key masih aktif`}>
                      <i style={{ width: `${activePct}%` }} />
                    </div>
                    <div className="adm-legend">
                      <div><b>{active}</b>Aktif</div>
                      <div><b>{expired}</b>Expired</div>
                      <div><b>{activePct}%</b>Masih berlaku</div>
                    </div>
                  </section>

                  <section className="adm-card adm-pad">
                    <div className="adm-label">Klik Get Key hari ini</div>
                    <div className="adm-num">{stats?.today?.getKeyClicks || 0}</div>
                    <div className="adm-sub">Orang yang mulai membuat key gratis.</div>
                    <div style={{ marginTop: 18 }}>
                      <button className="btn btn-primary" onClick={() => go('keys')}>Kelola key</button>
                    </div>
                  </section>
                </div>

                <div className="adm-three">
                  {[
                    ['Hari ini', stats?.today],
                    ['Minggu ini', stats?.week],
                    ['Bulan ini', stats?.month],
                  ].map(([label, s]) => (
                    <section className="adm-card adm-pad" key={label}>
                      <div className="adm-label">Kunjungan {label.toLowerCase()}</div>
                      <div className="adm-num">{s?.visits || 0}</div>
                      <div className="adm-sub">{s?.uniqueVisitors || 0} pengunjung unik</div>
                    </section>
                  ))}
                </div>
              </>
            )}

            {view === 'keys' && (
              <>
                <div className="adm-head">
                  <div>
                    <h1>Key</h1>
                    <p>Cari, edit waktu, batas perangkat, dan nama key.</p>
                  </div>
                </div>

                <section className="adm-card">
                  <div className="adm-tools">
                    <div className="adm-search">
                      <Icon name="search" size={16} />
                      <input
                        className="inp" placeholder="Cari key…" value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)} aria-label="Cari key"
                      />
                    </div>
                    <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                      <Icon name="plus" size={16} /> Tambah key
                    </button>
                  </div>

                  {keys.length === 0 ? (
                    <div className="adm-empty">
                      {loadingKeys
                        ? 'Memuat key…'
                        : search
                          ? `Tidak ada key yang cocok dengan “${search}”.`
                          : 'Belum ada key. Tambah key pertama dengan tombol di atas.'}
                    </div>
                  ) : (
                    <>
                      {/* tabel (desktop) */}
                      <div className="adm-tablewrap">
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>Key</th><th>Tipe</th><th>Status</th><th>Perangkat</th><th>Expired</th><th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keys.map((k) => (
                              <tr key={k.id}>
                                <td>
                                  <div className="keycell">
                                    <span className="mono">{k.key}</span>
                                    <button className="btn btn-sm btn-icon" onClick={() => copyKey(k.key)} aria-label="Salin key"><Icon name="copy" size={15} /></button>
                                  </div>
                                  {k.ownerName && <div className="subline">{k.ownerName}</div>}
                                </td>
                                <td><TypeBadge type={k.type} /></td>
                                <td><StatusBadge status={k.status} /></td>
                                <td><DeviceMeter k={k} /></td>
                                <td>
                                  <div>{fmtDate(k.expiresAt)}</div>
                                  <div className="subline">{remaining(k.expiresAt)}</div>
                                </td>
                                <td>
                                  <div className="actions">
                                    <button className="btn btn-sm btn-primary" onClick={() => setEditItem(k)}><Icon name="edit" size={15} /> Edit</button>
                                    <button className="btn btn-sm btn-icon" onClick={() => askReset(k)} aria-label="Reset HWID" title="Reset HWID"><Icon name="reset" size={15} /></button>
                                    <button className="btn btn-sm btn-icon btn-danger" onClick={() => askDelete(k)} aria-label="Hapus key" title="Hapus key"><Icon name="trash" size={15} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* kartu (mobile) */}
                      <div className="adm-cards">
                        {keys.map((k) => (
                          <article className="kcard" key={k.id}>
                            <div className="keycell">
                              <span className="mono">{k.key}</span>
                              <button className="btn btn-sm btn-icon" onClick={() => copyKey(k.key)} aria-label="Salin key"><Icon name="copy" size={15} /></button>
                            </div>
                            <div className="kcard-row">
                              <TypeBadge type={k.type} />
                              <StatusBadge status={k.status} />
                            </div>
                            <div className="kcard-meta">
                              <div>
                                <div className="adm-label">Perangkat</div>
                                <DeviceMeter k={k} />
                              </div>
                              <div>
                                <div className="adm-label">Expired</div>
                                <div>{fmtDate(k.expiresAt)}</div>
                                <div className="subline">{remaining(k.expiresAt)}</div>
                              </div>
                            </div>
                            <div className="kcard-actions">
                              <button className="btn btn-primary" onClick={() => setEditItem(k)}><Icon name="edit" size={16} /> Edit</button>
                              <button className="btn" onClick={() => askReset(k)}><Icon name="reset" size={16} /> Reset</button>
                              <button className="btn btn-danger btn-icon" style={{ flex: '0 0 44px' }} onClick={() => askDelete(k)} aria-label="Hapus key"><Icon name="trash" size={16} /></button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="adm-pager">
                    <span className="adm-sub">Halaman {page} dari {totalPages}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
                      <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya</button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ---------- modal ---------- */}
      {createOpen && <CreateKeyModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} />}
      {editItem && (
        <EditKeyModal
          key={editItem.id}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
          onReset={askReset}
          onDelete={askDelete}
        />
      )}
      {confirm && (
        <div className="adm-overlay top">
          <div className="adm-modal" role="alertdialog" aria-modal="true" aria-label={confirm.title} style={{ maxWidth: 440 }}>
            <div className="adm-modal-body">
              <h2 style={{ fontSize: 19, marginBottom: 8 }}>{confirm.title}</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{confirm.message}</p>
            </div>
            <div className="adm-modal-foot">
              <button className="btn" onClick={() => setConfirm(null)} disabled={confirmBusy}>Batal</button>
              <button className={`btn ${confirm.danger ? 'btn-primary' : 'btn-primary'}`} style={confirm.danger ? { background: 'var(--bad)', borderColor: 'var(--bad)' } : undefined} onClick={runConfirm} disabled={confirmBusy}>
                {confirmBusy ? 'Memproses…' : confirm.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div key={toast.id} className={`adm-toast ${toast.kind === 'bad' ? 'bad' : ''}`} role="status">{toast.text}</div>}
    </div>
  );
}