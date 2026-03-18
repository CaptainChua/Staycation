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
  payment_method?: string;
  payment_proof_url?: string;
  total_amount?: number;
  down_payment?: number;
  adults?: number;
  children?: number;
  infants?: number;
}

export const createCalendarEvent = async (bookingData: CalendarEventData): Promise<string | null> => {
  try {
    console.log(`📅 [CALENDAR] Starting calendar event creation for booking: ${bookingData.booking_id}`);

    const auth = getGoogleCalendarAuth();
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      const err = "Missing GOOGLE_CALENDAR_ID in environment variables.";
      console.error(`❌ [CALENDAR] ${err}`);
      throw new Error(err);
    }

    console.log(`📅 [CALENDAR] Calendar ID validated: ${calendarId}`);
    console.log(`📅 [CALENDAR] Auth configured successfully`);

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
      payment_method,
      payment_proof_url,
      total_amount,
      down_payment,
      adults,
      children,
      infants,
    } = bookingData;

    // Default times if not provided
    const inTime = check_in_time || "14:00";
    const outTime = check_out_time || "11:00";

    // Handle 10-hour stay checkout to next day edge cases if needed, but normally time is supplied correctly.
    const inDateOnly = String(check_in_date).split('T')[0];
    const outDateOnly = String(check_out_date).split('T')[0];

    const startDateTimeStr = `${inDateOnly}T${inTime}:00+08:00`;
    const endDateTimeStr = `${outDateOnly}T${outTime}:00+08:00`;

    // Build detailed description with all booking information
    const descriptionLines = [
      "===== BOOKING INFORMATION =====",
      `Booking ID: ${booking_id}`,
      `Status: ${status.toUpperCase()}`,
      "",
      "===== GUEST DETAILS =====",
      `Guest: ${guest_first_name} ${guest_last_name}`,
      `Email: ${guest_email}`,
      `Phone: ${guest_phone}`,
      `Guests: ${adults || 0} Adult(s), ${children || 0} Child(ren), ${infants || 0} Infant(s)`,
      "",
      "===== ACCOMMODATION =====",
      `Room: ${room_name}`,
      stay_type ? `Stay Type: ${stay_type}` : "",
      `Check-in: ${inDateOnly} at ${inTime}`,
      `Check-out: ${outDateOnly} at ${outTime}`,
      "",
      "===== PAYMENT INFORMATION =====",
      `Total Amount: ₱${total_amount ? total_amount.toFixed(2) : "N/A"}`,
      `Down Payment: ₱${down_payment ? down_payment.toFixed(2) : "N/A"}`,
      `Payment Method: ${payment_method || "Not specified"}`,
      payment_proof_url ? `Payment Proof: ${payment_proof_url}` : "Payment Proof: Pending",
    ];

    const description = descriptionLines.filter(line => line !== "").join("\n");

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

    console.log(`✅ [CALENDAR] Google Calendar event created successfully. Event ID: ${response.data.id}`);
    return response.data.id || null;
  } catch (error: any) {
    console.error("❌ [CALENDAR] Error creating Google Calendar event for booking:", bookingData.booking_id);

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error(`❌ [CALENDAR] Network error - Cannot reach Google APIs. Check your internet connection.`);
      console.error(`   Error: ${error.message}`);
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      console.error(`❌ [CALENDAR] Authentication failed (${error.response.status})`);
      console.error(`   This usually means your Google credentials are invalid or expired.`);
      console.error(`   Verify: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY_CALENDAR, and GOOGLE_CALENDAR_ID`);
    } else if (error.response?.status === 404) {
      console.error(`❌ [CALENDAR] Calendar not found (404)`);
      console.error(`   Check that GOOGLE_CALENDAR_ID is correct: ${process.env.GOOGLE_CALENDAR_ID}`);
    } else if (error.response?.data) {
      console.error(`❌ [CALENDAR] Google API Error (${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`❌ [CALENDAR] ${error.message || String(error)}`);
    }

    return null; // Return null so booking flow isn't entirely blocked if calendar fails
  }
};
