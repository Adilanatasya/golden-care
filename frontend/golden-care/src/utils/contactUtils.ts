/**
 * Utility functions for Parsing, Validating and Formatting Guardian Emergency Contacts
 * for Pusat Jagaan Warga Emas dan Terapi Fitrah.
 */

export interface ParsedContact {
  name: string;
  relationship: string;
  phone: string;
  raw: string;
}

/**
 * Parses an emergency contact string like "Ahmad bin Razali (Son) - 012-3456789"
 * or "Grace Chen (Daughter) • 016-9876543" into its individual components.
 */
export function parseEmergencyContact(contactStr?: string): ParsedContact {
  if (!contactStr || contactStr.trim() === '' || contactStr === 'N/A' || contactStr === 'Not specified') {
    return {
      name: '',
      relationship: '',
      phone: '',
      raw: contactStr || '',
    };
  }

  const raw = contactStr.trim();

  // Pattern 1: "Name (Relationship) - Phone" or "Name (Relationship) • Phone" or "Name (Relationship): Phone"
  const patternWithParen = /^([^(]+)\s*\(([^)]+)\)\s*[-:•|,]?\s*(.*)$/i;
  const matchParen = raw.match(patternWithParen);

  if (matchParen) {
    return {
      name: matchParen[1].trim(),
      relationship: matchParen[2].trim(),
      phone: matchParen[3].trim().replace(/^[-:•|,]\s*/, ''),
      raw,
    };
  }

  // Pattern 2: "Name - Relationship - Phone" or "Name, Relationship, Phone"
  const parts = raw.split(/[-•|,:]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      name: parts[0],
      relationship: parts[1],
      phone: parts.slice(2).join(' '),
      raw,
    };
  }

  if (parts.length === 2) {
    // Check if part 2 has digits (likely phone)
    if (/\d{4,}/.test(parts[1])) {
      return {
        name: parts[0],
        relationship: 'Guardian',
        phone: parts[1],
        raw,
      };
    } else {
      return {
        name: parts[0],
        relationship: parts[1],
        phone: '',
        raw,
      };
    }
  }

  // Fallback if just a string
  return {
    name: raw,
    relationship: 'Guardian',
    phone: '',
    raw,
  };
}

/**
 * Formats name, relationship, and phone into standard standard format:
 * "Name (Relationship) • Phone"
 */
export function formatEmergencyContact(name: string, relationship: string, phone: string): string {
  const cleanName = name.trim();
  const cleanRel = relationship.trim() || 'Guardian';
  const cleanPhone = phone.trim();

  if (!cleanName && !cleanPhone) return 'Not specified';
  if (!cleanPhone) return `${cleanName} (${cleanRel})`;
  return `${cleanName} (${cleanRel}) • ${cleanPhone}`;
}

/**
 * Cleans phone number for Malaysian/International dialing & Telegram/WhatsApp links
 * e.g. "013-8876543" -> "60138876543"
 * e.g. "+60 13 887 6543" -> "60138876543"
 */
export function cleanPhoneNumberForUrl(phone: string): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, dots
  let digits = phone.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    digits = digits.substring(1);
  }

  // If starts with Malaysian local format 01X (e.g. 0123456789)
  if (digits.startsWith('0')) {
    digits = '60' + digits.substring(1);
  } else if (!digits.startsWith('60') && digits.length >= 8 && digits.length <= 11) {
    // Default to Malaysia +60 country code
    digits = '60' + digits;
  }

  return digits;
}

/**
 * Validates Malaysian / International Phone numbers
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  // Malaysian mobile phones are typically 10 to 12 digits (e.g. 0123456789 or 60123456789)
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

/**
 * Generates direct tel:, telegram, and whatsapp links
 */
export function getContactActionLinks(phone: string) {
  const cleanedUrlPhone = cleanPhoneNumberForUrl(phone);
  const rawDialDigits = phone.replace(/[^\d+]/g, '');

  return {
    telUrl: rawDialDigits ? `tel:${rawDialDigits}` : '#',
    telegramUrl: cleanedUrlPhone ? `https://t.me/+${cleanedUrlPhone}` : '#',
    telegramAppUrl: cleanedUrlPhone ? `tg://resolve?phone=${cleanedUrlPhone}` : '#',
    whatsappUrl: cleanedUrlPhone ? `https://wa.me/${cleanedUrlPhone}` : '#',
    displayPhone: phone || 'No phone recorded',
    isValid: isValidPhoneNumber(phone),
  };
}
