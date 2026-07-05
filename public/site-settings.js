/* ============================================================
   SHARED SITE SETTINGS
   ------------------------------------------------------------
   Rates, add-ons and payment details for the public booking
   flow. Edit them from the Admin Dashboard (Booking & Rates /
   Payments pages); changes are saved in the browser and used
   by havens.html, booknow.html and payment.html.
   ============================================================ */

const SETTINGS_KEY = "shph_settings";

const DEFAULT_SETTINGS = {
    pricing: {
        stay6: 999,
        stay10: 1599,
        stay21Weekday: 1799,   // Sun–Thu
        stay21Weekend: 2099,   // Fri/Sat
        longWeekday: 1699,     // 3+ nights, Sun–Thu
        longWeekend: 1899,     // 3+ nights, Fri/Sat
        holidayNight: 2099,    // overnight night on a holiday
        holidayDayUse: 1799,   // 6–10h day-use on a holiday
        deposit: 1000,
        includedPax: 2,        // base rate covers this many pax
        addPax: 300,           // per extra pax
        poolRegular: 150,      // pool pass per pax (regular days)
        poolHoliday: 300,      // pool pass per pax (holidays)
        extraHour: 150,        // per additional hour
        towelRate: 50,         // towel rent each
        towelMaxPerPax: 2,     // towels allowed per pax
        maxDays: 14,           // longest allowed booking
        offer6: true,          // show 6-hour option on the website
        offer10: true,         // show 10-hour option
        offer21: true          // show 21-hour / overnight option
    },
    // extra add-ons the owner can offer (beyond pool pass / hours / towels)
    customAddons: [],          // [{ name, price, perPax }]
    // promotions shown on the website ([{ title, desc, discount, type, code, active }])
    promos: [],
    // editable copy for the public homepage (index.html) — managed on the dashboard's "Website" page
    site: {
        heroEyebrow: "Comfortable · Affordable · Memorable",
        heroTitle: "Your quiet escape above Panay Ave.",
        heroSubtitle: "Thoughtfully styled units at Mplace Tower D, Quezon City — from ₱999 a night.",
        heroHavenId: "",                 // "" = feature the first live haven
        promoEyebrow: "Limited promo",
        promoTitle: "Stay 3 nights, get the 4th on us — book direct this month.",
        promoButton: "See all promos",
        footerTagline: "Mplace Tower D, Panay Ave, Quezon City. Comfortable, affordable and memorable staycations.",
        footerEmail: "staycationhavenph@gmail.com",
        instagram: "",
        facebook: "",
        tiktok: ""
    },
    downpayment: [
        { maxDays: 2,  amount: 500 },    // 1–2 days
        { maxDays: 4,  amount: 1000 },   // 3–4 days
        { maxDays: 8,  amount: 2000 },   // 5–8 days
        { maxDays: 14, amount: 4000 }    // 9–14 days
    ],
    payment: {
        intro: "Kindly send your payment here po 😊",
        screenshotNote: "PLEASE SEND A SCREENSHOT AFTER PAYMENT PO.",
        warnNote: "Please be noted po: no payment = no reservation. Thank you ❤️",
        cashNote: "Please prepare the downpayment in cash upon check-in.",
        // each method: { name, number, account, qr (uploaded image data URL) }
        methods: [
            { name: "GCash", number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
            { name: "Maya",  number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
            { name: "BDO",   number: "010940093073", account: "Pia Carla Salamat", qr: "" }
        ]
    }
};

// merge saved settings over the defaults so new fields always exist
function mergeSettings(base, saved){
    const out = Array.isArray(base) ? base.slice() : {};
    for(const k in base){
        if(base[k] && typeof base[k] === "object" && !Array.isArray(base[k])){
            out[k] = mergeSettings(base[k], (saved && saved[k]) || {});
        } else {
            out[k] = (saved && saved[k] !== undefined) ? saved[k] : base[k];
        }
    }
    return out;
}

function loadSettings(){
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if(saved){
            const merged = mergeSettings(DEFAULT_SETTINGS, saved);
            // migrate older payment data (fixed GCash/Maya/BDO fields) → methods array
            const sp = saved.payment || {};
            if(!Array.isArray(sp.methods)){
                merged.payment.methods = [
                    { name:"GCash", number: sp.gcashMayaNumber || "", account: sp.gcashMayaName || "", qr: sp.gcashQr || "" },
                    { name:"Maya",  number: sp.gcashMayaNumber || "", account: sp.gcashMayaName || "", qr: sp.mayaQr || "" },
                    { name:"BDO",   number: sp.bdoNumber || "", account: sp.bdoName || "", qr: sp.bdoQr || "" }
                ];
            }
            return merged;
        }
    } catch(e){ /* fall through to defaults */ }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function resetSettings(){ localStorage.removeItem(SETTINGS_KEY); }
