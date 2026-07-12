/* ============================================================
   SUPABASE CONFIG
   Apna Supabase project ka URL aur anon/public key neeche daalein.
   Supabase Dashboard -> Project Settings -> API mein milega.
   ============================================================ */

const SUPABASE_URL = "https://xtxbhtrorviscpeizqrt.supabase.co";        // e.g. https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_TCPf4j28uYXWP3EXrA38Ig_gQ4hCdLW";

// window.supabase library CDN se load hoti hai (index page pe script tag dekhein)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket name jo aap Supabase Storage mein banayenge evidence uploads ke liye
const EVIDENCE_BUCKET = "evidence";
