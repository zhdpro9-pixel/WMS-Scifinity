'use strict';

/* ─────────────── SUPABASE ─────────────── */
const SUPABASE_URL      = 'https://zspyfjcqbuehbfqcbcax.supabase.co';   // contoh: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcHlmamNxYnVlaGJmcWNiY2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDM3MDEsImV4cCI6MjA5NjIxOTcwMX0.khoftJXX6sDM5vTA4pKZXWlrUhwFipA3jDHt1mRWlUE';      // dari: Project Settings → API → anon public

const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ─────────────── CONSTANTS ─────────────── */
const MATERIAL_UTAMA = {
  biang: { label: 'Biang Parfum', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Biang Parfum (mL)' },
  botolP: { label: 'Botol Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Perempuan (pcs)' },
  botolL: { label: 'Botol Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Laki-laki (pcs)' }
};

const MATERIAL_PENOLONG = {
  box: { label: 'Box Parfum Jadi', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Parfum Jadi (pcs)' },
  kardus: { label: 'Kardus Luar', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Kardus Luar (pcs)' },
  bubble: { label: 'Bubble Wrap', unit: 'm', warnAt: 2, lowAt: 0.5, optionLabel: 'Bubble Wrap (meter)' }
};

const MATERIAL_META = { ...MATERIAL_UTAMA, ...MATERIAL_PENOLONG };

const VENDORS_DEFAULT = [
  { id: 1, name: 'PT Aroma Nusantara', material: 'biang', leadTimeDays: 3, contact: '0812-xxxx-xxxx' },
  { id: 2, name: 'CV Botol Kaca Jaya', material: 'botolP,botolL', leadTimeDays: 5, contact: '0813-xxxx-xxxx' },
  { id: 3, name: 'PT PackIndo Sejahtera', material: 'box,kardus,bubble', leadTimeDays: 2, contact: '0819-xxxx-xxxx' }
];

let VENDORS = VENDORS_DEFAULT.map(v => ({ ...v }));

const CHANNEL_CODES = { Shopee: 'SHP', eBay: 'EBY' };

const DEFAULT_STATE = {
  rm: { biang: 0, botolP: 0, botolL: 0, box: 0, kardus: 0, bubble: 0 },
  log: [],
  sales: []
};

let S = deepClone(DEFAULT_STATE);
let currentUser = null;
let realtimeChannel = null; // Store realtime channel for cleanup
let clockInterval = null; // Store clock interval for cleanup

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
  const pass = document.getElementById('login-pass').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  errEl.style.display = 'none';
  if (!email || !pass) {
    showLoginError('Email dan password harus diisi.');
    return;
  }

  const btnLabel = btn.querySelector('.btn-label');
  const originalLabel = btnLabel ? btnLabel.textContent : 'Masuk';
  btn.disabled = true;
  if (btnLabel) btnLabel.textContent = 'Memverifikasi…';
  // Add loading spinner class
  btn.classList.add('loading');

  try {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });

    if (error) {
      showLoginError(
        error.message.includes('Invalid login')
          ? 'Email atau password salah. Silakan coba lagi.'
          : error.message
      );
    }
  } finally {
    btn.disabled = false;
    if (btnLabel) btnLabel.textContent = originalLabel;
    btn.classList.remove('loading');
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
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.add('visible');
  if (currentUser) {
    document.getElementById('sidebar-user-email').textContent = currentUser.email;
  }
  loadFinConfig(); // baca config dari localStorage ke memori
  populateFinFields(); // isi input form sekali saat pertama load
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
  } catch (e) { console.warn('loadLocalState error', e); }
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
        biang: inv.biang || 0,
        botolP: inv.botol_p || 0,
        botolL: inv.botol_l || 0,
        box: inv.box || 0,
        kardus: inv.kardus || 0,
        bubble: inv.bubble || 0
      };
    } else {
      await sb.from('wms_inventory').insert({
        id: 1, biang: 0, botol_p: 0, botol_l: 0,
        box: 0, kardus: 0, bubble: 0
      });
    }

    const { data: dbLogs, error: logsErr } = await sb
      .from('wms_logs').select('*').order('id', { ascending: false }).limit(5000);
    if (logsErr) throw logsErr;
    if (dbLogs) S.log = dbLogs.reverse();

    const { data: dbSales, error: salesErr } = await sb
      .from('wms_sales').select('*').order('id', { ascending: false }).limit(5000);
    if (salesErr) throw salesErr;
    if (dbSales) S.sales = dbSales.reverse();

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
    } else {
      // Insert default vendors if none exist
      const defaultVendors = [
        { name: 'PT Aroma Nusantara', material: 'biang', lead_time_days: 3, contact: '0812-xxxx-xxxx' },
        { name: 'CV Botol Kaca Jaya', material: 'botolP,botolL', lead_time_days: 5, contact: '0813-xxxx-xxxx' },
        { name: 'PT PackIndo Sejahtera', material: 'box,kardus,bubble', lead_time_days: 2, contact: '0819-xxxx-xxxx' }
      ];
      
      const { error: insertVendorsErr } = await sb.from('wms_vendors').insert(defaultVendors);
      if (!insertVendorsErr) {
        // Reload vendors after insertion
        const { data: newVendors } = await sb.from('wms_vendors').select('*').order('id', { ascending: true });
        if (newVendors) {
          VENDORS = newVendors.map(v => ({
            id: v.id,
            name: v.name,
            material: v.material,
            leadTimeDays: v.lead_time_days,
            contact: v.contact || ''
          }));
        }
      }
    }

  } catch (e) {
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
      biang: S.rm.biang,
      botol_p: S.rm.botolP,
      botol_l: S.rm.botolL,
      box: S.rm.box,
      kardus: S.rm.kardus,
      bubble: S.rm.bubble,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (error) throw error;
  } catch (e) {
    console.error('syncInventory error:', e);
    toast('Gagal sinkronisasi stok ke cloud', 'error');
  }
}

async function saveState() {
  if (!sb) {
    try { localStorage.setItem('wmsParfum_v2', JSON.stringify(S)); } catch (e) { }
  } else {
    await syncInventory();
  }
}

/* ─────────────── NAVIGATION ─────────────── */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  rawmaterials: 'Stok Bahan Baku',
  sales: 'Penjualan & Outbound',
  financial: 'Proyeksi Keuangan',
  vendors: 'Manajemen Vendor',
  report: 'Laporan Bulanan'
};

