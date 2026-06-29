/* ============================================================
   PARTNERS  (dashboard sub-module)
   ------------------------------------------------------------
   All Partners + PR-Rooms logic lives here, separate from
   dashboard.html. The matching markup is in
   views/partials/partners.ejs (pages) and partners-nav.ejs (nav).

   This file is loaded AFTER the main dashboard script, so all
   dashboard globals (bookings, HAVENS, peso, escHtml, showPage,
   DASH_PAGES, applyPermissions, openModal, …) already exist.

   If a Partners feature breaks, fix it HERE — not in dashboard.html.
   ============================================================ */
"use strict";

/* ---------- Partners store (localStorage-backed) ---------- */
const PARTNERS_KEY = "shph_partners";
let partnerEditingId = null;

function loadPartners(){ try{ return JSON.parse(localStorage.getItem(PARTNERS_KEY)) || []; }catch(e){ return []; } }
function savePartnersStore(arr){ localStorage.setItem(PARTNERS_KEY, JSON.stringify(arr)); }
function partnerById(id){ return loadPartners().find(p => p.id === id) || null; }

/* ---------- Partner List ---------- */
function renderPartners(){
    const tb = document.getElementById("partnersBody");
    if(!tb) return;
    const list = loadPartners();
    if(!list.length){
        tb.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding:28px;">No partners yet. Click &ldquo;+ Add Partner&rdquo; to add your first one.</td></tr>`;
        return;
    }
    tb.innerHTML = list.map(p => `<tr>
        <td><strong>${escHtml(p.name)}</strong></td>
        <td>${escHtml(p.type || "—")}</td>
        <td>${escHtml(p.contact || "—")}</td>
        <td>${escHtml(p.email || "—")}</td>
        <td>${p.rate ? peso(p.rate) : "—"}</td>
        <td class="pt-actions">
            <span class="edit" onclick="openAddPartner(${p.id})">Edit</span>
            <span class="del" onclick="deletePartner(${p.id})">Delete</span>
        </td></tr>`).join("");
}

/* ---------- Add / Edit Partner ---------- */
function openAddPartner(id){
    partnerEditingId = (typeof id === "number") ? id : null;
    const p = partnerEditingId ? partnerById(partnerEditingId) : null;
    document.getElementById("partnerFormTitle").textContent = p ? "Edit Partner" : "Add Partner";
    document.getElementById("pf_name").value    = p ? (p.name || "")    : "";
    document.getElementById("pf_type").value     = p ? (p.type || "Agency") : "Agency";
    document.getElementById("pf_rate").value     = p ? (p.rate || "")    : "";
    // Haven / Casa owned — populated from the live HAVENS list
    const havenSel = document.getElementById("pf_haven");
    const owns = (typeof HAVENS !== "undefined" && Array.isArray(HAVENS)) ? HAVENS : [];
    havenSel.innerHTML = '<option value="">— None —</option>' + owns.map(h => `<option>${escHtml(h)}</option>`).join("");
    havenSel.value = p ? (p.haven || "") : "";
    document.getElementById("pf_contact").value  = p ? (p.contact || "") : "";
    document.getElementById("pf_email").value    = p ? (p.email || "")   : "";
    document.getElementById("pf_login").value    = p ? (p.login || "")   : "";
    document.getElementById("pf_pw").value       = p ? (p.pw || "")      : "";
    document.getElementById("pf_notes").value    = p ? (p.notes || "")   : "";
    showPage("addpartner");
}

function savePartnerForm(){
    const name = document.getElementById("pf_name").value.trim();
    if(!name){ alert("Please enter a partner name."); document.getElementById("pf_name").focus(); return; }
    const data = {
        name,
        type:    document.getElementById("pf_type").value,
        rate:    Number(document.getElementById("pf_rate").value) || 0,
        haven:   document.getElementById("pf_haven").value,
        contact: document.getElementById("pf_contact").value.trim(),
        email:   document.getElementById("pf_email").value.trim(),
        login:   document.getElementById("pf_login").value.trim(),
        pw:      document.getElementById("pf_pw").value,
        notes:   document.getElementById("pf_notes").value.trim()
    };
    const list = loadPartners();
    if(partnerEditingId){
        const i = list.findIndex(p => p.id === partnerEditingId);
        if(i >= 0) list[i] = Object.assign({}, list[i], data);
    } else {
        data.id = Date.now();
        list.push(data);
    }
    savePartnersStore(list);
    if(typeof logActivity === "function") logActivity((partnerEditingId ? "updated" : "added") + " partner " + name);
    partnerEditingId = null;
    showPage("partners");
}

