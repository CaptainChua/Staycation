import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import jsPDF from "jspdf";

// ─── Shared palette ──────────────────────────────────────────────────────────
const PRIMARY: [number, number, number] = [184, 134, 11];
const PRIMARY_DARK: [number, number, number] = [139, 101, 8];
const PRIMARY_SOFT: [number, number, number] = [245, 222, 179];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [33, 33, 33];
const GRAY: [number, number, number] = [107, 114, 128];
const LIGHT_GRAY: [number, number, number] = [249, 250, 251];
const GREEN: [number, number, number] = [34, 139, 34];
const RED: [number, number, number] = [220, 53, 69];

export interface RentableItem {
  id?: number;
  name: string;
  icon?: string;
  price_per_night: number;
}

// Optional grouped structure for the pamphlet. When provided, the PDF
// renders items grouped under category headers instead of a flat list.
export interface AddOnCategory {
  id?: string;
  name: string;
  icon?: string;
  items: RentableItem[];
}

export interface ReceiptData {
  bookingId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  roomName?: string;
  stayType?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  guests?: string;
  adults?: number;
  children?: number;
  infants?: number;
  numberOfNights?: number;
  roomRate?: number;
  securityDeposit?: number;
  addOnsTotal?: number;
  totalAmount: string | number;
  downPayment: string | number;
  remainingBalance?: string | number;
  paymentMethod?: string;
}