function navigateTo(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${pageKey}`).classList.add('active');
  document.querySelector(`[data-page="${pageKey}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[pageKey];
  // Populate financial input fields hanya saat halaman financial dibuka,
  // bukan setiap renderAll() agar tidak overwrite input yang sedang diketik
  if (pageKey === 'financial') populateFinFields();
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
  renderSales();
  renderFinancial();
  renderVendors();
  renderReport();
}

function renderDashboard() {
  const { rm, log, sales } = S;
  const maxes = { biang: 500, botolP: 50, botolL: 50, box: 50 };

  set('d-biang', fmt(rm.biang) + '<span class="stat-unit">mL</span>');
  set('d-botp', fmt(rm.botolP) + '<span class="stat-unit">pcs</span>');
  set('d-botl', fmt(rm.botolL) + '<span class="stat-unit">pcs</span>');
  set('d-box', fmt(rm.box) + '<span class="stat-unit">pcs</span>');
  set('d-kardus', fmt(rm.kardus) + '<span class="stat-unit">pcs</span>');
  set('d-bubble', fmt(rm.bubble) + '<span class="stat-unit">m</span>');

  setStyle('d-biang-fill', 'width', Math.min(100, (rm.biang / maxes.biang) * 100) + '%');
  setStyle('d-botp-fill', 'width', Math.min(100, (rm.botolP / maxes.botolP) * 100) + '%');
  setStyle('d-botl-fill', 'width', Math.min(100, (rm.botolL / maxes.botolL) * 100) + '%');
  setStyle('d-box-fill', 'width', Math.min(100, (rm.box / maxes.box) * 100) + '%');

  // Render sales chart
  renderSalesChart(sales);

  const el = document.getElementById('dash-log');
  const entries = [...log].reverse().slice(0, 10);
  if (!entries.length) {
    el.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:32px 0;">Belum ada aktivitas yang tercatat</div>';
    return;
  }
  const BADGE = { inbound: 'log-in', production: 'log-prod', outbound: 'log-out' };
  const BADGE_LABEL = { inbound: 'INBOUND', production: 'PRODUKSI', outbound: 'OUTBOUND' };
  el.innerHTML = entries.map(e => `
    <div style="display:flex;align-items:start;gap:12px;padding:10px 12px;border-radius:10px;background:#FAF7F2;">
      <span class="log-entry-icon ${e.type || ''}">${logTypeIcon(e.type)}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#2D1F17;font-weight:500;">${sanitizeHtml(e.description)}</div>
        <div style="font-size:11px;color:#B08A62;margin-top:2px;">${fmtDate(e.ts)}</div>
      </div>
      <span class="${BADGE[e.type] || ''}" style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;margin-top:2px;">${BADGE_LABEL[e.type] || e.type}</span>
    </div>`).join('');
}

function renderSalesChart(sales) {
  const chartEl = document.getElementById('sales-chart');
  if (!chartEl) return;

  // Get last 7 days
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date: date,
      key: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      total: 0
    });
  }

  // Calculate sales per day
  if (sales && sales.length) {
    sales.forEach(s => {
      const saleDate = new Date(s.ts).toISOString().split('T')[0];
      const dayData = days.find(d => d.key === saleDate);
      if (dayData) {
        dayData.total += s.qty;
      }
    });
  }

  // Find max value for scaling
  const maxTotal = Math.max(...days.map(d => d.total), 1);

  chartEl.innerHTML = days.map(d => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="font-size:10px;font-weight:600;color:#5C4A3C;">${d.total}</div>
      <div style="width:100%;background:#E4D3BD;border-radius:4px;flex:1;display:flex;align-items:end;">
        <div style="width:100%;background:linear-gradient(180deg,#5C4A3C,#C9A882);border-radius:4px;transition:height 0.3s ease;height:${(d.total / maxTotal) * 100}%;"></div>
      </div>
      <div style="font-size:10px;color:#8B6F5E;">${d.label}</div>
    </div>
  `).join('');
}

function renderRawMaterials() {
  const { rm, log } = S;
  setTxt('rm-biang-val', fmt(rm.biang) + '<span class="stat-unit">mL</span>');
  setTxt('rm-botp-val', fmt(rm.botolP) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-botl-val', fmt(rm.botolL) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-box-val', fmt(rm.box) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-kardus-val', fmt(rm.kardus) + '<span class="stat-unit">pcs</span>');
  setTxt('rm-bubble-val', fmt(rm.bubble) + '<span class="stat-unit">m</span>');

  const badgeKeys = [
    ['rm-biang-badge', 'rm-biang-hint', rm.biang, 'biang'],
    ['rm-botp-badge', 'rm-botp-hint', rm.botolP, 'botolP'],
    ['rm-botl-badge', 'rm-botl-hint', rm.botolL, 'botolL'],
    ['rm-box-badge', 'rm-box-hint', rm.box, 'box'],
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

function updateSalePreview() {
  const qty = parseInt(document.getElementById('sale-qty').value) || 0;
  const size = parseInt(document.getElementById('sale-size').value) || 30;
  const totBiang = qty * size;
  setTxt('sale-prev-biang', `${fmt(totBiang)} mL`);
  setTxt('sale-prev-box', `${fmt(qty)} pcs`);
}

function renderSales() {
  const { rm, sales } = S;
  setTxt('s-biang', fmt(rm.biang) + ' mL');
  setTxt('s-botp', fmt(rm.botolP) + ' pcs');
  setTxt('s-botl', fmt(rm.botolL) + ' pcs');
  setTxt('s-box', fmt(rm.box) + ' pcs');
  setTxt('s-kardus', fmt(rm.kardus) + ' pcs');
  setTxt('s-bubble', fmt(rm.bubble) + ' m');

  // Get filter values
  const searchInput = document.getElementById('sales-search');
  const channelFilter = document.getElementById('sales-channel-filter');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const channelValue = channelFilter ? channelFilter.value : '';

  // Filter sales
  let filteredSales = [...sales].reverse();
  if (searchTerm) {
    filteredSales = filteredSales.filter(s =>
      (s.tracking && s.tracking.toLowerCase().includes(searchTerm)) ||
      (s.product && s.product.toLowerCase().includes(searchTerm)) ||
      (s.notes && s.notes.toLowerCase().includes(searchTerm))
    );
  }
  if (channelValue) {
    filteredSales = filteredSales.filter(s => s.channel === channelValue);
  }

  const tbody = document.getElementById('sales-tbody');
  if (!filteredSales || !filteredSales.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#B08A62;padding:24px;">Belum ada data penjualan</td></tr>';
    return;
  }
  tbody.innerHTML = filteredSales.map(s => {
    const prod = prodLabelHtml(s.product);
    const ch = channelBadgeHtml(s.channel);
    const kardusStr = (s.kardus != null && s.kardus > 0) ? `${fmt(s.kardus)} pcs` : '—';
    const bubbleStr = (s.bubble != null && s.bubble > 0) ? `${fmt(normalizeBubbleCm(s.bubble))} cm` : '—';
    const userEmail = s.user_email || '—';
    return `
      <tr>
        <td style="white-space:nowrap;">${fmtDateShort(s.ts)}</td>
        <td>${prod}</td>
        <td style="font-weight:600;">${sanitizeHtml(String(s.qty))}</td>
        <td>${ch}</td>
        <td style="font-family:monospace;font-size:12px;color:#5C4A3C;">${sanitizeHtml(s.tracking || '—')}</td>
        <td style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(kardusStr)}</td>
        <td style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(bubbleStr)}</td>
        <td style="font-size:11px;color:#8B6F5E;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${sanitizeHtml(userEmail)}</td>
      </tr>`;
  }).join('');
}

/* ─────────────── ACTIONS ─────────────── */
async function addStock() {
  const typeEl = document.getElementById('rm-type');
  const qtyEl = document.getElementById('rm-qty');
  const vendorEl = document.getElementById('rm-vendor');

  const type = typeEl.value;
  const qty = validateQuantity(qtyEl.value, true);
  const vendor = vendorEl.value.trim();

  if (!qty) return;

  if (!vendor) {
    toast('Pilih vendor sebelum menambah stok!\nData ini penting untuk traceability.', 'warn', 4000);
    vendorEl.focus();
    return;
  }

  S.rm[type] = +(S.rm[type] + qty).toFixed(2);
  const m = MATERIAL_META[type];

  await addLog('inbound', `+${fmt(qty)} ${m.unit} ${m.label} — ${vendor}`);
  await saveState();
  renderAll();

  qtyEl.value = '';
  toast(`${m.label} berhasil ditambah: +${fmt(qty)} ${m.unit}\nDari: ${vendor}`, 'success');
}

function updateProdPreview() { /* deprecated - now uses updateSalePreview */ }

async function processProduction() { /* deprecated - production merged into sales */ }

async function recordSale() {
  const productEl = document.getElementById('sale-product');
  const qtyEl = document.getElementById('sale-qty');
  const sizeEl = document.getElementById('sale-size');
  const channelEl = document.getElementById('sale-channel');
  const trackingEl = document.getElementById('sale-tracking');
  const kardusEl = document.getElementById('sale-kardus');
  const bubbleEl = document.getElementById('sale-bubble');
  const notesEl = document.getElementById('sale-notes');

  const product = productEl.value;
  const qty = validateQuantity(qtyEl.value, false);
  const size = parseInt(sizeEl.value) || 30;
  const channel = channelEl.value;
  const tracking = validateTracking(trackingEl.value);
  let kardus = parseFloat(kardusEl.value) || 0;
  let bubbleCm = parseFloat(bubbleEl.value) || 0;
  const bubble = +(bubbleCm / 100).toFixed(4); // simpan dalam meter untuk stok
  const notes = notesEl.value.trim();

  if (!qty || !tracking) return;

  // Validate kardus and bubble wrap can't be negative
  if (kardus < 0) {
    toast('Jumlah kardus tidak boleh negatif!', 'error');
    kardusEl.focus();
    return;
  }
  if (bubbleCm < 0) {
    toast('Jumlah bubble wrap tidak boleh negatif!', 'error');
    bubbleEl.focus();
    return;
  }

  // Auto-deduct: biang = qty * size, botol = qty (sesuai jenis), box = qty
  const biangNeeded = qty * size;
  const bottleKey = product === 'perempuan' ? 'botolP' : 'botolL';
  const bottleLabel = product === 'perempuan' ? 'Botol Perempuan' : 'Botol Laki-laki';

  const errors = [];
  if (S.rm.biang < biangNeeded) errors.push(`Biang kurang: butuh ${fmt(biangNeeded)}mL, stok ${fmt(S.rm.biang)}mL`);
  if (S.rm[bottleKey] < qty) errors.push(`${bottleLabel} kurang: butuh ${qty}, stok ${S.rm[bottleKey]}`);
  if (S.rm.box < qty) errors.push(`Box kurang: butuh ${qty}, stok ${S.rm.box}`);
  if (kardus > 0 && S.rm.kardus < kardus) errors.push(`Kardus hanya ${fmt(S.rm.kardus)} pcs (butuh ${fmt(kardus)})`);
  if (bubble > 0 && S.rm.bubble < bubble) errors.push(`Bubble Wrap hanya ${fmt(S.rm.bubble * 100)}cm (butuh ${fmt(bubbleCm)}cm)`);

  if (errors.length) {
    toast('Stok tidak cukup:\n' + errors.join('\n'), 'error', 5000);
    return;
  }

  // Auto-cut stok bahan baku
  S.rm.biang = +(S.rm.biang - biangNeeded).toFixed(2);
  S.rm[bottleKey] -= qty;
  S.rm.box -= qty;

  if (kardus > 0) S.rm.kardus = +(Math.max(0, S.rm.kardus - kardus)).toFixed(2);
  if (bubble > 0) S.rm.bubble = +(Math.max(0, S.rm.bubble - bubble)).toFixed(2);

  const prodLabel = product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki';
  const chLabel = channel === 'Shopee' ? 'Shopee (Lokal)' : 'eBay (Internasional)';

  const packingInfo = [];
  if (kardus > 0) packingInfo.push(`${fmt(kardus)} kardus`);
  if (bubbleCm > 0) packingInfo.push(`${fmt(bubbleCm)}cm bubble wrap`);
  const packingStr = packingInfo.length ? ` | Packing: ${packingInfo.join(', ')}` : '';

  await addLog('outbound', `Jual ${qty}x ${prodLabel} @ ${size}mL via ${chLabel}${packingStr}${tracking ? ' [' + tracking + ']' : ''} | Auto: -${fmt(biangNeeded)}mL biang, -${qty} ${bottleLabel}, -${qty} box${notes ? ' — ' + notes : ''}`);

  const ts = new Date().toISOString();
  const saleItem = {
    product,
    qty,
    size,
    channel,
    tracking,
    kardus,
    bubble: bubbleCm,
    notes,
    ts,
    user_id: currentUser?.id || 'local',
    user_email: currentUser?.email || 'local_user'
  };
  if (!S.sales) S.sales = [];

  if (sb) {
    try {
      const { error } = await sb.from('wms_sales').insert(saleItem);
      if (error) throw error;
      // Jangan push manual — realtime listener yang akan push setelah INSERT sukses
      // agar tidak ada duplikasi data di S.sales
    } catch (e) {
      console.error('recordSale supabase error:', e);
      toast('Gagal menyimpan ke cloud, tapi disimpan lokal: ' + e.message, 'warn', 4000);
      // Fallback: push manual hanya jika INSERT ke Supabase gagal
      S.sales.push(saleItem);
      if (S.sales.length > 5000) S.sales = S.sales.slice(-5000);
    }
  } else {
    S.sales.push(saleItem);
    if (S.sales.length > 5000) S.sales = S.sales.slice(-5000);
  }

  await saveState();
  renderAll();

  qtyEl.value = '1';
  kardusEl.value = '0';
  bubbleEl.value = '0';
  notesEl.value = '';
  onSaleChannelChange();
  updateSalePreview();
  toast(`Penjualan tercatat.\n${qty}x ${prodLabel} @ ${size}mL via ${chLabel}\nAuto-cut: ${fmt(biangNeeded)}mL biang, ${qty} ${bottleLabel}, ${qty} box`, 'success', 4000);
}

function exportCSV() {
  if (!S.sales || !S.sales.length) { toast('Belum ada data penjualan untuk di-export', 'warn'); return; }
  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble Wrap (cm)', 'Catatan'];
  const rows = S.sales.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ?? '', normalizeBubbleCm(s.bubble),
    s.notes || ''
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `outbound_${todayStr()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV berhasil di-export.', 'success');
}