function deletePartner(id){
    const p = partnerById(id);
    if(!p) return;
    if(!confirm("Delete partner \"" + p.name + "\"?")) return;
    savePartnersStore(loadPartners().filter(x => x.id !== id));
    if(typeof logActivity === "function") logActivity("deleted partner " + p.name);
    renderPartners();
}

/* bookings attributed to a partner (matches booking.partner to the partner name) */
function bookingsForPartner(name){
    const all = (typeof bookings !== "undefined" && Array.isArray(bookings)) ? bookings : [];
    return all.filter(b => !b.cancelled && (b.partner || "") === name);
}

/* ---------- Commissions ---------- */
function renderCommissions(){
    const tb = document.getElementById("commissionsBody");
    if(!tb) return;
    const list = loadPartners();
    if(!list.length){
        tb.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding:28px;">No partners yet. Add a partner first to track commissions.</td></tr>`;
        return;
    }
    let totRev = 0, totCom = 0;
    const rows = list.map(p => {
        const bks = bookingsForPartner(p.name);
        const revenue = bks.reduce((s, b) => s + (Number(b.total) || 0), 0);
        const commission = (Number(p.rate) || 0) * bks.length;
        totRev += revenue; totCom += commission;
        return `<tr>
            <td><strong>${escHtml(p.name)}</strong></td>
            <td>${escHtml(p.type || "—")}</td>
            <td>${p.rate ? peso(p.rate) : "—"}</td>
            <td>${bks.length}</td>
            <td>${peso(revenue)}</td>
            <td><strong>${peso(commission)}</strong></td>
        </tr>`;
    }).join("");
    tb.innerHTML = rows + `<tr style="border-top:2px solid var(--hv-line); font-weight:700;">
        <td colspan="4" style="text-align:right;">Total</td>
        <td>${peso(totRev)}</td>
        <td><strong>${peso(totCom)}</strong></td></tr>`;
}

/* ---------- Bookings by Partner ---------- */
function renderPartnerBookings(){
    const el = document.getElementById("partnerBookingsBody");
    if(!el) return;
    const list = loadPartners();
    if(!list.length){
        el.innerHTML = `<p class="muted" style="text-align:center; padding:28px;">No partners yet. Add a partner first.</p>`;
        return;
    }
    el.innerHTML = list.map(p => {
        const bks = bookingsForPartner(p.name);
        const rows = bks.length
            ? `<div style="overflow-x:auto;"><table class="clean-summary-table">
                  <thead><tr><th>Guest</th><th>Haven</th><th>Check-in</th><th>Total</th></tr></thead>
                  <tbody>${bks.map(b => `<tr>
                      <td><strong>${escHtml(b.name || b.guest || "—")}</strong></td>
                      <td>${escHtml(b.haven || "—")}</td>
                      <td>${escHtml(b.checkin || b.date || "—")}</td>
                      <td>${peso(b.total || 0)}</td></tr>`).join("")}</tbody>
               </table></div>`
            : `<p class="muted" style="margin:0;">No bookings tagged to this partner yet.</p>`;
        return `<div class="pt-group">
            <h3>${escHtml(p.name)} <span class="pt-count">${bks.length} booking${bks.length === 1 ? "" : "s"}</span></h3>
            ${rows}
        </div>`;
    }).join("");
}

/* ============================================================
   PR-Rooms — partner-room calendar + bookings
   ============================================================ */
const PR_ROOMS = ["CasaBienca", "CasaSiesta"];   // the partner rooms
const PR_DAYS = 7;
let prRoom = PR_ROOMS[0];
let prRangeStart = null;   // Date

function prIsAdmin(){ return (typeof isAdminUser === "function") ? isAdminUser() : true; }

