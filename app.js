'use strict';

/* ─────────────── SUPABASE ─────────────── */
const SUPABASE_URL      = 'https://zspyfjcqbuehbfqcbcax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcHlmamNxYnVlaGJmcWNiY2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDM3MDEsImV4cCI6MjA5NjIxOTcwMX0.khoftJXX6sDM5vTA4pKZXWlrUhwFipA3jDHt1mRWlUE';

const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ─────────────── CONSTANTS ─────────────── */
const MATERIAL_UTAMA = {
  biang:  { label: 'Biang Parfum',    unit: 'mL',  warnAt: 100, lowAt: 30,  optionLabel: 'Biang Parfum (mL)' },
  botolP: { label: 'Botol Perempuan', unit: 'pcs', warnAt: 5,   lowAt: 2,   optionLabel: 'Botol Perempuan (pcs)' },
  botolL: { label: 'Botol Laki-laki', unit: 'pcs', warnAt: 5,   lowAt: 2,   optionLabel: 'Botol Laki-laki (pcs)' }
};

const MATERIAL_PENOLONG = {
  box:    { label: 'Box Parfum Jadi', unit: 'pcs', warnAt: 5, lowAt: 2,   optionLabel: 'Box Parfum Jadi (pcs)' },
  kardus: { label: 'Kardus Luar',     unit: 'pcs', warnAt: 5, lowAt: 2,   optionLabel: 'Kardus Luar (pcs)' },
  bubble: { label: 'Bubble Wrap',     unit: 'm',   warnAt: 2, lowAt: 0.5, optionLabel: 'Bubble Wrap (meter)' }
};

const MATERIAL_META = { ...MATERIAL_UTAMA, ...MATERIAL_PENOLONG };

const VENDORS_DEFAULT = [
  { id: 1, name: 'PT Aroma Nusantara',    material: 'biang',             leadTimeDays: 3, contact: '0812-xxxx-xxxx' },
  { id: 2, name: 'CV Botol Kaca Jaya',    material: 'botolP,botolL',     leadTimeDays: 5, contact: '0813-xxxx-xxxx' },
  { id: 3, name: 'PT PackIndo Sejahtera', material: 'box,kardus,bubble', leadTimeDays: 2, contact: '0819-xxxx-xxxx' }
];

let VENDORS = VENDORS_DEFAULT.map(v => ({ ...v }));

const CHANNEL_CODES = { Shopee: 'SHP', eBay: 'EBY' };

const DEFAULT_STATE = {
  rm:    { biang: 0, botolP: 0, botolL: 0, box: 0, kardus: 0, bubble: 0 },
  fp:    { parfumP: 0, parfumL: 0 },
  log:   [],
  sales: []
};

let S = deepClone(DEFAULT_STATE);
let currentUser = null;

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

/* ─────────────── AUTH ─────────────── */
async function initAuth() {
  hideLoading();

  if (!sb) {
    showApp();
    loadLocalState();
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp();
    await loadState();
    setupRealtime();
  } else {
    showLogin();
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      showApp();
      await loadState();
      setupRealtime();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      S = deepClone(DEFAULT_STATE);
      showLogin();
    }
  });
}

async function doLogin() {
  if (!sb) { toast('Supabase belum dikonfigurasi.', 'error'); return; }

  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  errEl.style.display = 'none';
  if (!email || !pass) {
    showLoginError('Email dan password harus diisi.');
    return;
  }

  const btnLabel = btn.querySelector('.btn-label');
  btn.disabled = true;
  if (btnLabel) btnLabel.textContent = 'Memverifikasi…';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });

  btn.disabled = false;
  if (btnLabel) btnLabel.textContent = 'Masuk';

  if (error) {
    showLoginError(
      error.message.includes('Invalid login')
        ? 'Email atau password salah. Silakan coba lagi.'
        : error.message
    );
  }
}

