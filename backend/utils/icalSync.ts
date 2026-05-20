import pool from "@/backend/config/db";

// node-ical pulls in deps that use BigInt at module load and crash Next.js's
// build-time module evaluation. Import it lazily inside the function instead.
type IcalAsync = { fromURL: (url: string) => Promise<Record<string, unknown>> };
type IcalModule = { async: IcalAsync; default?: { async: IcalAsync } };
let _icalPromise: Promise<IcalAsync> | null = null;
const getIcal = (): Promise<IcalAsync> => {
  if (!_icalPromise) {
    _icalPromise = import("node-ical").then((m) => {
      const mod = m as unknown as IcalModule;
      return mod.async ?? mod.default!.async;
    });
  }
  return _icalPromise;
};

export interface ICalFeedRow {
  id: string;
  haven_id: string;
  source: string;
  url: string;
}

export interface ICalSyncResult {
  feed_id: string;
  haven_id: string;
  source: string;
  ok: boolean;
  events_imported: number;
  events_removed: number;
  error?: string;
}

// Normalize an ICAL-style date to YYYY-MM-DD (date-only) for our blocked_dates schema.
const toYmd = (d: Date | string): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Pull and parse one iCal feed, upsert its VEVENTs into blocked_dates,
 * and prune any previously-imported events that are no longer in the feed.
 */
export async function syncOneFeed(feed: ICalFeedRow): Promise<ICalSyncResult> {
  const out: ICalSyncResult = {
    feed_id: feed.id,
    haven_id: feed.haven_id,
    source: feed.source,
    ok: false,
    events_imported: 0,
    events_removed: 0,
  };

  try {
    // Fetch + parse (lazy-load node-ical to avoid build-time module evaluation crash)
    const icalAsync = await getIcal();
    const parsed = await icalAsync.fromURL(feed.url);

    // Collect just the VEVENT entries (node-ical returns a flat map of varying types)
    const events: Array<{
      uid: string;
      start: Date;
      end: Date;
      summary: string;
    }> = [];

    for (const key of Object.keys(parsed)) {
      const ev = (parsed as Record<string, unknown>)[key] as {
        type?: string;
        uid?: string;
        start?: Date;
        end?: Date;
        summary?: string;
      };
      if (!ev || ev.type !== "VEVENT") continue;
      if (!ev.uid || !ev.start || !ev.end) continue;
      events.push({
        uid: String(ev.uid),
        start: ev.start,
        end: ev.end,
        summary: String(ev.summary || ""),
      });
    }

    // Upsert each event
    const seenUids = new Set<string>();
    for (const ev of events) {
      seenUids.add(ev.uid);
      // iCal DTEND for date-only events is exclusive (the morning of checkout). We
      // store from/to inclusive, so we subtract one day from end if it's later than start.
      let endDate = ev.end;
      if (endDate.getTime() > ev.start.getTime() + 86_400_000) {
        endDate = new Date(endDate.getTime() - 86_400_000);
      }
      const fromYmd = toYmd(ev.start);
      const toYmdStr = toYmd(endDate);

      await pool.query(
        `INSERT INTO blocked_dates
           (haven_id, from_date, to_date, reason, block_type, external_source, external_uid, external_summary, synced_at, created_at)
         VALUES ($1, $2, $3, $4, 'imported_external', $5, $6, $7, NOW(), NOW())
         ON CONFLICT (haven_id, external_source, external_uid)
         WHERE external_source IS NOT NULL AND external_uid IS NOT NULL
         DO UPDATE SET
           from_date = EXCLUDED.from_date,
           to_date = EXCLUDED.to_date,
           reason = EXCLUDED.reason,
           external_summary = EXCLUDED.external_summary,
           synced_at = NOW()`,
        [
          feed.haven_id,
          fromYmd,
          toYmdStr,
          `${ev.summary || "Reserved"} (via ${feed.source})`,
          feed.source,
          ev.uid,
          ev.summary,
        ]
      );
      out.events_imported += 1;
    }

    // Prune previously-imported events that are no longer in the feed
    // (so cancellations on Airbnb free up the dates on our calendar)
    const existing = await pool.query<{ external_uid: string }>(
      `SELECT external_uid FROM blocked_dates
       WHERE haven_id = $1 AND external_source = $2 AND external_uid IS NOT NULL`,
      [feed.haven_id, feed.source]
    );
    const toRemove = existing.rows
      .map((r) => r.external_uid)
      .filter((uid) => !seenUids.has(uid));
    if (toRemove.length > 0) {
      await pool.query(
        `DELETE FROM blocked_dates
         WHERE haven_id = $1 AND external_source = $2 AND external_uid = ANY($3::text[])`,
        [feed.haven_id, feed.source, toRemove]
      );
      out.events_removed = toRemove.length;
    }

    // Stamp success on the feed config
    await pool.query(
      `UPDATE haven_ical_feeds
         SET last_synced_at = NOW(),
             last_status = 'ok',
             last_error = NULL,
             last_event_count = $1
       WHERE id = $2`,
      [out.events_imported, feed.id]
    );

    out.ok = true;
    return out;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    out.error = msg;
    await pool.query(
      `UPDATE haven_ical_feeds
         SET last_synced_at = NOW(),
             last_status = 'error',
             last_error = $1
       WHERE id = $2`,
      [msg.slice(0, 500), feed.id]
    );
    return out;
  }
}

