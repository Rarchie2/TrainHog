export const APP_NAME = 'TrainHog';

// The TrainHog Supabase project. These two values are safe to ship in the
// app (the database's security rules decide what each person can see).
// Leave them empty and the app runs on demo data only.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://tamoftqkqzeseexzdzez.supabase.co';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_WvbmM-UDor6Y_QbjcyqTxA_zytTpWhc';
