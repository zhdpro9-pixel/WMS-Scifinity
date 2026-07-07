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

const FINISHED_GOODS = {
  parfumP_30: { label: 'Parfum Perempuan 30mL', size: 30, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumP_50: { label: 'Parfum Perempuan 50mL', size: 50, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumP_100: { label: 'Parfum Perempuan 100mL', size: 100, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumL_30: { label: 'Parfum Laki-laki 30mL', size: 30, product: 'lakiLaki', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumL_50: { label: 'Parfum Laki-laki 50mL', size: 50, product: 'lakiLaki', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumL_100: { label: 'Parfum Laki-laki 100mL', size: 100, product: 'lakiLaki', unit: 'pcs', warnAt: 5, lowAt: 2 }
};

const DEFAULT_STATE = {
  rm: { biang: 0, botolP: 0, botolL: 0, box: 0, kardus: 0, bubble: 0 },
  fg: { parfumP_30: 0, parfumP_50: 0, parfumP_100: 0, parfumL_30: 0, parfumL_50: 0, parfumL_100: 0 },
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
    window._userEmail = currentUser.email;
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
        box: inv.box || 0, kardus: inv.kardus || 0, bubble: inv.bubble || 0
      };
    } else {
      await sb.from('wms_inventory').insert({
        id: 1, biang: 0, botol_p: 0, botol_l: 0, box: 0, kardus: 0, bubble: 0
      });
    }

    // Load finished goods
    const { data: fg, error: fgErr } = await sb
      .from('wms_finished_goods')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (fgErr) throw fgErr;

    if (fg) {
      S.fg = {
        parfumP_30: fg.parfum_p_30 || 0,
        parfumP_50: fg.parfum_p_50 || 0,
        parfumP_100: fg.parfum_p_100 || 0,
        parfumL_30: fg.parfum_l_30 || 0,
        parfumL_50: fg.parfum_l_50 || 0,
        parfumL_100: fg.parfum_l_100 || 0
      };
    } else {
      await sb.from('wms_finished_goods').insert({
        id: 1,
        parfum_p_30: 0, parfum_p_50: 0, parfum_p_100: 0,
        parfum_l_30: 0, parfum_l_50: 0, parfum_l_100: 0
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
        ...v,
        leadTimeDays: v.lead_time_days || 3
      }));
    } else {
      // Insert default vendors if none exist
      const defaultVendors = [
        { name: 'PT Aroma Nusantara', material: 'biang', lead_time_days: 3, contact: '0812-xxxx-xxxx', vendor_type: 'biang_parfum' },
        { name: 'CV Botol Kaca Jaya', material: 'botolP,botolL', lead_time_days: 5, contact: '0813-xxxx-xxxx', vendor_type: 'botol_parfum' },
        { name: 'PT PackIndo Sejahtera', material: 'box,kardus,bubble', lead_time_days: 2, contact: '0819-xxxx-xxxx', vendor_type: 'packaging' }
      ];
      
      const { error: insertVendorsErr } = await sb.from('wms_vendors').insert(defaultVendors);
      if (!insertVendorsErr) {
        const { data: newVendors } = await sb.from('wms_vendors').select('*').order('id', { ascending: true });
        if (newVendors) {
          VENDORS = newVendors.map(v => ({ ...v, leadTimeDays: v.lead_time_days || 3 }));
        }
      }
    }

  } catch (e) {
    console.error('loadState error:', e);
    toast('Gagal memuat data dari cloud. Cek koneksi internet.', 'warn', 4000);
  }

  renderAll();
  populateRmVendorSelect();

  // Load SKUs, POs, and PnL cache after main state is loaded
  if (window._postLoginInit) window._postLoginInit();
}

async function syncInventory() {
  if (!sb) return;
  try {
    // Sync raw materials
    const { error: invErr } = await sb.from('wms_inventory').update({
      biang: S.rm.biang,
      botol_p: S.rm.botolP,
      botol_l: S.rm.botolL,
      box: S.rm.box,
      kardus: S.rm.kardus,
      bubble: S.rm.bubble,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (invErr) throw invErr;

    // Sync finished goods
    const { error: fgErr } = await sb.from('wms_finished_goods').update({
      parfum_p_30: S.fg.parfumP_30,
      parfum_p_50: S.fg.parfumP_50,
      parfum_p_100: S.fg.parfumP_100,
      parfum_l_30: S.fg.parfumL_30,
      parfum_l_50: S.fg.parfumL_50,
      parfum_l_100: S.fg.parfumL_100,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (fgErr) throw fgErr;
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
  warehouse: 'Gudang & SKU',
  production: 'Produksi',
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
  if (pageKey === 'financial') populateFinFields();
  if (pageKey === 'vendors') { renderVendors(); renderPoHistory(); populatePoVendorSelect(); }
  if (pageKey === 'warehouse') renderWarehouse();
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
  // Sale preview box removed - preview is now shown in production page
  // Keep function for form listener compatibility
}

function updateProdPreview() {
  const qty = parseInt(document.getElementById('prod-qty').value) || 0;
  const size = parseInt(document.getElementById('prod-size').value) || 30;
  const totBiang = qty * size;
  setTxt('prod-prev-biang', `${fmt(totBiang)} mL`);
  setTxt('prod-prev-bottle', `${fmt(qty)} pcs`);
  setTxt('prod-prev-box', `${fmt(qty)} pcs`);
}

async function recordProduction() {
  const product = document.getElementById('prod-product').value;
  const size = parseInt(document.getElementById('prod-size').value) || 30;
  const qty = validateQuantity(document.getElementById('prod-qty').value, true);

  if (!qty) return;

  // Calculate required raw materials
  const biangNeeded = qty * size;
  const bottleNeeded = qty;
  const boxNeeded = qty;

  // Check stock availability
  const requiredBottleKey = product === 'perempuan' ? 'botolP' : 'botolL';
  if (S.rm.biang < biangNeeded) {
    toast(`Stok biang parfum tidak cukup! Perlu ${biangNeeded} mL, hanya tersedia ${fmt(S.rm.biang)} mL.`, 'error');
    return;
  }
  if (S.rm[requiredBottleKey] < bottleNeeded) {
    toast(`Stok botol ${product === 'perempuan' ? 'perempuan' : 'laki-laki'} tidak cukup! Perlu ${bottleNeeded} pcs, hanya tersedia ${fmt(S.rm[requiredBottleKey])} pcs.`, 'error');
    return;
  }
  if (S.rm.box < boxNeeded) {
    toast(`Stok box parfum tidak cukup! Perlu ${boxNeeded} pcs, hanya tersedia ${fmt(S.rm.box)} pcs.`, 'error');
    return;
  }

  // Deduct raw materials
  S.rm.biang = +(S.rm.biang - biangNeeded).toFixed(2);
  S.rm[requiredBottleKey] = +(S.rm[requiredBottleKey] - bottleNeeded).toFixed(2);
  S.rm.box = +(S.rm.box - boxNeeded).toFixed(2);

  // Add finished goods
  const fgKey = product === 'perempuan' ? `parfumP_${size}` : `parfumL_${size}`;
  S.fg[fgKey] = +(S.fg[fgKey] + qty).toFixed(2);

  // Add log
  const prodLabel = FINISHED_GOODS[fgKey].label;
  await addLog('production', `Produksi ${qty} pcs ${prodLabel} berhasil! -${fmt(biangNeeded)} mL biang, -${fmt(bottleNeeded)} botol, -${fmt(boxNeeded)} box`);

  toast(`Produksi berhasil! ${qty} pcs ${prodLabel} ditambahkan ke stok.`, 'success', 3000);

  await saveState();
  renderAll();
  updateProdPreview();
}

function renderProduction() {
  const { rm, fg, log } = S;

  // Render raw materials stock on production page
  setTxt('p-biang',  fmt(rm.biang)  + ' mL');
  setTxt('p-botp',   fmt(rm.botolP) + ' pcs');
  setTxt('p-botl',   fmt(rm.botolL) + ' pcs');
  setTxt('p-box',    fmt(rm.box)    + ' pcs');
  setTxt('p-kardus', fmt(rm.kardus) + ' pcs');
  setTxt('p-bubble', fmt(rm.bubble) + ' m');

  // Render production log (filter from S.log)
  const prodLogEl = document.getElementById('prod-log');
  if (prodLogEl) {
    const prodLogs = log.filter(l => l.type === 'production').reverse().slice(0, 20);
    if (!prodLogs.length) {
      prodLogEl.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:24px 0;">Belum ada riwayat produksi</div>';
    } else {
      prodLogEl.innerHTML = prodLogs.map(l => `
        <div style="padding:8px 12px;background:#FAF7F2;border-radius:8px;border:1px solid #F2EAE0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:11px;font-weight:600;color:#166534;background:#D1FAE5;padding:2px 8px;border-radius:20px;">PRODUKSI</span>
            <span style="font-size:11px;color:#8B6F5E;font-family:monospace;">${fmtDateShort(l.ts)}</span>
          </div>
          <div style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(l.description)}</div>
        </div>
      `).join('');
    }
  }
}

function renderSales() {
  const { fg, rm, sales } = S;

  // Render finished goods stock on sales page
  const fgStockEl = document.getElementById('s-fg-stock');
  if (fgStockEl) {
    const items = Object.entries(FINISHED_GOODS).map(([key, fgItem]) => {
      const qty = fg[key] || 0;
      const isLow = qty <= fgItem.lowAt;
      const isWarn = qty <= fgItem.warnAt && !isLow;
      const bgClass = isLow ? 'background:#FEF2F2' : isWarn ? 'background:#FFFBEB' : 'background:#FAF7F2';
      const colorClass = isLow ? 'color:#991B1B' : isWarn ? 'color:#92400E' : 'color:#2D1F17';

      return `
        <div style="padding:10px 14px;${bgClass};border-radius:9px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#2D1F17;">${fgItem.label}</div>
            <div style="font-size:11px;color:#8B6F5E;">${qty < fgItem.warnAt ? (qty < fgItem.lowAt ? 'Stok hampir habis!' : 'Stok menipis') : 'Stok aman'}</div>
          </div>
          <div style="font-size:14px;font-weight:700;${colorClass};">${fmt(qty)} ${fgItem.unit}</div>
        </div>
      `;
    }).join('');
    fgStockEl.innerHTML = items || '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum ada stok parfum jadi</div>';
  }

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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#B08A62;padding:24px;">Belum ada data penjualan</td></tr>';
    return;
  }
  tbody.innerHTML = filteredSales.map(s => {
    const prod = prodLabelHtml(s.product);
    const ch = channelBadgeHtml(s.channel);
    const kardusStr = (s.kardus != null && s.kardus > 0) ? `${fmt(s.kardus)} pcs` : '—';
    const bubbleStr = (s.bubble != null && s.bubble > 0) ? `${fmt(s.bubble)} cm` : '—';
    return `
      <tr>
        <td style="white-space:nowrap;">${fmtDateShort(s.ts)}</td>
        <td>${prod}</td>
        <td style="font-weight:600;">${sanitizeHtml(String(s.qty))}</td>
        <td>${ch}</td>
        <td style="font-family:monospace;font-size:12px;color:#5C4A3C;">${sanitizeHtml(s.tracking || '—')}</td>
        <td style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(kardusStr)}</td>
        <td style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(bubbleStr)}</td>
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

// (processProduction removed - use recordProduction instead)

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

  // Check finished goods stock
  const fgKey = product === 'perempuan' ? `parfumP_${size}` : `parfumL_${size}`;
  const fgLabel = FINISHED_GOODS[fgKey].label;

  const errors = [];
  if (S.fg[fgKey] < qty) errors.push(`${fgLabel} kurang: butuh ${fmt(qty)} pcs, stok ${fmt(S.fg[fgKey])} pcs`);
  if (kardus > 0 && S.rm.kardus < kardus) errors.push(`Kardus hanya ${fmt(S.rm.kardus)} pcs (butuh ${fmt(kardus)})`);
  if (bubble > 0 && S.rm.bubble < bubble) errors.push(`Bubble Wrap hanya ${fmt(S.rm.bubble * 100)}cm (butuh ${fmt(bubbleCm)}cm)`);

  if (errors.length) {
    toast('Stok tidak cukup:\n' + errors.join('\n'), 'error', 5000);
    return;
  }

  // Auto-cut stok finished goods and packing materials
  S.fg[fgKey] = +(S.fg[fgKey] - qty).toFixed(2);
  if (kardus > 0) S.rm.kardus = +(Math.max(0, S.rm.kardus - kardus)).toFixed(2);
  if (bubble > 0) S.rm.bubble = +(Math.max(0, S.rm.bubble - bubble)).toFixed(2);

  const prodLabel = product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki';
  const chLabel = channel === 'Shopee' ? 'Shopee (Lokal)' : 'eBay (Internasional)';

  const packingInfo = [];
  if (kardus > 0) packingInfo.push(`${fmt(kardus)} kardus`);
  if (bubbleCm > 0) packingInfo.push(`${fmt(bubbleCm)}cm bubble wrap`);
  const packingStr = packingInfo.length ? ` | Packing: ${packingInfo.join(', ')}` : '';

  await addLog('outbound', `Jual ${qty}x ${fgLabel} via ${chLabel}${packingStr}${tracking ? ' [' + tracking + ']' : ''}${notes ? ' — ' + notes : ''}`);

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
  toast(`Penjualan tercatat.\n${qty}x ${fgLabel} via ${chLabel}`, 'success', 4000);
}

function exportCSV() {
  if (!S.sales || !S.sales.length) { toast('Belum ada data penjualan untuk di-export', 'warn'); return; }
  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble'];
  const rows = S.sales.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ? `${s.kardus} pcs` : '',
    s.bubble ? `${s.bubble} cm` : ''
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
  const container = document.getElementById('vendors-cards');
  if (!container) return;

  const activeFilter = document.querySelector('.vendor-tab-panel.active')?.id;

  // Populate PO vendor filter
  populatePoVendorSelect();

  const activeChip = document.querySelector('#vpanel-list .chip.active');
  const filterType = activeChip?.dataset?.filter || 'all';

  let filtered = VENDORS;
  if (filterType !== 'all') {
    filtered = VENDORS.filter(v => (v.vendor_type || '') === filterType);
  }

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:40px 0;">Tidak ada vendor dengan kategori ini</div>';
    return;
  }

  container.innerHTML = filtered.map(v => {
    const materials = (v.material || '').split(',').map(k => {
      const m = MATERIAL_META[k.trim()];
      return m ? m.label : k.trim();
    }).join(', ');

    const rating = parseFloat(v.rating) || 5;
    const stars = renderStars(rating);
    const otif  = parseFloat(v.otif_rate) || 100;
    const otifCls = otif >= 90 ? 'otif-good' : otif >= 75 ? 'otif-ok' : 'otif-poor';
    const top   = v.term_of_payment || 'CBD';
    const topCls = top === 'CBD' || top === 'COD' ? 'top-cbd' : 'top-net';
    const vtCls = vtypeCls(v.vendor_type);
    const totalPaid = v.total_paid || 0;

    return `
      <div class="card" style="padding:18px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <div style="font-size:15px;font-weight:700;color:#2D1F17;margin-bottom:6px;">${sanitizeHtml(v.name)}</div>
            <div class="vendor-detail-strip">
              <span class="vtype-badge ${vtCls}">${vtypeLabel(v.vendor_type)}</span>
              <span class="top-badge ${topCls}">${sanitizeHtml(top)}</span>
              <span class="lead-badge">${v.leadTimeDays || v.lead_time_days || '?'} hari</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap;">
              <div class="star-rating">${stars}</div>
              <span style="font-size:12px;color:#8B6F5E;">${rating.toFixed(1)}/5</span>
              <span class="otif-badge ${otifCls}">OTIF ${otif.toFixed(0)}%</span>
            </div>
            <div style="margin-top:8px;font-size:12px;color:#8B6F5E;display:flex;flex-wrap:wrap;gap:12px;">
              ${v.phone || v.contact ? `<span>📞 ${sanitizeHtml(v.phone || v.contact || '')}</span>` : ''}
              ${v.email ? `<span>✉️ ${sanitizeHtml(v.email)}</span>` : ''}
            </div>
            <div style="margin-top:6px;font-size:12px;color:#8B6F5E;">Material: <strong style="color:#5C4A3C;">${sanitizeHtml(materials)}</strong></div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;font-weight:600;color:#8B6F5E;text-transform:uppercase;letter-spacing:0.04em;">Total Terbayar</div>
            <div style="font-size:18px;font-weight:700;color:#166534;">${fmtRp(totalPaid)}</div>
            <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px;">
              <button class="btn-secondary" style="padding:5px 12px;font-size:12px;" onclick="openEditVendorModal(${v.id})">Edit</button>
              <button class="btn-primary btn-with-icon" style="padding:5px 12px;font-size:12px;" onclick="switchVendorTab('po')">
                <svg class="ico ico-xs"><use href="#ico-plus"/></svg> PO
              </button>
            </div>
          </div>
        </div>
        ${v.bank_info ? `<div style="margin-top:10px;padding:8px 12px;background:#FAF7F2;border-radius:8px;font-size:12px;color:#5C4A3C;">🏦 ${sanitizeHtml(v.bank_info)}</div>` : ''}
      </div>`;
  }).join('');
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
  }
  return html;
}

function vtypeCls(t) {
  const map = { biang_parfum:'vtype-biang', botol_parfum:'vtype-botol', packaging:'vtype-packaging', deodorant:'vtype-deodorant', hairmist:'vtype-hairmist' };
  return map[t] || 'vtype-default';
}

function vtypeLabel(t) {
  const map = { biang_parfum:'Biang Parfum', botol_parfum:'Botol Parfum', packaging:'Packaging', deodorant:'Deodorant', hairmist:'Hair Mist' };
  return map[t] || (t || 'Umum');
}

function filterVendors(type) {
  document.querySelectorAll('#vpanel-list .chip').forEach(c => {
    const isActive = (type === 'all' && !c.dataset.filter) ||
      c.id === `vf-${type}` || (type === 'all' && c.id === 'vf-all');
    c.classList.toggle('active', isActive);
  });
  // Store filter in active chip via data attribute trick
  const chip = document.getElementById(type === 'all' ? 'vf-all' : `vf-${type}`) ||
               document.getElementById(`vf-${type.replace('_parfum','').replace('_','')}`);
  if (chip) chip.dataset.filter = type;
  // Set all chips data-filter
  const chipMap = { all:'all', biang:'biang_parfum', botol:'botol_parfum', deo:'deodorant', hair:'hairmist', pack:'packaging' };
  Object.entries(chipMap).forEach(([k, v]) => {
    const el = document.getElementById(`vf-${k}`);
    if (el) el.dataset.filter = v;
  });
  renderVendors();
}

function switchVendorTab(tab) {
  ['list','po','history'].forEach(t => {
    const btn = document.getElementById(`vtab-${t}`);
    const panel = document.getElementById(`vpanel-${t}`);
    const isActive = t === tab;
    if (btn) btn.classList.toggle('active', isActive);
    if (panel) panel.classList.toggle('active', isActive);
  });
  if (tab === 'po') { populatePoVendorSelect(); renderPendingPOs(); }
  if (tab === 'history') { renderPoHistory(); }
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

  const header = ['Tanggal', 'Produk', 'Qty', 'Channel', 'Resi', 'Kardus (pcs)', 'Bubble'];
  const rows = salesThisMonth.map(s => [
    fmtDate(s.ts),
    s.product === 'perempuan' ? 'Parfum Perempuan' : 'Parfum Laki-laki',
    s.qty, s.channel, s.tracking || '',
    s.kardus ? `${s.kardus} pcs` : '',
    s.bubble ? `${s.bubble} cm` : ''
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

function normalizeBubbleCm(value) {
  // Pastikan value dikembalikan sebagai angka (dalam cm)
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function renderFinancial() {
  // Hanya baca config dari memori — JANGAN panggil loadFinConfig() di sini
  // karena itu akan overwrite input yang sedang diketik user.

  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const salesThisMonth = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === thisMonth);

  // --- 1. Revenue Calculation ---
  let qtyP = 0, qtyL = 0, totalRevenue = 0;
  // Untuk channel revenue
  let revenueShopee = 0, revenueEbay = 0, qtyShopee = 0, qtyEbay = 0;
  
  salesThisMonth.forEach(s => {
    const qty = parseInt(s.qty) || 0;
    const price = s.product === 'perempuan' ? finConfig.priceP : finConfig.priceL;
    const saleRevenue = qty * price;
    
    if (s.product === 'perempuan') qtyP += qty;
    else qtyL += qty;
    totalRevenue += saleRevenue;
    
    // Hitung per channel
    if (s.channel === 'Shopee') {
      revenueShopee += saleRevenue;
      qtyShopee += qty;
    } else {
      revenueEbay += saleRevenue;
      qtyEbay += qty;
    }
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

  // --- Revenue per Channel ---
  const channelEl = document.getElementById('fin-channel-revenue');
  if (channelEl) {
    if (!salesThisMonth.length) {
      channelEl.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum ada penjualan bulan ini</div>';
    } else {
      const maxChRev = Math.max(revenueShopee, revenueEbay, 1);
      channelEl.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span style="color:#F97316;font-weight:600;">Shopee</span>
            <span style="font-weight:700;">${qtyShopee} pcs = ${fmtRp(revenueShopee)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(revenueShopee / maxChRev * 100).toFixed(1)}%;background:linear-gradient(90deg,#F97316,#FDBA74);"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span style="color:#8B5CF6;font-weight:600;">eBay</span>
            <span style="font-weight:700;">${qtyEbay} pcs = ${fmtRp(revenueEbay)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(revenueEbay / maxChRev * 100).toFixed(1)}%;background:linear-gradient(90deg,#8B5CF6,#C4B5FD);"></div></div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F2EAE0;display:flex;justify-content:space-between;font-size:12px;color:#8B6F5E;">
          <span>Total: <strong style="color:#2D1F17;">${qtyShopee + qtyEbay} pcs</strong></span>
          <span>Pendapatan: <strong style="color:#166534;">${fmtRp(totalRevenue)}</strong></span>
        </div>`;
    }
  }

  // --- Revenue Trend 3 Months ---
  const trendEl = document.getElementById('fin-revenue-trend');
  if (trendEl) {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      const salesInMonth = (S.sales || []).filter(s => s.ts && getYearMonthLocal(s.ts) === yearMonth);
      
      let rev = 0;
      salesInMonth.forEach(s => {
        const qty = parseInt(s.qty) || 0;
        const price = s.product === 'perempuan' ? finConfig.priceP : finConfig.priceL;
        rev += qty * price;
      });
      
      months.push({ name: monthName, rev: rev, count: salesInMonth.length });
    }

    const maxTrendRev = Math.max(...months.map(m => m.rev), 1);
    trendEl.innerHTML = months.map(m => {
      const percent = maxTrendRev > 0 ? (m.rev / maxTrendRev * 100) : 0;
      return `
        <div style="padding:10px;background:${m.rev > 0 ? '#F0FDF4' : '#FAF7F2'};border-radius:9px;border:1px solid ${m.rev > 0 ? '#BBF7D0' : '#F2EAE0'};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:700;color:#2D1F17;">${m.name}</span>
            <span style="font-size:12px;font-weight:600;color:${m.rev > 0 ? '#166534' : '#8B6F5E'};">${m.rev > 0 ? fmtRp(m.rev) : 'Tidak ada penjualan'}</span>
          </div>
          ${m.rev > 0 ? `
            <div class="progress-bar" style="height:6px;"><div class="progress-fill" style="width:${percent.toFixed(1)}%;background:linear-gradient(90deg,#166534,#86EFAC);"></div></div>
            <div style="font-size:11px;color:#8B6F5E;margin-top:4px;">${m.count} transaksi</div>
          ` : ''}
        </div>`;
    }).join('');
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

/* ═══════════════════════════════════════════════════════
   WAREHOUSE / SKU MANAGEMENT
   ═══════════════════════════════════════════════════════ */

let ALL_SKUS = [];
let WH_FILTER = 'all';

async function loadSkus() {
  if (!sb) return;
  const { data, error } = await sb.from('wms_products_sku').select('*').order('category').order('sku');
  if (!error && data) ALL_SKUS = data;
}

function renderWarehouse() {
  if (!ALL_SKUS.length) loadSkus().then(() => _renderWarehouse());
  else _renderWarehouse();
}

function _renderWarehouse() {
  const search = (document.getElementById('sku-search')?.value || '').toLowerCase();
  let skus = ALL_SKUS.filter(s => s.is_active !== false);

  if (WH_FILTER !== 'all') skus = skus.filter(s => s.category === WH_FILTER);
  if (search) skus = skus.filter(s =>
    s.sku.toLowerCase().includes(search) || s.name.toLowerCase().includes(search)
  );

  // Summary cards
  const totalSkus = ALL_SKUS.filter(s => s.is_active !== false).length;
  const lowSkus = ALL_SKUS.filter(s => s.is_active !== false && s.current_stock <= s.min_stock).length;
  const totalVal = ALL_SKUS.reduce((sum, s) => sum + (s.current_stock || 0) * (s.cost_price || 0), 0);
  const cats = [...new Set(ALL_SKUS.map(s => s.category))].length;

  const el = (id) => document.getElementById(id);
  if (el('wh-total-sku')) el('wh-total-sku').textContent = totalSkus;
  if (el('wh-low-sku'))   el('wh-low-sku').textContent   = lowSkus;
  if (el('wh-total-value')) el('wh-total-value').textContent = fmtRp(totalVal);
  if (el('wh-categories'))  el('wh-categories').textContent  = cats;

  // Grid cards
  const grid = document.getElementById('sku-grid');
  if (grid) {
    if (!skus.length) {
      grid.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:40px 0;grid-column:1/-1;">Tidak ada produk ditemukan</div>';
    } else {
      grid.innerHTML = skus.map(s => {
        const stock = s.current_stock || 0;
        const min = s.min_stock || 5;
        const max = s.max_stock || 100;
        const isLow = stock <= min;
        const isWarn = stock <= min * 1.5 && !isLow;
        const pct = Math.min(100, (stock / (max || 1)) * 100);
        const catCls = { parfum:'sku-parfum', deodorant:'sku-deodorant', hairmist:'sku-hairmist', bahan_baku:'sku-bahan' }[s.category] || 'sku-bahan';
        const statusCls = isLow ? 'low-stock' : isWarn ? 'warn-stock' : '';
        const statusLabel = isLow ? '<span class="sku-stock-indicator otif-poor">⚠ Restock Segera</span>' :
                           isWarn ? '<span class="sku-stock-indicator otif-ok">⚡ Stok Menipis</span>' :
                                    '<span class="sku-stock-indicator otif-good">✓ Aman</span>';

        return `
          <div class="sku-card ${statusCls}">
            <div class="sku-card-sku">${sanitizeHtml(s.sku)}</div>
            <div class="sku-card-name">${sanitizeHtml(s.name)}</div>
            <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
              <span class="sku-cat ${catCls}">${skuCatLabel(s.category)}</span>
              ${s.size_ml ? `<span style="font-size:10px;color:#8B6F5E;border:1px solid #E4D3BD;border-radius:4px;padding:1px 6px;">${s.size_ml}mL</span>` : ''}
            </div>
            <div class="sku-card-stock">${stock} <span style="font-size:13px;font-weight:400;color:#B08A62;">${s.unit || 'pcs'}</span></div>
            ${statusLabel}
            <div style="margin:10px 0 4px;height:4px;background:#E4D3BD;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${isLow ? '#EF4444' : isWarn ? '#F59E0B' : '#22C55E'};border-radius:2px;transition:width 0.4s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#B08A62;margin-bottom:10px;">
              <span>Min: ${min}</span><span>Max: ${max}</span>
            </div>
            <div style="display:flex;gap:6px;justify-content:space-between;align-items:center;">
              <div style="font-size:11px;color:#8B6F5E;">HPP: <strong style="color:#5C4A3C;">${fmtRp(s.cost_price||0)}</strong></div>
              <button class="btn-secondary" style="padding:4px 10px;font-size:11px;" onclick="openEditSkuModal(${s.id})">Edit</button>
            </div>
          </div>`;
      }).join('');
    }
  }

  // Table
  const tbody = document.getElementById('sku-tbody');
  if (tbody) {
    if (!skus.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#B08A62;padding:24px;">Tidak ada produk ditemukan</td></tr>';
    } else {
      tbody.innerHTML = skus.map(s => {
        const stock = s.current_stock || 0;
        const isLow = stock <= (s.min_stock || 5);
        const catCls = { parfum:'sku-parfum', deodorant:'sku-deodorant', hairmist:'sku-hairmist', bahan_baku:'sku-bahan' }[s.category] || 'sku-bahan';
        return `
          <tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600;color:#5C4A3C;">${sanitizeHtml(s.sku)}</td>
            <td style="font-weight:600;color:#2D1F17;">${sanitizeHtml(s.name)}</td>
            <td><span class="sku-cat ${catCls}">${skuCatLabel(s.category)}</span></td>
            <td style="text-align:center;font-weight:700;color:${isLow?'#991B1B':'#166534'};">${stock}</td>
            <td style="text-align:center;color:#8B6F5E;">${s.min_stock||5}</td>
            <td style="text-align:center;color:#8B6F5E;">${s.max_stock||100}</td>
            <td style="color:#5C4A3C;">${fmtRp(s.cost_price||0)}</td>
            <td style="color:#5C4A3C;">${fmtRp(s.sell_price||0)}</td>
            <td>${isLow ? '<span class="badge-low" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid;">⚠ Low</span>' : '<span class="badge-ok" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid;">✓ OK</span>'}</td>
          </tr>`;
      }).join('');
    }
  }
}

function skuCatLabel(cat) {
  return { parfum:'🌸 Parfum', deodorant:'🧴 Deodorant', hairmist:'💨 Hair Mist', bahan_baku:'⚗️ Bahan Baku' }[cat] || cat;
}

function filterWarehouse(cat) {
  WH_FILTER = cat;
  document.querySelectorAll('#wh-filter-chips .chip').forEach(c => c.classList.remove('active'));
  const active = { all:'wh-chip-all', parfum:'wh-chip-parfum', deodorant:'wh-chip-deodorant', hairmist:'wh-chip-hairmist', bahan_baku:'wh-chip-bahan' }[cat];
  if (active) document.getElementById(active)?.classList.add('active');
  _renderWarehouse();
}

function openAddSkuModal() {
  document.getElementById('modal-sku-title').textContent = 'Tambah Produk SKU';
  document.getElementById('sku-code').value = '';
  document.getElementById('sku-name-input').value = '';
  document.getElementById('sku-category').value = 'parfum';
  document.getElementById('sku-type').value = 'unisex';
  document.getElementById('sku-size').value = '';
  document.getElementById('sku-stock').value = '0';
  document.getElementById('sku-min').value = '5';
  document.getElementById('sku-max').value = '100';
  document.getElementById('sku-cost').value = '0';
  document.getElementById('sku-sell').value = '0';
  document.getElementById('sku-edit-id').value = '';
  openModal('modal-sku');
}

function openEditSkuModal(id) {
  const s = ALL_SKUS.find(x => x.id === id);
  if (!s) return;
  document.getElementById('modal-sku-title').textContent = 'Edit Produk SKU';
  document.getElementById('sku-code').value = s.sku;
  document.getElementById('sku-name-input').value = s.name;
  document.getElementById('sku-category').value = s.category;
  document.getElementById('sku-type').value = s.product_type || 'unisex';
  document.getElementById('sku-size').value = s.size_ml || '';
  document.getElementById('sku-stock').value = s.current_stock || 0;
  document.getElementById('sku-min').value = s.min_stock || 5;
  document.getElementById('sku-max').value = s.max_stock || 100;
  document.getElementById('sku-cost').value = s.cost_price || 0;
  document.getElementById('sku-sell').value = s.sell_price || 0;
  document.getElementById('sku-edit-id').value = id;
  openModal('modal-sku');
}

async function saveSku() {
  const code = document.getElementById('sku-code').value.trim();
  const name = document.getElementById('sku-name-input').value.trim();
  if (!code || !name) return showToast('Kode SKU dan nama wajib diisi', 'error');

  const payload = {
    sku: code,
    name,
    category: document.getElementById('sku-category').value,
    product_type: document.getElementById('sku-type').value,
    size_ml: parseInt(document.getElementById('sku-size').value) || null,
    current_stock: parseFloat(document.getElementById('sku-stock').value) || 0,
    min_stock: parseFloat(document.getElementById('sku-min').value) || 5,
    max_stock: parseFloat(document.getElementById('sku-max').value) || 100,
    cost_price: parseFloat(document.getElementById('sku-cost').value) || 0,
    sell_price: parseFloat(document.getElementById('sku-sell').value) || 0,
    updated_at: new Date().toISOString()
  };

  const editId = document.getElementById('sku-edit-id').value;
  let error;

  if (editId) {
    ({ error } = await sb.from('wms_products_sku').update(payload).eq('id', editId));
  } else {
    ({ error } = await sb.from('wms_products_sku').insert([payload]));
  }

  if (error) return showToast('Gagal menyimpan SKU: ' + error.message, 'error');

  showToast('SKU berhasil disimpan ✓', 'success');
  closeModal('modal-sku');
  await loadSkus();
  _renderWarehouse();
}

/* ═══════════════════════════════════════════════════════
   VENDOR MANAGEMENT (Modal + Save + Edit)
   ═══════════════════════════════════════════════════════ */

function openAddVendorModal() {
  document.getElementById('modal-vendor-title').textContent = 'Tambah Vendor Baru';
  ['v-name','v-material','v-phone','v-email','v-address','v-bank','v-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('v-type').value = 'biang_parfum';
  document.getElementById('v-leadtime').value = '3';
  document.getElementById('v-rating').value = '5';
  document.getElementById('v-top').value = 'CBD';
  document.getElementById('v-edit-id').value = '';
  openModal('modal-vendor');
}

function openEditVendorModal(id) {
  const v = VENDORS.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-vendor-title').textContent = 'Edit Vendor';
  document.getElementById('v-name').value = v.name || '';
  document.getElementById('v-type').value = v.vendor_type || 'biang_parfum';
  document.getElementById('v-material').value = v.material || '';
  document.getElementById('v-leadtime').value = v.leadTimeDays || v.lead_time_days || '3';
  document.getElementById('v-rating').value = v.rating || '5';
  document.getElementById('v-top').value = v.term_of_payment || 'CBD';
  document.getElementById('v-phone').value = v.phone || v.contact || '';
  document.getElementById('v-email').value = v.email || '';
  document.getElementById('v-address').value = v.address || '';
  document.getElementById('v-bank').value = v.bank_info || '';
  document.getElementById('v-notes').value = v.notes || '';
  document.getElementById('v-edit-id').value = id;
  openModal('modal-vendor');
}

async function saveVendor() {
  const name = document.getElementById('v-name').value.trim();
  if (!name) return showToast('Nama vendor wajib diisi', 'error');

  const payload = {
    name,
    vendor_type: document.getElementById('v-type').value,
    material: document.getElementById('v-material').value.trim(),
    lead_time_days: parseInt(document.getElementById('v-leadtime').value) || 3,
    rating: parseFloat(document.getElementById('v-rating').value) || 5,
    term_of_payment: document.getElementById('v-top').value,
    phone: document.getElementById('v-phone').value.trim(),
    email: document.getElementById('v-email').value.trim(),
    address: document.getElementById('v-address').value.trim(),
    bank_info: document.getElementById('v-bank').value.trim(),
    notes: document.getElementById('v-notes').value.trim(),
    updated_at: new Date().toISOString()
  };

  const editId = document.getElementById('v-edit-id').value;
  let error, data;

  if (editId) {
    ({ error } = await sb.from('wms_vendors').update(payload).eq('id', editId));
  } else {
    ({ data, error } = await sb.from('wms_vendors').insert([payload]).select());
  }

  if (error) return showToast('Gagal menyimpan vendor: ' + error.message, 'error');

  showToast('Vendor berhasil disimpan ✓', 'success');
  closeModal('modal-vendor');

  // Reload vendors
  const { data: vdata } = await sb.from('wms_vendors').select('*').order('name');
  if (vdata) {
    VENDORS = vdata.map(v => ({ ...v, leadTimeDays: v.lead_time_days || 3 }));
  }
  renderVendors();
}

/* ═══════════════════════════════════════════════════════
   PURCHASE ORDER (PO) MANAGEMENT
   ═══════════════════════════════════════════════════════ */

let ALL_POS = [];

async function loadPOs() {
  if (!sb) return;
  const { data, error } = await sb.from('wms_vendor_po').select('*, wms_vendors(name, vendor_type)').order('created_at', { ascending: false });
  if (!error && data) ALL_POS = data;
}

function populatePoVendorSelect() {
  const selects = ['po-vendor', 'po-vendor-filter'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    const extra = id === 'po-vendor-filter' ? '<option value="">Semua Vendor</option>' : '';
    sel.innerHTML = extra + VENDORS.map(v => `<option value="${v.id}">${sanitizeHtml(v.name)}</option>`).join('');
    if (cur) sel.value = cur;
  });
}

function updatePoTotal() {
  const qty = parseFloat(document.getElementById('po-qty')?.value) || 0;
  const price = parseFloat(document.getElementById('po-unit-price')?.value) || 0;
  const total = document.getElementById('po-total');
  if (total) total.value = qty * price;
}

function updatePoMaterialOptions() {
  const vendorId = parseInt(document.getElementById('po-vendor')?.value);
  const vendor = VENDORS.find(v => v.id === vendorId);
  if (vendor && document.getElementById('po-material')) {
    document.getElementById('po-material').placeholder = vendor.material || 'Contoh: Biang parfum';
  }
}

async function savePurchaseOrder() {
  const vendorId = parseInt(document.getElementById('po-vendor')?.value);
  const poNumber = document.getElementById('po-number')?.value.trim();
  const material = document.getElementById('po-material')?.value.trim();
  const qty = parseFloat(document.getElementById('po-qty')?.value) || 0;
  const unitPrice = parseFloat(document.getElementById('po-unit-price')?.value) || 0;
  const expectedDate = document.getElementById('po-expected-date')?.value;

  if (!vendorId || !poNumber || !material || qty <= 0) {
    return showToast('Vendor, No. PO, material, dan qty wajib diisi', 'error');
  }

  const payload = {
    vendor_id: vendorId,
    po_number: poNumber,
    material,
    qty,
    unit: document.getElementById('po-unit')?.value || 'pcs',
    unit_price: unitPrice,
    total_amount: qty * unitPrice,
    expected_date: expectedDate || null,
    payment_status: 'unpaid',
    paid_amount: 0,
    notes: document.getElementById('po-notes')?.value.trim() || null,
    user_email: window._userEmail || null
  };

  const { error } = await sb.from('wms_vendor_po').insert([payload]);
  if (error) return showToast('Gagal simpan PO: ' + error.message, 'error');

  showToast(`PO ${poNumber} berhasil disimpan ✓`, 'success');

  // Reset form
  ['po-number','po-material','po-qty','po-unit-price','po-total','po-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  await loadPOs();
  renderPendingPOs();
  renderPoHistory();
}

function renderPendingPOs() {
  const container = document.getElementById('po-pending-list');
  if (!container) return;

  const pending = ALL_POS.filter(p => !p.actual_date);
  if (!pending.length) {
    container.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:24px 0;">Semua PO sudah diterima</div>';
    return;
  }

  container.innerHTML = pending.map(p => {
    const vendorName = p.wms_vendors?.name || `Vendor #${p.vendor_id}`;
    const expected = p.expected_date ? new Date(p.expected_date).toLocaleDateString('id-ID') : '—';
    const today = new Date();
    const expDate = p.expected_date ? new Date(p.expected_date) : null;
    const isLate = expDate && today > expDate;

    return `
      <div style="padding:12px;background:${isLate?'#FEF2F2':'#F9F7F4'};border:1px solid ${isLate?'#FECACA':'#E4D3BD'};border-radius:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <div style="font-size:13px;font-weight:700;color:#2D1F17;">${sanitizeHtml(p.po_number)}</div>
            <div style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(vendorName)} · ${sanitizeHtml(p.material)}</div>
            <div style="font-size:11px;color:#8B6F5E;margin-top:2px;">${p.qty} ${p.unit} · ${fmtRp(p.total_amount)}</div>
            <div style="font-size:11px;color:${isLate?'#991B1B':'#8B6F5E'};margin-top:2px;">
              ${isLate ? '⚠ Terlambat! ' : ''}Estimasi tiba: ${expected}
            </div>
          </div>
          <button class="btn-secondary" style="font-size:11px;padding:5px 10px;white-space:nowrap;flex-shrink:0;" onclick="openReceivePoModal(${p.id})">Terima</button>
        </div>
      </div>`;
  }).join('');
}

function openReceivePoModal(poId) {
  document.getElementById('rpo-po-id').value = poId;
  document.getElementById('rpo-actual-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('rpo-in-full').value = 'true';
  document.getElementById('rpo-payment-status').value = 'paid';
  document.getElementById('rpo-paid-amount').value = '0';
  openModal('modal-receive-po');
}

async function confirmReceivePO() {
  const poId = parseInt(document.getElementById('rpo-po-id').value);
  const actualDate = document.getElementById('rpo-actual-date').value;
  const isInFull = document.getElementById('rpo-in-full').value === 'true';
  const payStatus = document.getElementById('rpo-payment-status').value;
  const paidAmt = parseFloat(document.getElementById('rpo-paid-amount').value) || 0;

  const po = ALL_POS.find(p => p.id === poId);
  if (!po) return;

  // Calculate OTIF
  const isOnTime = po.expected_date ? new Date(actualDate) <= new Date(po.expected_date) : true;

  const { error } = await sb.from('wms_vendor_po').update({
    actual_date: actualDate,
    is_on_time: isOnTime,
    is_in_full: isInFull,
    payment_status: payStatus,
    paid_amount: paidAmt
  }).eq('id', poId);

  if (error) return showToast('Gagal memperbarui PO: ' + error.message, 'error');

  // Recalculate vendor OTIF rate
  await recalculateVendorOTIF(po.vendor_id);

  // Update vendor total_paid
  const vendorPos = ALL_POS.filter(p => p.vendor_id === po.vendor_id);
  const totalPaid = vendorPos.reduce((s, p) => s + (p.paid_amount || 0), 0) + paidAmt;
  await sb.from('wms_vendors').update({ total_paid: totalPaid }).eq('id', po.vendor_id);

  showToast(`PO diterima! OTIF: ${isOnTime ? '✓ On Time' : '✗ Terlambat'}`, isOnTime ? 'success' : 'warn');
  closeModal('modal-receive-po');

  await loadPOs();
  renderPendingPOs();
  renderPoHistory();

  // Reload vendors to show updated OTIF
  const { data: vdata } = await sb.from('wms_vendors').select('*').order('name');
  if (vdata) VENDORS = vdata.map(v => ({ ...v, leadTimeDays: v.lead_time_days || 3 }));
  renderVendors();
}

async function recalculateVendorOTIF(vendorId) {
  const vendorPos = ALL_POS.filter(p => p.vendor_id === vendorId && p.actual_date);
  if (!vendorPos.length) return;

  const onTimeFull = vendorPos.filter(p => p.is_on_time && p.is_in_full).length;
  const otifRate = (onTimeFull / vendorPos.length) * 100;

  await sb.from('wms_vendors').update({ otif_rate: Math.round(otifRate * 10) / 10 }).eq('id', vendorId);
}

function renderPoHistory() {
  const tbody = document.getElementById('po-history-tbody');
  if (!tbody) return;

  if (!ALL_POS.length) loadPOs().then(() => _renderPoHistory());
  else _renderPoHistory();
}

function _renderPoHistory() {
  const tbody = document.getElementById('po-history-tbody');
  if (!tbody) return;

  const vendorFilter = document.getElementById('po-vendor-filter')?.value || '';
  const statusFilter = document.getElementById('po-status-filter')?.value || '';

  let pos = [...ALL_POS];
  if (vendorFilter) pos = pos.filter(p => String(p.vendor_id) === String(vendorFilter));
  if (statusFilter) pos = pos.filter(p => p.payment_status === statusFilter);

  // Summary totals
  const totalUnpaid  = ALL_POS.filter(p => p.payment_status === 'unpaid').reduce((s,p) => s + (p.total_amount||0), 0);
  const totalPartial = ALL_POS.filter(p => p.payment_status === 'partial').reduce((s,p) => s + (p.total_amount||0), 0);
  const totalPaidAll = ALL_POS.reduce((s,p) => s + (p.paid_amount||0), 0);
  const totalAll = ALL_POS.reduce((s,p) => s + (p.total_amount||0), 0);

  const el = id => document.getElementById(id);
  if (el('po-total-unpaid'))  el('po-total-unpaid').textContent  = fmtRp(totalUnpaid);
  if (el('po-total-partial')) el('po-total-partial').textContent = fmtRp(totalPartial);
  if (el('po-total-paid'))    el('po-total-paid').textContent    = fmtRp(totalPaidAll);
  if (el('po-total-all'))     el('po-total-all').textContent     = fmtRp(totalAll);

  // Also update finance menu - vendor costs
  const finVendorCost = document.getElementById('fin-vendor-cost');
  if (finVendorCost) finVendorCost.textContent = fmtRp(totalAll);

  if (!pos.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#B08A62;padding:24px;">Belum ada transaksi</td></tr>';
    return;
  }

  tbody.innerHTML = pos.map(p => {
    const vendorName = p.wms_vendors?.name || `Vendor #${p.vendor_id}`;
    const dateStr = new Date(p.created_at).toLocaleDateString('id-ID');
    const payCls = { paid:'pay-paid', unpaid:'pay-unpaid', partial:'pay-partial' }[p.payment_status] || 'pay-unpaid';
    const payLabel = { paid:'Lunas', unpaid:'Belum Bayar', partial:'Sebagian' }[p.payment_status] || p.payment_status;

    let otifHtml = '—';
    if (p.actual_date) {
      const ok = p.is_on_time && p.is_in_full;
      const partialOk = p.is_on_time || p.is_in_full;
      otifHtml = `<span class="otif-badge ${ok?'otif-good':partialOk?'otif-ok':'otif-poor'}">${ok?'✓ OTIF':partialOk?'⚡ Partial':'✗ Gagal'}</span>`;
    } else {
      otifHtml = '<span style="font-size:11px;color:#B08A62;">Pending</span>';
    }

    return `
      <tr>
        <td style="font-size:12px;color:#8B6F5E;">${dateStr}</td>
        <td style="font-size:12px;font-weight:600;color:#5C4A3C;">${sanitizeHtml(p.po_number)}</td>
        <td style="font-size:12px;">${sanitizeHtml(vendorName)}</td>
        <td style="font-size:12px;">${sanitizeHtml(p.material)}</td>
        <td style="text-align:right;font-weight:600;color:#2D1F17;">${fmtRp(p.total_amount||0)}</td>
        <td style="text-align:center;">${otifHtml}</td>
        <td style="text-align:center;"><span class="pay-badge ${payCls}">${payLabel}</span></td>
        <td>
          ${!p.actual_date ? `<button class="btn-secondary" style="font-size:11px;padding:3px 8px;" onclick="openReceivePoModal(${p.id})">Terima</button>` : '<span style="font-size:11px;color:#8B6F5E;">Selesai</span>'}
        </td>
      </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   GOOGLE SHEETS PnL INTEGRATION
   ═══════════════════════════════════════════════════════ */

const GSHEETS_ID = '1_TGa5MOoW0q7b8RX3jN6NnpXU-2gJr5FkztSYG3HrHw';
const GSHEETS_SHEET = 'PnL Fix';
let PNL_DATA = null; // Parsed PnL data array (3 years x 12 months)

async function fetchGoogleSheetsPnL() {
  const btn = document.getElementById('pnl-sync-btn');
  const lbl = document.getElementById('pnl-sync-label');
  if (btn) btn.classList.add('loading');
  if (lbl) lbl.textContent = 'Menyinkronkan…';

  const url = `https://docs.google.com/spreadsheets/d/${GSHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(GSHEETS_SHEET)}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csv = await resp.text();
    PNL_DATA = parsePnLCSV(csv);

    if (lbl) lbl.textContent = 'Sinkronisasi Sheets';
    if (btn) btn.classList.remove('loading');

    const now = new Date().toLocaleString('id-ID');
    const syncEl = document.getElementById('pnl-last-sync');
    if (syncEl) syncEl.textContent = `Diperbarui: ${now}`;

    // Cache in localStorage
    localStorage.setItem('pnl_data', JSON.stringify(PNL_DATA));
    localStorage.setItem('pnl_sync', now);

    renderPnLMetrics();
    showToast('Data PnL berhasil disinkronkan ✓', 'success');
  } catch (e) {
    if (btn) btn.classList.remove('loading');
    if (lbl) lbl.textContent = 'Sinkronisasi Sheets';
    showToast('Gagal ambil data Sheets: ' + e.message, 'error');
  }
}

function parsePnLCSV(csv) {
  // Parse the CSV rows, columns: [label, Y1M1..Y1M12, Y2M1..Y2M12, Y3M1..Y3M12]
  const rows = csv.trim().split('\n').map(line => {
    // Parse CSV properly handling quoted fields
    const cols = [];
    let inQuote = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuote = !inQuote; }
      else if (c === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    return cols;
  });

  // Row indices (0-based): row 0=header, 2=revenue, 3=hpp, 4=gm1, 7=gm2, 12=gm3, 16=net, 15=marketing
  const ROWS = {
    revenue:   2,  // Total Revenue
    hpp:       3,  // Total HPP
    gm1:       4,  // GROSS MARGIN 1
    marketing: 5,  // Biaya Pemasaran header (empty), so use row 6 = Total Marketing
    total_mkt: 6,
    gm2:       7,  // GROSS MARGIN 2
    gm3:       12, // GROSS MARGIN 3
    net:       16  // NET PROFIT (row 26 = index 16 in CSV which has no header offset)
  };

  function parseNum(str) {
    if (!str) return 0;
    // Remove Rp, dots (thousands), parentheses (negative), spaces
    const s = str.replace(/[Rp\s]/g,'').replace(/\./g,'').replace(/\(/g,'-').replace(/\)/g,'');
    return parseFloat(s) || 0;
  }

  // The CSV has columns: col0=label, col1..12 = Y1M1..M12, col13..24 = Y2, col25..36 = Y3
  const result = [];

  for (let year = 0; year < 3; year++) {
    const yearData = [];
    for (let month = 0; month < 12; month++) {
      const colIdx = 1 + year * 12 + month;
      yearData.push({
        revenue:   parseNum(rows[ROWS.revenue]?.[colIdx]),
        hpp:       parseNum(rows[ROWS.hpp]?.[colIdx]),
        gm1:       parseNum(rows[ROWS.gm1]?.[colIdx]),
        marketing: parseNum(rows[ROWS.total_mkt]?.[colIdx]),
        gm2:       parseNum(rows[ROWS.gm2]?.[colIdx]),
        gm3:       parseNum(rows[ROWS.gm3]?.[colIdx]),
        net:       parseNum(rows[ROWS.net]?.[colIdx])
      });
    }
    result.push(yearData);
  }
  return result;
}

function renderPnLMetrics() {
  // Try loading from cache if not yet fetched
  if (!PNL_DATA) {
    const cached = localStorage.getItem('pnl_data');
    if (cached) {
      PNL_DATA = JSON.parse(cached);
      const syncTime = localStorage.getItem('pnl_sync');
      const syncEl = document.getElementById('pnl-last-sync');
      if (syncEl && syncTime) syncEl.textContent = `Diperbarui: ${syncTime}`;
    } else {
      return; // No data yet
    }
  }

  const year  = parseInt(document.getElementById('pnl-year-select')?.value  || '0');
  const month = parseInt(document.getElementById('pnl-month-select')?.value || '0');
  const d = PNL_DATA[year]?.[month];
  if (!d) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmtRp(Math.abs(val));
  };

  set('pnl-gm1', d.gm1);
  set('pnl-gm2', d.gm2);
  set('pnl-gm3', d.gm3);
  set('pnl-net', d.net);
  set('pnl-revenue', d.revenue);
  set('pnl-hpp', d.hpp);
  set('pnl-marketing', Math.abs(d.marketing));

  // Color net profit green if positive, red if negative
  const netEl = document.getElementById('pnl-net');
  if (netEl) netEl.style.color = d.net >= 0 ? '#86EFAC' : '#FCA5A5';
}

/* ═══════════════════════════════════════════════════════
   MODAL HELPERS
   ═══════════════════════════════════════════════════════ */

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Load POs and SKUs after auth
document.addEventListener('wms:ready', async () => {
  await loadSkus();
  await loadPOs();
  renderPnLMetrics(); // Render from cache if available
});

// Also initialize on DOM ready (called manually after login)
window._postLoginInit = async () => {
  await loadSkus();
  await loadPOs();
  renderPnLMetrics();
};
