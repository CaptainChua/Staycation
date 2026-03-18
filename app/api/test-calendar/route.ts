import { NextResponse } from "next/server";
import { google } from "googleapis";
import { parsePrivateKey } from "../../../backend/utils/googleCalendar";

export async function POST() {
  const diagnostics: Record<string, unknown> = {};

  try {
    // --- Step 1: Check env vars ---
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    diagnostics.hasClientEmail = !!clientEmail;
    diagnostics.clientEmail = clientEmail ?? "(missing)";
    diagnostics.hasPrivateKey = !!privateKeyRaw;
    diagnostics.privateKeyPreview = privateKeyRaw
      ? `${privateKeyRaw.slice(0, 40)}...`
      : "(missing)";
    diagnostics.hasCalendarId = !!calendarId;
    diagnostics.calendarId = calendarId ?? "(missing)";

    if (!clientEmail || !privateKeyRaw || !calendarId) {
      return NextResponse.json({
        success: false,
        error: "One or more required env vars are missing.",
        diagnostics,
      });
    }

    const privateKey = parsePrivateKey(privateKeyRaw);
    diagnostics.privateKeyContainsBegin = privateKey.includes("-----BEGIN PRIVATE KEY-----");
    diagnostics.privateKeyContainsEnd = privateKey.includes("-----END PRIVATE KEY-----");
    diagnostics.privateKeyLineCount = privateKey.split("\n").length;

    // --- Step 2: Auth ---
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });

    diagnostics.authCreated = true;

    // --- Step 3: Create calendar client ---
    const calendar = google.calendar({ version: "v3", auth });
    diagnostics.calendarClientCreated = true;

    // --- Step 4: Insert test event ---
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 86400000 * 2);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const event = {
      summary: "[DEBUG] Staycation Calendar Test",
      description: "This is a debug test event. Safe to delete.",
      start: {
        dateTime: `${fmt(tomorrow)}T14:00:00+08:00`,
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: `${fmt(dayAfter)}T11:00:00+08:00`,
        timeZone: "Asia/Manila",
      },
    };

    diagnostics.eventPayload = event;

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    diagnostics.googleResponseStatus = response.status;
    diagnostics.eventId = response.data.id;

    return NextResponse.json({
      success: true,
      eventId: response.data.id,
      diagnostics,
    });
  } catch (err: unknown) {
    const e = err as Record<string, unknown> & { message?: string; response?: { data?: unknown; status?: number } };
    diagnostics.errorMessage = e.message ?? "Unknown error";
    diagnostics.googleErrorData = e.response?.data ?? null;
    diagnostics.googleErrorStatus = e.response?.status ?? null;

    return NextResponse.json({
      success: false,
      error: e.message ?? "Unknown error",
      diagnostics,
    });
  }
}

