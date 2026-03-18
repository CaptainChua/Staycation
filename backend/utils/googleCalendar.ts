import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

/**
 * Robustly parses GOOGLE_PRIVATE_KEY from .env regardless of how it was stored.
 * Handles: escaped \\n, JSON-quoted strings, literal newlines, missing headers.
 */
export const parsePrivateKey = (raw: string): string => {
  let key = raw.trim();

  // If the whole thing is wrapped in JSON quotes (e.g. "-----BEGIN...-----")
  if (key.startsWith('"') && key.endsWith('"')) {
    try {
      key = JSON.parse(key);
    } catch { }
  }

  // Replace literal \n text sequences with actual newlines
  key = key.replace(/\\n/g, "\n");

  // If the key still has no real newlines, it might be a single-line base64 blob
  // Try to reconstruct proper PEM by inserting newlines every 64 chars between headers
  if (!key.includes("\n")) {
    const beginMatch = key.match(/(-----BEGIN[^-]+-----)/);
    const endMatch = key.match(/(-----END[^-]+-----)/);
    if (beginMatch && endMatch) {
      const begin = beginMatch[1];
      const end = endMatch[1];
      const body = key.slice(begin.length, key.lastIndexOf("-----END")).trim();
      const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
      key = `${begin}\n${wrapped}\n${end}`;
    }
  }

  return key;
};

export const getGoogleCalendarAuth = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY_CALENDAR;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing Google Calendar credentials in environment variables.");
  }

  const privateKey = parsePrivateKey(privateKeyRaw);

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
};

export interface CalendarEventData {
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  booking_id: string;
  status: string;
  stay_type?: string;
}

export const createCalendarEvent = async (bookingData: CalendarEventData): Promise<string | null> => {
  try {
    const auth = getGoogleCalendarAuth();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      throw new Error("Missing GOOGLE_CALENDAR_ID in environment variables.");
    }

    const {
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      booking_id,
      status,
      stay_type,
    } = bookingData;

    // Default times if not provided
    const inTime = check_in_time || "14:00";
    const outTime = check_out_time || "11:00";

    // Handle 10-hour stay checkout to next day edge cases if needed, but normally time is supplied correctly.
    const inDateOnly = String(check_in_date).split('T')[0];
    const outDateOnly = String(check_out_date).split('T')[0];

    const startDateTimeStr = `${inDateOnly}T${inTime}:00+08:00`;
    const endDateTimeStr = `${outDateOnly}T${outTime}:00+08:00`;

    const description = `
Booking ID: ${booking_id}
Guest: ${guest_first_name} ${guest_last_name}
Email: ${guest_email}
Phone: ${guest_phone}
Status: ${status}
Room: ${room_name}
${stay_type ? `Stay Type: ${stay_type}` : ""}
    `.trim();

    console.log(`📅 Preparing to create Google Calendar event for booking ${booking_id}`);
    console.log(`📅 Event details: Starts ${startDateTimeStr}, Ends ${endDateTimeStr}`);

    const event = {
      summary: `Booking: ${room_name} - ${guest_first_name} ${guest_last_name}`,
      description,
      start: {
        dateTime: startDateTimeStr,
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: "Asia/Manila",
      },
      // Color coding: pending (yellowish/orange), approved/confirmed (green), else default
      colorId: status === "pending" ? "5" : status === "confirmed" || status === "approved" ? "2" : "1",
    };

    console.log("📅 Requesting calendar insertion with payload:", JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log(`✅ Google Calendar event created successfully. Event ID: ${response.data.id}`);
    return response.data.id || null;
  } catch (error: any) {
    console.error("❌ Error creating Google Calendar event:");
    if (error.response?.data) {
      console.error("Google API Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    return null; // Return null so booking flow isn't entirely blocked if calendar fails
  }
};
