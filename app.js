'use strict';

/* ─────────────── SUPABASE ─────────────── */
const SUPABASE_URL = 'https://zspyfjcqbuehbfqcbcax.supabase.co';   // contoh: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcHlmamNxYnVlaGJmcWNiY2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDM3MDEsImV4cCI6MjA5NjIxOTcwMX0.khoftJXX6sDM5vTA4pKZXWlrUhwFipA3jDHt1mRWlUE';      // dari: Project Settings → API → anon public

const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ─────────────── CONSTANTS ─────────────── */
const MATERIAL_PARFUM = {
  biangP: { label: 'Biang Parfum Perempuan', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Biang Parfum Perempuan (mL)', group: 'parfum' },
  biangL: { label: 'Biang Parfum Laki-laki', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Biang Parfum Laki-laki (mL)', group: 'parfum' },
  botolP: { label: 'Botol Parfum Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Parfum Perempuan (pcs)', group: 'parfum' },
  botolL: { label: 'Botol Parfum Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Parfum Laki-laki (pcs)', group: 'parfum' }
};

const MATERIAL_PERSONAL_CARE = {
  cairanDeoP: { label: 'Cairan Deodorant Perempuan', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Cairan Deodorant Perempuan (mL)', group: 'personal_care' },
  cairanDeoL: { label: 'Cairan Deodorant Laki-laki', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Cairan Deodorant Laki-laki (mL)', group: 'personal_care' },
  botolDeoP: { label: 'Botol Deodorant Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Deodorant Perempuan (pcs)', group: 'personal_care' },
  botolDeoL: { label: 'Botol Deodorant Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Deodorant Laki-laki (pcs)', group: 'personal_care' },
  cairanHMP: { label: 'Cairan Hair Mist Perempuan', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Cairan Hair Mist Perempuan (mL)', group: 'personal_care' },
  cairanHML: { label: 'Cairan Hair Mist Laki-laki', unit: 'mL', warnAt: 100, lowAt: 30, optionLabel: 'Cairan Hair Mist Laki-laki (mL)', group: 'personal_care' },
  botolHMP: { label: 'Botol Hair Mist Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Hair Mist Perempuan (pcs)', group: 'personal_care' },
  botolHML: { label: 'Botol Hair Mist Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Botol Hair Mist Laki-laki (pcs)', group: 'personal_care' }
};

const MATERIAL_PACKAGING = {
  boxParfumL: { label: 'Box Parfum Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Parfum Laki-laki (pcs)', group: 'packaging' },
  boxParfumP: { label: 'Box Parfum Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Parfum Perempuan (pcs)', group: 'packaging' },
  boxDeoP: { label: 'Box Deodorant Perempuan', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Deodorant Perempuan (pcs)', group: 'packaging' },
  boxDeoL: { label: 'Box Deodorant Laki-laki', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Deodorant Laki-laki (pcs)', group: 'packaging' },
  boxExclusive: { label: 'Box Exclusive', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Exclusive (pcs)', group: 'packaging' },
  boxBundlingP: { label: 'Box Bundling Pria', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Bundling Pria (pcs)', group: 'packaging' },
  boxBundlingW: { label: 'Box Bundling Wanita', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Bundling Wanita (pcs)', group: 'packaging' },
  bubbleWrap: { label: 'Bubble Wrap', unit: 'm', warnAt: 2, lowAt: 0.5, optionLabel: 'Bubble Wrap (meter)', group: 'packaging' },
  boxLuar: { label: 'Box Luar', unit: 'pcs', warnAt: 5, lowAt: 2, optionLabel: 'Box Luar (pcs)', group: 'packaging' }
};

const MATERIAL_META = { ...MATERIAL_PARFUM, ...MATERIAL_PERSONAL_CARE, ...MATERIAL_PACKAGING };

const VENDORS_DEFAULT = [
  { id: 1, name: 'PT Aroma Nusantara', material: 'biangP,biangL', leadTimeDays: 3, contact: '0812-xxxx-xxxx' },
  { id: 2, name: 'CV Botol Kaca Jaya', material: 'botolP,botolL,botolDeoP,botolDeoL,botolHMP,botolHML', leadTimeDays: 5, contact: '0813-xxxx-xxxx' },
  { id: 3, name: 'PT PackIndo Sejahtera', material: 'boxParfumP,boxParfumL,boxDeoP,boxDeoL,boxExclusive,boxBundlingP,boxBundlingW,bubbleWrap,boxLuar', leadTimeDays: 2, contact: '0819-xxxx-xxxx' },
  { id: 4, name: 'CV Deodorant Supply', material: 'cairanDeoP,cairanDeoL', leadTimeDays: 4, contact: '0821-xxxx-xxxx' },
  { id: 5, name: 'PT Hair Mist Indo', material: 'cairanHMP,cairanHML', leadTimeDays: 4, contact: '0822-xxxx-xxxx' }
];

let VENDORS = VENDORS_DEFAULT.map(v => ({ ...v }));

const CHANNEL_CODES = { Shopee: 'SHP', eBay: 'EBY' };

const FINISHED_GOODS = {
  parfumP_QoS_35: { label: 'Parfum Queen of Sheba 35mL', size: 35, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumP_Cleopatra_35: { label: 'Parfum Cleopatra’s Nilus 35mL', size: 35, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumP_Joan_35: { label: 'Parfum Joan’s Armor 35mL', size: 35, product: 'perempuan', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumL_KingSolomon_30: { label: 'Parfum King Solomon 30mL', size: 30, product: 'lakiLaki', unit: 'pcs', warnAt: 5, lowAt: 2 },
  parfumL_Alexander_30: { label: 'Parfum Alexander’s Empire 30mL', size: 30, product: 'lakiLaki', unit: 'pcs', warnAt: 5, lowAt: 2 },
  deodorantP: { label: 'Deodorant Queen of Sheba', size: 50, product: 'deodorantP', unit: 'pcs', warnAt: 5, lowAt: 2 },
  deodorantL: { label: 'Deodorant King Solomon', size: 50, product: 'deodorantL', unit: 'pcs', warnAt: 5, lowAt: 2 },
  hairMistP: { label: 'Crown of Velvet Hair Mist', size: 60, product: 'hairMistP', unit: 'pcs', warnAt: 5, lowAt: 2 },
  hairMistL: { label: 'Sovereign Mane Hair Mist', size: 60, product: 'hairMistL', unit: 'pcs', warnAt: 5, lowAt: 2 },
  bundlingPria: { label: 'The King\'s Ritual Trilogy 3-in-1', size: 0, product: 'bundlingPria', unit: 'set', warnAt: 3, lowAt: 1 },
  bundlingWanita: { label: 'The Queen\'s Secret Trilogy 3-in-1', size: 0, product: 'bundlingWanita', unit: 'set', warnAt: 3, lowAt: 1 },
  giftBoxLuxury: { label: 'The Queen\'s Trilogy Gift Box (Luxury)', size: 0, product: 'giftBoxLuxury', unit: 'set', warnAt: 3, lowAt: 1 }
};

// Recipe: bahan baku yang dibutuhkan per 1 unit produk jadi
const PRODUCTION_RECIPES = {
  parfumP_QoS_35: { biangP: 35, botolP: 1, boxParfumP: 1 },
  parfumP_Cleopatra_35: { biangP: 35, botolP: 1, boxParfumP: 1 },
  parfumP_Joan_35: { biangP: 35, botolP: 1, boxParfumP: 1 },
  parfumL_KingSolomon_30: { biangL: 30, botolL: 1, boxParfumL: 1 },
  parfumL_Alexander_30: { biangL: 30, botolL: 1, boxParfumL: 1 },
  deodorantP: { cairanDeoP: 50, botolDeoP: 1, boxDeoP: 1 },
  deodorantL: { cairanDeoL: 50, botolDeoL: 1, boxDeoL: 1 },
  hairMistP: { cairanHMP: 60, botolHMP: 1, boxExclusive: 1 },
  hairMistL: { cairanHML: 60, botolHML: 1, boxExclusive: 1 },
  // Bundling menggunakan produk jadi (fg) bukan bahan baku langsung
  bundlingPria: { _fg: { parfumL_KingSolomon_30: 1, deodorantL: 1, hairMistL: 1 }, boxBundlingP: 1 },
  bundlingWanita: { _fg: { parfumP_QoS_35: 1, deodorantP: 1, hairMistP: 1 }, boxBundlingW: 1 },
  giftBoxLuxury: { _fg: { parfumP_QoS_35: 1, deodorantP: 1, hairMistP: 1 }, boxExclusive: 1 }
};

const DEFAULT_STATE = {
  rm: {
    biangP: 0, biangL: 0, botolP: 0, botolL: 0, boxParfumL: 0, boxParfumP: 0,
    cairanDeoP: 0, cairanDeoL: 0, botolDeoP: 0, botolDeoL: 0, boxDeoP: 0, boxDeoL: 0,
    cairanHMP: 0, cairanHML: 0, botolHMP: 0, botolHML: 0,
    boxExclusive: 0, boxBundlingP: 0, boxBundlingW: 0, bubbleWrap: 0, boxLuar: 0
  },
  rmCost: {
    biangP: 500, biangL: 500, 
    botolP: 12000, botolL: 12000, 
    boxParfumL: 5000, boxParfumP: 5000,
    cairanDeoP: 200, cairanDeoL: 200, 
    botolDeoP: 8000, botolDeoL: 8000, 
    boxDeoP: 2000, boxDeoL: 2000,
    cairanHMP: 150, cairanHML: 150, 
    botolHMP: 10000, botolHML: 10000,
    boxExclusive: 6000, boxBundlingP: 15000, boxBundlingW: 15000, 
    bubbleWrap: 500, boxLuar: 3000
  },
  customRM: {},
  fg: {
    parfumP_QoS_35: 0, parfumP_Cleopatra_35: 0, parfumP_Joan_35: 0,
    parfumL_KingSolomon_30: 0, parfumL_Alexander_30: 0,
    deodorantP: 0, deodorantL: 0, hairMistP: 0, hairMistL: 0,
    bundlingPria: 0, bundlingWanita: 0, giftBoxLuxury: 0
  },
  hr: {
    errors: [], // { id, ts, staff, type, resi, notes }
    overtimes: [] // { id, ts, date, staff, hours, notes }
  },
  marketing: {
    budgets: [], // { id, ts, category, month, amount }
    kpi: { roas: 0, cac: 0, ltv: 0, reach: 0, growth: 0 },
    calendar: [], // { id, title, type, start, end, pic }
    pr: [] // { id, name, type, date, notes }
  },
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
  // populateFinFields removed
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
    if (raw) {
      const parsed = JSON.parse(raw);
      S = { ...deepClone(DEFAULT_STATE), ...parsed };
      // Pastikan rmCost di-merge dalam (deep merge) agar nilai default tidak hilang jika kosong
      S.rmCost = { ...DEFAULT_STATE.rmCost, ...(parsed.rmCost || {}) };
    }
  } catch (e) { console.warn('loadLocalState error', e); }
  setupFormListeners();
  renderAll();
  startClock();
}

async function loadState() {
  loadLocalState(); // load local cache first, including rmCost and other non-synced states
  if (!sb) return;

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
        biangP: inv.biang_p || inv.biang || 0,
        biangL: inv.biang_l || 0,
        botolP: inv.botol_p || 0,
        botolL: inv.botol_l || 0,
        boxParfumL: inv.box_parfum_l || 0,
        boxParfumP: inv.box_parfum_p || inv.box || 0,
        cairanDeoP: inv.cairan_deo_p || inv.cairan_deo || 0,
        cairanDeoL: inv.cairan_deo_l || 0,
        botolDeoP: inv.botol_deo_p || inv.botol_deo || 0,
        botolDeoL: inv.botol_deo_l || 0,
        boxDeoP: inv.box_deo_p || inv.box_deo || 0,
        boxDeoL: inv.box_deo_l || 0,
        cairanHMP: inv.cairan_hm_p || inv.cairan_hm || 0,
        cairanHML: inv.cairan_hm_l || 0,
        botolHMP: inv.botol_hm_p || inv.botol_hm || 0,
        botolHML: inv.botol_hm_l || 0,
        boxExclusive: inv.box_exclusive || 0,
        boxBundlingP: inv.box_bundling_p || 0,
        boxBundlingW: inv.box_bundling_w || 0,
        bubbleWrap: inv.bubble_wrap || inv.bubble || 0,
        boxLuar: inv.box_luar || inv.kardus || 0
      };
    } else {
      await sb.from('wms_inventory').insert({
        id: 1,
        biang_p: 0, biang_l: 0, botol_p: 0, botol_l: 0,
        box_parfum_l: 0, box_parfum_p: 0,
        cairan_deo_p: 0, cairan_deo_l: 0, botol_deo_p: 0, botol_deo_l: 0, box_deo_p: 0, box_deo_l: 0,
        cairan_hm_p: 0, cairan_hm_l: 0, botol_hm_p: 0, botol_hm_l: 0,
        box_exclusive: 0, box_bundling_p: 0, box_bundling_w: 0,
        bubble_wrap: 0, box_luar: 0
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
        parfumP_QoS_35: fg.parfum_p_qos_35 || 0,
        parfumP_Cleopatra_35: fg.parfum_p_cleopatra_35 || 0,
        parfumP_Joan_35: fg.parfum_p_joan_35 || 0,
        parfumL_KingSolomon_30: fg.parfum_l_kingsolomon_30 || 0,
        parfumL_Alexander_30: fg.parfum_l_alexander_30 || 0,
        deodorantP: fg.deodorant_p || fg.deodorant || 0,
        deodorantL: fg.deodorant_l || 0,
        hairMistP: fg.hair_mist_p || fg.hair_mist || 0,
        hairMistL: fg.hair_mist_l || 0,
        bundlingPria: fg.bundling_pria || 0,
        bundlingWanita: fg.bundling_wanita || 0,
        giftBoxLuxury: fg.gift_box_luxury || 0
      };
    } else {
      await sb.from('wms_finished_goods').insert({
        id: 1,
        parfum_p_qos_35: 0, parfum_p_cleopatra_35: 0, parfum_p_joan_35: 0,
        parfum_l_kingsolomon_30: 0, parfum_l_alexander_30: 0,
        deodorant_p: 0, deodorant_l: 0, hair_mist_p: 0, hair_mist_l: 0, bundling_pria: 0, bundling_wanita: 0, gift_box_luxury: 0
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
    // Sync raw materials (16 bahan baku)
    const { error: invErr } = await sb.from('wms_inventory').update({
      biang_p: S.rm.biangP,
      biang_l: S.rm.biangL,
      botol_p: S.rm.botolP,
      botol_l: S.rm.botolL,
      box_parfum_l: S.rm.boxParfumL,
      box_parfum_p: S.rm.boxParfumP,
      cairan_deo_p: S.rm.cairanDeoP,
      cairan_deo_l: S.rm.cairanDeoL,
      botol_deo_p: S.rm.botolDeoP,
      botol_deo_l: S.rm.botolDeoL,
      box_deo_p: S.rm.boxDeoP,
      box_deo_l: S.rm.boxDeoL,
      cairan_hm_p: S.rm.cairanHMP,
      cairan_hm_l: S.rm.cairanHML,
      botol_hm_p: S.rm.botolHMP,
      botol_hm_l: S.rm.botolHML,
      box_exclusive: S.rm.boxExclusive,
      box_bundling_p: S.rm.boxBundlingP,
      box_bundling_w: S.rm.boxBundlingW,
      bubble_wrap: S.rm.bubbleWrap,
      box_luar: S.rm.boxLuar,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (invErr) throw invErr;

    // Sync finished goods
    const { error: fgErr } = await sb.from('wms_finished_goods').update({
      parfum_p_qos_35: S.fg.parfumP_QoS_35,
      parfum_p_cleopatra_35: S.fg.parfumP_Cleopatra_35,
      parfum_p_joan_35: S.fg.parfumP_Joan_35,
      parfum_l_kingsolomon_30: S.fg.parfumL_KingSolomon_30,
      parfum_l_alexander_30: S.fg.parfumL_Alexander_30,
      deodorant_p: S.fg.deodorantP,
      deodorant_l: S.fg.deodorantL,
      hair_mist_p: S.fg.hairMistP,
      hair_mist_l: S.fg.hairMistL,
      bundling_pria: S.fg.bundlingPria,
      bundling_wanita: S.fg.bundlingWanita,
      gift_box_luxury: S.fg.giftBoxLuxury,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (fgErr) throw fgErr;
  } catch (e) {
    console.error('syncInventory error:', e);
    toast('Gagal sinkronisasi stok ke cloud', 'error');
  }
}

async function saveState() {
  try { localStorage.setItem('wmsParfum_v2', JSON.stringify(S)); } catch (e) { }
  if (sb) {
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
  hr: 'Human Resources',
  financial: 'Finance & AP',
  marketing: 'Marketing',
  vendors: 'Manajemen Vendor',
  report: 'Laporan Bulanan'
};

function navigateTo(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${pageKey}`).classList.add('active');
  document.querySelector(`[data-page="${pageKey}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[pageKey];
  if (pageKey === 'hr') { renderHr(); populateHrStaff(); }
  if (pageKey === 'financial') switchFinTab('dashboard');
  if (pageKey === 'marketing') renderMarketing();
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
  renderHr();
  renderFinancial();
  renderMarketing();
  renderVendors();
  renderReport();
}

function renderDashboard() {
  const { rm, log, sales } = S;

  // Summary stats for dashboard - grouped counts
  const parfumBiangTotal = (rm.biangP || 0) + (rm.biangL || 0);
  const parfumBotolTotal = (rm.botolP || 0) + (rm.botolL || 0);
  const parfumBoxTotal = (rm.boxParfumP || 0) + (rm.boxParfumL || 0);
  const deoTotal = (rm.cairanDeo || 0);
  const hmTotal = (rm.cairanHM || 0);
  const packTotal = (rm.boxExclusive || 0) + (rm.boxBundlingP || 0) + (rm.boxBundlingW || 0) + (rm.boxLuar || 0);

  set('d-biang', fmt(parfumBiangTotal) + '<span class="stat-unit">mL</span>');
  set('d-botp', fmt(parfumBotolTotal) + '<span class="stat-unit">pcs</span>');
  set('d-botl', fmt(deoTotal) + '<span class="stat-unit">mL</span>');
  set('d-box', fmt(hmTotal) + '<span class="stat-unit">mL</span>');
  set('d-kardus', fmt(rm.boxLuar || 0) + '<span class="stat-unit">pcs</span>');
  set('d-bubble', fmt(rm.bubbleWrap || 0) + '<span class="stat-unit">m</span>');

  const maxes = { biang: 500, botolP: 50, deo: 500, hm: 500 };
  setStyle('d-biang-fill', 'width', Math.min(100, (parfumBiangTotal / maxes.biang) * 100) + '%');
  setStyle('d-botp-fill', 'width', Math.min(100, (parfumBotolTotal / maxes.botolP) * 100) + '%');
  setStyle('d-botl-fill', 'width', Math.min(100, (deoTotal / maxes.deo) * 100) + '%');
  setStyle('d-box-fill', 'width', Math.min(100, (hmTotal / maxes.hm) * 100) + '%');

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

let RM_FILTER = 'parfum';

function switchRmTab(tabId) {
  RM_FILTER = tabId;
  document.querySelectorAll('#page-rawmaterials .vendor-tab').forEach(b => {
    if (b.id === `rmtab-${tabId}`) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderRawMaterials();
}

let RM_SEARCH = '';

function filterRmList() {
  const input = document.getElementById('rm-search');
  if (input) {
    RM_SEARCH = input.value.trim().toLowerCase();
    renderRawMaterials();
  }
}

function renderRawMaterials() {
  const { rm, log } = S;

  const tbody = document.getElementById('rm-list-tbody');
  if (tbody) {
    const allMaterials = { ...MATERIAL_META, ...(S.customRM || {}) };
    let materials = Object.entries(allMaterials).filter(([key, meta]) => meta.group === RM_FILTER);

    if (RM_SEARCH) {
      materials = materials.filter(([key, meta]) => meta.label.toLowerCase().includes(RM_SEARCH));
    }

    if (materials.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#B08A62;padding:24px;">Tidak ada bahan baku ditemukan</td></tr>';
    } else {
      tbody.innerHTML = materials.map(([key, meta]) => {
        const stock = rm[key] || 0;
        const isLow = stock <= meta.warnAt;
        const stockColor = isLow ? '#991B1B' : '#5C4A3C';
        const costVal = S.rmCost[key] || '';

        return `
          <tr>
            <td style="font-weight:600;color:#2D1F17;">${meta.label}</td>
            <td style="text-align:center;font-weight:700;color:${stockColor};">
              ${fmt(stock)} <span style="font-size:12px;font-weight:400;">${meta.unit}</span>
            </td>
            <td>
              <input type="number" class="form-input rm-mass-cost" data-key="${key}" min="0" step="1" value="${costVal}" placeholder="Rp">
            </td>
            <td>
              <input type="number" class="form-input rm-mass-qty" data-key="${key}" min="0" step="0.1" placeholder="+ Qty">
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const el = document.getElementById('rm-log');
  if (!el) return;
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
  const fgKey = document.getElementById('prod-product')?.value;
  const qty = parseInt(document.getElementById('prod-qty')?.value) || 0;
  if (!fgKey) return;

  const recipe = PRODUCTION_RECIPES[fgKey];
  if (!recipe) return;

  const previewEl = document.getElementById('prod-preview-items');
  if (!previewEl) return;

  let html = '';
  // Show raw material needs
  Object.entries(recipe).forEach(([matKey, amount]) => {
    if (matKey === '_fg') return; // Skip fg requirements display separately
    const meta = MATERIAL_META[matKey];
    if (!meta) return;
    const needed = amount * qty;
    const available = S.rm[matKey] || 0;
    const isShort = available < needed;
    html += `<div style="display:flex;justify-content:space-between;font-size:13px;">
      <span class="label-with-icon" style="color:#6B5347;">${icon(matIconName(matKey), 'ico ico-xs')} ${meta.label}</span>
      <strong style="color:${isShort ? '#991B1B' : '#2D1F17'};">${fmt(needed)} ${meta.unit}${isShort ? ' ⚠' : ''}</strong>
    </div>`;
  });

  // Show finished goods needs (for bundling)
  if (recipe._fg) {
    Object.entries(recipe._fg).forEach(([fgReqKey, amount]) => {
      const fgMeta = FINISHED_GOODS[fgReqKey];
      if (!fgMeta) return;
      const needed = amount * qty;
      const available = S.fg[fgReqKey] || 0;
      const isShort = available < needed;
      html += `<div style="display:flex;justify-content:space-between;font-size:13px;">
        <span style="color:#6B5347;">📦 ${fgMeta.label} (produk jadi)</span>
        <strong style="color:${isShort ? '#991B1B' : '#2D1F17'};">${fmt(needed)} ${fgMeta.unit}${isShort ? ' ⚠' : ''}</strong>
      </div>`;
    });
  }

  previewEl.innerHTML = html || '<div style="color:#B08A62;font-size:12px;">Pilih produk terlebih dahulu</div>';
}

async function recordProduction() {
  const fgKey = document.getElementById('prod-product').value;
  const qty = validateQuantity(document.getElementById('prod-qty').value, true);

  if (!qty) return;
  if (!fgKey || !PRODUCTION_RECIPES[fgKey]) {
    toast('Pilih jenis produk yang valid!', 'error');
    return;
  }

  const recipe = PRODUCTION_RECIPES[fgKey];
  const errors = [];

  // Check raw material stock
  Object.entries(recipe).forEach(([matKey, amount]) => {
    if (matKey === '_fg') return;
    const needed = amount * qty;
    const available = S.rm[matKey] || 0;
    const meta = MATERIAL_META[matKey];
    if (available < needed) {
      errors.push(`${meta.label}: butuh ${fmt(needed)} ${meta.unit}, tersedia ${fmt(available)} ${meta.unit}`);
    }
  });

  // Check finished goods stock (for bundling)
  if (recipe._fg) {
    Object.entries(recipe._fg).forEach(([fgReqKey, amount]) => {
      const needed = amount * qty;
      const available = S.fg[fgReqKey] || 0;
      const fgMeta = FINISHED_GOODS[fgReqKey];
      if (available < needed) {
        errors.push(`${fgMeta.label} (produk jadi): butuh ${fmt(needed)}, tersedia ${fmt(available)}`);
      }
    });
  }

  if (errors.length) {
    toast('Stok tidak cukup!\n' + errors.join('\n'), 'error', 5000);
    return;
  }

  // Deduct raw materials
  const deductions = [];
  Object.entries(recipe).forEach(([matKey, amount]) => {
    if (matKey === '_fg') return;
    const needed = amount * qty;
    S.rm[matKey] = +(S.rm[matKey] - needed).toFixed(2);
    const meta = MATERIAL_META[matKey];
    deductions.push(`-${fmt(needed)} ${meta.unit} ${meta.label}`);
  });

  // Deduct finished goods (for bundling)
  if (recipe._fg) {
    Object.entries(recipe._fg).forEach(([fgReqKey, amount]) => {
      const needed = amount * qty;
      S.fg[fgReqKey] = +(S.fg[fgReqKey] - needed).toFixed(2);
      const fgMeta = FINISHED_GOODS[fgReqKey];
      deductions.push(`-${fmt(needed)} ${fgMeta.label}`);
    });
  }

  // Add finished goods
  S.fg[fgKey] = +(S.fg[fgKey] + qty).toFixed(2);

  const fgLabel = FINISHED_GOODS[fgKey].label;
  await addLog('production', `Produksi ${qty} pcs ${fgLabel} berhasil! ${deductions.join(', ')}`);

  // Kalkulasi HPP dari bahan baku yang digunakan & simpan ke Supabase
  const unitHpp = typeof calculateFgHpp === 'function' ? calculateFgHpp(fgKey) : 0;
  if (sb && unitHpp > 0) {
    try {
      await sb.from('wms_products_sku').update({ cost_price: unitHpp }).eq('product_type', fgKey);
      // Update local cache so UI reflects immediately without refetching
      const s = ALL_SKUS.find(x => x.product_type === fgKey);
      if (s) s.cost_price = unitHpp;
    } catch (e) {
      console.error('Failed to sync HPP to cloud', e);
    }
  }

  toast(`Produksi berhasil! ${qty} pcs ${fgLabel} ditambahkan ke stok.`, 'success', 3000);

  await saveState();
  renderAll();
  updateProdPreview();
}

function renderProduction() {
  const { fg, log } = S;

  // Render finished goods stock on production page
  const fgStockEl = document.getElementById('prod-fg-stock');
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
    fgStockEl.innerHTML = items || '<div style="text-align:center;color:#B08A62;font-size:13px;padding:16px 0;">Belum ada stok produk jadi</div>';
  }

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
async function massAddStock() {
  const vendorEl = document.getElementById('rm-vendor');
  const vendor = vendorEl ? vendorEl.value.trim() : '';

  const qtyInputs = document.querySelectorAll('.rm-mass-qty');
  let hasItems = false;
  let itemsProcessed = 0;

  // First pass to check if there is anything to save
  qtyInputs.forEach(input => {
    if (validateQuantity(input.value, true) > 0) hasItems = true;
  });

  if (!hasItems) {
    toast('Isi minimal satu Qty Masuk untuk menyimpan stok.', 'warn');
    return;
  }

  if (!vendor) {
    toast('Pilih Vendor Suplier terlebih dahulu!\nData ini penting untuk traceability.', 'warn', 4000);
    if (vendorEl) vendorEl.focus();
    return;
  }

  // Second pass to apply changes
  for (const input of qtyInputs) {
    const qty = validateQuantity(input.value, true);
    if (qty > 0) {
      const key = input.getAttribute('data-key');
      const costInput = document.querySelector(`.rm-mass-cost[data-key="${key}"]`);
      const cost = costInput ? validateQuantity(costInput.value, false) : 0;

      S.rm[key] = +(S.rm[key] + qty).toFixed(2);
      if (cost > 0) {
        S.rmCost[key] = cost;
      }

      const m = MATERIAL_META[key];
      await addLog('inbound', `+${fmt(qty)} ${m.unit} ${m.label} — ${vendor}`);
      itemsProcessed++;

      input.value = ''; // clear qty input after processing
    }
  }

  if (itemsProcessed > 0) {
    await saveState();
    renderAll();

    // Clear search
    const searchInput = document.getElementById('rm-search');
    if (searchInput) searchInput.value = '';
    RM_SEARCH = '';
    if (vendorEl) vendorEl.value = ''; // Reset vendor
    renderRawMaterials();

    toast(`Berhasil menyimpan inbound untuk ${itemsProcessed} jenis bahan baku dari ${vendor}.`, 'success');
  }
}

// (processProduction removed - use recordProduction instead)

async function recordSale() {
  const productEl = document.getElementById('sale-product');
  const qtyEl = document.getElementById('sale-qty');
  const channelEl = document.getElementById('sale-channel');
  const trackingEl = document.getElementById('sale-tracking');
  const kardusEl = document.getElementById('sale-kardus');
  const bubbleEl = document.getElementById('sale-bubble');
  const notesEl = document.getElementById('sale-notes');

  const fgKey = productEl.value;
  const qty = validateQuantity(qtyEl.value, false);
  const channel = channelEl.value;
  const tracking = validateTracking(trackingEl.value);
  let kardus = parseFloat(kardusEl.value) || 0;
  let bubbleCm = parseFloat(bubbleEl.value) || 0;
  const bubble = +(bubbleCm / 100).toFixed(4); // simpan dalam meter untuk stok
  const notes = notesEl.value.trim();

  if (!qty || !tracking) return;
  if (!fgKey || !FINISHED_GOODS[fgKey]) {
    toast('Pilih produk yang valid!', 'error');
    return;
  }

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
  const fgLabel = FINISHED_GOODS[fgKey].label;

  const errors = [];
  if ((S.fg[fgKey] || 0) < qty) errors.push(`${fgLabel} kurang: butuh ${fmt(qty)} pcs, stok ${fmt(S.fg[fgKey])} pcs`);
  if (kardus > 0 && (S.rm.boxLuar || 0) < kardus) errors.push(`Kardus hanya ${fmt(S.rm.boxLuar || 0)} pcs (butuh ${fmt(kardus)})`);
  if (bubble > 0 && (S.rm.bubbleWrap || 0) < bubble) errors.push(`Bubble Wrap hanya ${fmt((S.rm.bubbleWrap || 0) * 100)}cm (butuh ${fmt(bubbleCm)}cm)`);

  if (errors.length) {
    toast('Stok tidak cukup:\n' + errors.join('\n'), 'error', 5000);
    return;
  }

  // Auto-cut stok finished goods and packing materials
  S.fg[fgKey] = +(S.fg[fgKey] - qty).toFixed(2);
  if (kardus > 0) S.rm.boxLuar = +(Math.max(0, (S.rm.boxLuar || 0) - kardus)).toFixed(2);
  if (bubble > 0) S.rm.bubbleWrap = +(Math.max(0, (S.rm.bubbleWrap || 0) - bubble)).toFixed(2);

  const chLabel = channel === 'Shopee' ? 'Shopee (Lokal)' : 'eBay (Internasional)';

  const packingInfo = [];
  if (kardus > 0) packingInfo.push(`${fmt(kardus)} kardus`);
  if (bubbleCm > 0) packingInfo.push(`${fmt(bubbleCm)}cm bubble wrap`);
  const packingStr = packingInfo.length ? ` | Packing: ${packingInfo.join(', ')}` : '';

  await addLog('outbound', `Jual ${qty}x ${fgLabel} via ${chLabel}${packingStr}${tracking ? ' [' + tracking + ']' : ''}${notes ? ' — ' + notes : ''}`);

  const ts = new Date().toISOString();
  const saleItem = {
    product: fgKey,
    size: FINISHED_GOODS[fgKey].size || 0,
    qty,
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

      try {
        const skuData = ALL_SKUS.find(s => s.category === 'parfum' && s.product_type === fgKey);
        const sellPrice = skuData?.sell_price || (fgKey === 'perempuan' ? finConfig.priceP : finConfig.priceL);
        const revenue = qty * sellPrice;
        await sb.from('wms_finance_cash').insert({
          type: 'IN',
          category: 'sales',
          amount: revenue,
          notes: `Penjualan ${qty}x ${fgLabel} via ${channel}`
        });
      } catch (e2) { console.error('Cash insert err:', e2); }

    } catch (e) {
      console.error('recordSale supabase error:', e);
      toast('Gagal menyimpan ke cloud, tapi disimpan lokal: ' + e.message, 'warn', 4000);
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
        S.rm = {
          biangP: inv.biang_p || inv.biang || 0,
          biangL: inv.biang_l || 0,
          botolP: inv.botol_p || 0,
          botolL: inv.botol_l || 0,
          boxParfumL: inv.box_parfum_l || 0,
          boxParfumP: inv.box_parfum_p || inv.box || 0,
          cairanDeoP: inv.cairan_deo_p || inv.cairan_deo || 0,
          cairanDeoL: inv.cairan_deo_l || 0,
          botolDeoP: inv.botol_deo_p || inv.botol_deo || 0,
          botolDeoL: inv.botol_deo_l || 0,
          boxDeoP: inv.box_deo_p || inv.box_deo || 0,
          boxDeoL: inv.box_deo_l || 0,
          cairanHMP: inv.cairan_hm_p || inv.cairan_hm || 0,
          cairanHML: inv.cairan_hm_l || 0,
          botolHMP: inv.botol_hm_p || inv.botol_hm || 0,
          botolHML: inv.botol_hm_l || 0,
          boxExclusive: inv.box_exclusive || 0,
          boxBundlingP: inv.box_bundling_p || 0,
          boxBundlingW: inv.box_bundling_w || 0,
          bubbleWrap: inv.bubble_wrap || inv.bubble || 0,
          boxLuar: inv.box_luar || inv.kardus || 0
        };
        renderAll();
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_finished_goods' }, payload => {
      const fg = payload.new;
      if (fg && fg.id === 1) {
        S.fg = {
          parfumP_QoS_35: fg.parfum_p_qos_35 || 0,
          parfumP_Cleopatra_35: fg.parfum_p_cleopatra_35 || 0,
          parfumP_Joan_35: fg.parfum_p_joan_35 || 0,
          parfumL_KingSolomon_30: fg.parfum_l_kingsolomon_30 || 0,
          parfumL_Alexander_30: fg.parfum_l_alexander_30 || 0,
          deodorantP: fg.deodorant_p || fg.deodorant || 0,
          deodorantL: fg.deodorant_l || 0,
          hairMistP: fg.hair_mist_p || fg.hair_mist || 0,
          hairMistL: fg.hair_mist_l || 0,
          bundlingPria: fg.bundling_pria || 0,
          bundlingWanita: fg.bundling_wanita || 0,
          giftBoxLuxury: fg.gift_box_luxury || 0
        };
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
  const vendorEl = document.getElementById('rm-vendor');
  if (!vendorEl) return;

  if (!VENDORS || !VENDORS.length) {
    vendorEl.innerHTML = '<option value="">— Tidak ada vendor terdaftar —</option>';
    return;
  }

  vendorEl.innerHTML = '<option value="">-- Pilih Vendor --</option>' + VENDORS.map(v =>
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

  const activeTabId = document.querySelector('.vendor-tab-panel.active')?.id;

  // Populate PO vendor filter
  populatePoVendorSelect();

  const activeFilter = window._vendorFilter || 'all';

  let filtered = VENDORS;
  if (activeFilter !== 'all') {
    filtered = VENDORS.filter(v => {
      const vt = v.vendor_type || '';
      if (activeFilter === 'parfum') return vt === 'parfum' || vt === 'biang_parfum' || vt === 'botol_parfum';
      if (activeFilter === 'personal_care') return vt === 'personal_care' || vt === 'deodorant' || vt === 'hairmist';
      if (activeFilter === 'packaging') return vt === 'packaging';
      return vt === activeFilter;
    });
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
    const parsedOtif = parseFloat(v.otif_rate);
    const otif = isNaN(parsedOtif) ? 100 : parsedOtif;
    const otifCls = otif >= 90 ? 'otif-good' : otif >= 75 ? 'otif-ok' : 'otif-poor';
    const top = v.term_of_payment || 'CBD';
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
              <button class="btn-primary btn-with-icon" style="padding:5px 12px;font-size:12px;" onclick="createPoForVendor(${v.id})">
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
  const map = { parfum: 'vtype-biang', personal_care: 'vtype-deodorant', packaging: 'vtype-packaging', biang_parfum: 'vtype-biang', botol_parfum: 'vtype-botol', deodorant: 'vtype-deodorant', hairmist: 'vtype-hairmist' };
  return map[t] || 'vtype-default';
}

function vtypeLabel(t) {
  const map = { parfum: 'Parfum', personal_care: 'Personal Care', packaging: 'Packaging', biang_parfum: 'Biang Parfum', botol_parfum: 'Botol Parfum', deodorant: 'Deodorant', hairmist: 'Hair Mist' };
  return map[t] || (t || 'Umum');
}

function filterVendors(type) {
  document.querySelectorAll('#vpanel-list .chip').forEach(c => {
    const isActive = (type === 'all' && c.id === 'vf-all') || c.id === `vf-${type}`;
    c.classList.toggle('active', isActive);
  });
  window._vendorFilter = type;
  renderVendors();
}

function createPoForVendor(vendorId) {
  switchPage('financial');
  switchFinTab('po');
  const vendorSelect = document.getElementById('po-vendor');
  if (vendorSelect) {
    vendorSelect.value = vendorId;
    updatePoMaterialOptions();
  }
}

function switchVendorTab(tab) {
  ['list'].forEach(t => {
    const btn = document.getElementById(`vtab-${t}`);
    const panel = document.getElementById(`vpanel-${t}`);
    const isActive = t === tab;
    if (btn) btn.classList.toggle('active', isActive);
    if (panel) panel.classList.toggle('active', isActive);
  });

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
    if (genResiBtn) genResiBtn.addEventListener('click', simulateCourierTracking);

    // Populate products
    const prodSelect = document.getElementById('prod-product');
    const saleSelect = document.getElementById('sale-product');
    const fgOptions = Object.entries(FINISHED_GOODS).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('');
    if (prodSelect) prodSelect.innerHTML = fgOptions;
    if (saleSelect) saleSelect.innerHTML = fgOptions;

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

function saveFinConfig() {
  try { localStorage.setItem('wmsFinConfig', JSON.stringify(finConfig)); } catch (e) { }
}

window.switchFinTab = function (tabName) {
  ['dashboard', 'pricing', 'po', 'po-history', 'invoices', 'payroll', 'cash'].forEach(t => {
    const btn = document.getElementById(`tab-fin-${t}`);
    const panel = document.getElementById(`fin-panel-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (panel) panel.style.display = (t === tabName) ? 'block' : 'none';
  });

  if (tabName === 'dashboard') renderFinancial();
  else if (tabName === 'pricing') renderFinProducts();
  else if (tabName === 'po') { populatePoVendorSelect(); renderPendingPOs(); }
  else if (tabName === 'po-history') { populatePoVendorSelect(); renderPoHistory(); }
  else if (tabName === 'invoices') renderFinInvoices();
  else if (tabName === 'payroll') renderFinPayroll();
  else if (tabName === 'cash') renderFinCash();
};

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

  // Cache SKU prices
  const getPrice = (type) => {
    const s = ALL_SKUS.find(x => x.category === 'parfum' && x.product_type === type);
    return s?.sell_price || (type === 'perempuan' ? finConfig.priceP : finConfig.priceL);
  };
  const priceP = getPrice('perempuan');
  const priceL = getPrice('laki-laki');

  salesThisMonth.forEach(s => {
    const qty = parseInt(s.qty) || 0;
    const price = s.product === 'perempuan' ? priceP : priceL;
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
  const revenueP = qtyP * priceP;
  const revenueL = qtyL * priceL;

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
  const avgPrice = (qtyP + qtyL) > 0 ? (revenueP + revenueL) / (qtyP + qtyL) : priceP;
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
  const { rm, fg } = S;
  const search = (document.getElementById('sku-search')?.value || '').toLowerCase();

  const allMaterials = { ...MATERIAL_META, ...(S.customRM || {}) };
  let materials = Object.entries(allMaterials).map(([key, meta]) => {
    return { key, meta, stock: rm[key] || 0, isFg: false };
  });

  // Add Finished Goods
  const fgItems = Object.entries(FINISHED_GOODS).map(([key, meta]) => {
    return { key, meta: { ...meta, group: 'produk_jadi' }, stock: fg[key] || 0, isFg: true };
  });
  materials = materials.concat(fgItems);

  if (WH_FILTER !== 'all') {
    const filterGroupMap = {
      parfum: ['biangP', 'biangL', 'botolP', 'botolL'],
      personal_care: ['cairanDeoP', 'cairanDeoL', 'botolDeoP', 'botolDeoL', 'cairanHMP', 'cairanHML', 'botolHMP', 'botolHML'],
      packaging: ['boxParfumL', 'boxParfumP', 'boxDeoP', 'boxDeoL', 'boxExclusive', 'boxBundlingP', 'boxBundlingW', 'bubbleWrap', 'boxLuar']
    };

    if (WH_FILTER === 'produk_jadi') {
      materials = materials.filter(m => m.isFg);
    } else {
      const allowedKeys = filterGroupMap[WH_FILTER] || [];
      // Also allow dynamic customRM items that match the group
      materials = materials.filter(m => allowedKeys.includes(m.key) || m.meta.group === WH_FILTER);
    }
  }

  if (search) {
    materials = materials.filter(m => m.meta.label.toLowerCase().includes(search));
  }

  // Summary cards
  const totalSkus = materials.length;
  const lowSkus = materials.filter(m => m.stock <= m.meta.warnAt).length;
  const cats = new Set(materials.map(m => m.meta.group)).size;

  let totalValuation = 0;
  materials.forEach(m => {
    const cost = S.rmCost[m.key] || 0;
    totalValuation += m.stock * cost;
  });

  const el = (id) => document.getElementById(id);
  if (el('wh-total-sku')) el('wh-total-sku').textContent = totalSkus;
  if (el('wh-low-sku')) el('wh-low-sku').textContent = lowSkus;
  if (el('wh-categories')) el('wh-categories').textContent = cats;
  if (el('wh-total-value')) el('wh-total-value').textContent = fmtRp(totalValuation);

  // Grid cards
  const grid = document.getElementById('sku-grid');
  if (grid) {
    if (!materials.length) {
      grid.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:40px 0;grid-column:1/-1;">Tidak ada barang ditemukan</div>';
    } else {
      grid.innerHTML = materials.map(m => {
        const { key, meta, stock } = m;
        const min = meta.lowAt;
        const max = meta.warnAt * 3; // roughly
        const isLow = stock <= min;
        const isWarn = stock <= meta.warnAt && !isLow;
        const pct = Math.min(100, (stock / (max || 1)) * 100);

        const groupLabels = { parfum: '🌸 Parfum', personal_care: '🧴 Personal Care', packaging: '📦 Packaging', produk_jadi: '📦 Produk Jadi' };
        const catCls = { parfum: 'sku-parfum', personal_care: 'sku-deodorant', packaging: 'sku-bahan', produk_jadi: 'sku-bahan' }[meta.group] || 'sku-bahan';
        const statusCls = isLow ? 'low-stock' : isWarn ? 'warn-stock' : '';
        const statusLabel = isLow ? '<span class="sku-stock-indicator otif-poor">⚠ Restock Segera</span>' :
          isWarn ? '<span class="sku-stock-indicator otif-ok">⚡ Stok Menipis</span>' :
            '<span class="sku-stock-indicator otif-good">✓ Aman</span>';

        return `
          <div class="sku-card ${statusCls}" style="position:relative;">
            <button onclick="openEditMaterial('${key}')" style="position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;color:#B08A62;padding:4px;border-radius:4px;" onmouseover="this.style.background='#F2EAE0'" onmouseout="this.style.background='none'" title="Edit Item">
              <svg class="ico ico-sm"><use href="#ico-edit" /></svg>
            </button>
            <div class="sku-card-sku">${key}</div>
            <div class="sku-card-name" style="padding-right:20px;">${meta.label}</div>
            <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
              <span class="sku-cat ${catCls}">${groupLabels[meta.group] || meta.group}</span>
            </div>
            <div class="sku-card-stock">${fmt(stock)} <span style="font-size:13px;font-weight:400;color:#B08A62;">${meta.unit}</span></div>
            ${statusLabel}
            <div style="margin:10px 0 4px;height:4px;background:#E4D3BD;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${isLow ? '#EF4444' : isWarn ? '#F59E0B' : '#22C55E'};border-radius:2px;transition:width 0.4s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#B08A62;margin-bottom:10px;">
              <span>Min: ${meta.warnAt}</span><span>Kritis: ${min}</span>
            </div>
          </div>`;
      }).join('');
    }
  }

  // Table
  const tbody = document.getElementById('sku-tbody');
  if (tbody) {
    if (!materials.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#B08A62;padding:24px;">Tidak ada barang ditemukan</td></tr>';
    } else {
      tbody.innerHTML = materials.map(m => {
        const { key, meta, stock } = m;
        const isLow = stock <= meta.warnAt;
        const groupLabels = { parfum: '🌸 Parfum', personal_care: '🧴 Personal Care', packaging: '📦 Packaging', produk_jadi: '📦 Produk Jadi' };
        const catCls = { parfum: 'sku-parfum', personal_care: 'sku-deodorant', packaging: 'sku-bahan', produk_jadi: 'sku-bahan' }[meta.group] || 'sku-bahan';
        return `
          <tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600;color:#5C4A3C;">${key}</td>
            <td style="font-weight:600;color:#2D1F17;">${meta.label}</td>
            <td><span class="sku-cat ${catCls}">${groupLabels[meta.group] || meta.group}</span></td>
            <td style="text-align:center;font-weight:700;color:${isLow ? '#991B1B' : '#166534'};">${fmt(stock)} ${meta.unit}</td>
            <td style="text-align:center;color:#8B6F5E;">${meta.warnAt}</td>
            <td style="text-align:center;color:#8B6F5E;">${meta.lowAt}</td>
            <td style="color:#5C4A3C;">${fmtRp(S.rmCost[key] || 0)}</td>
            <td>${isLow ? '<span class="badge-low" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid;">⚠ Low</span>' : '<span class="badge-ok" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid;">✓ OK</span>'}</td>
            <td style="text-align:right;">
              <button onclick="openEditMaterial('${key}')" class="btn-secondary" style="padding:4px 8px;font-size:11px;">Edit</button>
            </td>
          </tr>`;
      }).join('');
    }
  }
}

function skuCatLabel(cat) {
  return { parfum: '🌸 Parfum', deodorant: '🧴 Deodorant', hairmist: '💨 Hair Mist', bahan_baku: '⚗️ Bahan Baku', produk_jadi: '📦 Produk Jadi' }[cat] || cat;
}

function filterWarehouse(cat) {
  WH_FILTER = cat;
  document.querySelectorAll('#wh-filter-chips .chip').forEach(c => c.classList.remove('active'));
  const active = { all: 'wh-chip-all', parfum: 'wh-chip-parfum', personal_care: 'wh-chip-personal_care', packaging: 'wh-chip-packaging', produk_jadi: 'wh-chip-produk_jadi' }[cat];
  if (active) document.getElementById(active)?.classList.add('active');
  renderWarehouse();
}

function openAddSkuModal() {
  document.getElementById('modal-sku-title').textContent = 'Tambah Stok Bahan Baku';
  document.getElementById('sku-code').value = '';
  document.getElementById('sku-code').readOnly = false;
  document.getElementById('sku-name-input').value = '';
  document.getElementById('sku-category').value = 'parfum';
  document.getElementById('sku-unit').value = 'pcs';
  document.getElementById('sku-stock').value = '0';
  document.getElementById('sku-min').value = '5';
  document.getElementById('sku-max').value = '100';
  document.getElementById('sku-cost').value = '0';
  document.getElementById('sku-edit-id').value = '';
  document.getElementById('btn-delete-sku').style.display = 'none';
  openModal('modal-sku');
}

function openEditMaterial(key) {
  const allMaterials = { ...MATERIAL_META, ...(S.customRM || {}) };
  const m = allMaterials[key];
  const isFg = !!FINISHED_GOODS[key];
  const meta = isFg ? FINISHED_GOODS[key] : m;

  if (!meta) return;

  document.getElementById('modal-sku-title').textContent = 'Edit Data Barang';
  document.getElementById('sku-code').value = key;
  document.getElementById('sku-code').readOnly = true;
  document.getElementById('sku-name-input').value = meta.label;

  if (isFg) {
    document.getElementById('sku-category').value = 'produk_jadi';
    // Append produk_jadi if not exists in dropdown
    const catDrop = document.getElementById('sku-category');
    if (!catDrop.querySelector('option[value="produk_jadi"]')) {
      const opt = document.createElement('option');
      opt.value = 'produk_jadi';
      opt.textContent = 'Produk Jadi';
      catDrop.appendChild(opt);
    }
  } else {
    document.getElementById('sku-category').value = meta.group || 'parfum';
  }

  document.getElementById('sku-unit').value = meta.unit || 'pcs';
  document.getElementById('sku-stock').value = isFg ? (S.fg[key] || 0) : (S.rm[key] || 0);
  document.getElementById('sku-min').value = meta.lowAt || 0;
  document.getElementById('sku-max').value = meta.warnAt || 0;
  document.getElementById('sku-cost').value = S.rmCost[key] || 0;
  document.getElementById('sku-edit-id').value = key;

  // Only allow deleting custom dynamic materials
  const btnDelete = document.getElementById('btn-delete-sku');
  if (S.customRM && S.customRM[key] && !MATERIAL_META[key] && !FINISHED_GOODS[key]) {
    btnDelete.style.display = 'inline-flex';
    btnDelete.style.alignItems = 'center';
  } else {
    btnDelete.style.display = 'none';
  }

  openModal('modal-sku');
}

async function deleteSku() {
  const key = document.getElementById('sku-edit-id').value;
  if (!key) return;

  // Ensure it is a custom item
  if (S.customRM && S.customRM[key] && !MATERIAL_META[key] && !FINISHED_GOODS[key]) {
    if (!confirm('Yakin ingin menghapus barang dinamis ini?')) return;
    delete S.customRM[key];
    delete S.rm[key];
    delete S.rmCost[key];

    await saveState();
    toast('Barang berhasil dihapus', 'success');
    closeModal('modal-sku');
    renderWarehouse();
    renderRawMaterials();
  } else {
    toast('Barang bawaan sistem (static) tidak bisa dihapus!', 'error');
  }
}

async function saveSku() {
  const code = document.getElementById('sku-code').value.trim();
  const name = document.getElementById('sku-name-input').value.trim();
  if (!code || !name) return toast('Kode Barang dan Nama wajib diisi', 'error');

  const editId = document.getElementById('sku-edit-id').value;
  const targetKey = editId || code.replace(/[^a-zA-Z0-9]/g, '');

  const category = document.getElementById('sku-category').value;
  const unit = document.getElementById('sku-unit').value || 'pcs';
  const stock = parseFloat(document.getElementById('sku-stock').value) || 0;
  const minStock = parseFloat(document.getElementById('sku-min').value) || 5;
  const maxStock = parseFloat(document.getElementById('sku-max').value) || 100;
  const cost = parseFloat(document.getElementById('sku-cost').value) || 0;

  // Check if editing a static finished good
  if (FINISHED_GOODS[targetKey]) {
    S.fg[targetKey] = stock;
  }
  // Check if editing a static raw material
  else if (MATERIAL_META[targetKey]) {
    S.rm[targetKey] = stock;
    S.rmCost[targetKey] = cost;
    // For min/max updates, we can optionally save them to customRM as overrides
    if (!S.customRM) S.customRM = {};
    if (minStock !== MATERIAL_META[targetKey].lowAt || maxStock !== MATERIAL_META[targetKey].warnAt) {
      S.customRM[targetKey] = { ...MATERIAL_META[targetKey], lowAt: minStock, warnAt: maxStock };
    }
  }
  // Custom material
  else {
    if (!S.customRM) S.customRM = {};
    S.customRM[targetKey] = {
      label: name,
      group: category,
      unit: unit,
      lowAt: minStock,
      warnAt: maxStock
    };
    S.rm[targetKey] = stock;
    S.rmCost[targetKey] = cost;
  }

  await saveState();
  toast('Stok berhasil disimpan ✓', 'success');
  closeModal('modal-sku');
  renderWarehouse();
  renderRawMaterials(); // Update inbound stock list
}

/* ═══════════════════════════════════════════════════════
   VENDOR MANAGEMENT (Modal + Save + Edit)
   ═══════════════════════════════════════════════════════ */

function openAddVendorModal() {
  document.getElementById('modal-vendor-title').textContent = 'Tambah Vendor Baru';
  ['v-name', 'v-material', 'v-phone', 'v-email', 'v-address', 'v-bank', 'v-notes'].forEach(id => document.getElementById(id).value = '');
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
  if (!name) return toast('Nama vendor wajib diisi', 'error');

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

  if (error) return toast('Gagal menyimpan vendor: ' + error.message, 'error');

  toast('Vendor berhasil disimpan ✓', 'success');
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
  const materialSelect = document.getElementById('po-material');
  if (materialSelect) {
    let optionsHtml = '<option value="">-- Pilih Material --</option>';
    for (const key in MATERIAL_META) {
      optionsHtml += `<option value="${key}">${MATERIAL_META[key].label}</option>`;
    }
    materialSelect.innerHTML = optionsHtml;
  }
}

async function savePurchaseOrder() {
  const vendorId = parseInt(document.getElementById('po-vendor')?.value);
  const poNumber = document.getElementById('po-number')?.value.trim();
  const material = document.getElementById('po-material')?.value.trim();
  const qty = parseFloat(document.getElementById('po-qty')?.value) || 0;
  const unitPrice = parseFloat(document.getElementById('po-unit-price')?.value) || 0;
  const expectedDate = document.getElementById('po-expected-date')?.value;
  const top = document.getElementById('po-top')?.value;

  if (!vendorId || !poNumber || !material || qty <= 0 || !expectedDate || !top) {
    return toast('Vendor, No. PO, material, qty, estimasi tiba, dan ToP wajib diisi', 'error');
  }

  const payload = {
    vendor_id: vendorId,
    po_number: poNumber,
    material,
    qty,
    unit: document.getElementById('po-unit')?.value || 'pcs',
    unit_price: unitPrice,
    total_amount: qty * unitPrice,
    expected_date: expectedDate,
    term_of_payment: top,
    payment_status: 'unpaid',
    paid_amount: 0,
    notes: document.getElementById('po-notes')?.value.trim() || null,
    user_email: window._userEmail || null
  };

  const { error } = await sb.from('wms_vendor_po').insert([payload]);
  if (error) return toast('Gagal simpan PO: ' + error.message, 'error');

  toast(`PO ${poNumber} berhasil disimpan ✓`, 'success');

  // Reset form
  ['po-number', 'po-material', 'po-qty', 'po-unit-price', 'po-total', 'po-notes', 'po-expected-date', 'po-top'].forEach(id => {
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
    const allMats = { ...MATERIAL_META, ...(S.customRM || {}) };

    return `
      <div style="padding:12px;background:${isLate ? '#FEF2F2' : '#F9F7F4'};border:1px solid ${isLate ? '#FECACA' : '#E4D3BD'};border-radius:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <div style="font-size:13px;font-weight:700;color:#2D1F17;">${sanitizeHtml(p.po_number)}</div>
            <div style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(vendorName)} · ${sanitizeHtml(allMats[p.material]?.label || p.material)}</div>
            <div style="font-size:11px;color:#8B6F5E;margin-top:2px;">${p.qty} ${p.unit} · ${fmtRp(p.total_amount)}</div>
            <div style="font-size:11px;color:${isLate ? '#991B1B' : '#8B6F5E'};margin-top:2px;">
              ${isLate ? '⚠ Terlambat! ' : ''}Estimasi tiba: ${expected}
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn-secondary" style="font-size:11px;padding:5px 10px;white-space:nowrap;color:#991B1B;border-color:#FECACA;" onclick="deletePurchaseOrder(${p.id})">Hapus</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function deletePurchaseOrder(poId) {
  if (!confirm('Apakah Anda yakin ingin menghapus PO ini?')) return;
  const { error } = await sb.from('wms_vendor_po').delete().eq('id', poId);
  if (error) return toast('Gagal menghapus PO: ' + error.message, 'error');
  toast('PO berhasil dihapus', 'success');
  await loadPOs();
  renderPendingPOs();
  renderPoHistory();
}

function openReceivePoModal(poId) {
  const po = ALL_POS.find(p => p.id == poId);
  const total = po ? (po.total_amount || (po.qty * po.unit_price) || 0) : 0;
  const paid = po ? (po.paid_amount || 0) : 0;
  const remaining = total - paid;

  document.getElementById('rpo-po-id').value = poId;
  document.getElementById('rpo-actual-date').value = po?.actual_date || '';
  document.getElementById('rpo-in-full').value = po?.is_in_full != null ? po.is_in_full : '';
  document.getElementById('rpo-payment-status').value = '';
  document.getElementById('rpo-paid-amount').value = remaining > 0 ? remaining : 0;
  openModal('modal-receive-po');
}

async function confirmReceivePO() {
  const poId = parseInt(document.getElementById('rpo-po-id').value);
  let actualDate = document.getElementById('rpo-actual-date').value;
  const isInFullRaw = document.getElementById('rpo-in-full').value;
  const payStatus = document.getElementById('rpo-payment-status').value;
  const paidAmt = document.getElementById('rpo-paid-amount').value;

  if (!payStatus || paidAmt === '') {
    return toast('Status pembayaran dan jumlah bayar wajib diisi', 'warn');
  }

  const parsedPaidAmt = parseFloat(paidAmt) || 0;

  const po = ALL_POS.find(p => p.id === poId);
  if (!po) return;

  const totalPoCost = po.total_amount || (po.qty * po.unit_price) || 0;
  const newPaidAmount = (po.paid_amount || 0) + parsedPaidAmt;

  if (newPaidAmount > totalPoCost) {
    return toast(`Total bayar (${fmtRp(newPaidAmount)}) melebihi total PO (${fmtRp(totalPoCost)})`, 'error');
  }
  if (payStatus === 'paid' && newPaidAmount < totalPoCost) {
    return toast(`Status Lunas tidak valid karena total bayar (${fmtRp(newPaidAmount)}) kurang dari total (${fmtRp(totalPoCost)})`, 'error');
  }

  const isFirstTimeReceiving = !po.actual_date && actualDate;
  if (!actualDate && po.actual_date) actualDate = po.actual_date;

  let isInFull = null;
  if (isInFullRaw !== '') isInFull = isInFullRaw === 'true';
  else if (po.is_in_full !== null) isInFull = po.is_in_full;

  const isOnTime = po.expected_date && actualDate ? new Date(actualDate) <= new Date(po.expected_date) : true;

  const { error } = await sb.from('wms_vendor_po').update({
    actual_date: actualDate || null,
    is_on_time: isOnTime,
    is_in_full: isInFull,
    payment_status: payStatus,
    paid_amount: newPaidAmount
  }).eq('id', poId);

  if (error) return toast('Gagal memperbarui PO: ' + error.message, 'error');

  // Auto-deduct Cash Flow if payment was made THIS TIME
  if (parsedPaidAmt > 0) {
    try {
      await sb.from('wms_finance_cash').insert({
        type: 'OUT',
        category: 'vendor',
        amount: parsedPaidAmt,
        notes: `Pembayaran PO ${po.po_number} - Vendor #${po.vendor_id}`,
        reference_id: poId
      });
    } catch (ce) { console.error('Cash deduct error', ce); }
  }

  // AUTO-INBOUND STOK (Opsi A) hanya jika ini penerimaan pertama kali
  if (isFirstTimeReceiving) {
    const allMats = { ...MATERIAL_META, ...(S.customRM || {}) };
    if (po.material && allMats[po.material]) {
      if (S.rm[po.material] === undefined) S.rm[po.material] = 0;
      S.rm[po.material] += parseFloat(po.qty) || 0;

      if (po.unit_price > 0) S.rmCost[po.material] = po.unit_price;

      S.log.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'inbound',
        item: po.material,
        qty: parseFloat(po.qty) || 0,
        balance: S.rm[po.material],
        notes: `Dari PO: ${po.po_number}`
      });

      await saveState();
    }
  }

  await loadPOs();
  await recalculateVendorOTIF(po.vendor_id);

  const vendorPos = ALL_POS.filter(p => p.vendor_id === po.vendor_id);
  const totalPaid = vendorPos.reduce((s, p) => s + (p.paid_amount || 0), 0);
  await sb.from('wms_vendors').update({ total_paid: totalPaid }).eq('id', po.vendor_id);

  toast(`PO diproses!${isFirstTimeReceiving ? (isOnTime ? ' OTIF: ✓ On Time' : ' OTIF: ✗ Terlambat') : ''}`, 'success');
  closeModal('modal-receive-po');

  renderPendingPOs();
  renderPoHistory();
  // Call Finance renderers safely in case we are in Finance tab
  if (window.renderFinInvoices) renderFinInvoices();
  if (window.renderFinCash) renderFinCash();
}

async function recalculateVendorOTIF(vendorId) {
  const vendorPos = ALL_POS.filter(p => p.vendor_id === vendorId && p.actual_date);
  if (!vendorPos.length) return;

  const totalScore = vendorPos.reduce((score, p) => {
    if (p.is_on_time && p.is_in_full) return score + 1; // 100%
    if (p.is_on_time || p.is_in_full) return score + 0.5; // 50%
    return score; // 0%
  }, 0);

  const otifRate = (totalScore / vendorPos.length) * 100;

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
  const totalUnpaid = ALL_POS.reduce((s, p) => s + ((p.total_amount || 0) - (p.paid_amount || 0)), 0);
  const totalPartial = ALL_POS.filter(p => p.payment_status === 'partial').reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalPaidAll = ALL_POS.reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalAll = ALL_POS.reduce((s, p) => s + (p.total_amount || 0), 0);

  const el = id => document.getElementById(id);
  if (el('po-total-unpaid')) el('po-total-unpaid').textContent = fmtRp(totalUnpaid);
  if (el('po-total-partial')) el('po-total-partial').textContent = fmtRp(totalPartial);
  if (el('po-total-paid')) el('po-total-paid').textContent = fmtRp(totalPaidAll);
  if (el('po-total-all')) el('po-total-all').textContent = fmtRp(totalAll);

  // Also update finance menu - vendor costs & AP
  if (el('fin-vendor-cost')) el('fin-vendor-cost').textContent = fmtRp(totalAll);
  if (el('fin-ap-unpaid')) el('fin-ap-unpaid').textContent = fmtRp(totalUnpaid);
  if (el('fin-ap-partial')) el('fin-ap-partial').textContent = fmtRp(totalPartial);
  if (el('fin-ap-total')) el('fin-ap-total').textContent = fmtRp(totalAll);

  if (!pos.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#B08A62;padding:24px;">Belum ada transaksi</td></tr>';
    return;
  }

  tbody.innerHTML = pos.map(p => {
    const vendorName = p.wms_vendors?.name || `Vendor #${p.vendor_id}`;
    const dateStr = new Date(p.created_at).toLocaleDateString('id-ID');
    const payCls = { paid: 'pay-paid', unpaid: 'pay-unpaid', partial: 'pay-partial' }[p.payment_status] || 'pay-unpaid';
    const payLabel = { paid: 'Lunas', unpaid: 'Belum Bayar', partial: 'Sebagian' }[p.payment_status] || p.payment_status;

    let otifHtml = '—';
    if (p.actual_date) {
      const ok = p.is_on_time && p.is_in_full;
      const partialOk = p.is_on_time || p.is_in_full;
      otifHtml = `<span class="otif-badge ${ok ? 'otif-good' : partialOk ? 'otif-ok' : 'otif-poor'}">${ok ? '✓ On Time' : partialOk ? '⚡ Partial' : '✗ Late'}</span>`;
    } else {
      otifHtml = '<span style="font-size:11px;color:#B08A62;">Pending</span>';
    }

    return `
      <tr>
        <td style="font-size:12px;color:#8B6F5E;">${dateStr}</td>
        <td style="font-size:12px;font-weight:600;color:#5C4A3C;">${sanitizeHtml(p.po_number)}</td>
        <td style="font-size:12px;">${sanitizeHtml(vendorName)}</td>
        <td style="font-size:12px;">${sanitizeHtml(p.material)}</td>
        <td style="text-align:right;font-weight:600;color:#2D1F17;">${fmtRp(p.total_amount || 0)}</td>
        <td style="text-align:center;">${otifHtml}</td>
        <td style="text-align:center;"><span class="pay-badge ${payCls}">${payLabel}</span></td>
        <td>
          ${!p.actual_date ? '<span style="font-size:11px;color:#8B6F5E;">Pending (Proses di Finance)</span>' : '<span style="font-size:11px;color:#8B6F5E;">Selesai</span>'}
        </td>
      </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   GOOGLE SHEETS PnL INTEGRATION
   ═══════════════════════════════════════════════════════ */

let PNL_DATA = null; // Parsed PnL data array (3 years x 12 months)
let CSV_URL = localStorage.getItem('pnl_csv_url') || '';
let isFetchingPnL = false;

async function fetchGoogleSheetsPnL(silent = false) {
  if (isFetchingPnL) return;
  const syncEl = document.getElementById('pnl-last-sync');

  if (!CSV_URL) {
    if (syncEl) syncEl.textContent = 'Menunggu URL CSV...';
    return;
  }

  isFetchingPnL = true;
  if (syncEl && !silent) syncEl.textContent = 'Menyinkronkan…';

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error('Network response was not ok');
    const text = await res.text();

    // Parse CSV manually
    const rows = text.split('\n').map(row => row.split(','));
    PNL_DATA = parsePnLCSV(rows);

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (syncEl) syncEl.textContent = `Auto-Sync: Aktif (Diperbarui ${now})`;
    localStorage.setItem('pnl_data', JSON.stringify(PNL_DATA));
    localStorage.setItem('pnl_sync', now);
    renderPnLMetrics();
    renderMktDashboard();
    if (!silent) toast('Data PnL berhasil disinkronkan dari Google Sheets ✓', 'success');
  } catch (e) {
    if (syncEl) syncEl.textContent = 'Auto-Sync: Gagal (Koneksi/Format)';
    console.error('CSV Fetch Error:', e);
    if (!silent) toast(e.message || 'Gagal mengambil data dari Google Sheets.', 'error');
  } finally {
    isFetchingPnL = false;
  }
}

function parsePnLCSV(rows) {
  // Helper to find row index dynamically based on label keywords
  function findRowIdx(keywords) {
    for (let i = 0; i < rows.length; i++) {
      const label = String(rows[i][0] || '').toLowerCase().trim();
      if (keywords.some(kw => label.includes(kw.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  }

  const rRev = findRowIdx(['total revenue']);
  const rHpp = findRowIdx(['total hpp tiap barang']);
  const rGm1 = findRowIdx(['gross margin 1']);
  const rMkt = findRowIdx(['- total marketing']);
  const rGm2 = findRowIdx(['gross margin 2']);
  const rLogistik = findRowIdx(['- total biaya logistik']);
  const rGm3 = findRowIdx(['gross margin 3']);
  const rNet = findRowIdx(['net profit']);

  if (rRev === -1 || rHpp === -1) {
    throw new Error('Format salah. Pastikan link adalah CSV dan memiliki baris "Total Revenue".');
  }

  function parseNum(val) {
    if (!val) return 0;
    const s = String(val).replace(/[Rp\s"]/g, '').replace(/\./g, '').replace(/\(/g, '-').replace(/\)/g, '');
    return parseFloat(s) || 0;
  }

  const result = [];
  for (let year = 0; year < 3; year++) {
    const yearData = [];
    for (let month = 0; month < 12; month++) {
      const colIdx = 1 + year * 12 + month;
      yearData.push({
        revenue: parseNum(rows[rRev]?.[colIdx]),
        hpp: parseNum(rows[rHpp]?.[colIdx]),
        gm1: parseNum(rows[rGm1]?.[colIdx]),
        marketing: parseNum(rows[rMkt]?.[colIdx]),
        logistik: parseNum(rows[rLogistik]?.[colIdx]),
        gm2: parseNum(rows[rGm2]?.[colIdx]),
        gm3: parseNum(rows[rGm3]?.[colIdx]),
        net: parseNum(rows[rNet]?.[colIdx])
      });
    }
    result.push(yearData);
  }
  return result;
}

function renderPnLMetrics() {
  if (!PNL_DATA) {
    const cached = localStorage.getItem('pnl_data');
    if (cached) {
      PNL_DATA = JSON.parse(cached);
      const syncTime = localStorage.getItem('pnl_sync');
      const syncEl = document.getElementById('pnl-last-sync');
      if (syncEl && syncTime) syncEl.textContent = `Auto-Sync: Aktif (Diperbarui ${syncTime})`;
    } else return;
  }

  const year = parseInt(document.getElementById('pnl-year-select')?.value || '0');
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
  set('pnl-marketing', d.marketing);
  set('pnl-logistik', d.logistik);

  const netEl = document.getElementById('pnl-net');
  if (netEl) netEl.style.color = d.net >= 0 ? '#86EFAC' : '#FCA5A5';
}

function renderMktDashboard() {
  if (!PNL_DATA) return;
  const year = parseInt(document.getElementById('mkt-year-select')?.value || '0');
  const month = parseInt(document.getElementById('mkt-month-select')?.value || '0');
  const d = PNL_DATA[year]?.[month];
  if (!d) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmtRp(Math.abs(val));
  };

  set('mkt-actual-mkt', d.marketing);
  set('mkt-actual-log', d.logistik);
}

window.updateSpreadsheetId = function (val) {
  if (!val) return;
  const url = val.trim().replace(/^['"]|['"]$/g, '').replace(/,+$/, ''); // Remove accidental quotes and trailing commas
  if (!url.startsWith('http')) {
    toast('Tautan tidak valid. Harus diawali dengan https://', 'error');
    return;
  }
  CSV_URL = url;
  localStorage.setItem('pnl_csv_url', CSV_URL);
  fetchGoogleSheetsPnL(false);
};

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

let pnlSyncInterval = null;

function startPnLSync() {
  // Set the input field to current ID
  const inputEl = document.getElementById('pnl-sheet-id');
  if (inputEl) inputEl.value = CSV_URL;

  // Fetch immediately
  fetchGoogleSheetsPnL(true);

  if (pnlSyncInterval) clearInterval(pnlSyncInterval);
  // Auto-sync every 10 seconds (10000 ms) in background silently
  pnlSyncInterval = setInterval(() => fetchGoogleSheetsPnL(true), 10000);
}

// Load POs and SKUs after auth
document.addEventListener('wms:ready', async () => {
  await loadSkus();
  await loadPOs();
  startPnLSync(); // Start background sync
});

// Also initialize on DOM ready (called manually after login)
window._postLoginInit = async () => {
  await loadSkus();
  await loadPOs();
  startPnLSync(); // Start background sync
};

/* ═══════════════════════════════════════════════════════
   HR MODULE
   ═══════════════════════════════════════════════════════ */

let HR_STAFF = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko'];
let HR_STAFF_DATA = [];

async function populateHrStaff() {
  const staffSelect = document.getElementById('hr-error-staff');
  const otSelect = document.getElementById('hr-ot-staff');

  if (sb) {
    try {
      const { data: staffData, error } = await sb.from('wms_hr_staff').select('*').eq('is_active', true);
      if (!error && staffData) {
        HR_STAFF_DATA = staffData;
        HR_STAFF = staffData.map(s => s.name);

        // For HR errors (still uses name)
        const errorOptions = staffData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        if (staffSelect) staffSelect.innerHTML = errorOptions;

        // For Overtime (needs ID and base_salary)
        const otOptions = staffData.map(s => `<option value="${s.id}" data-salary="${s.base_salary}" data-name="${s.name}">${s.name}</option>`).join('');
        if (otSelect) otSelect.innerHTML = otOptions;
        return;
      }
    } catch (e) { console.error('Gagal mengambil data staf:', e); }
  }

  // Fallback to local
  const options = HR_STAFF.map(s => `<option value="${s}">${s}</option>`).join('');
  if (staffSelect) staffSelect.innerHTML = options;
  if (otSelect) otSelect.innerHTML = options;
}

function switchHrTab(tabId) {
  document.querySelectorAll('.hr-tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('#page-hr .vendor-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`hrpanel-${tabId}`).classList.remove('hidden');
  document.getElementById(`hrtab-${tabId}`).classList.add('active');
  if (tabId === 'overtime') renderHrPayroll();
}

function saveHrError() {
  const staff = document.getElementById('hr-error-staff').value;
  const type = document.getElementById('hr-error-type').value;
  const resi = document.getElementById('hr-error-resi').value;
  const notes = document.getElementById('hr-error-notes').value;

  S.hr.errors.push({ id: Date.now(), ts: Date.now(), staff, type, resi, notes });
  saveState();
  renderHr();
  toast('Insiden Error berhasil dicatat', 'success');
}

async function saveHrOvertime() {
  const date = document.getElementById('hr-ot-date').value;
  const selectEl = document.getElementById('hr-ot-staff');
  const staffId = selectEl.value;
  const optionEl = selectEl.options[selectEl.selectedIndex];
  const staffName = optionEl ? (optionEl.getAttribute('data-name') || staffId) : staffId;
  const baseSalary = optionEl ? (parseFloat(optionEl.getAttribute('data-salary')) || 0) : 0;

  const hours = parseFloat(document.getElementById('hr-ot-hours').value) || 0;
  const notes = document.getElementById('hr-ot-notes').value;
  const isHoliday = document.getElementById('hr-ot-isholiday').checked;

  if (!date || !hours) {
    toast('Isi tanggal dan durasi lembur!', 'warn');
    return;
  }

  let amount = 0;
  if (baseSalary > 0) {
    const hourlyWage = baseSalary / 173;
    let remainingHours = hours;

    if (isHoliday) {
      if (remainingHours <= 8) {
        amount += remainingHours * 2 * hourlyWage;
      } else {
        amount += 8 * 2 * hourlyWage;
        remainingHours -= 8;
        if (remainingHours <= 1) {
          amount += remainingHours * 3 * hourlyWage;
        } else {
          amount += 1 * 3 * hourlyWage;
          remainingHours -= 1;
          amount += remainingHours * 4 * hourlyWage;
        }
      }
    } else {
      if (remainingHours <= 1) {
        amount += remainingHours * 1.5 * hourlyWage;
      } else {
        amount += 1 * 1.5 * hourlyWage;
        remainingHours -= 1;
        amount += remainingHours * 2 * hourlyWage;
      }
    }
  }

  if (sb && optionEl && optionEl.hasAttribute('data-salary')) {
    try {
      const { error } = await sb.from('wms_hr_overtimes').insert({
        ts: Date.now(),
        date: date,
        staff: staffName,
        staff_id: staffId,
        hours: hours,
        notes: notes,
        amount: amount,
        status: 'approved',
        is_holiday: isHoliday
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      toast('Gagal sinkronisasi lembur ke cloud', 'warn');
      return;
    }
  }

  S.hr.overtimes.push({ id: Date.now(), ts: Date.now(), date, staff: staffName, hours, notes, isHoliday, amount });
  saveState();
  renderHrPayroll();
  toast('Lembur berhasil dicatat' + (sb ? ' dan disinkronisasi' : ''), 'success');
}

function renderHr() {
  const tbody = document.getElementById('hr-error-tbody');
  const statsDiv = document.getElementById('hr-error-stats');
  if (!tbody || !statsDiv) return;

  const errors = S.hr.errors || [];

  // Render Stats
  const staffErrors = {};
  errors.forEach(e => {
    staffErrors[e.staff] = (staffErrors[e.staff] || 0) + 1;
  });

  if (Object.keys(staffErrors).length === 0) {
    statsDiv.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:24px 0;">Belum ada insiden tercatat.</div>';
  } else {
    statsDiv.innerHTML = Object.entries(staffErrors).sort((a, b) => b[1] - a[1]).map(([staff, count]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#FEF2F2;border-radius:8px;">
        <span style="font-size:13px;font-weight:600;color:#991B1B;">👤 ${staff}</span>
        <span style="font-size:13px;font-weight:700;color:#7F1D1D;">${count} Insiden</span>
      </div>
    `).join('');
  }

  // Render Table
  if (errors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#B08A62;padding:24px;">Belum ada riwayat error.</td></tr>';
  } else {
    tbody.innerHTML = [...errors].reverse().slice(0, 50).map(e => `
      <tr>
        <td style="font-size:12px;color:#8B6F5E;">${fmtDateShort(e.ts)}</td>
        <td style="font-size:13px;font-weight:600;color:#2D1F17;">${sanitizeHtml(e.staff)}</td>
        <td style="font-size:13px;color:#991B1B;">${sanitizeHtml(e.type)}</td>
        <td style="font-size:12px;">${sanitizeHtml(e.resi || '-')}</td>
        <td style="font-size:12px;color:#5C4A3C;">${sanitizeHtml(e.notes || '-')}</td>
      </tr>
    `).join('');
  }
}

function renderHrPayroll() {
  const tbody = document.getElementById('hr-payroll-tbody');
  if (!tbody) return;

  const monthVal = document.getElementById('hr-payroll-month').value; // YYYY-MM
  const baseRate = parseFloat(document.getElementById('hr-base-rate').value) || 100000;
  const workingDays = 22; // Assumed 22 working days per bulan

  if (!monthVal) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#B08A62;padding:24px;">Pilih Bulan Kerja terlebih dahulu.</td></tr>';
    return;
  }

  const filteredOt = (S.hr.overtimes || []).filter(ot => ot.date && ot.date.startsWith(monthVal));

  tbody.innerHTML = HR_STAFF.map(staff => {
    const sData = HR_STAFF_DATA.find(d => d.name === staff);
    const monthlySalary = sData ? parseFloat(sData.base_salary) : (baseRate * workingDays);
    const hourlyWage = monthlySalary / 173;

    const staffOts = filteredOt.filter(ot => ot.staff === staff);
    let totalOtHours = 0;
    let otTotal = 0;

    staffOts.forEach(ot => {
      totalOtHours += ot.hours;

      if (ot.amount !== undefined) {
        otTotal += ot.amount;
      } else {
        let remainingHours = ot.hours;
        if (ot.isHoliday) {
          // Asumsi 5 Hari Kerja (PP 35/2021)
          if (remainingHours <= 8) {
            otTotal += remainingHours * 2 * hourlyWage;
          } else {
            otTotal += 8 * 2 * hourlyWage;
            remainingHours -= 8;
            if (remainingHours <= 1) {
              otTotal += remainingHours * 3 * hourlyWage;
            } else {
              otTotal += 1 * 3 * hourlyWage;
              remainingHours -= 1;
              otTotal += remainingHours * 4 * hourlyWage;
            }
          }
        } else {
          // Hari Kerja biasa (PP 35/2021)
          if (remainingHours <= 1) {
            otTotal += remainingHours * 1.5 * hourlyWage;
          } else {
            otTotal += 1 * 1.5 * hourlyWage;
            remainingHours -= 1;
            otTotal += remainingHours * 2 * hourlyWage;
          }
        }
      }
    });

    const baseTotal = monthlySalary;
    return `
      <tr>
        <td style="font-weight:600;color:#2D1F17;">${staff}</td>
        <td style="text-align:center;">${workingDays}</td>
        <td style="text-align:center;">${totalOtHours}</td>
        <td style="text-align:right;">${fmtRp(baseTotal)}</td>
        <td style="text-align:right;">${fmtRp(otTotal)}</td>
        <td style="text-align:right;font-weight:700;color:#166534;">${fmtRp(baseTotal + otTotal)}</td>
      </tr>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   MARKETING MODULE
   ═══════════════════════════════════════════════════════ */

function switchMkTab(tabId) {
  document.querySelectorAll('.hr-tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('#page-marketing .vendor-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`mkpanel-${tabId}`).classList.remove('hidden');
  document.getElementById(`mktab-${tabId}`).classList.add('active');
  if (tabId === 'budget') renderMktDashboard();
}

function renderMarketing() {
  // Render KPI values into inputs
  if (S.marketing.kpi) {
    const kpi = S.marketing.kpi;
    const el = id => document.getElementById(id);
    if (el('mk-kpi-roas')) el('mk-kpi-roas').value = kpi.roas || '';
    if (el('mk-kpi-cac')) el('mk-kpi-cac').value = kpi.cac || '';
    if (el('mk-kpi-ltv')) el('mk-kpi-ltv').value = kpi.ltv || '';
    if (el('mk-kpi-reach')) el('mk-kpi-reach').value = kpi.reach || '';
    if (el('mk-kpi-growth')) el('mk-kpi-growth').value = kpi.growth || '';
  }

  // Render PR list
  const prTbody = document.getElementById('mk-pr-tbody');
  if (prTbody) {
    if (!S.marketing.pr || S.marketing.pr.length === 0) {
      prTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#B08A62;padding:24px;">Belum ada data Partnership & PR.</td></tr>';
    } else {
      prTbody.innerHTML = [...S.marketing.pr].reverse().map(pr => `
        <tr>
          <td style="font-size:12px;color:#8B6F5E;">${pr.date || '-'}</td>
          <td style="font-size:13px;font-weight:600;">${sanitizeHtml(pr.name)}</td>
          <td style="font-size:13px;">${sanitizeHtml(pr.type)}</td>
          <td style="font-size:12px;">${sanitizeHtml(pr.notes)}</td>
        </tr>
      `).join('');
    }
  }

  // Render Calendar
  const calList = document.getElementById('mk-calendar-list');
  if (calList) {
    if (!S.marketing.calendar || S.marketing.calendar.length === 0) {
      calList.innerHTML = '<div style="text-align:center;color:#B08A62;font-size:13px;padding:24px 0;">Belum ada agenda di Kalender Campaign.</div>';
    } else {
      calList.innerHTML = [...S.marketing.calendar].reverse().map(cal => `
        <div style="padding:12px;background:#FAF7F2;border-radius:8px;border:1px solid #F2EAE0;border-left:4px solid #D0B898;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <div style="font-weight:600;font-size:14px;">${sanitizeHtml(cal.title)}</div>
            <div style="font-size:11px;color:#8B6F5E;font-family:monospace;">${cal.start} ${cal.end ? '- ' + cal.end : ''}</div>
          </div>
          <div style="font-size:12px;color:#5C4A3C;display:flex;justify-content:space-between;">
             <span>${sanitizeHtml(cal.type)}</span>
             <span>👤 PIC: ${sanitizeHtml(cal.pic || '-')}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

function saveMkBudget() {
  const category = document.getElementById('mk-budget-category').value;
  const month = document.getElementById('mk-budget-month').value;
  const amount = parseFloat(document.getElementById('mk-budget-amount').value) || 0;

  if (!month || !amount) {
    toast('Pilih bulan dan isi nilai budget!', 'warn');
    return;
  }

  S.marketing.budgets.push({ id: Date.now(), ts: Date.now(), category, month, amount });
  saveState();
  toast('Alokasi budget berhasil disimpan', 'success');
}

function saveMkKpi() {
  S.marketing.kpi = {
    roas: parseFloat(document.getElementById('mk-kpi-roas').value) || 0,
    cac: parseFloat(document.getElementById('mk-kpi-cac').value) || 0,
    ltv: parseFloat(document.getElementById('mk-kpi-ltv').value) || 0,
    reach: parseFloat(document.getElementById('mk-kpi-reach').value) || 0,
    growth: parseFloat(document.getElementById('mk-kpi-growth').value) || 0
  };
  saveState();
  toast('KPI Digital berhasil diperbarui', 'success');
}

function openMkCalendarModal() {
  openModal('modal-mk-calendar');
}

window.renderCarryingCost = function () {
  const rateInput = document.getElementById('fin-carrying-rate');
  if (!rateInput) return;
  const rateAnnual = parseFloat(rateInput.value) || 0;
  const rateMonthly = rateAnnual / 100 / 12;

  // Calculate total inventory value
  let totalValue = 0;
  const valEl = document.getElementById('fin-inventory-value');
  if (valEl) {
    // A rough approximation if actual valuasi is not yet rendered fully, 
    // but typically `renderFinancial()` handles inventory valuasi.
    // We'll calculate it from S directly
    if (S.rm) {
      // Rough estimate mapping, or we could use `TOTAL_VALUATION` global if we had one.
      // The actual values are in renderFinancial() using `getValuation`.
    }
  }

  // Just rely on the previously calculated total from renderFinancial
  const totalValuationStr = document.getElementById('fin-inventory-value')?.innerText || '';
  // parse Rp X.XXX.XXX from text if exists
  const match = totalValuationStr.match(/Total:\s*Rp\s*([\d\.]+)/i);
  if (match) {
    const totalVal = parseFloat(match[1].replace(/\./g, ''));
    const monthlyCost = totalVal * rateMonthly;
    document.getElementById('fin-carrying-cost').textContent = fmtRp(monthlyCost);
  }
};

// We need to inject renderCarryingCost into renderFinancial as well so it updates automatically
const oldRenderFinancial = window.renderFinancial || function () { };
window.renderFinancial = function () {
  oldRenderFinancial();
  setTimeout(renderCarryingCost, 100); // wait for fin-inventory-value to populate
};


function saveMkCalendarAgenda() {
  const title = document.getElementById('mk-cal-title').value;
  const type = document.getElementById('mk-cal-type').value;
  const start = document.getElementById('mk-cal-start').value;
  const end = document.getElementById('mk-cal-end').value;
  const pic = document.getElementById('mk-cal-pic').value;

  if (!title || !start) {
    toast('Judul dan tanggal mulai wajib diisi!', 'warn');
    return;
  }

  S.marketing.calendar.push({ id: Date.now(), title, type, start, end, pic });
  saveState();
  closeModal('modal-mk-calendar');
  renderMarketing();
  toast('Agenda berhasil ditambahkan', 'success');

  // Clear modal inputs
  document.getElementById('mk-cal-title').value = '';
  document.getElementById('mk-cal-start').value = '';
  document.getElementById('mk-cal-end').value = '';
  document.getElementById('mk-cal-pic').value = '';
}

function saveMkPr() {
  const name = document.getElementById('mk-pr-name').value;
  const type = document.getElementById('mk-pr-type').value;
  const date = document.getElementById('mk-pr-date').value;
  const notes = document.getElementById('mk-pr-notes').value;

  if (!name) {
    toast('Nama Partner / Event wajib diisi!', 'warn');
    return;
  }

  S.marketing.pr.push({ id: Date.now(), name, type, date, notes });
  saveState();
  renderMarketing();
  toast('Data PR & Partnership berhasil disimpan', 'success');

  // Clear inputs
  document.getElementById('mk-pr-name').value = '';
  document.getElementById('mk-pr-date').value = '';
  document.getElementById('mk-pr-notes').value = '';
}

/* =====================================================================
 * FINANCE MODULE ADDITIONS (TAB: PRICING, INVOICES, PAYROLL, CASH)
 * ===================================================================== */

function calculateFgHpp(fgKey) {
  let totalHpp = 0;
  const recipe = PRODUCTION_RECIPES[fgKey];
  if (!recipe) return 0;

  for (const rm in recipe) {
    const qty = recipe[rm];
    if (rm === '_fg') {
      for (const subFg in qty) {
        totalHpp += calculateFgHpp(subFg) * qty[subFg];
      }
    } else {
      const rmHpp = S.rmCost[rm] || 0;
      totalHpp += rmHpp * qty;
    }
  }
  return totalHpp;
}

// --- TAB: PRICING ---
async function renderFinProducts() {
  const tbody = document.getElementById('fin-pricing-list');
  if (!tbody) return;

  let html = '';
  for (const fgKey in FINISHED_GOODS) {
    const fgMeta = FINISHED_GOODS[fgKey];
    // Find sku in ALL_SKUS
    const s = ALL_SKUS.find(x => x.product_type === fgKey);
    const skuCode = s ? s.sku : '-';
    const sellPrice = s ? (s.sell_price || 0) : 0;
    const hpp = s ? (s.cost_price || 0) : 0; // Baca HPP dari database Supabase

    html += `<tr>
      <td>${skuCode}</td>
      <td>${fgMeta.label}</td>
      <td>Produk Jadi</td>
      <td>${fmtRp(hpp)}</td>
      <td><input type="number" class="form-input" id="fin-price-${fgKey}" value="${sellPrice}" style="width:120px"></td>
      <td><button class="btn-primary" onclick="updateFinProductPrice('${fgKey}')">Simpan</button></td>
    </tr>`;
  }

  if (!html) html = '<tr><td colspan="6" style="text-align:center">Tidak ada data produk jadi.</td></tr>';
  tbody.innerHTML = html;
}

window.updateFinProductPrice = async function (fgKey) {
  const newPrice = parseFloat(document.getElementById(`fin-price-${fgKey}`).value) || 0;
  try {
    const { error } = await sb.from('wms_products_sku').update({ sell_price: newPrice }).eq('product_type', fgKey);
    if (error) throw error;
    toast('Harga berhasil diupdate!', 'success');
    await loadSkus(); // Refresh ALL_SKUS
    renderFinProducts();
  } catch (e) {
    console.error(e);
    toast('Gagal update harga: ' + e.message, 'warn');
  }
};

// --- TAB: INVOICES (AP) ---
async function renderFinInvoices() {
  const tbody = document.getElementById('fin-invoice-list');
  const dispTotal = document.getElementById('fin-total-ap-display');
  if (!tbody) return;

  try {
    const { data: pos, error } = await sb.from('wms_vendor_po').select('*, wms_vendors(name)').or('payment_status.in.(unpaid,partial),actual_date.is.null').order('created_at', { ascending: false });
    if (error) throw error;

    let html = '';
    let totalAp = 0;

    (pos || []).forEach(po => {
      const unpaid = po.total_amount - (po.paid_amount || 0);
      totalAp += unpaid;
      const vendorName = po.wms_vendors?.name || `Vendor #${po.vendor_id}`;
      html += `<tr>
        <td>${po.po_number}</td>
        <td>${vendorName}</td>
        <td>${po.material} (${po.qty})</td>
        <td>${fmtRp(po.total_amount)}</td>
        <td>${fmtRp(po.paid_amount || 0)}</td>
        <td><span class="status-badge status-${po.payment_status}">${po.payment_status.toUpperCase()}</span></td>
        <td><button class="btn-secondary" onclick="openReceivePoModal('${po.id}')">Terima & Bayar</button></td>
      </tr>`;
    });
    if (!html) html = '<tr><td colspan="7" style="text-align:center">Tidak ada tagihan/PO tertunda.</td></tr>';
    tbody.innerHTML = html;
    if (dispTotal) dispTotal.innerText = fmtRp(totalAp);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Gagal memuat invoice.</td></tr>';
  }
}



// --- TAB: PAYROLL ---
async function renderFinPayroll() {
  const tbody = document.getElementById('fin-payroll-list');
  const mInput = document.getElementById('fin-payroll-month');
  if (!tbody || !mInput) return;

  if (!mInput.value) {
    const now = new Date();
    mInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }
  const month = mInput.value;

  try {
    const { data: pr, error } = await sb.from('wms_hr_payroll').select('*, wms_hr_staff(name, role)').eq('month', month);
    if (error) throw error;

    let html = '';
    (pr || []).forEach(p => {
      html += `<tr>
        <td>${p.wms_hr_staff?.name || '-'}</td>
        <td>${p.wms_hr_staff?.role || '-'}</td>
        <td>${fmtRp(p.base_salary)}</td>
        <td>${fmtRp(p.overtime_pay)}</td>
        <td>${fmtRp(p.deductions)}</td>
        <td><strong>${fmtRp(p.net_pay)}</strong></td>
        <td><span class="status-badge status-${p.status}">${p.status.toUpperCase()}</span></td>
        <td>
          ${p.status === 'unpaid'
          ? `<button class="btn-primary" onclick="paySalary('${p.id}', '${p.wms_hr_staff?.name}', ${p.net_pay})">Bayar</button>`
          : `<span style="font-size:11px;color:#8B6F5E">Lunas</span>`
        }
        </td>
      </tr>`;
    });
    if (!html) html = '<tr><td colspan="8" style="text-align:center">Belum ada data payroll untuk bulan ini. Klik Hitung.</td></tr>';
    tbody.innerHTML = html;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Gagal memuat payroll.</td></tr>';
  }
}

window.generatePayrollAutomated = async function () {
  const month = document.getElementById('fin-payroll-month').value;
  if (!month) return toast('Pilih bulan dulu', 'warn');

  try {
    const { data: staff, error: eStaff } = await sb.from('wms_hr_staff').select('*').eq('is_active', true);
    if (eStaff) throw eStaff;

    // Hitung lembur bulan ini
    const { data: overtimes, error: eOv } = await sb.from('wms_hr_overtimes').select('*')
      .gte('date', month + '-01').lte('date', month + '-31').eq('status', 'approved');

    let insertCount = 0;
    for (const s of staff) {
      // Cek apa payroll sudah ada
      const { data: exist } = await sb.from('wms_hr_payroll').select('id').eq('staff_id', s.id).eq('month', month).single();
      if (exist) continue; // Skip jika sudah digenerate

      // Hitung Overtimes Pay untuk staff ini
      let ovPay = 0;
      if (overtimes) {
        ovPay = overtimes.filter(o => o.staff_id === s.id).reduce((sum, curr) => sum + (parseFloat(curr.amount) || 0), 0);
      }

      const netPay = s.base_salary + ovPay;

      await sb.from('wms_hr_payroll').insert({
        staff_id: s.id,
        month: month,
        base_salary: s.base_salary,
        overtime_pay: ovPay,
        deductions: 0,
        net_pay: netPay,
        status: 'unpaid'
      });
      insertCount++;
    }
    toast(`Berhasil generate ${insertCount} payroll baru`, 'success');
    renderFinPayroll();
  } catch (e) {
    console.error(e);
    toast('Gagal generate: ' + e.message, 'warn');
  }
}

window.paySalary = async function (payroll_id, staffName, amount) {
  if (!confirm(`Bayar gaji ${staffName} sebesar ${fmtRp(amount)} dan catat ke Kas?`)) return;

  try {
    const { error: errUpd } = await sb.from('wms_hr_payroll').update({
      status: 'paid', paid_at: new Date().toISOString()
    }).eq('id', payroll_id);
    if (errUpd) throw errUpd;

    // Catat ke Buku Kas (OUT)
    await sb.from('wms_finance_cash').insert({
      type: 'OUT',
      category: 'payroll',
      amount: amount,
      notes: `Gaji ${staffName}`,
      reference_id: payroll_id
    });

    toast('Gaji berhasil dibayar & tercatat di Buku Kas!', 'success');
    renderFinPayroll();
  } catch (e) {
    console.error(e);
    toast('Gagal memproses gaji: ' + e.message, 'warn');
  }
}

// --- TAB: BUKU KAS ---
async function renderFinCash() {
  const tbody = document.getElementById('fin-cash-list');
  if (!tbody) return;

  try {
    const { data: cashList, error } = await sb.from('wms_finance_cash').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;

    let html = '';
    let totalCash = 0;

    cashList.forEach(c => {
      const isOut = c.type === 'OUT';
      html += `<tr>
        <td>${new Date(c.date).toLocaleDateString('id-ID')}</td>
        <td><span class="status-badge" style="background:${isOut ? '#FEE2E2' : '#DCFCE7'};color:${isOut ? '#991B1B' : '#166534'};">${c.type}</span></td>
        <td>${c.category}</td>
        <td>${c.notes || '-'}</td>
        <td style="text-align:right;color:${isOut ? '#991B1B' : '#166534'}">${isOut ? '-' : '+'}${fmtRp(c.amount)}</td>
      </tr>`;
    });

    // Kalkulasi total saldo kas (semua history, tidak hanya limit 200)
    const { data: allCash, error: errAll } = await sb.from('wms_finance_cash').select('type, amount');
    if (!errAll && allCash) {
      allCash.forEach(c => {
        if (c.type === 'IN') totalCash += parseFloat(c.amount);
        else totalCash -= parseFloat(c.amount);
      });
      const balEl = document.getElementById('fin-cash-balance');
      if (balEl) balEl.innerText = fmtRp(totalCash);
    }

    if (!html) html = '<tr><td colspan="5" style="text-align:center">Belum ada riwayat kas.</td></tr>';
    tbody.innerHTML = html;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Gagal memuat kas.</td></tr>';
  }
}

window.addCashTransaction = async function () {
  const type = document.getElementById('fin-cash-type').value;
  const category = document.getElementById('fin-cash-category').value;
  const amount = parseFloat(document.getElementById('fin-cash-amount').value);
  const notes = document.getElementById('fin-cash-notes').value;

  if (!category || !amount) return toast('Kategori dan Nominal wajib diisi!', 'warn');

  try {
    const { error } = await sb.from('wms_finance_cash').insert({
      type, category, amount, notes, date: new Date().toISOString().split('T')[0]
    });
    if (error) throw error;

    toast('Transaksi manual berhasil ditambahkan', 'success');
    document.getElementById('fin-cash-category').value = '';
    document.getElementById('fin-cash-amount').value = '';
    document.getElementById('fin-cash-notes').value = '';
    renderFinCash();
  } catch (e) {
    console.error(e);
    toast('Gagal tambah transaksi kas: ' + e.message, 'warn');
  }
};