async function resetData() {
  // Step 1: Password verification
  const password = prompt('Untuk konfirmasi reset data, silakan ketik "RESET" (huruf besar semua):');
  if (password !== 'RESET') {
    toast('Reset dibatalkan! Kata konfirmasi salah.', 'warn');
    return;
  }

  // Step 2: Final confirmation
  if (!confirm('⚠️ PERINGATAN PENTING! ⚠️\n\nSemua data (inventory, logs, sales) akan dihapus SELAMANYA!\n\nApakah Anda 100% yakin?')) {
    toast('Reset dibatalkan!', 'warn');
    return;
  }

  // Execute reset
  S = deepClone(DEFAULT_STATE);

  if (sb) {
    try {
      await sb.from('wms_logs').delete().gt('id', 0);
      await sb.from('wms_sales').delete().gt('id', 0);
      await sb.from('wms_inventory').update({
        biang: 0, botol_p: 0, botol_l: 0, box: 0,
        kardus: 0, bubble: 0,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
    } catch (e) {
      console.error('resetData supabase error:', e);
      toast('Gagal mereset data di cloud: ' + e.message, 'error', 5000);
    }
  }

  await saveState();
  renderAll();
  toast('✅ Semua data telah di-reset.', 'success');
}

/* ─────────────── HELPERS ─────────────── */

/** Sanitize HTML to prevent XSS attacks */
function sanitizeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Validate quantity input */
function validateQuantity(qty, allowDecimal = false) {
  const num = allowDecimal ? parseFloat(qty) : parseInt(qty);
  if (isNaN(num) || num <= 0) {
    toast('Jumlah harus lebih dari 0!', 'error');
    return null;
  }
  return num;
}

/** Validate tracking number format */
function validateTracking(tracking) {
  if (!tracking || tracking.trim() === '') {
    toast('Nomor resi wajib diisi!', 'error');
    return null;
  }
  return tracking.trim();
}

async function addLog(type, description) {
  const ts = new Date().toISOString();
  const logItem = {
    type,
    description,
    ts,
    user_id: currentUser?.id || 'local',
    user_email: currentUser?.email || 'local_user'
  };

  if (sb) {
    try {
      const { error } = await sb.from('wms_logs').insert(logItem);
      if (error) throw error;
      // Jangan push manual — realtime listener yang akan push setelah INSERT sukses
      // agar tidak ada duplikasi. Push lokal hanya sebagai fallback di bawah.
      return; // sukses → keluar, realtime yang handle
    } catch (e) {
      console.error('addLog supabase error:', e);
      // Fallback: push lokal jika INSERT gagal
    }
  }

  // Mode offline atau fallback saat INSERT gagal
  S.log.push(logItem);
  if (S.log.length > 5000) S.log = S.log.slice(-5000);
}

function setupRealtime() {
  if (!sb) return;

  // Cleanup existing channel if it exists
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }

  realtimeChannel = sb.channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_inventory' }, payload => {
      const inv = payload.new;
      if (inv && inv.id === 1) {
        S.rm = { biang: inv.biang || 0, botolP: inv.botol_p || 0, botolL: inv.botol_l || 0, box: inv.box || 0, kardus: inv.kardus || 0, bubble: inv.bubble || 0 };
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wms_logs' }, payload => {
      const n = payload.new;
      if (n && !S.log.some(l => l.id === n.id || (l.description === n.description && l.ts === n.ts))) {
        S.log.push(n);
        if (S.log.length > 5000) S.log = S.log.slice(-5000);
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wms_sales' }, payload => {
      const n = payload.new;
      if (n && !S.sales.some(s => s.id === n.id || (s.tracking === n.tracking && s.ts === n.ts))) {
        S.sales.push(n);
        if (S.sales.length > 5000) S.sales = S.sales.slice(-5000);
        renderAll();
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wms_logs' }, () => { S.log = []; renderAll(); })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wms_sales' }, () => { S.sales = []; renderAll(); })
    .subscribe();
}

function fmt(n) {
  // Ensure n is a number
  const num = Number(n);
  if (n == null || isNaN(num)) return '0';
  if (Number.isInteger(num) || num === Math.floor(num)) return num.toLocaleString('id-ID');
  return parseFloat(num.toFixed(2)).toLocaleString('id-ID');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

/**
 * Normalisasi nilai bubble dari DB ke satuan cm.
 * Data lama disimpan dalam meter (misal: 1.5), data baru dalam cm (misal: 150).
 * Heuristik: jika nilai < 20 kemungkinan besar meter (data lama) → kali 100.
 * Threshold 20 dipilih karena sangat tidak mungkin orang pakai bubble wrap < 20cm
 * tapi sangat mungkin stok bubble wrap > 20 meter.
 */
function normalizeBubbleCm(val) {
  const n = parseFloat(val) || 0;
  if (n <= 0) return 0;
  // Jika nilainya kecil (< 20), hampir pasti data lama dalam meter
  return n < 20 ? +(n * 100).toFixed(2) : n;
}

function getYearMonthLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

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
  const catEl = document.getElementById('rm-category');
  const typeEl = document.getElementById('rm-type');
  if (!catEl || !typeEl) return;

  const category = catEl.value;
  const metaMap = category === 'utama' ? MATERIAL_UTAMA : MATERIAL_PENOLONG;
  const prev = typeEl.value;

  typeEl.innerHTML = Object.entries(metaMap).map(([k, m]) =>
    `<option value="${k}">${m.optionLabel}</option>`
  ).join('');

  const keys = Object.keys(metaMap);
  if (keys.includes(prev)) typeEl.value = prev;
  populateRmVendorSelect();
}

function populateRmVendorSelect() {
  const typeEl = document.getElementById('rm-type');
  const vendorEl = document.getElementById('rm-vendor');
  if (!typeEl || !vendorEl) return;

  const materialKey = typeEl.value;
  const vendors = getVendorsForMaterial(materialKey);

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
  const now = new Date();
  const ymd = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0');

  // Generate unique ID - check for collision with existing sales
  let trackingId;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); // 4 digits instead of 3
    const timestamp = String(now.getHours()).padStart(2, '0')
      + String(now.getMinutes()).padStart(2, '0')
      + String(now.getSeconds()).padStart(2, '0');
    trackingId = `${code}-${ymd}-${timestamp}-${rand}`;
    attempts++;
  } while (S.sales.some(s => s.tracking === trackingId) && attempts < maxAttempts);

  return trackingId;
}

