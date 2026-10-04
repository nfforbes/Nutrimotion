/**
 * WhatsApp contact number (admin-configurable, stored on AppSetting `app`).
 */

import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';
import { DEFAULT_WHATSAPP, normalizeWhatsApp } from './whatsappLink';

export { DEFAULT_WHATSAPP, normalizeWhatsApp, whatsAppLink } from './whatsappLink';

const CONFIG_ID = 'app';

export async function getContactWhatsApp(): Promise<string> {
  try {
    await connectDB();
    const doc = await AppSetting.findById(CONFIG_ID).select('contactWhatsApp').lean();
    return normalizeWhatsApp(doc?.contactWhatsApp) ?? DEFAULT_WHATSAPP;
  } catch {
    return DEFAULT_WHATSAPP;
  }
}

export async function setContactWhatsApp(digits: string): Promise<void> {
  await connectDB();
  await AppSetting.updateOne({ _id: CONFIG_ID }, { $set: { contactWhatsApp: digits } }, { upsert: true });
}
