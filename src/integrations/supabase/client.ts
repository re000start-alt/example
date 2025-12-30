import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Config from "react-native-config";

const SUPABASE_URL = Config.SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = Config.SUPABASE_PUBLISHABLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
