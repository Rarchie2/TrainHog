// The Supabase connection. `supabase` is null when the app has no project
// set up (see src/config.ts), and then the app runs on demo data only.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { AppState, Platform } from 'react-native';
import { SUPABASE_KEY, SUPABASE_URL } from '@/config';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Only refresh the sign-in while the app is on screen.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Random ids, so records can be shown straight away and saved after.
export function uuid() {
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else if (i === 19) s += h[(Math.random() * 4) | 8];
    else s += h[(Math.random() * 16) | 0];
  }
  return s;
}

// Where the sign-in email's link sends people: back into the app
// (trainhog://auth), or back to the web app on a computer.
export function authRedirectUrl() {
  return Linking.createURL('auth');
}

// Finish signing in from the email link. Returns an error message or null.
export async function signInFromLink(url: string): Promise<string | null> {
  if (!supabase) return 'Sign-in is not set up yet.';
  const parts = new URLSearchParams([url.split('?')[1]?.split('#')[0] ?? '', url.split('#')[1] ?? ''].join('&'));
  const desc = parts.get('error_description');
  if (desc) return /expired|invalid/i.test(desc) ? 'That sign-in link has expired. Ask for a new one.' : desc.replace(/\+/g, ' ');
  const access = parts.get('access_token');
  const refresh = parts.get('refresh_token');
  if (access && refresh) {
    const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    return error ? error.message : null;
  }
  const code = parts.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? error.message : null;
  }
  return null;
}
