/* ============================================================
   Shared utilities used across all pages
   ============================================================ */

// ---------- Toasts ----------
function toast(message, type = "success") {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- Code generators ----------
function generateAssetCode(category = "AST") {
  const prefix = (category || "AST").substring(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const stamp = Date.now().toString().slice(-4);
  return `${prefix}-${stamp}${rand}`;
}

function generateIssueNumber() {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(10 + Math.random() * 90);
  return `ISS-${stamp}${rand}`;
}

// ---------- Formatting ----------
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---------- Badge class helpers ----------
function badgeClass(prefix, value) {
  return `badge badge-${slugify(value || "")}`;
}
function priorityClass(value) {
  return `badge priority-${slugify(value || "medium")}`;
}

// ---------- Status option lists ----------
const ASSET_STATUSES = ["Operational", "Issue Reported", "Under Inspection", "Under Maintenance", "Out of Service", "Retired"];
const ISSUE_STATUSES = ["Reported", "Assigned", "Inspection Started", "Maintenance In Progress", "Waiting for Parts", "Resolved", "Closed", "Reopened"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = ["Electrical", "Mechanical", "Plumbing", "HVAC", "IT/Electronics", "Structural", "Furniture", "Safety", "Other"];

// ---------- Auth helpers ----------
async function getCurrentProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) {
    console.error("profile fetch error", error);
    return null;
  }
  return data;
}

async function requireAuth(allowedRoles = null) {
  const profile = await getCurrentProfile();
  if (!profile) {
    window.location.href = "index.html";
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    toast("You don't have access to this page", "error");
    window.location.href = profile.role === "technician" ? "technician-dashboard.html" : "admin-dashboard.html";
    return null;
  }
  return profile;
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = "index.html";
}

// ---------- Asset history logging ----------
async function logHistory({ asset_id, issue_id = null, actor_name, actor_id = null, action, details = "" }) {
  const { error } = await sb.from("asset_history").insert({
    asset_id, issue_id, actor_name, actor_id, action, details
  });
  if (error) console.error("history log failed", error);
}

// ---------- QR rendering ----------
// Renders a QR code for `url` into the element with id `elId`, framed with corner brackets.
async function renderQR(elId, url) {
  const container = document.getElementById(elId);
  if (!container) return;
  if (typeof QRCode === "undefined") {
    container.innerHTML = `<div class="empty-state"><div class="icon">📵</div>QR library load nahi ho saki. Internet check karein aur page reload karein.</div>`;
    console.error("QRCode library not loaded — check js/qrcode.min.js is present");
    return;
  }
  container.innerHTML = `
    <div class="qr-frame">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <span class="bracket bl"></span><span class="bracket br"></span>
      <div class="qr-canvas-wrap"></div>
    </div>`;
  const wrap = container.querySelector(".qr-canvas-wrap");
  new QRCode(wrap, {
    text: url,
    width: 168,
    height: 168,
    colorDark: "#12161c",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ---------- Evidence upload ----------
async function uploadEvidence(file, folder = "general") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.floor(Math.random() * 9999)}.${ext}`;
  const { error } = await sb.storage.from(EVIDENCE_BUCKET).upload(path, file);
  if (error) {
    console.error("upload error", error);
    toast("Evidence upload failed: " + error.message, "error");
    return null;
  }
  const { data } = sb.storage.from(EVIDENCE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Public URL builder for QR ----------
function publicAssetUrl(assetCode) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]+$/, "");
  return `${base}public-asset.html?code=${encodeURIComponent(assetCode)}`;
}