/**
 * Sync every active feed in the database. Used by the cron job.
 */
export async function syncAllActiveFeeds(): Promise<ICalSyncResult[]> {
  const feeds = await pool.query<ICalFeedRow>(
    `SELECT id, haven_id, source, url FROM haven_ical_feeds WHERE is_active = TRUE`
  );
  // Run sequentially to avoid hammering external services. Feeds are small (~one per haven per source).
  const results: ICalSyncResult[] = [];
  for (const feed of feeds.rows) {
    const r = await syncOneFeed(feed);
    results.push(r);
  }
  return results;
}

/**
 * Build the iCal export for one haven — combines internal bookings + blocked_dates
 * so external platforms can import OUR availability.
 */
export async function buildHavenIcalExport(havenId: string): Promise<string> {
  // Pull blocked ranges + active bookings
  const blocks = await pool.query<{
    id: string;
    from_date: string;
    to_date: string;
    reason: string | null;
    block_type: string;
  }>(
    `SELECT id::text, from_date::text, to_date::text, reason, block_type
     FROM blocked_dates
     WHERE haven_id = $1 AND to_date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY from_date`,
    [havenId]
  );
  const bookings = await pool.query<{
    booking_uuid: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
  }>(
    `SELECT booking_uuid::text, check_in_date::text, check_out_date::text, status
     FROM booking
     WHERE haven_id = $1
       AND status IN ('approved','confirmed','checked-in','completed')
       AND check_out_date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY check_in_date`,
    [havenId]
  );

  const fmtDate = (ymd: string) => ymd.replace(/-/g, "");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Staycation Haven//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const b of blocks.rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:block-${b.id}@staycationhaven`);
    lines.push(`DTSTART;VALUE=DATE:${fmtDate(b.from_date)}`);
    // iCal DTEND is exclusive — add one day so the block covers through end of to_date
    const endDate = new Date(`${b.to_date}T00:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${fmtDate(endDate.toISOString().slice(0, 10))}`);
    lines.push(`SUMMARY:${b.reason || (b.block_type === "maintenance" ? "Maintenance" : "Blocked")}`);
    lines.push("END:VEVENT");
  }

  for (const b of bookings.rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:booking-${b.booking_uuid}@staycationhaven`);
    lines.push(`DTSTART;VALUE=DATE:${fmtDate(b.check_in_date)}`);
    lines.push(`DTEND;VALUE=DATE:${fmtDate(b.check_out_date)}`);
    lines.push(`SUMMARY:Reserved (Staycation)`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