function renderPrRooms(){
    if(typeof havenNames === "function") HAVENS = havenNames();   // stay in sync with the Havens page
    if(!prRangeStart) prRangeStart = today();
    // admin-only haven dropdown
    const sel = document.getElementById("prRoomFilter");
    if(sel){
        const admin = prIsAdmin();
        if(!admin) prRoom = PR_ROOMS[0];                 // a partner login is locked to its room
        sel.style.display = admin ? "" : "none";
        sel.innerHTML = PR_ROOMS.map(h => `<option ${h === prRoom ? "selected" : ""}>${escHtml(h)}</option>`).join("");
    }
    const lbl = document.getElementById("prRoomLabel"); if(lbl) lbl.textContent = prRoom;
    const blbl = document.getElementById("prBookingsRoom"); if(blbl) blbl.textContent = prRoom;
    prRenderTimeline();
    prRenderBookings();
}

function prSetRoom(v){ prRoom = v; renderPrRooms(); }
function prShiftWeek(dir){ prRangeStart = addDays(prRangeStart || today(), dir * PR_DAYS); renderPrRooms(); }
function prToday(){ prRangeStart = today(); renderPrRooms(); }

function prRenderTimeline(){
    const grid = document.getElementById("prTimeline");
    if(!grid) return;
    const dates = [];
    for(let i = 0; i < PR_DAYS; i++) dates.push(addDays(prRangeStart, i));
    grid.style.gridTemplateColumns = `140px repeat(${PR_DAYS}, 1fr)`;
    const rl = document.getElementById("prRangeLabel");
    if(rl) rl.textContent = fmt(iso(dates[0])) + " – " + fmt(iso(dates[PR_DAYS - 1]));
    const todayIso = iso(today());

    let html = `<div class="tl-haven tl-head">Haven</div>`;
    dates.forEach(d => {
        const weekend = (d.getDay() === 0 || d.getDay() === 6) ? "weekend" : "";
        const isToday = iso(d) === todayIso ? "is-today" : "";
        html += `<div class="tl-cell tl-head ${weekend} ${isToday}">${d.toLocaleDateString("en-PH",{weekday:"short"})}<br>${d.getDate()}</div>`;
    });
    html += `<div class="tl-haven">${escHtml(prRoom)}</div>`;
    for(let i = 0; i < PR_DAYS; i++){
        const isToday = iso(dates[i]) === todayIso ? "is-today" : "";
        html += `<div class="tl-cell ${isToday}" data-h="${prRoom}" data-i="${i}"></div>`;
    }
    grid.innerHTML = html;

    // place bars (same math as the dashboard timeline, single room)
    const rangeStartIso = iso(prRangeStart);
    const rangeEndIso = iso(addDays(prRangeStart, PR_DAYS));
    bookings.forEach(b => {
        if(b.cancelled || b.haven !== prRoom) return;
        const coIso = b.checkout > b.checkin ? b.checkout : iso(addDays(new Date(b.checkin + "T00:00:00"), 1));
        if(!(b.checkin < rangeEndIso && coIso > rangeStartIso)) return;
        const startIdx = Math.max(0, daysBetween(rangeStartIso, b.checkin));
        const endIdx = Math.min(PR_DAYS, daysBetween(rangeStartIso, coIso));
        const span = endIdx - startIdx;
        if(span <= 0) return;
        const firstCell = grid.querySelector(`.tl-cell[data-h="${prRoom.replace(/"/g, '\\"')}"][data-i="0"]`);
        if(!firstCell) return;
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.background = havenColor(b);
        bar.style.color = "#222";
        bar.style.borderLeft = "5px solid " + (STATUS_COLOR[statusOf(b)] || "#999");
        bar.textContent = (b.fbName || primaryName(b)) + (b.slot ? " (" + (b.slot === "morning" ? "AM" : "PM") + ")" : "");
        bar.title = `${guestNames(b)} • ${fmt(b.checkin)}${b.checkout > b.checkin ? "→" + fmt(b.checkout) : ""} • ${peso(paidOf(b))}/${peso(b.total)}`;
        bar.onclick = () => openModal(b.id);
        const cellWidth = firstCell.offsetWidth, rowTop = firstCell.offsetTop, cellH = firstCell.offsetHeight;
        bar.style.left = (firstCell.offsetLeft + startIdx * cellWidth + 2) + "px";
        bar.style.width = (span * cellWidth - 4) + "px";
        if(b.slot === "morning"){ bar.style.top = (rowTop + 4) + "px"; bar.style.height = (cellH / 2 - 5) + "px"; }
        else if(b.slot === "evening"){ bar.style.top = (rowTop + cellH / 2 + 1) + "px"; bar.style.height = (cellH / 2 - 5) + "px"; }
        else { bar.style.top = (rowTop + 7) + "px"; bar.style.height = (cellH - 14) + "px"; }
        bar.style.bottom = "auto";
        grid.appendChild(bar);
    });
}

