/* ============================================================
   STAYCATION HAVEN PH — SERVER-SIDE DATA STORE
   ------------------------------------------------------------
   A tiny persistent key/value store backed by a JSON file.
   It mirrors the localStorage keys the front-end already uses,
   so every existing page keeps working — the data just lives on
   the server now (shared across all devices) instead of in one
   browser. Replace this file with a real database later and the
   rest of the app is unchanged.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

/* ---- Defaults (same values the old browser scripts shipped) ---- */
const DEFAULT_HAVENS = [
  {
    id: 1,
    name: "Haven 1",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    gallery: [],
    price: "₱2,500 / night",
    description: "Perfect for couples and small families.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "❄️ Air Conditioning", "🛏️ Comfortable Beds"]
  },
  {
    id: 2,
    name: "Haven 2",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    gallery: [],
    price: "₱3,200 / night",
    description: "Modern city-view staycation.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "🚗 Parking", "🍳 Kitchen"]
  },
  {
    id: 3,
    name: "Casa Bienca",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200",
    gallery: [],
    price: "₱5,000 / night",
    description: "Luxury experience with premium amenities.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "❄️ Air Conditioning", "🚗 Parking", "🍳 Kitchen", "🛏️ Comfortable Beds"]
  }
];

const DEFAULT_SETTINGS = {
  pricing: {
    stay6: 999, stay10: 1599, stay21Weekday: 1799, stay21Weekend: 2099,
    longWeekday: 1699, longWeekend: 1899, holidayNight: 2099, holidayDayUse: 1799,
    deposit: 1000, includedPax: 2, addPax: 300, poolRegular: 150, poolHoliday: 300,
    extraHour: 150, towelRate: 50, towelMaxPerPax: 2, maxDays: 14,
    offer6: true, offer10: true, offer21: true
  },
  customAddons: [],
  downpayment: [
    { maxDays: 2, amount: 500 },
    { maxDays: 4, amount: 1000 },
    { maxDays: 8, amount: 2000 },
    { maxDays: 14, amount: 4000 }
  ],
  payment: {
    intro: "Kindly send your payment here po 😊",
    screenshotNote: "PLEASE SEND A SCREENSHOT AFTER PAYMENT PO.",
    warnNote: "Please be noted po: no payment = no reservation. Thank you ❤️",
    cashNote: "Please prepare the downpayment in cash upon check-in.",
    methods: [
      { name: "GCash", number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
      { name: "Maya", number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
      { name: "BDO", number: "010940093073", account: "Pia Carla Salamat", qr: "" }
    ]
  }
};

// The shared business keys that live on the server. Per-session keys
// (current_user, dashboard_page, the pending/confirmed booking handoff,
// UI filters) stay in the browser and are NOT listed here.
const SHARED_KEYS = [
  "staycation_havens",
  "shph_settings",
  "shph_bookings_v3",
  "shph_staff_v1",
  "shph_bills_v1",
  "shph_cleaning_v1",
  "shph_users",
  "shph_activity_log"
];

function defaults() {
  return {
    staycation_havens: DEFAULT_HAVENS,
    shph_settings: DEFAULT_SETTINGS,
    shph_bookings_v3: [],
    shph_staff_v1: [],
    shph_bills_v1: [],
    shph_cleaning_v1: [],
    shph_users: [],
    shph_activity_log: []
  };
}

let cache = null;

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    cache = JSON.parse(raw);
  } catch (e) {
    cache = defaults();
    persist();
  }
  // make sure any newly-added key exists
  const d = defaults();
  let changed = false;
  for (const k of SHARED_KEYS) {
    if (!(k in cache)) { cache[k] = d[k]; changed = true; }
  }
  if (changed) persist();
  return cache;
}

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE); // atomic-ish swap
}

module.exports = {
  SHARED_KEYS,
  isShared: (key) => SHARED_KEYS.includes(key),
  // return every shared key/value (used to seed each page)
  all() {
    const c = ensureLoaded();
    const out = {};
    for (const k of SHARED_KEYS) out[k] = c[k];
    return out;
  },
  get(key) {
    const c = ensureLoaded();
    return c[key];
  },
  set(key, value) {
    const c = ensureLoaded();
    c[key] = value;
    persist();
    return value;
  },
  remove(key) {
    const c = ensureLoaded();
    delete c[key];
    persist();
  }
};