function onSaleChannelChange() {
  const channel = document.getElementById('sale-channel').value;
  const input = document.getElementById('sale-tracking');
  if (input) input.value = generateInternalTrackingId(channel);
}

function simulateCourierTracking() {
  const channel = document.getElementById('sale-channel').value;
  const input = document.getElementById('sale-tracking');
  const btn = document.getElementById('btn-gen-resi');
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
    const rmType = document.getElementById('rm-type');
    const saleCh = document.getElementById('sale-channel');
    const genResiBtn = document.getElementById('btn-gen-resi');

    if (rmCategory) rmCategory.addEventListener('change', populateRmTypeOptions);
    if (rmType) rmType.addEventListener('change', populateRmVendorSelect);
    if (saleCh) saleCh.addEventListener('change', onSaleChannelChange);
    if (saleCh) document.getElementById('sale-product')?.addEventListener('change', updateSalePreview);
    if (saleCh) document.getElementById('sale-size')?.addEventListener('change', updateSalePreview);
    if (genResiBtn) genResiBtn.addEventListener('click', simulateCourierTracking);
    formListenersReady = true;
  }

  populateRmTypeOptions();
  onSaleChannelChange();
  updateSalePreview();
}

function set(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setTxt(id, txt) { const el = document.getElementById(id); if (el) el.innerHTML = txt; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

function toast(msg, type = 'info', duration = 3000) {
  const cls = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-warn';
  const el = document.createElement('div');
  el.className = `toast ${cls}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function startClock() {
  // Cleanup existing interval if it exists
  if (clockInterval) {
    clearInterval(clockInterval);
  }

  const tick = () => {
    const now = new Date();
    const timeEl = document.getElementById('nowTime');
    const heroEl = document.getElementById('hero-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (heroEl) heroEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  tick();
  clockInterval = setInterval(tick, 1000);
}

/* ─────────────── SKELETON LOADER ─────────────── */
function showStatSkeletons() {
  const statIds = [
    'rm-biang-val', 'rm-botp-val', 'rm-botl-val',
    'rm-box-val', 'rm-kardus-val', 'rm-bubble-val',
    'd-biang', 'd-botp', 'd-botl', 'd-box', 'd-kardus', 'd-bubble'
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
    if (s.ts) months.add(getYearMonthLocal(s.ts));
  });
  // Catatan: filter 'production' dihapus karena alur produksi sudah merged ke sales.
  // Month selector cukup berdasarkan data sales saja.
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
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

function renderReport() {
  renderMonthTabs();
  if (!reportMonth) return;

  const salesThisMonth = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === reportMonth);

  const totalQty = salesThisMonth.reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const qtyP = salesThisMonth.filter(s => s.product === 'perempuan').reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const qtyL = salesThisMonth.filter(s => s.product === 'lakiLaki').reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const orderShopee = salesThisMonth.filter(s => s.channel === 'Shopee').length;
  const orderEbay = salesThisMonth.filter(s => s.channel === 'eBay').length;

  const avgOrderSize = salesThisMonth.length > 0 ? (totalQty / salesThisMonth.length).toFixed(1) : 0;

  setTxt('rpt-total', fmt(totalQty));
  setTxt('rpt-p', fmt(qtyP));
  setTxt('rpt-l', fmt(qtyL));
  setTxt('rpt-shopee', fmt(orderShopee));
  setTxt('rpt-ebay', fmt(orderEbay));
  setTxt('rpt-prod', avgOrderSize);

  const shopeeQty = salesThisMonth.filter(s => s.channel === 'Shopee').reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
  const ebayQty = salesThisMonth.filter(s => s.channel === 'eBay').reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
  const maxQty = Math.max(shopeeQty, ebayQty, 1);

  const chartEl = document.getElementById('rpt-channel-chart');
  if (chartEl) {
    chartEl.innerHTML = `
      <div class="channel-bar">
        <span class="label-with-icon" style="width:72px;font-size:12px;color:#9A3412;font-weight:600;">${icon('shop', 'ico ico-xs')} Shopee</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(shopeeQty / maxQty * 100).toFixed(1)}%;background:linear-gradient(90deg,#EA580C,#FED7AA);"></div></div>
        <span style="width:32px;text-align:right;font-weight:700;font-size:13px;color:#9A3412;">${shopeeQty}</span>
      </div>
      <div class="channel-bar">
        <span class="label-with-icon" style="width:72px;font-size:12px;color:#1E40AF;font-weight:600;">${icon('globe', 'ico ico-xs')} eBay</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(ebayQty / maxQty * 100).toFixed(1)}%;background:linear-gradient(90deg,#1D4ED8,#BFDBFE);"></div></div>
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
        <div class="progress-bar"><div class="progress-fill" style="width:${(qtyP / maxProd * 100).toFixed(1)}%;background:linear-gradient(90deg,#BE185D,#F9A8D4);"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:#1D4ED8;font-weight:600;">${prodLabelHtml('lakiLaki')}</span>
          <span style="font-weight:700;">${qtyL} pcs</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${(qtyL / maxProd * 100).toFixed(1)}%;background:linear-gradient(90deg,#1D4ED8,#93C5FD);"></div></div>
      </div>`;
  }

  const tbody = document.getElementById('rpt-sales-tbody');
  if (tbody) {
    if (!salesThisMonth.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#B08A62;padding:24px;">Tidak ada penjualan pada bulan ini</td></tr>';
    } else {
      tbody.innerHTML = [...salesThisMonth].reverse().map(s => {
        const prod = prodLabelHtml(s.product);
        const ch = channelBadgeHtml(s.channel);
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
  const salesThisMonth = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === reportMonth);
  if (!salesThisMonth.length) { toast('Tidak ada data penjualan bulan ini', 'warn'); return; }

  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble Wrap (cm)', 'Catatan'];
  const rows = salesThisMonth.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ?? '', normalizeBubbleCm(s.bubble),
    s.notes || ''
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `laporan_${reportMonth}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  toast(`Laporan ${fmtMonth(reportMonth)} berhasil di-export.`, 'success');
}

/* ─────────────── FINANCIAL CONFIG ─────────────── */
const FIN_CONFIG_DEFAULT = {
  priceP: 150000, priceL: 150000,
  costBiang: 500, costBottle: 5000,
  costBox: 3000, costPacking: 5000,
  costKardus: 2000, costBubble: 1500,
  feeMarketplace: 5, costOverhead: 5000000
};
let finConfig = { ...FIN_CONFIG_DEFAULT };

function loadFinConfig() {
  try {
    const raw = localStorage.getItem('wmsFinConfig');
    if (raw) finConfig = { ...FIN_CONFIG_DEFAULT, ...JSON.parse(raw) };
  } catch (e) { }
}

/** Isi form input dengan nilai finConfig saat ini. Dipanggil sekali saat halaman financial dibuka. */
function populateFinFields() {
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.value = val; };
  el('fin-price-p',        finConfig.priceP);
  el('fin-price-l',        finConfig.priceL);
  el('fin-cost-biang',     finConfig.costBiang);
  el('fin-cost-bottle',    finConfig.costBottle);
  el('fin-cost-box',       finConfig.costBox);
  el('fin-cost-packing',   finConfig.costPacking);
  el('fin-cost-kardus',    finConfig.costKardus);
  el('fin-cost-bubble',    finConfig.costBubble);
  el('fin-fee-marketplace',finConfig.feeMarketplace);
  el('fin-cost-overhead',  finConfig.costOverhead);
}

function saveFinConfig() {
  const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
  finConfig = {
    priceP: v('fin-price-p'), priceL: v('fin-price-l'),
    costBiang: v('fin-cost-biang'), costBottle: v('fin-cost-bottle'),
    costBox: v('fin-cost-box'), costPacking: v('fin-cost-packing'),
    costKardus: v('fin-cost-kardus'), costBubble: v('fin-cost-bubble'),
    feeMarketplace: v('fin-fee-marketplace'), costOverhead: v('fin-cost-overhead')
  };
  try { localStorage.setItem('wmsFinConfig', JSON.stringify(finConfig)); } catch (e) { }
}

function fmtRp(n) {
  if (n == null || isNaN(n)) return 'Rp 0';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function renderFinancial() {
  // Hanya baca config dari memori — JANGAN panggil loadFinConfig() di sini
  // karena itu akan overwrite input yang sedang diketik user.

  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const salesThisMonth = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === thisMonth);

  // --- 1. Revenue Calculation ---
  let qtyP = 0, qtyL = 0, totalRevenue = 0;
  salesThisMonth.forEach(s => {
    const qty = parseInt(s.qty) || 0;
    const price = s.product === 'perempuan' ? finConfig.priceP : finConfig.priceL;
    if (s.product === 'perempuan') qtyP += qty;
    else qtyL += qty;
    totalRevenue += qty * price;
  });
  const revenueP = qtyP * finConfig.priceP;
  const revenueL = qtyL * finConfig.priceL;

  // --- 2. COGS & Expenses Calculation ---
  let totalBiangMl = 0, totalBottles = 0, totalBoxes = 0;
  let totalKardusPcs = 0, totalBubbleM = 0;

  salesThisMonth.forEach(s => {
    const sz = parseInt(s.size) || 30;
    const qty = parseInt(s.qty) || 0;
    totalBiangMl += qty * sz;
    totalBottles += qty;
    totalBoxes += qty;
    totalKardusPcs += parseInt(s.kardus) || 0;
    totalBubbleM += normalizeBubbleCm(s.bubble) / 100; // normalisasi ke meter untuk kalkulasi biaya
  });

  const costBiang = totalBiangMl * finConfig.costBiang;
  const costBottle = totalBottles * finConfig.costBottle;
  const costBox = totalBoxes * finConfig.costBox;
  const costKardus = totalKardusPcs * finConfig.costKardus;
  const costBubble = totalBubbleM * finConfig.costBubble;
  const costPack = salesThisMonth.length * finConfig.costPacking;
  const costMarketplace = totalRevenue * (finConfig.feeMarketplace / 100);
  const totalCOGS = costBiang + costBottle + costBox + costKardus + costBubble + costPack;
  const totalExpenses = totalCOGS + costMarketplace + finConfig.costOverhead;

  // --- 3. Profit Calculations ---
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // --- 4. AOV (Average Order Value) ---
  const totalOrders = salesThisMonth.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // --- 5. Break Even Point (BEP) ---
  // Calculate average contribution margin per unit
  const avgPrice = (qtyP + qtyL) > 0 ? (revenueP + revenueL) / (qtyP + qtyL) : finConfig.priceP;
  // Average variable cost per unit (simplified - using 30mL as average)
  const avgVariableCost = (30 * finConfig.costBiang) + finConfig.costBottle + finConfig.costBox +
    (finConfig.costKardus / 2) + (finConfig.costBubble / 2) + (finConfig.costPacking / 2);
  const contributionMarginPerUnit = avgPrice - avgVariableCost - (avgPrice * (finConfig.feeMarketplace / 100));
  const bepUnits = contributionMarginPerUnit > 0 ? Math.ceil(finConfig.costOverhead / contributionMarginPerUnit) : 0;

  // --- Update KPI Displays ---
  setTxt('fin-revenue', fmtRp(totalRevenue));
  setTxt('fin-cogs', fmtRp(totalCOGS));
  setTxt('fin-profit', fmtRp(grossProfit));
  setTxt('fin-margin', grossMargin + '%');
  setTxt('fin-net-profit', fmtRp(netProfit));
  setTxt('fin-aov', fmtRp(aov));
  setTxt('fin-bep-unit', fmt(bepUnits));
  setTxt('fin-total-orders', fmt(totalOrders));

  // --- Revenue Breakdown ---
  const revEl = document.getElementById('fin-revenue-breakdown');
  if (revEl) {
    if (!salesThisMonth.length) {
      revEl.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum ada penjualan bulan ini</div>';
    } else {
      const maxRev = Math.max(revenueP, revenueL, 1);
      revEl.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span style="color:#BE185D;font-weight:600;">${prodLabelHtml('perempuan')}</span>
            <span style="font-weight:700;">${qtyP} pcs = ${fmtRp(revenueP)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(revenueP / maxRev * 100).toFixed(1)}%;background:linear-gradient(90deg,#BE185D,#F9A8D4);"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span style="color:#1D4ED8;font-weight:600;">${prodLabelHtml('lakiLaki')}</span>
            <span style="font-weight:700;">${qtyL} pcs = ${fmtRp(revenueL)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(revenueL / maxRev * 100).toFixed(1)}%;background:linear-gradient(90deg,#1D4ED8,#93C5FD);"></div></div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F2EAE0;display:flex;justify-content:space-between;font-size:12px;color:#8B6F5E;">
          <span>Total: <strong style="color:#2D1F17;">${qtyP + qtyL} pcs</strong></span>
          <span>Pendapatan: <strong style="color:#166534;">${fmtRp(totalRevenue)}</strong></span>
        </div>`;
    }
  }

  // --- Cost Breakdown ---
  const costEl = document.getElementById('fin-cost-breakdown');
  if (costEl) {
    const costItems = [
      { label: 'Biang Parfum', val: costBiang, detail: `${fmt(totalBiangMl)} mL × ${fmtRp(finConfig.costBiang)}`, color: '#9A3412', bg: 'linear-gradient(90deg,#9A3412,#FED7AA)' },
      { label: 'Botol', val: costBottle, detail: `${fmt(totalBottles)} pcs × ${fmtRp(finConfig.costBottle)}`, color: '#5C4A3C', bg: 'linear-gradient(90deg,#5C4A3C,#C9A882)' },
      { label: 'Box Parfum', val: costBox, detail: `${fmt(totalBoxes)} pcs × ${fmtRp(finConfig.costBox)}`, color: '#1E40AF', bg: 'linear-gradient(90deg,#1E40AF,#BFDBFE)' },
      { label: 'Kardus', val: costKardus, detail: `${fmt(totalKardusPcs)} pcs × ${fmtRp(finConfig.costKardus)}`, color: '#7C3AED', bg: 'linear-gradient(90deg,#7C3AED,#C4B5FD)' },
      { label: 'Bubble Wrap', val: costBubble, detail: `${fmt(totalBubbleM.toFixed(1))} m × ${fmtRp(finConfig.costBubble)}`, color: '#059669', bg: 'linear-gradient(90deg,#059669,#6EE7B7)' },
      { label: 'Packing', val: costPack, detail: `${totalOrders} order × ${fmtRp(finConfig.costPacking)}`, color: '#DC2626', bg: 'linear-gradient(90deg,#DC2626,#FCA5A5)' },
      { label: 'Fee Marketplace', val: costMarketplace, detail: `${finConfig.feeMarketplace}% × ${fmtRp(totalRevenue)}`, color: '#D97706', bg: 'linear-gradient(90deg,#D97706,#FCD34D)' },
      { label: 'Overhead Bulanan', val: finConfig.costOverhead, detail: '(sewa, gaji, dll)', color: '#1E3A8A', bg: 'linear-gradient(90deg,#1E3A8A,#93C5FD)' }
    ];
    const maxCost = Math.max(...costItems.map(c => c.val), 1);

    costEl.innerHTML = costItems.map(c => `
      <div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
          <span style="color:${c.color};font-weight:600;">${c.label}</span>
          <span style="font-weight:700;">${fmtRp(c.val)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#8B6F5E;margin-bottom:4px;">
          <span>${c.detail}</span>
        </div>
        <div class="progress-bar" style="height:4px;"><div class="progress-fill" style="width:${(c.val / maxCost * 100).toFixed(1)}%;background:${c.bg};"></div></div>
      </div>`).join('') + `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F2EAE0;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
        <div style="color:#9A3412;">Total HPP: <strong>${fmtRp(totalCOGS)}</strong></div>
        <div style="color:#DC2626;">Total Biaya: <strong>${fmtRp(totalExpenses)}</strong></div>
      </div>`;
  }

  // --- Product Profitability ---
  const profEl = document.getElementById('fin-product-profit');
  if (profEl) {
    const products = [
      { label: 'Parfum Perempuan', price: finConfig.priceP, color: '#BE185D', qty: qtyP },
      { label: 'Parfum Laki-laki', price: finConfig.priceL, color: '#1D4ED8', qty: qtyL }
    ];

    profEl.innerHTML = products.map(p => {
      // Calculate cost per unit for 30, 50, 100mL (average)
      const costPerUnit30 = (30 * finConfig.costBiang) + finConfig.costBottle + finConfig.costBox;
      const costPerUnit50 = (50 * finConfig.costBiang) + finConfig.costBottle + finConfig.costBox;
      const costPerUnit100 = (100 * finConfig.costBiang) + finConfig.costBottle + finConfig.costBox;
      const avgCostPerUnit = (costPerUnit30 + costPerUnit50 + costPerUnit100) / 3;

      const profitPerUnit = p.price - avgCostPerUnit - (p.price * (finConfig.feeMarketplace / 100));
      const margin = p.price > 0 ? ((profitPerUnit / p.price) * 100).toFixed(1) : 0;

      return `
        <div style="padding:14px;background:#FAF7F2;border-radius:12px;border:1px solid #F2EAE0;">
          <div style="font-size:14px;font-weight:700;color:${p.color};margin-bottom:8px;">${p.label}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
            <div><span style="color:#8B6F5E;">Harga Jual:</span> <strong>${fmtRp(p.price)}</strong></div>
            <div><span style="color:#8B6F5E;">HPP/unit (avg):</span> <strong style="color:#9A3412;">${fmtRp(avgCostPerUnit)}</strong></div>
            <div><span style="color:#8B6F5E;">Laba/unit:</span> <strong style="color:${profitPerUnit >= 0 ? '#166534' : '#991B1B'}">${fmtRp(profitPerUnit)}</strong></div>
            <div><span style="color:#8B6F5E;">Margin:</span> <strong style="color:${profitPerUnit >= 0 ? '#166534' : '#991B1B'}">${margin}%</strong></div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#8B6F5E;">Total laba bulan ini: <strong style="color:#166534;">${fmtRp(profitPerUnit * p.qty)}</strong> (${p.qty} pcs terjual)</div>
        </div>`;
    }).join('');
  }

  // --- 3-Month Projection ---
  const projEl = document.getElementById('fin-projection');
  if (projEl) {
    const months = getAvailableMonths();
    if (months.length < 1) {
      projEl.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum cukup data untuk proyeksi</div>';
    } else {
      // Calculate avg monthly revenue from last 3 months
      const recentMonths = months.slice(0, 3);
      let totalPastRev = 0, totalPastQty = 0, monthCount = 0;
      recentMonths.forEach(m => {
        const mSales = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === m);
        if (mSales.length) {
          monthCount++;
          mSales.forEach(s => {
            const sz = parseInt(s.size) || 30;
            const price = s.product === 'perempuan' ? finConfig.priceP : finConfig.priceL;
            totalPastRev += (parseInt(s.qty) || 0) * price;
            totalPastQty += (parseInt(s.qty) || 0);
          });
        }
      });
      const avgRev = monthCount > 0 ? totalPastRev / monthCount : 0;
      const avgQty = monthCount > 0 ? totalPastQty / monthCount : 0;
      const growth = 1.1; // 10% monthly growth assumption

      const projections = [];
      let baseRev = avgRev, baseQty = avgQty;
      for (let i = 1; i <= 3; i++) {
        baseRev *= growth;
        baseQty *= growth;
        const pCOGS = baseQty * ((50 * finConfig.costBiang) + finConfig.costBottle + finConfig.costBox + finConfig.costPacking);
        const pMarketplace = baseRev * (finConfig.feeMarketplace / 100);
        const pNetProfit = baseRev - pCOGS - pMarketplace - finConfig.costOverhead;
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = futureDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        projections.push({ month: monthName, rev: baseRev, cogs: pCOGS, profit: pNetProfit });
      }

      projEl.innerHTML = `
        <div style="font-size:11px;color:#8B6F5E;margin-bottom:8px;">Berdasarkan rata-rata ${monthCount} bulan terakhir + estimasi pertumbuhan 10%/bulan</div>
        ${projections.map((p, i) => `
          <div style="padding:12px;background:${i === 0 ? '#F0FDF4' : '#FAF7F2'};border-radius:10px;border:1px solid ${i === 0 ? '#BBF7D0' : '#F2EAE0'};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:700;color:#2D1F17;">${p.month}</span>
              <span style="font-size:11px;font-weight:600;color:${p.profit >= 0 ? '#166534' : '#991B1B'};background:${p.profit >= 0 ? '#F0FDF4' : '#FEF2F2'};padding:2px 8px;border-radius:10px;">${p.profit >= 0 ? '+' : ''}${fmtRp(p.profit)}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#8B6F5E;">
              <span>Revenue: ${fmtRp(p.rev)}</span>
              <span>Total Biaya: ${fmtRp(p.cogs + finConfig.costOverhead + (p.rev * finConfig.feeMarketplace / 100))}</span>
            </div>
          </div>`).join('')}`;
    }
  }

  // --- Inventory Valuation ---
  const invEl = document.getElementById('fin-inventory-value');
  if (invEl) {
    const { rm } = S;
    const valBiang = rm.biang * finConfig.costBiang;
    const valBotolP = rm.botolP * finConfig.costBottle;
    const valBotolL = rm.botolL * finConfig.costBottle;
    const valBox = rm.box * finConfig.costBox;
    const valKardus = rm.kardus * finConfig.costKardus;
    const valBubble = rm.bubble * finConfig.costBubble;
    const totalVal = valBiang + valBotolP + valBotolL + valBox + valKardus + valBubble;

    const items = [
      { label: 'Biang Parfum', qty: `${fmt(rm.biang)} mL`, val: valBiang },
      { label: 'Botol Perempuan', qty: `${fmt(rm.botolP)} pcs`, val: valBotolP },
      { label: 'Botol Laki-laki', qty: `${fmt(rm.botolL)} pcs`, val: valBotolL },
      { label: 'Box Parfum', qty: `${fmt(rm.box)} pcs`, val: valBox },
      { label: 'Kardus Luar', qty: `${fmt(rm.kardus)} pcs`, val: valKardus },
      { label: 'Bubble Wrap', qty: `${fmt(rm.bubble)} m`, val: valBubble }
    ];

    invEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        ${items.map(it => `
          <div style="padding:10px 14px;background:#FAF7F2;border-radius:9px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12px;color:#8B6F5E;">${it.label}</div>
              <div style="font-size:12px;color:#5C4A3C;">${it.qty}</div>
            </div>
            <div style="font-size:13px;font-weight:700;color:#5C4A3C;">${fmtRp(it.val)}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:12px;padding:12px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;font-weight:600;color:#166534;">Total Estimasi Nilai Stok</span>
        <span style="font-size:16px;font-weight:700;color:#166534;">${fmtRp(totalVal)}</span>
      </div>`;
  }
}

/* ─────────────── INIT ─────────────── */
initAuth();
