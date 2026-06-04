import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/utils/requireAdmin";
import { sendLowInventoryAlertEmail, LowStockEmailItem } from "@/backend/utils/mailer";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const lowItems: LowStockEmailItem[] = Array.isArray(body?.lowItems) ? body.lowItems : [];
    const outItems: LowStockEmailItem[] = Array.isArray(body?.outItems) ? body.outItems : [];
    const threshold: number = typeof body?.threshold === "number" ? body.threshold : 15;

    if (lowItems.length === 0 && outItems.length === 0) {
      return NextResponse.json({ message: "No low-stock items; nothing to send." });
    }

    // Recipient: configurable via env, falls back to the sending account
    const recipient = process.env.CSR_ALERT_EMAIL || process.env.EMAIL_USER;
    if (!recipient) {
      return NextResponse.json(
        { error: "No alert recipient configured (set CSR_ALERT_EMAIL or EMAIL_USER)." },
        { status: 500 },
      );
    }

    const sent = await sendLowInventoryAlertEmail(recipient, lowItems, outItems, threshold);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send alert email." }, { status: 500 });
    }

    return NextResponse.json({ message: "Low inventory alert email sent.", recipient });
  } catch (error) {
    console.error("Error sending low inventory alert:", error);
    return NextResponse.json({ error: "Failed to process alert." }, { status: 500 });
  }
}
