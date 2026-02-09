import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const extractSpreadsheetId = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("docs.google.com/spreadsheets")) {
    const match = trimmed.match(/\/spreadsheets\/d\/([^/\s?&#]+)/i);
    return match?.[1]?.trim() || null;
  }

  return trimmed;
};

export async function GET() {
  try {
    const spreadsheetIdRaw = process.env.SPREADSHEET_ID || "";
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdRaw);

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: "Missing SPREADSHEET_ID in environment variables." },
        { status: 500 }
      );
    }

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
