const fs = require('fs');
const configContent = `window.ENV = {
  SUPABASE_URL: "${process.env.SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}",
  EVIDENCE_BUCKET: "${process.env.EVIDENCE_BUCKET}"
};`;
fs.writeFileSync('public/config.js', configContent);
console.log('✅ config.js generated');