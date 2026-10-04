/** Client-safe WhatsApp helpers. */

export const DEFAULT_WHATSAPP = '18764282339';

export function normalizeWhatsApp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsAppLink(digits: string, text?: string): string {
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function formatWhatsAppDisplay(digits: string): string {
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return `+${digits}`;
}
