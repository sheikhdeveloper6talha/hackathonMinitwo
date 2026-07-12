# MaintainIQ — QR Maintenance & Asset History Platform

Track: **HTML/CSS/JavaScript + Supabase (Track B)**
Plain HTML/CSS/JS — koi build step nahi chahiye. Supabase backend (Auth + Database + Storage) ke sath.

---

## 1. Kya bana hua hai (Features)

- **Auth** — Sign up / login (Admin ya Technician role choose karke), Supabase Auth se.
- **Asset Management** — Admin asset register karta hai, unique asset code auto-generate hota hai (e.g. `PRO-84213`).
- **QR Code** — Har asset ka QR auto-generate hota hai, download aur copy-link bhi ho sakta hai.
- **Public Asset Page** (`public-asset.html?code=...`) — QR scan karne pe safe info dikhti hai, login nahi chahiye.
- **Issue Reporting** — Public user complaint likhta hai; ek rule-based "AI Triage" helper title/category/priority suggest karta hai (client-side, koi API key nahi chahiye — chaho to isay real GenAI call se replace kar sakte ho).
- **Assignment** — Admin issue ko technician assign karta hai (`issues-board.html`).
- **Maintenance Workflow** — Status: Reported → Assigned → Inspection Started → Maintenance In Progress ⇄ Waiting for Parts → Resolved → Closed / Reopened. Invalid transitions block hoti hain, aur maintenance note ke bina Resolve nahi ho sakta.
- **Asset History** — Har important action (register, status change, issue report, assignment, maintenance) automatically history mein add hota hai.
- **Evidence Upload** — Supabase Storage bucket (`evidence`) mein photos/videos.
- **Search & Filters** — Assets aur issues dono list mein.

---

## 2. Supabase Setup (Zaroori — pehle ye karo)

1. [supabase.com](https://supabase.com) pe free account banao, **New Project** create karo.
2. **SQL Editor** kholo → `sql/schema.sql` file ka pura content paste karo → **Run**.
   - Ye sab tables (`profiles`, `assets`, `issues`, `maintenance_records`, `asset_history`), RLS policies, aur `evidence` storage bucket bana dega.
3. **Project Settings → API** mein jao, apna:
   - `Project URL`
   - `anon public` key
   copy karo.
4. `js/supabase-client.js` file kholo aur yahan paste karo:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
5. Bas — save karo, project ready hai.

> Agar Storage bucket SQL se na bane, to manually: **Storage → New Bucket → name: `evidence` → Public: ON**.

---

## 3. Project Chalane Ka Tarika

Koi build/npm install nahi chahiye. Sirf ek local server chala do (browser security ke liye zaroori hai, kyunki fetch calls file:// se kabhi kabhi block ho jati hain):

```bash
# Python se
python3 -m http.server 5500

# ya VS Code mein "Live Server" extension
```

Phir browser mein `http://localhost:5500/index.html` kholo.

---

## 4. Pehla Account Banana

1. `index.html` pe **Create Account** tab kholo.
2. Pehla account **Administrator** role se banao (asset register karne ke liye).
3. Doosra account **Technician** role se banao (maintenance karne ke liye).
4. Admin se ek asset register karo → uska QR mil jayega → naya browser tab/incognito mein QR ka link kholo → public page se issue report karo.

---

## 5. File Structure

```
maintainiq/
├── index.html                 → Login / Signup
├── admin-dashboard.html       → Asset registry (Admin)
├── asset-detail.html          → Single asset: QR, edit, history
├── public-asset.html          → Public QR-scan page (no login)
├── report-issue.html          → Public issue report form + triage
├── issues-board.html          → All issues + assign technician (Admin)
├── issue-detail.html          → Status workflow + maintenance records
├── technician-dashboard.html  → Technician's assigned work
├── css/style.css              → Design system
├── js/supabase-client.js      → ⚠️ Apni Supabase keys yahan daalo
├── js/utils.js                → Shared helpers (toast, QR, history, etc.)
└── sql/schema.sql             → Database schema + RLS + storage bucket
```

---

## 6. Roles / Authority (Business Rules)

| Role | Authority |
|---|---|
| **Admin** | Assets register/edit karna, sare issues dekhna, technician assign karna, poori history dekhna |
| **Technician** | Sirf apne assign hue issues dekh/update kar sakta hai, maintenance notes/parts/cost record karna |
| **Public User** | Login ke bina QR scan karke safe info dekhna, issue report karna |

Enforcement Supabase **Row Level Security (RLS)** se ho rahi hai — sirf frontend pe hide nahi, backend pe bhi lock hai.

---

## 7. Aage Kya Add Kar Sakte Ho (Bonus)

- Real GenAI triage: `report-issue.html` ke `runTriage()` function ko ek Supabase Edge Function se call karwao jo OpenAI/Claude API ko safely (server-side key ke sath) call kare.
- Email notification jab issue assign ho (Supabase Edge Function + Resend/SendGrid).
- Realtime updates: `sb.channel(...)` se issue status live update.
- Bulk QR label sheet: multiple assets select karke ek PDF banao (pdf-lib ya jsPDF CDN se).
