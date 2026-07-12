/* ============================================================
   SUPABASE CONFIG
   Apna Supabase project ka URL aur anon/public key neeche daalein.
   Supabase Dashboard -> Project Settings -> API mein milega.
   ============================================================ */

// const SUPABASE_URL = "https://xtxbhtrorviscpeizqrt.supabase.co";        // e.g. https://xxxxxxxx.supabase.co
// const SUPABASE_ANON_KEY = "sb_publishable_TCPf4j28uYXWP3EXrA38Ig_gQ4hCdLW";

// // window.supabase library CDN se load hoti hai (index page pe script tag dekhein)
// const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// // Bucket name jo aap Supabase Storage mein banayenge evidence uploads ke liye
// const EVIDENCE_BUCKET = "evidence";
// supabase-client.js
// NOTE: config.js is file se PEHLE load honi chahiye HTML mein

if (!window.ENV) {
  throw new Error("config.js load nahi hui ya supabase-client.js se pehle load nahi ki gayi!");
}

const SUPABASE_URL = window.ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY;
const EVIDENCE_BUCKET = window.ENV.EVIDENCE_BUCKET;

// window.sb — const sb nahi — taake dusri files (utils.js) ise access kar sakein
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.EVIDENCE_BUCKET = EVIDENCE_BUCKET;