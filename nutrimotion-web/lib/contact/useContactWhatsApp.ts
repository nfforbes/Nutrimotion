'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_WHATSAPP, normalizeWhatsApp } from './whatsappLink';

let cached: string | null = null;

/** Admin-configured WhatsApp number; starts with the default until the setting loads. */
export function useContactWhatsApp(): string {
  const [digits, setDigits] = useState<string>(cached ?? DEFAULT_WHATSAPP);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetch('/api/settings/contact')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const value = normalizeWhatsApp(data?.whatsapp);
        if (value && !cancelled) {
          cached = value;
          setDigits(value);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return digits;
}
