import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qoebcbrbbdusczbcchse.supabase.co";
const supabasePublishableKey = "sb_publishable_I9FCJyBucod_PRZ97zAbug_GkZtDzeS";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

