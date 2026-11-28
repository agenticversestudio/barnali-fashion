import { formatINR, formatDate } from "./utils";
import type { BookingDto } from "@/types/api";

interface ReceiptOptions {
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
}

const DEFAULT_SHOP_NAME = "Barnali Fashion";
const DEFAULT_SHOP_PHONE = "+91 79782 56488";
const DEFAULT_SHOP_ADDRESS = "LIC Office Road, Bargarh, Odisha";

/**
 * Returns the best emoji for a boutique garment based on name and category
 */
export function getGarmentEmoji(name: string, category: string = ""): string {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("sherwani") || text.includes("achkan") || text.includes("kurta") || text.includes("groom")) return "🤵";
  if (text.includes("saree") || text.includes("kanjeevaram") || text.includes("silk")) return "🥻";
  if (text.includes("jewellery") || text.includes("choker") || text.includes("kundan") || text.includes("necklace") || text.includes("bangle")) return "💎";
  if (text.includes("gown") || text.includes("cocktail")) return "💃";
  if (text.includes("kid") || text.includes("child")) return "👶";
  if (text.includes("indo-western") || text.includes("sharara")) return "✨";
  return "👗"; // Bridal / Festive Lehenga default
}

/**
 * Generates an ultra-luxurious, receipt-styled WhatsApp message
 * designed with bold liners, rich boutique emojis, and clear visual hierarchy.
 */
export function formatWhatsAppReceipt(booking: BookingDto, options: ReceiptOptions = {}): string {
  const shopName = (options.shopName || DEFAULT_SHOP_NAME).toUpperCase();
  const shopPhone = options.shopPhone || DEFAULT_SHOP_PHONE;
  const shopAddress = options.shopAddress || DEFAULT_SHOP_ADDRESS;

  const isCompleted = booking.status === "COMPLETED";
  const isOutOnRent = booking.status === "OUT_ON_RENT";
  const isCancelled = booking.status === "CANCELLED";

  const divider = "━━━━━━━━━━━━━━━━━━━━";
  const subDivider = "────────────────────";

  const lines: string[] = [];

  // 1. BRAND HEADER
  lines.push(`👑 *${shopName}*`);
  lines.push(`_Bridal & Luxury Festive Studio_ 🌺`);
  lines.push(divider);
  lines.push("");

  // 2. RECEIPT TYPE BADGE
  if (isCompleted) {
    lines.push(`✅ *RETURN & SETTLEMENT SLIP*`);
  } else if (isOutOnRent) {
    lines.push(`📦 *GARMENT HANDOVER RECEIPT*`);
  } else if (isCancelled) {
    lines.push(`❌ *BOOKING CANCELLATION RECEIPT*`);
  } else {
    lines.push(`🧾 *OFFICIAL BOOKING RECEIPT*`);
  }

  lines.push(`🏷️ *Receipt No:* \`#${booking.id}\``);
  lines.push(`📅 *Date:* ${formatDate(new Date().toISOString().split("T")[0])}`);
  lines.push(divider);
  lines.push("");

  // 3. CUSTOMER & EVENT
  lines.push(`👤 *CUSTOMER DETAILS*`);
  lines.push(`• *Client Name:* ${booking.customer.name}`);
  if (booking.customer.phone) {
    lines.push(`• *Phone:* ${booking.customer.phone}`);
  }
  if (booking.eventName) {
    lines.push(`• *Occasion / Event:* 💍 ${booking.eventName}`);
  }
  lines.push("");

  // 4. RENTAL SCHEDULE
  lines.push(`📅 *RENTAL SCHEDULE*`);
  lines.push(`• 📦 *Pickup Date:* ${formatDate(booking.pickupDate)}`);
  lines.push(`• ⏳ *Return Due Date:* *${formatDate(booking.returnDueDate)}*`);
  lines.push("");

  // 5. OUTFITS / COSTUMES BREAKDOWN WITH DYNAMIC EMOJIS
  lines.push(`👗 *RESERVED COUTURE PIECES*`);
  booking.items.forEach((item, idx) => {
    const emoji = getGarmentEmoji(item.name);
    lines.push(`*${idx + 1}. ${emoji} ${item.name}*`);
    lines.push(`   🏷️ Code: \`${item.garmentId}\``);
    lines.push(`   💵 Rent: ${formatINR(item.rentalPrice)}  |  🛡️ Deposit: ${formatINR(item.securityDeposit)}`);
  });
  lines.push(subDivider);
  lines.push("");

  // 6. FINANCIAL BREAKDOWN
  lines.push(`💰 *BILLING & CHARGES*`);
  lines.push(`• 👗 Total Rental Fee: ${formatINR(booking.rentalTotal)}`);
  lines.push(`• 🛡️ Security Deposit (Refundable): ${formatINR(booking.depositTotal)}`);

  if (booking.dryCleanCharge > 0) {
    lines.push(`• 🧼 Dry Cleaning / Care: ${formatINR(booking.dryCleanCharge)}`);
  }
  if (booking.transitCharge > 0) {
    lines.push(`• 🚚 Delivery / Transit: ${formatINR(booking.transitCharge)}`);
  }

  lines.push(`• *Net Grand Total:* *${formatINR(booking.grandTotal)}*`);
  lines.push(subDivider);
  lines.push("");

  // 7. PAYMENTS & BALANCE DUES
  const advancePaid = booking.amountPaid ?? 0;

  lines.push(`💳 *PAYMENT SUMMARY*`);
  lines.push(`• 💵 Amount Paid so far: ${formatINR(advancePaid)}`);

  if (isCompleted) {
    lines.push(`• 📋 Order Status: *COMPLETED & CLOSED* ✅`);
    if ((booking.refundAmount || 0) > 0) {
      lines.push(`🎉 *Deposit Refunded to Client: ${formatINR(booking.refundAmount)}*`);
    }
    if ((booking.additionalDue || 0) > 0) {
      lines.push(`⚠️ *Extra Liability Paid: ${formatINR(booking.additionalDue)}*`);
    }
  } else if (booking.balanceDue > 0) {
    lines.push(`⚠️ *BALANCE DUE AT HANDOVER: ${formatINR(booking.balanceDue)}*`);
  } else {
    lines.push(`✅ *PAYMENT STATUS: ALL CLEAR / FULLY PAID*`);
  }

  lines.push(divider);
  lines.push("");

  // 8. BOUTIQUE CARE POLICIES
  lines.push(`🛡️ *STUDIO POLICY HIGHLIGHTS*`);
  lines.push(`• Security deposit is 100% refundable upon safe return of outfits.`);
  lines.push(`• Kindly return the outfit by 7:00 PM on the due date.`);
  lines.push(`• ⚠️ Please do not wash or iron heavy zardozi/bridal embroidery at home.`);
  lines.push("");

  // 9. STUDIO FOOTER & DIRECT HELPLINE
  lines.push(`📍 *Studio Address:*`);
  lines.push(`${shopAddress}`);
  lines.push(`📞 *Helpdesk / Queries:* ${shopPhone}`);
  lines.push("");
  lines.push(`_Thank you for choosing ${shopName}! We look forward to making your special day memorable._ ✨💖`);

  return lines.join("\n");
}

