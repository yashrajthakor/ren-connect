export type MemberContactInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  business_name?: string | null;
  category_name?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  pincode?: string | null;
  business_address?: string | null;
  website?: string | null;
  referral_person?: string | null;
  chapter_name?: string | null;
  city_name?: string | null;
};

export const contactDisplayName = (fullName: string) => {
  const base = fullName.trim();
  if (!base) return "RBN Member";
  return base.toLowerCase().endsWith("rbn") ? base : `${base} RBN`;
};

const sanitizeFilePart = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "")
    .slice(0, 60) || "member";

export const contactFileBaseName = (fullName: string) =>
  `${sanitizeFilePart(fullName)}_RBN`;

const escapeVCard = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

export const buildMemberVCard = (m: MemberContactInput): string => {
  const displayName = contactDisplayName(m.full_name);
  const parts = m.full_name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || displayName;

  const city = m.business_city || m.city_name || "";
  const state = m.business_state || "";
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(displayName)}`,
    `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
  ];

  if (m.business_name) lines.push(`ORG:${escapeVCard(m.business_name)}`);
  if (m.phone) lines.push(`TEL;TYPE=CELL:${normalizePhone(m.phone)}`);
  if (m.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(m.email)}`);

  const street = m.business_address || "";
  if (street || city || state || m.pincode) {
    lines.push(
      `ADR;TYPE=WORK:;;${escapeVCard(street)};${escapeVCard(city)};${escapeVCard(state)};${escapeVCard(m.pincode || "")};India`
    );
  }

  if (m.website) lines.push(`URL:${escapeVCard(m.website)}`);

  const noteParts = ["Rajput Business Network (RBN)"];
  if (m.category_name) noteParts.push(`Category: ${m.category_name}`);
  if (m.chapter_name) noteParts.push(`Chapter: ${m.chapter_name}`);
  if (m.referral_person) noteParts.push(`Referred by: ${m.referral_person}`);
  lines.push(`NOTE:${escapeVCard(noteParts.join(" | "))}`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
};

export const buildMemberContactMessage = (m: MemberContactInput): string => {
  const displayName = contactDisplayName(m.full_name);
  const rows: string[] = [
    "📇 *RBN Member Contact*",
    "",
    `*Name:* ${displayName}`,
  ];
  if (m.business_name) rows.push(`*Business:* ${m.business_name}`);
  if (m.category_name) rows.push(`*Category:* ${m.category_name}`);
  if (m.phone) rows.push(`*Phone:* ${m.phone}`);
  if (m.email) rows.push(`*Email:* ${m.email}`);
  const location = [m.business_city || m.city_name, m.business_state].filter(Boolean).join(", ");
  if (location) rows.push(`*Location:* ${location}`);
  if (m.business_address) rows.push(`*Address:* ${m.business_address}`);
  if (m.website) rows.push(`*Website:* ${m.website}`);
  if (m.referral_person) rows.push(`*Referred by:* ${m.referral_person}`);
  if (m.chapter_name) rows.push(`*Chapter:* ${m.chapter_name}`);
  rows.push("", "_Rajput Business Network_");
  return rows.join("\n");
};

export const downloadMemberContact = (m: MemberContactInput) => {
  const vcard = buildMemberVCard(m);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${contactFileBaseName(m.full_name)}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const shareMemberContactWhatsApp = (m: MemberContactInput) => {
  const text = buildMemberContactMessage(m);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

/** Save vCard + open WhatsApp with contact text (mobile-friendly flow). */
export const saveAndShareMemberContact = async (
  m: MemberContactInput,
  onToast?: (opts: { title: string; description?: string }) => void
) => {
  downloadMemberContact(m);

  const vcard = buildMemberVCard(m);
  const fileName = `${contactFileBaseName(m.full_name)}.vcf`;
  const file = new File([vcard], fileName, { type: "text/vcard" });
  const text = buildMemberContactMessage(m);
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file], text })) {
    try {
      await nav.share({ files: [file], text, title: contactDisplayName(m.full_name) });
      return;
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    onToast?.({
      title: "Contact saved",
      description: "Open the .vcf file to add to contacts. Message copied — paste in WhatsApp.",
    });
  } catch {
    onToast?.({
      title: "Contact saved",
      description: "Open the downloaded .vcf file to add to your phone contacts.",
    });
  }

  shareMemberContactWhatsApp(m);
};
