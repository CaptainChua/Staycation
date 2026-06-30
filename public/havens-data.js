/* ============================================================
   SHARED HAVEN DATA
   ------------------------------------------------------------
   These are the default havens. Once you edit them in the
   Admin Dashboard, your changes are saved in the browser and
   used everywhere (home page + haven detail page).
   ============================================================ */

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

const STORAGE_KEY = "staycation_havens";

function loadHavens() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved).filter(h => !h.deleted);   // soft-deleted havens stay on the server, hidden here
        } catch (e) {
            console.warn("Could not read saved havens, using defaults.");
        }
    }
    return DEFAULT_HAVENS.map(h => ({ ...h }));
}

function saveHavens(havens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(havens));
}

function getHaven(id) {
    return loadHavens().find(h => String(h.id) === String(id));
}

function resetHavens() {
    localStorage.removeItem(STORAGE_KEY);
}