/**
 * Generates an automated fitting & trial reminder message
 */
export function formatTrialReminderWhatsApp(
  customerName: string,
  garmentNames: string[],
  pickupDate: string,
  shopPhone: string = DEFAULT_SHOP_PHONE
): string {
  const divider = "━━━━━━━━━━━━━━━━━━━━";
  return [
    `👑 *BARNALI FASHION — FITTING & TRIAL REMINDER* 🪡✨`,
    divider,
    ``,
    `Namaste *${customerName}* ji 🙏`,
    ``,
    `Your bridal & festive couture trial is due at the studio:`,
    `👗 *Outfits:* ${garmentNames.join(", ")}`,
    `📦 *Scheduled Pickup:* *${formatDate(pickupDate)}*`,
    ``,
    `📍 *Studio:* LIC Office Road, Bargarh, Odisha`,
    `📞 *Call / WhatsApp:* ${shopPhone}`,
    ``,
    `_Please visit the studio today for your trial and final fitment adjustments!_ 💖`,
  ].join("\n");
}

/**
 * Generates an automated packing ready message
 */
export function formatPackingReadyWhatsApp(
  customerName: string,
  garmentNames: string[],
  pickupDate: string,
  shopPhone: string = DEFAULT_SHOP_PHONE
): string {
  const divider = "━━━━━━━━━━━━━━━━━━━━";
  return [
    `👑 *BARNALI FASHION — OUTFIT READY FOR PICKUP* 📦✨`,
    divider,
    ``,
    `Namaste *${customerName}* ji 🙏`,
    ``,
    `Good news! Your outfit has been steam-pressed, sanitized, and packed for pickup:`,
    `👗 *Outfits:* ${garmentNames.join(", ")}`,
    `📅 *Pickup Date:* *${formatDate(pickupDate)}* (Ready by 11:00 AM)`,
    ``,
    `📍 *Studio:* LIC Office Road, Bargarh, Odisha`,
    `📞 *Call / WhatsApp:* ${shopPhone}`,
    ``,
    `_We look forward to welcoming you at the studio!_ 🌺👑`,
  ].join("\n");
}

/**
 * Encodes message and returns universal wa.me link with CRLF normalization
 * to prevent Windows WhatsApp Desktop and WhatsApp Web from flattening lines.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const normalized = message.replace(/\r?\n/g, "\r\n");
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(normalized)}`;
}