async function doLogout() {
  if (!sb) return;
  if (!confirm('Yakin ingin logout?')) return;
  await sb.auth.signOut();
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function togglePassVisibility() {
  const input = document.getElementById('login-pass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('login-error').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.add('visible');
  if (currentUser) {
    document.getElementById('sidebar-user-email').textContent = currentUser.email;
  }
  setupFormListeners();
  renderAll();
  startClock();
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

/* ─────────────── STATE ─────────────── */
function loadLocalState() {
  try {
    const raw = localStorage.getItem('wmsParfum_v2');
    if (raw) S = { ...deepClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch(e) { console.warn('loadLocalState error', e); }
  setupFormListeners();
  renderAll();
  startClock();
}

async function loadState() {
  if (!sb) { loadLocalState(); return; }

  showStatSkeletons();

  try {
    const { data: inv, error: invErr } = await sb
      .from('wms_inventory')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (invErr) throw invErr;

    if (inv) {
      S.rm = {
        biang:  inv.biang   || 0,
        botolP: inv.botol_p || 0,
        botolL: inv.botol_l || 0,
        box:    inv.box     || 0,
        kardus: inv.kardus  || 0,
        bubble: inv.bubble  || 0
      };
      S.fp = { parfumP: inv.parfum_p || 0, parfumL: inv.parfum_l || 0 };
    } else {
      await sb.from('wms_inventory').insert({
        id: 1, biang: 0, botol_p: 0, botol_l: 0,
        box: 0, kardus: 0, bubble: 0, parfum_p: 0, parfum_l: 0
      });
    }

    const { data: dbLogs, error: logsErr } = await sb
      .from('wms_logs').select('*').order('id', { ascending: true }).limit(200);
    if (logsErr) throw logsErr;
    if (dbLogs) S.log = dbLogs;

    const { data: dbSales, error: salesErr } = await sb
      .from('wms_sales').select('*').order('id', { ascending: true }).limit(200);
    if (salesErr) throw salesErr;
    if (dbSales) S.sales = dbSales;

    const { data: dbVendors, error: vendorsErr } = await sb
      .from('wms_vendors').select('*').order('id', { ascending: true });
    if (!vendorsErr && dbVendors && dbVendors.length) {
      VENDORS = dbVendors.map(v => ({
        id: v.id,
        name: v.name,
        material: v.material,
        leadTimeDays: v.lead_time_days,
        contact: v.contact || ''
      }));
    }

  } catch(e) {
    console.error('loadState error:', e);
    toast('Gagal memuat data dari cloud. Cek koneksi internet.', 'warn', 4000);
  }

  renderAll();
  populateRmVendorSelect();
}

async function syncInventory() {
  if (!sb) return;
  try {
    const { error } = await sb.from('wms_inventory').update({
      biang:      S.rm.biang,
      botol_p:    S.rm.botolP,
      botol_l:    S.rm.botolL,
      box:        S.rm.box,
      kardus:     S.rm.kardus,
      bubble:     S.rm.bubble,
      parfum_p:   S.fp.parfumP,
      parfum_l:   S.fp.parfumL,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (error) throw error;
  } catch(e) {
    console.error('syncInventory error:', e);
    toast('Gagal sinkronisasi stok ke cloud', 'error');
  }
}

async function saveState() {
  if (!sb) {
    try { localStorage.setItem('wmsParfum_v2', JSON.stringify(S)); } catch(e) {}
  } else {
    await syncInventory();
  }
}

/* ─────────────── NAVIGATION ─────────────── */
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  rawmaterials: 'Stok Bahan Baku',
  production:   'Modul Produksi',
  sales:        'Penjualan & Outbound',
  vendors:      'Manajemen Vendor',
  report:       'Laporan Bulanan'
};

function navigateTo(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${pageKey}`).classList.add('active');
  document.querySelector(`[data-page="${pageKey}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[pageKey];
  renderAll();
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ─────────────── RENDER ─────────────── */
function renderAll() {
  renderDashboard();
  renderRawMaterials();
  renderProduction();
  renderSales();
  renderVendors();
  renderReport();
}

function renderDashboard() {
  const { rm, fp, log } = S;
  const maxes = { biang: 500, botolP: 50, botolL: 50, box: 50 };

  set('d-biang',  fmt(rm.biang)   + '<span class="stat-unit">mL</span>');
  set('d-botp',   fmt(rm.botolP)  + '<span class="stat-unit">pcs</span>');
  set('d-botl',   fmt(rm.botolL)  + '<span class="stat-unit">pcs</span>');
  set('d-box',    fmt(rm.box)     + '<span class="stat-unit">pcs</span>');
  set('d-kardus', fmt(rm.kardus)  + '<span class="stat-unit">pcs</span>');
  set('d-bubble', fmt(rm.bubble)  + '<span class="stat-unit">m</span>');
  set('d-fp-p',   fmt(fp.parfumP) + '<span class="stat-unit">pcs</span>');
  set('d-fp-l',   fmt(fp.parfumL) + '<span class="stat-unit">pcs</span>');

  setStyle('d-biang-fill', 'width', Math.min(100, (rm.biang  / maxes.biang)  * 100) + '%');
  setStyle('d-botp-fill',  'width', Math.min(100, (rm.botolP / maxes.botolP) * 100) + '%');
  setStyle('d-botl-fill',  'width', Math.min(100, (rm.botolL / maxes.botolL) * 100) + '%');
  setStyle('d-box-fill',   'width', Math.min(100, (rm.box    / maxes.box)    * 100) + '%');

  const el = document.getElementById('dash-log');
  const entries = [...log].reverse().slice(0, 10);
  if (!entries.length) {
    el.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:32px 0;">Belum ada aktivitas yang tercatat</div>';
    return;
  }
  const BADGE        = { inbound: 'log-in', production: 'log-prod', outbound: 'log-out' };
  const BADGE_LABEL  = { inbound: 'INBOUND', production: 'PRODUKSI', outbound: 'OUTBOUND' };
  el.innerHTML = entries.map(e => `
    <div style="display:flex;align-items:start;gap:12px;padding:10px 12px;border-radius:10px;background:#FAF7F2;">
      <span class="log-entry-icon ${e.type || ''}">${logTypeIcon(e.type)}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#2D1F17;font-weight:500;">${e.description}</div>
        <div style="font-size:11px;color:#B08A62;margin-top:2px;">${fmtDate(e.ts)}</div>
      </div>
      <span class="${BADGE[e.type] || ''}" style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;margin-top:2px;">${BADGE_LABEL[e.type] || e.type}</span>
    </div>`).join('');
}

function renderRawMaterials() {
  const { rm, log } = S;
  setTxt('rm-biang-val',  fmt(rm.biang)  + '<span class="stat-unit">mL</span>');
  setTxt('rm-botp-val',   fmt(rm.botolP) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-botl-val',   fmt(rm.botolL) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-box-val',    fmt(rm.box)    + '<span class="stat-unit">pcs</span>');
  setTxt('rm-kardus-val', fmt(rm.kardus) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-bubble-val', fmt(rm.bubble) + '<span class="stat-unit">m</span>');

  const badgeKeys = [
    ['rm-biang-badge',  'rm-biang-hint',  rm.biang,  'biang'],
    ['rm-botp-badge',   'rm-botp-hint',   rm.botolP, 'botolP'],
    ['rm-botl-badge',   'rm-botl-hint',   rm.botolL, 'botolL'],
    ['rm-box-badge',    'rm-box-hint',    rm.box,    'box'],
    ['rm-kardus-badge', 'rm-kardus-hint', rm.kardus, 'kardus'],
    ['rm-bubble-badge', 'rm-bubble-hint', rm.bubble, 'bubble']
  ];
  badgeKeys.forEach(([badgeId, hintId, val, key]) => {
    updateBadge(badgeId, val, key);
    updateVendorHint(hintId, val, key);
  });

  const el = document.getElementById('rm-log');
  const entries = log.filter(e => e.type === 'inbound').reverse().slice(0, 10);
  if (!entries.length) {
    el.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:24px 0;">Belum ada data inbound</div>';
    return;
  }
  el.innerHTML = entries.map(e => `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:9px 12px;background:#ECFDF5;border-radius:8px;border:1px solid #BBF7D0;">
      <span class="label-with-icon" style="color:#065F46;font-weight:500;">${logTypeIcon('inbound')}${e.description}</span>
      <span style="color:#6EE7B7;font-size:11px;white-space:nowrap;margin-left:10px;">${fmtDate(e.ts)}</span>
    </div>`).join('');
}

function renderProduction() {
  const { rm, fp, log } = S;
  setTxt('p-biang', fmt(rm.biang)  + ' mL');
  setTxt('p-botp',  fmt(rm.botolP) + ' pcs');
  setTxt('p-botl',  fmt(rm.botolL) + ' pcs');
  setTxt('p-box',   fmt(rm.box)    + ' pcs');
  setTxt('p-fp-p',  fmt(fp.parfumP));
  setTxt('p-fp-l',  fmt(fp.parfumL));

  const el = document.getElementById('prod-log');
  const entries = log.filter(e => e.type === 'production').reverse().slice(0, 8);
  if (!entries.length) {
    el.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum ada data produksi</div>';
    return;
  }
  el.innerHTML = entries.map(e => `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:9px 12px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
      <span class="label-with-icon" style="color:#1E40AF;font-weight:500;">${logTypeIcon('production')}${e.description}</span>
      <span style="color:#93C5FD;font-size:11px;white-space:nowrap;margin-left:10px;">${fmtDate(e.ts)}</span>
    </div>`).join('');
}

function renderSales() {
  const { fp, rm, sales } = S;
  setTxt('s-fp-p',   fmt(fp.parfumP) + ' pcs');
  setTxt('s-fp-l',   fmt(fp.parfumL) + ' pcs');
  setTxt('s-kardus', fmt(rm.kardus)  + ' pcs');
  setTxt('s-bubble', fmt(rm.bubble)  + ' m');

  const tbody = document.getElementById('sales-tbody');
  if (!sales || !sales.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#B08A62;padding:24px;">Belum ada data penjualan</td></tr>';
    return;
  }
  tbody.innerHTML = [...sales].reverse().map(s => {
    const prod = prodLabelHtml(s.product);
    const ch = channelBadgeHtml(s.channel);
    const kardusStr = (s.kardus != null && s.kardus > 0) ? `${fmt(s.kardus)} pcs` : '—';
    const bubbleStr = (s.bubble != null && s.bubble > 0) ? `${fmt(s.bubble)} cm`  : '—';
    return `
      <tr>
        <td style="white-space:nowrap;">${fmtDateShort(s.ts)}</td>
        <td>${prod}</td>
        <td style="font-weight:600;">${s.qty}</td>
        <td>${ch}</td>
        <td style="font-family:monospace;font-size:12px;color:#5C4A3C;">${s.tracking || '—'}</td>
        <td style="font-size:12px;color:#5C4A3C;">${kardusStr}</td>
        <td style="font-size:12px;color:#5C4A3C;">${bubbleStr}</td>
      </tr>`;
  }).join('');
}

/* ─────────────── ACTIONS ─────────────── */
async function addStock() {
  const type   = document.getElementById('rm-type').value;
  const qty    = parseFloat(document.getElementById('rm-qty').value);
  const vendor = document.getElementById('rm-vendor').value.trim();

  if (!qty || isNaN(qty) || qty <= 0) { toast('Jumlah harus lebih dari 0', 'error'); return; }
  if (!vendor) {
    toast('Pilih vendor sebelum menambah stok.\n\nData ini penting untuk dokumentasi dan traceable inventory.', 'warn', 4000);
    document.getElementById('rm-vendor').focus();
    return;
  }

  S.rm[type] = +(S.rm[type] + qty).toFixed(2);
  const m = MATERIAL_META[type];
  await addLog('inbound', `+${fmt(qty)} ${m.unit} ${m.label} — ${vendor}`);
  await saveState();
  renderAll();

  document.getElementById('rm-qty').value = '';
  toast(`${m.label} berhasil ditambah: +${fmt(qty)} ${m.unit}\nDari: ${vendor}`, 'success');
}

function updateProdPreview() {
  const bp   = parseInt(document.getElementById('prod-bp').value)   || 0;
  const bl   = parseInt(document.getElementById('prod-bl').value)   || 0;
  const size = parseInt(document.getElementById('prod-size').value) || 30;
  const tot  = bp + bl;
  setTxt('prev-biang', `${fmt(tot * size)} mL`);
  setTxt('prev-bp',    `${bp} pcs`);
  setTxt('prev-bl',    `${bl} pcs`);
  setTxt('prev-box',   `${tot} pcs`);
}

async function processProduction() {
  const bp   = parseInt(document.getElementById('prod-bp').value)   || 0;
  const bl   = parseInt(document.getElementById('prod-bl').value)   || 0;
  const size = parseInt(document.getElementById('prod-size').value) || 30;

  if (bp === 0 && bl === 0) { toast('Masukkan jumlah botol yang ingin dirakit (minimal 1)', 'error'); return; }

  const tot   = bp + bl;
  const biang = tot * size;
  const errors = [];

  if (S.rm.biang  < biang) errors.push(`Biang kurang: butuh ${fmt(biang)}mL, stok ${fmt(S.rm.biang)}mL`);
  if (S.rm.botolP < bp)    errors.push(`Botol Perempuan kurang: butuh ${bp}, stok ${S.rm.botolP}`);
  if (S.rm.botolL < bl)    errors.push(`Botol Laki-laki kurang: butuh ${bl}, stok ${S.rm.botolL}`);
  if (S.rm.box    < tot)   errors.push(`Box kurang: butuh ${tot}, stok ${S.rm.box}`);

  if (errors.length) { toast('Stok tidak cukup:\n' + errors.join('\n'), 'error', 5000); return; }

  S.rm.biang  = +(S.rm.biang  - biang).toFixed(2);
  S.rm.botolP -= bp;
  S.rm.botolL -= bl;
  S.rm.box    -= tot;
  S.fp.parfumP += bp;
  S.fp.parfumL += bl;

  const parts = [];
  if (bp > 0) parts.push(`${bp} Parfum Perempuan`);
  if (bl > 0) parts.push(`${bl} Parfum Laki-laki`);
  await addLog('production', `Rakit ${parts.join(' + ')} @ ${size}mL — Biang terpotong ${fmt(biang)}mL`);

  await saveState();
  renderAll();
  document.getElementById('prod-bp').value = '0';
  document.getElementById('prod-bl').value = '0';
  updateProdPreview();
  toast(`Produksi selesai.\n${parts.join(' & ')} siap jual.`, 'success');
}

async function recordSale() {
  const product  = document.getElementById('sale-product').value;
  const qty      = parseInt(document.getElementById('sale-qty').value)      || 0;
  const channel  = document.getElementById('sale-channel').value;
  const tracking = document.getElementById('sale-tracking').value.trim();
  const kardus      = parseFloat(document.getElementById('sale-kardus').value) || 0;
  const bubbleCm    = parseFloat(document.getElementById('sale-bubble').value) || 0;
  const bubble      = +(bubbleCm / 100).toFixed(4); // simpan dalam meter untuk stok
  const notes    = document.getElementById('sale-notes').value.trim();

  if (qty <= 0) { toast('Jumlah harus lebih dari 0', 'error'); return; }
  if (!tracking) {
    toast('Nomor Resi wajib diisi sebelum mencatat penjualan.', 'warn', 4000);
    document.getElementById('sale-tracking').focus();
    return;
  }
  if (kardus < 0) { toast('Kardus tidak boleh negatif', 'error'); return; }
  if (bubbleCm < 0) { toast('Bubble Wrap tidak boleh negatif', 'error'); return; }

  const errors = [];
  if (product === 'perempuan' && S.fp.parfumP < qty) errors.push(`Stok Parfum Perempuan hanya ${S.fp.parfumP} pcs`);
  if (product === 'lakiLaki'  && S.fp.parfumL < qty) errors.push(`Stok Parfum Laki-laki hanya ${S.fp.parfumL} pcs`);
  if (kardus > 0 && S.rm.kardus < kardus) errors.push(`Kardus hanya ${fmt(S.rm.kardus)} pcs (butuh ${fmt(kardus)})`);
  if (bubble > 0 && S.rm.bubble < bubble) errors.push(`Bubble Wrap hanya ${fmt(S.rm.bubble * 100)}cm (butuh ${fmt(bubbleCm)}cm)`);

  if (errors.length) { toast('Stok tidak cukup:\n' + errors.join('\n'), 'error', 5000); return; }

  if (product === 'perempuan') S.fp.parfumP -= qty;
  else                         S.fp.parfumL -= qty;

  if (kardus > 0) S.rm.kardus = +(Math.max(0, S.rm.kardus - kardus)).toFixed(2);
  if (bubble > 0) S.rm.bubble = +(Math.max(0, S.rm.bubble - bubble)).toFixed(2);

  const prodLabel = product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki';
  const chLabel   = channel === 'Shopee' ? 'Shopee (Lokal)' : 'eBay (Internasional)';

  const packingInfo = [];
  if (kardus > 0) packingInfo.push(`${fmt(kardus)} kardus`);
  if (bubbleCm > 0) packingInfo.push(`${fmt(bubbleCm)}cm bubble wrap`);
  const packingStr = packingInfo.length ? ` | Packing: ${packingInfo.join(', ')}` : '';

  await addLog('outbound', `Jual ${qty}x ${prodLabel} via ${chLabel}${packingStr}${tracking ? ' [' + tracking + ']' : ''}${notes ? ' — ' + notes : ''}`);

  const ts       = new Date().toISOString();
  const saleItem = { product, qty, channel, tracking, kardus, bubble: bubbleCm, notes, ts };
  if (!S.sales) S.sales = [];

  if (sb) {
    try {
      const { error } = await sb.from('wms_sales').insert(saleItem);
      if (error) throw error;
    } catch(e) {
      console.error('recordSale supabase error:', e);
      S.sales.push(saleItem);
      if (S.sales.length > 200) S.sales = S.sales.slice(-200);
    }
  } else {
    S.sales.push(saleItem);
    if (S.sales.length > 200) S.sales = S.sales.slice(-200);
  }

  await saveState();
  renderAll();

  document.getElementById('sale-qty').value      = '1';
  document.getElementById('sale-kardus').value   = '0';
  document.getElementById('sale-bubble').value   = '0';
  document.getElementById('sale-notes').value    = '';
  onSaleChannelChange();
  toast(`Penjualan tercatat.\n${qty}x ${prodLabel} via ${chLabel}`, 'success');
}

function exportCSV() {
  if (!S.sales || !S.sales.length) { toast('Belum ada data penjualan untuk di-export', 'warn'); return; }
  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble Wrap (m)', 'Catatan'];
  const rows   = S.sales.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ?? '', s.bubble ?? '',
    s.notes || ''
  ]);
  const csv  = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `outbound_${todayStr()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV berhasil di-export.', 'success');
}

async function resetData() {
  if (!confirm('Yakin ingin MENGHAPUS SEMUA data?\n\nTindakan ini tidak bisa dibatalkan!')) return;
  S = deepClone(DEFAULT_STATE);

  if (sb) {
    try {
      await sb.from('wms_logs').delete().gt('id', 0);
      await sb.from('wms_sales').delete().gt('id', 0);
      await sb.from('wms_inventory').update({
        biang: 0, botol_p: 0, botol_l: 0, box: 0,
        kardus: 0, bubble: 0, parfum_p: 0, parfum_l: 0,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
    } catch(e) { console.error('resetData supabase error:', e); }
  }

  await saveState();
  renderAll();
  toast('Semua data telah di-reset.', 'warn');
}

/* ─────────────── HELPERS ─────────────── */
async function addLog(type, description) {
  const ts      = new Date().toISOString();
  const logItem = { type, description, ts };

  if (sb) {
    try {
      await sb.from('wms_logs').insert(logItem);
    } catch(e) {
      console.error('addLog supabase error:', e);
      S.log.push(logItem);
      if (S.log.length > 200) S.log = S.log.slice(-200);
    }
  } else {
    S.log.push(logItem);
    if (S.log.length > 200) S.log = S.log.slice(-200);
  }
}

function setupRealtime() {
  if (!sb) return;
  sb.channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_inventory' }, payload => {
      const inv = payload.new;
      if (inv && inv.id === 1) {
        S.rm = { biang: inv.biang||0, botolP: inv.botol_p||0, botolL: inv.botol_l||0, box: inv.box||0, kardus: inv.kardus||0, bubble: inv.bubble||0 };
        S.fp = { parfumP: inv.parfum_p||0, parfumL: inv.parfum_l||0 };
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wms_logs' }, payload => {
      const n = payload.new;
      if (n && !S.log.some(l => l.id === n.id || (l.description === n.description && l.ts === n.ts))) {
        S.log.push(n);
        if (S.log.length > 200) S.log = S.log.slice(-200);
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wms_sales' }, payload => {
      const n = payload.new;
      if (n && !S.sales.some(s => s.id === n.id || (s.tracking === n.tracking && s.ts === n.ts))) {
        S.sales.push(n);
        if (S.sales.length > 200) S.sales = S.sales.slice(-200);
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wms_logs' },  () => { S.log   = []; renderAll(); })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wms_sales' }, () => { S.sales = []; renderAll(); })
    .subscribe();
}

function fmt(n) {
  if (n == null || isNaN(n)) return '0';
  if (Number.isInteger(n) || n === Math.floor(n)) return n.toLocaleString('id-ID');
  return parseFloat(n.toFixed(2)).toLocaleString('id-ID');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}
function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day:'numeric', month:'short' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

function getVendorsForMaterial(materialKey) {
  return VENDORS.filter(v =>
    v.material.split(',').map(s => s.trim()).includes(materialKey)
  );
}

function getPrimaryVendorForMaterial(materialKey) {
  const list = getVendorsForMaterial(materialKey);
  return list.length ? list[0] : null;
}

function populateRmTypeOptions() {
  const catEl  = document.getElementById('rm-category');
  const typeEl = document.getElementById('rm-type');
  if (!catEl || !typeEl) return;

  const category = catEl.value;
  const metaMap  = category === 'utama' ? MATERIAL_UTAMA : MATERIAL_PENOLONG;
  const prev     = typeEl.value;

  typeEl.innerHTML = Object.entries(metaMap).map(([k, m]) =>
    `<option value="${k}">${m.optionLabel}</option>`
  ).join('');

  const keys = Object.keys(metaMap);
  if (keys.includes(prev)) typeEl.value = prev;
  populateRmVendorSelect();
}

function populateRmVendorSelect() {
  const typeEl   = document.getElementById('rm-type');
  const vendorEl = document.getElementById('rm-vendor');
  if (!typeEl || !vendorEl) return;

  const materialKey = typeEl.value;
  const vendors     = getVendorsForMaterial(materialKey);

  if (!vendors.length) {
    vendorEl.innerHTML = '<option value="">— Tidak ada vendor terdaftar —</option>';
    return;
  }

  vendorEl.innerHTML = vendors.map(v =>
    `<option value="${v.name}">${v.name} (Lead time: ${v.leadTimeDays} hari)</option>`
  ).join('');
}

function updateVendorHint(hintId, val, key) {
  const hintEl = document.getElementById(hintId);
  if (!hintEl) return;
  const m = MATERIAL_META[key];
  const vendor = getPrimaryVendorForMaterial(key);

  if (val < m.warnAt && vendor) {
    hintEl.innerHTML = `${icon('alert', 'ico ico-xs')} Stok menipis. Pesan ke ${vendor.name} (Estimasi tiba: ${vendor.leadTimeDays} hari)`;
    hintEl.hidden = false;
  } else {
    hintEl.hidden = true;
    hintEl.textContent = '';
  }
}

function updateBadge(id, val, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const m = MATERIAL_META[key];
  const vendor = getPrimaryVendorForMaterial(key);
  let statusText = 'OK';
  let cls = 'badge-ok';

  if (val <= 0) {
    cls = 'badge-low';
    statusText = 'HABIS';
  } else if (val < m.lowAt) {
    cls = 'badge-low';
    statusText = 'KRITIS';
  } else if (val < m.warnAt) {
    cls = 'badge-warn';
    statusText = 'PERINGATAN';
  }

  el.className = cls;
  el.textContent = statusText;

  if (val < m.warnAt && vendor) {
    const tip = `Stok menipis. Pesan ke ${vendor.name} (Estimasi tiba: ${vendor.leadTimeDays} hari)`;
    el.title = tip;
    el.setAttribute('data-tooltip', tip);
  } else {
    el.removeAttribute('title');
    el.removeAttribute('data-tooltip');
  }
}

function renderVendors() {
  const tbody = document.getElementById('vendors-tbody');
  if (!tbody) return;

  if (!VENDORS.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#B08A62;padding:24px;">Belum ada vendor terdaftar</td></tr>';
    return;
  }

  tbody.innerHTML = VENDORS.map(v => {
    const materials = v.material.split(',').map(k => k.trim()).map(k => {
      const m = MATERIAL_META[k];
      return m ? m.label : k;
    }).join(', ');
    return `
      <tr>
        <td style="font-weight:600;color:#2D1F17;">${v.name}</td>
        <td>${materials}</td>
        <td style="text-align:center;"><span class="lead-badge">${v.leadTimeDays} hari</span></td>
        <td style="font-family:monospace;font-size:12px;color:#5C4A3C;">${v.contact || '—'}</td>
        <td style="font-size:12px;color:#8B6F5E;">${v.material}</td>
      </tr>`;
  }).join('');
}

function generateInternalTrackingId(channel) {
  const code = CHANNEL_CODES[channel] || 'WMS';
  const now  = new Date();
  const ymd  = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${code}-${ymd}-${rand}`;
}

function onSaleChannelChange() {
  const channel = document.getElementById('sale-channel').value;
  const input   = document.getElementById('sale-tracking');
  if (input) input.value = generateInternalTrackingId(channel);
}

function simulateCourierTracking() {
  const channel = document.getElementById('sale-channel').value;
  const input   = document.getElementById('sale-tracking');
  const btn     = document.getElementById('btn-gen-resi');
  if (!input || !btn) return;

  btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span><span class="btn-label">Memuat…</span>';
  input.classList.add('tracking-loading');

  setTimeout(() => {
    const dummy = channel === 'Shopee'
      ? `JNT${Math.floor(100000000 + Math.random() * 900000000)}ID`
      : `DHL${Math.floor(10000000 + Math.random() * 90000000)}US`;

    input.value = dummy;
    input.classList.remove('tracking-loading');
    btn.disabled = false;
    btn.innerHTML = `${icon('refresh', 'ico ico-sm')}<span class="btn-label">Generate Resi Kurir</span>`;
    toast(`Resi kurir ${channel} berhasil di-generate.`, 'success');
  }, 500);
}

let formListenersReady = false;

function setupFormListeners() {
  if (!formListenersReady) {
    const rmCategory = document.getElementById('rm-category');
    const rmType     = document.getElementById('rm-type');
    const saleCh     = document.getElementById('sale-channel');
    const genResiBtn = document.getElementById('btn-gen-resi');

    if (rmCategory) rmCategory.addEventListener('change', populateRmTypeOptions);
    if (rmType)     rmType.addEventListener('change', populateRmVendorSelect);
    if (saleCh)     saleCh.addEventListener('change', onSaleChannelChange);
    if (genResiBtn) genResiBtn.addEventListener('click', simulateCourierTracking);
    formListenersReady = true;
  }

  populateRmTypeOptions();
  onSaleChannelChange();
}

function set(id, html)           { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setTxt(id, txt)         { const el = document.getElementById(id); if (el) el.innerHTML = txt; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

function toast(msg, type = 'info', duration = 3000) {
  const cls = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-warn';
  const el  = document.createElement('div');
  el.className   = `toast ${cls}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function startClock() {
  const tick = () => {
    const now = new Date();
    const timeEl = document.getElementById('nowTime');
    const heroEl = document.getElementById('hero-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    if (heroEl) heroEl.textContent = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  };
  tick();
  setInterval(tick, 1000);
}

/* ─────────────── SKELETON LOADER ─────────────── */
function showStatSkeletons() {
  const statIds = [
    'rm-biang-val','rm-botp-val','rm-botl-val',
    'rm-box-val','rm-kardus-val','rm-bubble-val',
    'd-biang','d-botp','d-botl','d-box','d-kardus','d-bubble',
    'd-fp-p','d-fp-l'
  ];
  const skeletonHtml = '<span class="skeleton skeleton-num" style="display:inline-block;"></span>';
  statIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = skeletonHtml;
  });
}

/* ─────────────── LAPORAN BULANAN ─────────────── */
let reportMonth = null; // 'YYYY-MM'

function getAvailableMonths() {
  const months = new Set();
  (S.sales || []).forEach(s => {
    if (s.ts) months.add(s.ts.slice(0, 7));
  });
  (S.log || []).filter(l => l.type === 'production').forEach(l => {
    if (l.ts) months.add(l.ts.slice(0, 7));
  });
  return [...months].sort().reverse();
}

function renderMonthTabs() {
  const months = getAvailableMonths();
  const container = document.getElementById('month-tabs');
  if (!container) return;

  if (!months.length) {
    container.innerHTML = '<span style="font-size:13px;color:#B08A62;">Belum ada data untuk ditampilkan</span>';
    return;
  }

  if (!reportMonth || !months.includes(reportMonth)) {
    reportMonth = months[0];
  }

  container.innerHTML = months.map(m => `
    <button class="month-tab ${m === reportMonth ? 'active' : ''}"
      onclick="selectReportMonth('${m}')">${fmtMonth(m)}</button>
  `).join('');
}

function selectReportMonth(m) {
  reportMonth = m;
  renderReport();
}

function fmtMonth(ym) {
  const [y, mo] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

function renderReport() {
  renderMonthTabs();
  if (!reportMonth) return;

  const salesThisMonth    = (S.sales || []).filter(s => s.ts && s.ts.startsWith(reportMonth));
  const logsThisMonth     = (S.log   || []).filter(l => l.ts && l.ts.startsWith(reportMonth));
  const prodLogsThisMonth = logsThisMonth.filter(l => l.type === 'production');

  const totalQty    = salesThisMonth.reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const qtyP        = salesThisMonth.filter(s => s.product === 'perempuan').reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const qtyL        = salesThisMonth.filter(s => s.product === 'lakiLaki').reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const orderShopee = salesThisMonth.filter(s => s.channel === 'Shopee').length;
  const orderEbay   = salesThisMonth.filter(s => s.channel === 'eBay').length;

  setTxt('rpt-total',  fmt(totalQty));
  setTxt('rpt-p',      fmt(qtyP));
  setTxt('rpt-l',      fmt(qtyL));
  setTxt('rpt-shopee', fmt(orderShopee));
  setTxt('rpt-ebay',   fmt(orderEbay));
  setTxt('rpt-prod',   fmt(prodLogsThisMonth.length));

  const shopeeQty = salesThisMonth.filter(s => s.channel === 'Shopee').reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
  const ebayQty   = salesThisMonth.filter(s => s.channel === 'eBay').reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
  const maxQty    = Math.max(shopeeQty, ebayQty, 1);

  const chartEl = document.getElementById('rpt-channel-chart');
  if (chartEl) {
    chartEl.innerHTML = `
      <div class="channel-bar">
        <span class="label-with-icon" style="width:72px;font-size:12px;color:#9A3412;font-weight:600;">${icon('shop', 'ico ico-xs')} Shopee</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(shopeeQty/maxQty*100).toFixed(1)}%;background:linear-gradient(90deg,#EA580C,#FED7AA);"></div></div>
        <span style="width:32px;text-align:right;font-weight:700;font-size:13px;color:#9A3412;">${shopeeQty}</span>
      </div>
      <div class="channel-bar">
        <span class="label-with-icon" style="width:72px;font-size:12px;color:#1E40AF;font-weight:600;">${icon('globe', 'ico ico-xs')} eBay</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(ebayQty/maxQty*100).toFixed(1)}%;background:linear-gradient(90deg,#1D4ED8,#BFDBFE);"></div></div>
        <span style="width:32px;text-align:right;font-weight:700;font-size:13px;color:#1D4ED8;">${ebayQty}</span>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #F2EAE0;display:flex;justify-content:space-between;font-size:12px;color:#8B6F5E;">
        <span>Total order: <strong style="color:#2D1F17;">${salesThisMonth.length}</strong></span>
        <span>Total pcs: <strong style="color:#2D1F17;">${totalQty}</strong></span>
      </div>`;
  }

  const topEl = document.getElementById('rpt-top-product');
  if (topEl) {
    const maxProd = Math.max(qtyP, qtyL, 1);
    topEl.innerHTML = !totalQty
      ? '<div style="text-align:center;color:#B08A62;font-size:13px;padding:12px 0;">Tidak ada penjualan bulan ini</div>'
      : `
      <div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:#BE185D;font-weight:600;">${prodLabelHtml('perempuan')}</span>
          <span style="font-weight:700;">${qtyP} pcs</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${(qtyP/maxProd*100).toFixed(1)}%;background:linear-gradient(90deg,#BE185D,#F9A8D4);"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:#1D4ED8;font-weight:600;">${prodLabelHtml('lakiLaki')}</span>
          <span style="font-weight:700;">${qtyL} pcs</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${(qtyL/maxProd*100).toFixed(1)}%;background:linear-gradient(90deg,#1D4ED8,#93C5FD);"></div></div>
      </div>`;
  }

  const tbody = document.getElementById('rpt-sales-tbody');
  if (tbody) {
    if (!salesThisMonth.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#B08A62;padding:24px;">Tidak ada penjualan pada bulan ini</td></tr>';
    } else {
      tbody.innerHTML = [...salesThisMonth].reverse().map(s => {
        const prod = prodLabelHtml(s.product);
        const ch   = channelBadgeHtml(s.channel);
        return `
          <tr>
            <td style="white-space:nowrap;">${fmtDateShort(s.ts)}</td>
            <td>${prod}</td>
            <td style="font-weight:600;">${s.qty}</td>
            <td>${ch}</td>
            <td style="font-family:monospace;font-size:12px;color:#5C4A3C;">${s.tracking || '—'}</td>
            <td style="font-size:12px;color:#8B6F5E;">${s.notes || '—'}</td>
          </tr>`;
      }).join('');
    }
  }
}

function exportReportCSV() {
  if (!reportMonth) { toast('Pilih bulan terlebih dahulu', 'warn'); return; }
  const salesThisMonth = (S.sales || []).filter(s => s.ts && s.ts.startsWith(reportMonth));
  if (!salesThisMonth.length) { toast('Tidak ada data penjualan bulan ini', 'warn'); return; }

  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble Wrap (m)', 'Catatan'];
  const rows   = salesThisMonth.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ?? '', s.bubble ?? '',
    s.notes || ''
  ]);
  const csv  = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `laporan_${reportMonth}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  toast(`Laporan ${fmtMonth(reportMonth)} berhasil di-export.`, 'success');
}

/* ─────────────── INIT ─────────────── */
initAuth();
