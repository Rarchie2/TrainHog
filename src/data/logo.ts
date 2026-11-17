// Trainers can upload their own logo. It's shrunk on the phone to at most
// 600 pixels wide (PNG, keeps transparency), then stored in the "logos"
// bucket under the trainer's business, where only that business's trainers
// can write. The bucket refuses files over 1 MB or that aren't images.

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './backend';

export const LOGO_MAX_BYTES = 1024 * 1024;

export type PickedLogo = { uri: string; base64: string; bytes: number };

// Open the photo library and get a small PNG of the chosen image.
export async function pickLogo(): Promise<PickedLogo | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const ctx = ImageManipulator.manipulate(a.uri);
  if ((a.width ?? 0) > 600) ctx.resize({ width: 600 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.PNG, base64: true });
  const b64 = out.base64 ?? '';
  const bytes = Math.floor((b64.length * 3) / 4);
  return { uri: `data:image/png;base64,${b64}`, base64: b64, bytes };
}

// Save it to storage and return its public link.
export async function uploadLogo(businessId: string, logo: PickedLogo): Promise<string> {
  if (!supabase) throw new Error('Uploading needs a signed-in trainer account.');
  if (logo.bytes > LOGO_MAX_BYTES) throw new Error('That image is too big. Please use one under 1 MB.');
  const bin = globalThis.atob(logo.base64);
  const data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  const path = `${businessId}/logo-${Date.now()}.png`;
  const { error } = await supabase.storage.from('logos').upload(path, data, { contentType: 'image/png', upsert: false });
  if (error) throw new Error(`Couldn't upload the logo: ${error.message}`);
  return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
}