function prRenderBookings(){
    const tb = document.getElementById("prBookingsBody");
    if(!tb) return;
    const rows = bookings.filter(b => !b.cancelled && b.haven === prRoom)
        .sort((a, b) => (a.checkin || "").localeCompare(b.checkin || ""));
    if(!rows.length){
        tb.innerHTML = `<tr><td colspan="12" class="empty">No bookings for ${escHtml(prRoom)}.</td></tr>`;
        return;
    }
    tb.innerHTML = rows.map(b => {
        const balance = balanceOf(b), st = statusOf(b);
        return `<tr>
            <td><strong>${escHtml(b.haven)}</strong></td>
            <td>${guestSummary(b)}<br><span class="muted">${b.contact || ""}</span></td>
            <td>${fmt(b.checkin)}<br><span class="muted">${checkinTimeStr(b)}</span></td>
            <td>${fmt(b.checkout)}<br><span class="muted">${checkoutTimeStr(b)}</span></td>
            <td>${b.stayHours ? b.stayHours + "h" + (Number(b.stayHours) === 6 && b.slot ? "<br><span class='muted'>" + (b.slot === "morning" ? "AM" : "PM") + "</span>" : "") : "—"}</td>
            <td>${b.swimpass > 0 ? b.swimpass : '<span class="muted">—</span>'}</td>
            <td>${b.towels > 0 ? b.towels : '<span class="muted">—</span>'}</td>
            <td>${b.extend > 0 ? "+" + b.extend + "h" : '<span class="muted">—</span>'}</td>
            <td>${peso(b.downpayment)}</td>
            <td>${balance > 0 ? `<span class="bal-due">${peso(balance)}</span>` : '<span class="bal-clear">₱0</span>'}</td>
            <td><span class="status ${st}">${st}</span></td>
            <td class="actions">
                <span class="edit" style="color:var(--hv-terra-d);" onclick="viewBooking(${b.id})">View</span>
                <span class="edit" onclick="openModal(${b.id})">Edit</span>
            </td>
        </tr>`;
    }).join("");
}

/* ============================================================
   Register the Partners pages into the dashboard shell.
   Runs once, right after this script loads (main script already ran).
   ============================================================ */
function partnersOnShowPage(page){
    if(page === "partners") renderPartners();
    else if(page === "commissions") renderCommissions();
    else if(page === "partnerbookings") renderPartnerBookings();
    else if(page === "prrooms") renderPrRooms();
}

(function registerPartners(){
    const pages = [
        { key:"partners",        label:"Partner List" },
        { key:"addpartner",      label:"Add Partner" },
        { key:"commissions",     label:"Commissions" },
        { key:"partnerbookings", label:"Bookings by Partner" },
        { key:"prrooms",         label:"PR-Rooms" }
    ];
    // 1) access-control registry
    if(typeof DASH_PAGES !== "undefined" && Array.isArray(DASH_PAGES)){
        const have = new Set(DASH_PAGES.map(p => p.key));
        pages.forEach(p => { if(!have.has(p.key)) DASH_PAGES.push(p); });
    }
    // 2) breadcrumbs (merged by the dashboard's showPage)
    window.PARTNER_CRUMB = {
        partners:["Partners","Partner List"],
        addpartner:["Partners","Add Partner"],
        commissions:["Partners","Commissions"],
        partnerbookings:["Partners","Bookings by Partner"],
        prrooms:["Partners","PR-Rooms"]
    };
    // 3) re-apply permissions so the (now-registered) Partners nav reveals
    if(typeof applyPermissions === "function") applyPermissions();
    // 4) if the last-open page was a Partners page, restore it now that it's registered
    try{
        const saved = localStorage.getItem("shph_dashboard_page");
        if(saved && pages.some(p => p.key === saved) && typeof showPage === "function") showPage(saved);
    }catch(e){}
})();
