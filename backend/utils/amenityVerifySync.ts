import pool from "@/backend/config/db";

// Mirror of the frontend AMENITIES_LIST. When a partner toggles a built-in
// amenity ON, we need a stable label + category to seed the verification row.
const BUILTIN_AMENITIES: Record<string, { label: string; category: string }> = {
  wifi:            { label: "WiFi",              category: "Essential" },
  airConditioning: { label: "Air conditioning",  category: "Essential" },
  poolAccess:      { label: "Pool access",       category: "Luxury" },
  netflix:         { label: "Netflix",           category: "Essential" },
  kitchen:         { label: "Kitchen",           category: "Essential" },
  parking:         { label: "Parking",           category: "Essential" },
  ps4:             { label: "PS4",               category: "Luxury" },
  balcony:         { label: "Balcony",           category: "Comfort" },
  washerDryer:     { label: "Washer/Dryer",      category: "Comfort" },
  glowBed:         { label: "Glow Bed",          category: "Luxury" },
  tv:              { label: "TV",                category: "Essential" },
  towels:          { label: "Towels",            category: "Essential" },
};

interface CustomAmenityMeta {
  id: string;
  label: string;
  iconKey?: string;
  iconUrl?: string;
  category?: string;
}

type AmenitiesShape = Record<string, unknown> & { _custom?: CustomAmenityMeta[] };

interface SyncOptions {
  /**
   * When true, removes verification rows for amenities the partner has toggled OFF
   * (and which weren't yet verified). Verified amenities stay even if toggled off
   * so the admin keeps a history; the public filter is the gate.
   */
  pruneToggledOff?: boolean;
}

/**
 * Reconcile haven_amenity_verifications rows against the haven's amenities JSONB.
 * - For each currently-true amenity that lacks a row → insert (status: 'pending').
 * - For amenities that already have a row, do nothing (preserve status / media).
 * - For toggled-off amenities, optionally delete pending/revision rows.
 */
export async function syncAmenityVerifications(
  havenId: string,
  amenities: AmenitiesShape | undefined,
  opts: SyncOptions = {}
): Promise<void> {
  if (!havenId || !amenities || typeof amenities !== "object") return;

  // Collect the set of amenity keys the partner currently has toggled ON
  const enabledKeys = new Set<string>();
  const meta: Record<string, { label: string; iconKey?: string; iconUrl?: string; category: string }> = {};

  for (const [key, value] of Object.entries(amenities)) {
    if (key === "_custom") continue;
    if (value !== true) continue;
    enabledKeys.add(key);
    const builtin = BUILTIN_AMENITIES[key];
    if (builtin) {
      meta[key] = { label: builtin.label, category: builtin.category };
    }
  }

  // Layer in custom amenities (label/icon/category come from the _custom array)
  const customArr = Array.isArray(amenities._custom) ? amenities._custom : [];
  for (const c of customArr) {
    if (!c?.id) continue;
    if (amenities[c.id] !== true) continue;
    enabledKeys.add(c.id);
    meta[c.id] = {
      label: c.label || "Custom amenity",
      iconKey: c.iconKey,
      iconUrl: c.iconUrl,
      category: c.category || "Custom",
    };
  }

  // Read existing rows for this haven so we know which to insert / which to skip / which to prune
  const existing = await pool.query<{ amenity_key: string; status: string }>(
    `SELECT amenity_key, status FROM haven_amenity_verifications WHERE haven_id = $1`,
    [havenId]
  );
  const existingByKey = new Map(existing.rows.map((r) => [r.amenity_key, r.status]));

  // INSERT new rows for enabled amenities without a verification row
  for (const key of enabledKeys) {
    if (existingByKey.has(key)) continue;
    const m = meta[key];
    if (!m) continue; // unknown amenity key — skip rather than insert garbage
    await pool.query(
      `INSERT INTO haven_amenity_verifications
         (haven_id, amenity_key, amenity_label, amenity_icon_key, amenity_icon_url, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       ON CONFLICT (haven_id, amenity_key) DO NOTHING`,
      [havenId, key, m.label, m.iconKey || null, m.iconUrl || null, m.category]
    );
  }

  // Optional: prune rows for amenities the partner toggled OFF, but only if they
  // haven't been verified yet (verified ones we keep for audit).
  if (opts.pruneToggledOff) {
    const existingKeys = Array.from(existingByKey.keys());
    const toPrune = existingKeys.filter(
      (k) => !enabledKeys.has(k) && existingByKey.get(k) !== "verified"
    );
    if (toPrune.length > 0) {
      await pool.query(
        `DELETE FROM haven_amenity_verifications
         WHERE haven_id = $1 AND amenity_key = ANY($2::text[]) AND status <> 'verified'`,
        [havenId, toPrune]
      );
    }
  }
}