// ─── Receipt PDF ─────────────────────────────────────────────────────────────

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const qr = await QRCode.toDataURL(data.bookingId, {
    width: 300,
    margin: 1,
    color: { dark: "#B8860B", light: "#FFFFFF" },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const cw = pageWidth - margin * 2;
  let y = margin;

  // Header
  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, pageWidth, 60, "F");
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("STAYCATION", margin, 16);
  pdf.setFontSize(26);
  pdf.setFont("helvetica", "bold");
  pdf.text("Haven", margin, 28);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Your Perfect Getaway Awaits", margin, 38);

  if (qr) {
    const qrSize = 32;
    const qrX = pageWidth - margin - qrSize;
    pdf.setFillColor(...WHITE);
    pdf.roundedRect(qrX - 3, 5, qrSize + 6, qrSize + 6, 2, 2, "F");
    pdf.addImage(qr, "PNG", qrX, 8, qrSize, qrSize);
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text("SCAN FOR CHECK-IN", qrX + qrSize / 2, 8 + qrSize + 8, { align: "center" });
  }

  pdf.setFillColor(...WHITE);
  pdf.roundedRect(margin, 48, 45, 14, 2, 2, "F");
  pdf.setTextColor(...PRIMARY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("OFFICIAL RECEIPT", margin + 22.5, 57, { align: "center" });

  y = 72;

  // Info bar
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.rect(margin, y, cw, 10, "F");
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Receipt #: ${data.bookingId}`, margin + 4, y + 7);
  pdf.text(
    `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth - margin - 4,
    y + 7,
    { align: "right" },
  );
  y += 18;

  // Guest info
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("GUEST INFORMATION", margin, y);
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y + 1.5, margin + 40, y + 1.5);
  y += 10;

  const col2 = pageWidth / 2 + 5;
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Guest Name", margin, y);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${data.firstName} ${data.lastName || ""}`, margin, y + 5);
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Email Address", col2, y);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.email || "N/A", col2, y + 5);
  y += 14;

  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Phone Number", margin, y);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.phone || "N/A", margin, y + 5);

  const adults = data.adults ?? 1;
  const children = data.children ?? 0;
  const infants = data.infants ?? 0;
  const guestSummary =
    data.guests ||
    `${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}${infants > 0 ? `, ${infants} Infant${infants > 1 ? "s" : ""}` : ""}`;
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Number of Guests", col2, y);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(guestSummary, col2, y + 5);
  y += 16;

  // Booking details card
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("BOOKING DETAILS", margin, y);
  pdf.setDrawColor(...PRIMARY);
  pdf.line(margin, y + 1.5, margin + 38, y + 1.5);
  y += 8;

  pdf.setFillColor(...PRIMARY_SOFT);
  pdf.roundedRect(margin, y, cw, 32, 2, 2, "F");
  const cp = 6;
  const cy = y + cp;

  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("ROOM", margin + cp, cy + 2);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(11);
  pdf.text(data.roomName || "N/A", margin + cp, cy + 9);
  if (data.stayType) {
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.stayType, margin + cp, cy + 15);
  }

  const dx1 = margin + cw / 3;
  const dx2 = margin + (cw / 3) * 2;
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.2);
  pdf.line(dx1, y + 4, dx1, y + 28);
  pdf.line(dx2, y + 4, dx2, y + 28);

  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("CHECK-IN", dx1 + 8, cy + 2);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.checkInDate || "N/A", dx1 + 8, cy + 9);
  if (data.checkInTime) {
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(8);
    pdf.text(data.checkInTime, dx1 + 8, cy + 15);
  }

  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("CHECK-OUT", dx2 + 8, cy + 2);
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.checkOutDate || "N/A", dx2 + 8, cy + 9);
  if (data.checkOutTime) {
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(8);
    pdf.text(data.checkOutTime, dx2 + 8, cy + 15);
  }

  pdf.setTextColor(...GRAY);
  pdf.setFontSize(7);
  pdf.text(`Booking ID: ${data.bookingId}`, margin + cp, y + 26);
  y += 40;

  // Payment summary
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("PAYMENT SUMMARY", margin, y);
  pdf.setDrawColor(...PRIMARY);
  pdf.line(margin, y + 1.5, margin + 40, y + 1.5);
  y += 8;

  const rh = 8;
  pdf.setFillColor(...PRIMARY);
  pdf.rect(margin, y, cw, rh, "F");
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("Description", margin + 4, y + 5.5);
  pdf.text("Amount", pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += rh;

  const total = typeof data.totalAmount === "string" ? parseFloat(data.totalAmount) : (data.totalAmount ?? 0);
  const down = typeof data.downPayment === "string" ? parseFloat(data.downPayment) : (data.downPayment ?? 0);
  const balance =
    data.remainingBalance != null
      ? typeof data.remainingBalance === "string"
        ? parseFloat(data.remainingBalance)
        : data.remainingBalance
      : total - down;

  pdf.setFillColor(...WHITE);
  pdf.rect(margin, y, cw, rh, "F");
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Total Amount", margin + 4, y + 5.5);
  pdf.text(`₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += rh;

  pdf.setFillColor(...LIGHT_GRAY);
  pdf.rect(margin, y, cw, rh, "F");
  pdf.setTextColor(...BLACK);
  pdf.text("Down Payment (Paid)", margin + 4, y + 5.5);
  pdf.setTextColor(...GREEN);
  pdf.setFont("helvetica", "bold");
  pdf.text(`- ₱${down.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += rh;

  pdf.setFillColor(...WHITE);
  pdf.rect(margin, y, cw, rh, "F");
  pdf.setTextColor(...BLACK);
  pdf.setFont("helvetica", "normal");
  pdf.text("Remaining Balance (Due at Check-in)", margin + 4, y + 5.5);
  const bc: [number, number, number] = balance > 0 ? RED : GREEN;
  pdf.setTextColor(...bc);
  pdf.setFont("helvetica", "bold");
  pdf.text(`₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += rh + 2;

  pdf.setFillColor(...PRIMARY_SOFT);
  pdf.roundedRect(margin, y, cw, 16, 2, 2, "F");
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("AMOUNT PAID", margin + 4, y + 10);
  pdf.setTextColor(...PRIMARY);
  pdf.setFontSize(13);
  pdf.text(`₱${down.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 10, { align: "right" });

  const isPaid = balance <= 0;
  const statusText = isPaid ? "FULLY PAID" : "PARTIALLY PAID";
  const sc: [number, number, number] = isPaid ? GREEN : [255, 165, 0];
  pdf.setFillColor(...sc);
  const bw = 35;
  pdf.roundedRect(pageWidth - margin - bw, y + 1, bw, 8, 2, 2, "F");
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.text(statusText, pageWidth - margin - bw / 2, y + 6, { align: "center" });
  y += 26;

  if (data.paymentMethod) {
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Payment Method: ${data.paymentMethod === "gcash" ? "GCash" : "Bank Transfer"}`,
      margin,
      y,
    );
    y += 8;
  }

  // Notes
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.roundedRect(margin, y, cw, 28, 2, 2, "F");
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("Important Notes:", margin + 4, y + 6);
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("• Please present this receipt and a valid ID during check-in.", margin + 4, y + 12);
  pdf.text("• Standard check-in: 2:00 PM | Standard check-out: 12:00 PM", margin + 4, y + 17);
  pdf.text("• Security deposit will be refunded upon check-out if no damages.", margin + 4, y + 22);

  // Footer
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.8);
  pdf.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
  pdf.setTextColor(...PRIMARY);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Thank you for choosing Staycation Haven!", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("This is a computer-generated receipt. No signature required.", pageWidth / 2, pageHeight - 9, { align: "center" });

  return Buffer.from(pdf.output("arraybuffer"));
}

// ─── Pamphlet PDF ─────────────────────────────────────────────────────────────

export interface PamphletData {
  guestName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingId: string;
  // Legacy flat list — kept for back-compat with callers that haven't moved to categories.
  rentableItems: RentableItem[];
  // Optional grouped form. When present + non-empty, the pamphlet renders by category.
  categories?: AddOnCategory[];
  // Owner / front-desk contact number rendered in the "How to request" card.
  // When omitted, a placeholder is shown.
  contactPhone?: string;
  // Owner / front-desk contact email rendered alongside the phone. When
  // omitted, falls back to the platform default.
  contactEmail?: string;
}

export async function generatePamphletPDF(data: PamphletData): Promise<Buffer> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth  = pdf.internal.pageSize.getWidth();  // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
  const margin = 18;
  const cw = pageWidth - margin * 2; // 174 mm

  // ── Page background ──────────────────────────────────────────────────────
  pdf.setFillColor(252, 248, 242);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // ── Header ───────────────────────────────────────────────────────────────
  const HEADER_H = 56;
  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, pageWidth, HEADER_H, "F");
  pdf.setFillColor(210, 168, 45); // top shimmer stripe
  pdf.rect(0, 0, pageWidth, 3, "F");
  pdf.setFillColor(...PRIMARY_SOFT); // bottom separator
  pdf.rect(0, HEADER_H - 1.5, pageWidth, 2, "F");

  // ── Logo upper-left ──────────────────────────────────────────────────────
  let logoBase64: string | null = null;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "haven_logo.png"));
    logoBase64 = buf.toString("base64");
  } catch { /* no logo — skip */ }

  const LOGO_SIZE = 38;
  const LOGO_X    = margin;
  const LOGO_Y    = (HEADER_H - LOGO_SIZE) / 2;

  if (logoBase64) {
    pdf.setFillColor(...WHITE);
    pdf.circle(LOGO_X + LOGO_SIZE / 2, LOGO_Y + LOGO_SIZE / 2, LOGO_SIZE / 2 + 2.5, "F");
    pdf.addImage(`data:image/png;base64,${logoBase64}`, "PNG", LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
  }

  // Hotel name — right of logo
  const TXT_X = logoBase64 ? LOGO_X + LOGO_SIZE + 9 : margin;
  const TXT_Y = LOGO_Y + 5;
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("STAYCATION", TXT_X, TXT_Y);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("Haven", TXT_X, TXT_Y + 12);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...PRIMARY_SOFT);
  pdf.text("Your Perfect Getaway Awaits", TXT_X, TXT_Y + 21);

  // Pamphlet badge — far right of header
  const BDGW = 52, BDGH = 18;
  const BDGX = pageWidth - margin - BDGW;
  const BDGY = (HEADER_H - BDGH) / 2;
  pdf.setFillColor(...PRIMARY_SOFT);
  pdf.roundedRect(BDGX, BDGY, BDGW, BDGH, 3, 3, "F");
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("GUEST PAMPHLET",    BDGX + BDGW / 2, BDGY + 7,    { align: "center" });
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "normal");
  pdf.text("RENTABLE ITEMS GUIDE", BDGX + BDGW / 2, BDGY + 13.5, { align: "center" });

  let y = HEADER_H + 11;

  // ── Guest info card ──────────────────────────────────────────────────────
  //
  // Layout (left-to-right, after the 4.5 mm gold strip):
  //   col1: GUEST NAME   col2: ROOM   col3: CHECK-IN   col4: CHECK-OUT
  // Each row: value (large, bold) then label (small, gray) directly below it.
  // Bottom amber strip holds the booking REF.
  //
  const CARD_BODY_H = 38; // content area height (bumped for larger value text)
  const REF_H       = 15; // amber ref strip height
  const CARD_H      = CARD_BODY_H + REF_H;

  // Shadow
  pdf.setFillColor(215, 205, 190);
  pdf.roundedRect(margin + 1.5, y + 1.5, cw, CARD_H, 3, 3, "F");

  // White body
  pdf.setFillColor(...WHITE);
  pdf.roundedRect(margin, y, cw, CARD_H, 3, 3, "F");

  // Left gold strip
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(margin, y, 4.5, CARD_H, 2, 2, "F");

  // Amber ref strip — fills the bottom REF_H rows inside the card
  pdf.setFillColor(254, 248, 228);
  pdf.rect(margin + 4.5, y + CARD_BODY_H, cw - 4.5, REF_H, "F");

  // Thin divider between content and ref strip
  pdf.setDrawColor(235, 215, 165);
  pdf.setLineWidth(0.25);
  pdf.line(margin + 4.5, y + CARD_BODY_H, margin + cw, y + CARD_BODY_H);

  // Card border (redrawn on top so corners look clean)
  pdf.setDrawColor(225, 210, 180);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(margin, y, cw, CARD_H, 3, 3, "S");

  // REF text centred in the amber strip
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("BOOKING REF:", margin + 10, y + CARD_BODY_H + 10);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.bookingId, margin + 49, y + CARD_BODY_H + 10);

  // 4-column layout inside the card body
  // columns start after the left strip (4.5 mm) with 4 mm inner padding
  const COL_INNER_X = margin + 8.5;       // first column x
  const COL_W       = (cw - 8.5) / 4;    // ≈ 41.4 mm per column
  const C1 = COL_INNER_X;
  const C2 = COL_INNER_X + COL_W;
  const C3 = COL_INNER_X + COL_W * 2;
  const C4 = COL_INNER_X + COL_W * 3;

  // Value row (date / name — displayed FIRST)
  const VAL_Y = y + 15;
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  // truncate to fit column so columns don't bleed into each other
  const truncate = (text: string, maxW: number) =>
    (pdf.splitTextToSize(text, maxW) as string[])[0];
  pdf.text(truncate(data.guestName,   COL_W - 2), C1, VAL_Y);
  pdf.text(truncate(data.roomName,    COL_W - 2), C2, VAL_Y);
  pdf.text(truncate(data.checkInDate, COL_W - 2), C3, VAL_Y);
  pdf.text(truncate(data.checkOutDate,COL_W - 2), C4, VAL_Y);

  // Label row (below the value)
  const LBL_Y = VAL_Y + 10;
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("GUEST NAME", C1, LBL_Y);
  pdf.text("ROOM",       C2, LBL_Y);
  pdf.text("CHECK-IN",   C3, LBL_Y);
  pdf.text("CHECK-OUT",  C4, LBL_Y);

  y += CARD_H + 11;

  // ── Intro text ───────────────────────────────────────────────────────────
  pdf.setTextColor(...GRAY);
  pdf.setFontSize(12.5);
  pdf.setFont("helvetica", "normal");
  const intro = pdf.splitTextToSize(
    "Enhance your stay with our optional add-ons. Simply request any of the items below at the front desk or via the contacts provided. All prices are per night unless stated otherwise.",
    cw,
  );
  pdf.text(intro, margin, y);
  y += (intro as string[]).length * 6.2 + 11;

  // ── Section title ────────────────────────────────────────────────────────
  pdf.setTextColor(...PRIMARY_DARK);
  pdf.setFontSize(15);
  pdf.setFont("helvetica", "bold");
  pdf.text("AVAILABLE ADD-ONS", margin, y);
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y + 2.5, margin + 90, y + 2.5);
  y += 12;

  // ── Items table ──────────────────────────────────────────────────────────
  // Price badge: fixed 64 mm wide, anchored 3 mm from the box's right inner edge.
  // Item name is clipped to the space left of the badge.
  const PRICE_BADGE_W = 64;
  const PRICE_BADGE_H = 12;
  const PRICE_BADGE_X = margin + cw - PRICE_BADGE_W - 3;
  const NAME_MAX_W    = PRICE_BADGE_X - (margin + 22) - 3;
  const ROW_H = 20;

  // Renders one item row. Reused by both flat + grouped layouts.
  const renderItemRow = (item: RentableItem, i: number) => {
    const rowBg: [number, number, number] = i % 2 === 0 ? WHITE : [251, 247, 238];
    pdf.setFillColor(...rowBg);
    pdf.rect(margin, y, cw, ROW_H, "F");

    const CX = margin + 11;
    const CY = y + ROW_H / 2;
    pdf.setFillColor(...PRIMARY_SOFT);
    pdf.circle(CX, CY, 6, "F");
    pdf.setTextColor(...PRIMARY_DARK);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const iconChar =
      item.icon && /[^\x00-\x7F]/.test(item.icon)
        ? item.name.charAt(0).toUpperCase()
        : (item.icon || item.name.charAt(0).toUpperCase());
    pdf.text(iconChar, CX, CY + 3.5, { align: "center" });

    pdf.setTextColor(...BLACK);
    pdf.setFontSize(12.5);
    pdf.setFont("helvetica", "normal");
    const displayName = (pdf.splitTextToSize(item.name, NAME_MAX_W) as string[])[0];
    pdf.text(displayName, margin + 22, CY + 4.5);

    const priceText = `₱${Number(item.price_per_night).toLocaleString("en-PH", { minimumFractionDigits: 2 })}/night`;
    const PBY = y + (ROW_H - PRICE_BADGE_H) / 2;
    pdf.setFillColor(254, 248, 228);
    pdf.roundedRect(PRICE_BADGE_X, PBY, PRICE_BADGE_W, PRICE_BADGE_H, 2, 2, "F");
    pdf.setDrawColor(235, 215, 165);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(PRICE_BADGE_X, PBY, PRICE_BADGE_W, PRICE_BADGE_H, 2, 2, "S");
    pdf.setTextColor(...PRIMARY_DARK);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(priceText, PRICE_BADGE_X + PRICE_BADGE_W / 2, PBY + 8, { align: "center" });

    pdf.setDrawColor(228, 215, 190);
    pdf.setLineWidth(0.15);
    pdf.line(margin, y + ROW_H, margin + cw, y + ROW_H);

    y += ROW_H;
  };

  // Renders a "Category — N items" header band before its items.
  const CATEGORY_H = 13;
  const renderCategoryHeader = (cat: AddOnCategory) => {
    pdf.setFillColor(...PRIMARY);
    pdf.roundedRect(margin, y, cw, CATEGORY_H, 2, 2, "F");
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(11.5);
    pdf.setFont("helvetica", "bold");
    const safeIcon =
      cat.icon && /[^\x00-\x7F]/.test(cat.icon) ? "" : (cat.icon ? `${cat.icon}  ` : "");
    pdf.text(`${safeIcon}${cat.name.toUpperCase()}`, margin + 4, y + 9);
    pdf.text(
      `${cat.items.length} item${cat.items.length === 1 ? "" : "s"}`,
      margin + cw - 4,
      y + 9,
      { align: "right" },
    );
    y += CATEGORY_H;
  };

  const totalItems =
    (data.categories?.reduce((s, c) => s + c.items.length, 0) || 0) + data.rentableItems.length;

  if (totalItems === 0) {
    pdf.setFillColor(254, 243, 199);
    pdf.roundedRect(margin, y, cw, 24, 2, 2, "F");
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "italic");
    pdf.text("No add-ons are listed for this room.", pageWidth / 2, y + 15, { align: "center" });
    y += 32;
  } else if (data.categories && data.categories.length > 0) {
    // Grouped layout: render each non-empty category with its items.
    let rowIdx = 0;
    for (const cat of data.categories) {
      if (cat.items.length === 0) continue;
      renderCategoryHeader(cat);
      cat.items.forEach((item) => {
        renderItemRow(item, rowIdx++);
      });
      y += 2; // tiny gap before the next category
    }
    // Any leftover uncategorized items (from the flat list when categories is also passed)
    if (data.rentableItems.length > 0) {
      renderCategoryHeader({ name: "Other", icon: "📦", items: data.rentableItems });
      data.rentableItems.forEach((item) => {
        renderItemRow(item, rowIdx++);
      });
    }
    pdf.setDrawColor(200, 175, 120);
    pdf.setLineWidth(0.4);
    pdf.line(margin, y, margin + cw, y);
    y += 5;
  } else {
    // Flat layout (legacy callers that haven't moved to categories yet).
    pdf.setFillColor(...PRIMARY);
    pdf.roundedRect(margin, y, cw, CATEGORY_H, 2, 2, "F");
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("ITEM",          margin + 24,               y + 9);
    pdf.text("PRICE / NIGHT", PRICE_BADGE_X + PRICE_BADGE_W / 2, y + 9, { align: "center" });
    y += CATEGORY_H;
    data.rentableItems.forEach((item, i) => renderItemRow(item, i));
    pdf.setDrawColor(200, 175, 120);
    pdf.setLineWidth(0.4);
    pdf.line(margin, y, margin + cw, y);
    y += 5;
  }

  // ── How to request ───────────────────────────────────────────────────────
  y += 7;
  const CONTACT_H = 64;
  const FOOTER_H  = 30;

  // Overflow guard — if not enough space, start a new page
  if (y + CONTACT_H > pageHeight - FOOTER_H - 4) {
    pdf.addPage();
    y = margin;
  }

  pdf.setFillColor(254, 243, 199);
  pdf.roundedRect(margin, y, cw, CONTACT_H, 3, 3, "F");
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, cw, CONTACT_H, 3, 3, "S");
  pdf.setFillColor(245, 158, 11);
  pdf.roundedRect(margin, y, 4, CONTACT_H, 2, 2, "F");

  pdf.setTextColor(146, 64, 14);
  pdf.setFontSize(13.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("HOW TO REQUEST YOUR ITEMS", margin + 11, y + 13);

  pdf.setTextColor(120, 53, 15);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  const phoneDisplay = data.contactPhone && data.contactPhone.trim()
    ? data.contactPhone.trim()
    : "Contact number not configured";
  const emailDisplay = data.contactEmail && data.contactEmail.trim()
    ? data.contactEmail.trim()
    : "staycationhaven9@gmail.com";
  pdf.text("Front Desk  —  Visit us anytime during your stay", margin + 11, y + 27);
  pdf.text(`Phone          —  ${phoneDisplay}`,                margin + 11, y + 41);
  pdf.text(`Email           —  ${emailDisplay}`,               margin + 11, y + 55);

  // ── Footer band ──────────────────────────────────────────────────────────
  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, pageHeight - FOOTER_H, pageWidth, FOOTER_H, "F");
  pdf.setFillColor(...PRIMARY_SOFT);
  pdf.rect(0, pageHeight - FOOTER_H, pageWidth, 1.5, "F");

  pdf.setTextColor(...WHITE);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("We hope you enjoy your stay at Staycation Haven!", pageWidth / 2, pageHeight - 16, { align: "center" });
  pdf.setTextColor(...PRIMARY_SOFT);
  pdf.setFontSize(10.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Ref: ${data.bookingId}  •  Items subject to availability`, pageWidth / 2, pageHeight - 6, { align: "center" });

  return Buffer.from(pdf.output("arraybuffer"));
}
