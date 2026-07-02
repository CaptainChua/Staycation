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
   Partner DASHBOARD MODE (read-only, single haven)
   Entered when dashboard.html runs as /dashboard.html?mode=partner.
   dashboard.html has already filtered `bookings` to the partner's haven
   and set window.__PARTNER__. Here we lock down the chrome.
   ============================================================ */
function applyPartnerChrome(){
    const ps = window.__PARTNER__;
    if(!ps) return;
    const MAIN = ["today", "calendar", "deposit"];               // stay under the "Main" header
    const DASH = ["analytics", "finance", "bills", "expenses"];  // move under a new "Dashboard" header
    const BOARD = ["board"];                                     // move under a new "Board" header
    const ALLOW = MAIN.concat(DASH).concat(BOARD).concat(["account"]);   // "account" = My Account (a modal action; keep it visible)
    const sb = document.querySelector(".sidebar");

    // show only the allowed nav items
    document.querySelectorAll(".sidebar .nav-item").forEach(n => {
        n.style.display = ALLOW.includes(n.dataset.page) ? "flex" : "none";
    });

    // helper: build a sidebar group at the end and move the given pages into it
    const buildGroup = (id, title, keys) => {
        if(!sb || document.getElementById(id)) return;
        const hdr = document.createElement("div");
        hdr.className = "nav-group";
        hdr.id = id;
        hdr.textContent = title;
        sb.appendChild(hdr);
        keys.forEach(dp => {
            const item = sb.querySelector('.nav-item[data-page="' + dp + '"]');
            if(item){ item.style.display = "flex"; sb.appendChild(item); }
        });
    };
    buildGroup("partnerDashGroup", "Dashboard", DASH);
    buildGroup("partnerBoardGroup", "Board", BOARD);

    // "My Account" at the very bottom — lets a partner change their own password.
    // Scoped partners only; the super-admin login is managed in code, not here.
    if(sb && !ps.superAdmin && !document.getElementById("partnerAccountGroup")){
        const ahdr = document.createElement("div");
        ahdr.className = "nav-group"; ahdr.id = "partnerAccountGroup"; ahdr.textContent = "Account";
        sb.appendChild(ahdr);
        const aitem = document.createElement("div");
        aitem.className = "nav-item"; aitem.dataset.page = "account"; aitem.style.display = "flex";
        aitem.innerHTML = '<span class="ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span> My Account';
        aitem.onclick = function(){ openPartnerAccount(); };
        sb.appendChild(aitem);
    }

    // Security Deposit belongs under MAIN — move it next to Calendar/Bookings
    const _dep = sb && sb.querySelector('.nav-item[data-page="deposit"]');
    const _cal = sb && sb.querySelector('.nav-item[data-page="calendar"]');
    if(_dep && _cal){ _dep.style.display = "flex"; _cal.insertAdjacentElement("afterend", _dep); }

    // put a "PARTNERS" label under the logo
    const brand = document.querySelector(".sidebar .brand");
    if(brand && !document.getElementById("partnerBadge")){
        const badge = document.createElement("div");
        badge.id = "partnerBadge";
        badge.textContent = "PARTNERS";
        badge.style.cssText = "font:800 12px/1 'Mulish',sans-serif; letter-spacing:3px; color:var(--hv-terra); padding:10px 0 2px 6px;";
        brand.insertAdjacentElement("afterend", badge);
    }

    // hide every now-empty group (e.g. Finance, emptied by the move above)
    document.querySelectorAll(".sidebar .nav-group").forEach(g => {
        let sib = g.nextElementSibling, any = false;
        while(sib && !(sib.classList && sib.classList.contains("nav-group"))){
            if(sib.classList && sib.classList.contains("nav-item") && sib.style.display !== "none"){ any = true; break; }
            sib = sib.nextElementSibling;
        }
        g.style.display = any ? "" : "none";
    });
    if(sb) sb.classList.remove("perms-pending");
    document.body.classList.add("partner-mode");

    // identity + hide admin-only chrome
    const ab = document.getElementById("addBookingBtn"); if(ab) ab.style.display = "none";
    const _calLog = document.getElementById("calLogPanel"); if(_calLog) _calLog.style.display = "none";   // Activity Log is admin-only
    const ul = document.getElementById("currentUserLabel");
    if(ps.superAdmin){
        // super admin: see ALL havens; keep the haven pickers usable to filter
        if(ul) ul.textContent = "Partner Super Admin: " + ps.name + " · all havens";
    } else {
        if(ul) ul.textContent = "Partner: " + ps.name + " · " + ps.haven;
        try{ calHaven = ps.haven; }catch(e){}
        const ch = document.getElementById("calHavenFilter"); if(ch) ch.style.display = "none";
        const fh = document.getElementById("filterHaven"); if(fh) fh.style.display = "none";
        // Scope the shared finance data to this haven (same idea as the bookings filter
        // in dashboard.html). This auto-scopes Bills, Expenses AND Analytics. Read-only,
        // so block the writers to be safe.
        try{ if(typeof bills !== "undefined") bills = bills.filter(b => b.haven === ps.haven); }catch(e){}
        try{ if(typeof expenses !== "undefined") expenses = expenses.filter(e => (e.haven || "") === ps.haven); }catch(e){}
        // Bills & Expenses are READ-ONLY for a scoped partner. Writes are blocked CENTRALLY in
        // dashboard.html (saveOneRecord/deleteOneRecord bail out for a scoped partner on the finance
        // keys — refactor-proof), so here we only hide the add/edit/delete controls on those pages.
        try{
            var _roCss = document.createElement("style");
            _roCss.textContent = "#page-bills button[onclick^='openBillModal'],#page-bills .act,"
                + "#page-expenses button[onclick^='openExpenseModal'],#page-expenses .act{display:none !important;}";
            document.head.appendChild(_roCss);
        }catch(e){}
        // lock the haven selectors on the finance-style pages
        const finH = document.getElementById("finHaven"); if(finH){ finH.value = ps.haven; finH.style.display = "none"; }
        const billH = document.getElementById("billFilterHaven"); if(billH){ billH.value = ps.haven; billH.style.display = "none"; }
        const expH = document.getElementById("expFilterHaven"); if(expH){ expH.value = ps.haven; expH.style.display = "none"; }
        // re-render with the scoped data
        try{ if(typeof renderHavenAnalytics === "function") renderHavenAnalytics(); }catch(e){}
        try{ if(typeof renderBills === "function") renderBills(); }catch(e){}
        try{ if(typeof renderExpenses === "function") renderExpenses(); }catch(e){}
        try{ if(typeof renderAnalytics === "function") renderAnalytics(); }catch(e){}
    }

    // read-only: row/bar clicks open the View (never the editor); block any save
    try{ if(typeof viewBooking === "function") openModal = function(id){ viewBooking(id); }; }catch(e){}
    try{ save = function(){}; }catch(e){}
    try{ window.save = function(){}; }catch(e){}

    // the "Today's Booking" nav normally jumps to the standalone (unscoped) page;
    // in partner mode point it at the in-app, haven-scoped Today page instead.
    const _todayNav = document.querySelector('.sidebar .nav-item[data-page="today"]');
    if(_todayNav) _todayNav.onclick = function(){ showPage("today"); };
    // land on the last-open page (if it's still a partner-allowed page), else the scoped Today's Booking page
    let _land = "today";
    try{
        const _saved = localStorage.getItem("shph_dashboard_page");
        if(_saved && ALLOW.includes(_saved) && document.getElementById("page-" + _saved)) _land = _saved;
    }catch(e){}
    if(typeof showPage === "function") showPage(_land);
}

/* ---------- Partner "My Account" — change your own password ---------- */
function openPartnerAccount(){
    let ov = document.getElementById("partnerAccountOverlay");
    if(!ov){
        ov = document.createElement("div");
        ov.className = "overlay"; ov.id = "partnerAccountOverlay";
        ov.innerHTML =
            '<div class="modal" style="width:420px;">' +
                '<h2>My Account</h2>' +
                '<p class="muted" id="paWho" style="margin:-4px 0 14px;"></p>' +
                '<div class="form-grid">' +
                    '<div class="field full"><label>Current password</label><input type="password" id="paCur" autocomplete="off"></div>' +
                    '<div class="field full"><label>New password</label><input type="password" id="paNew" autocomplete="off"></div>' +
                    '<div class="field full"><label>Confirm new password</label><input type="password" id="paNew2" autocomplete="off"></div>' +
                '</div>' +
                '<div id="paMsg" style="min-height:18px;font-size:13px;font-weight:600;margin:2px 0 6px;"></div>' +
                '<div class="modal-actions">' +
                    '<button class="btn secondary" onclick="closePartnerAccount()">Cancel</button>' +
                    '<button class="btn" id="paSaveBtn" onclick="partnerChangePw()">Change password</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(ov);
    }
    const ps = window.__PARTNER__ || {};
    const who = document.getElementById("paWho");
    if(who) who.textContent = (ps.name || ps.login || "") + (ps.haven ? " · " + ps.haven : "");
    ["paCur", "paNew", "paNew2"].forEach(function(id){ const el = document.getElementById(id); if(el) el.value = ""; });
    const msg = document.getElementById("paMsg"); if(msg) msg.textContent = "";
    ov.classList.add("show");
}
function closePartnerAccount(){ const ov = document.getElementById("partnerAccountOverlay"); if(ov) ov.classList.remove("show"); }
function partnerChangePw(){
    const ps = window.__PARTNER__;
    const msg = document.getElementById("paMsg");
    const setMsg = function(t, ok){ if(msg){ msg.textContent = t; msg.style.color = ok ? "#2e7d4f" : "#c0283d"; } };
    if(!ps || ps.id == null){ setMsg("This account's password can't be changed here.", false); return; }
    const cur  = (document.getElementById("paCur")  || {}).value || "";
    const nw   = (document.getElementById("paNew")  || {}).value || "";
    const nw2  = (document.getElementById("paNew2") || {}).value || "";
    if(!cur || !nw || !nw2){ setMsg("Please fill in all three fields.", false); return; }
    if(nw.length < 4){ setMsg("New password must be at least 4 characters.", false); return; }
    if(nw !== nw2){ setMsg("The new passwords don't match.", false); return; }
    let partners = [];
    try{ partners = JSON.parse(localStorage.getItem("shph_partners")) || []; }catch(e){ partners = []; }
    const me = partners.find(function(p){ return String(p.id) === String(ps.id); })
            || partners.find(function(p){ return (p.login || "").toLowerCase() === (ps.login || "").toLowerCase(); });
    if(!me){ setMsg("Couldn't find your account — please log out and back in, then try again.", false); return; }
    if(String(me.pw || "") !== cur){ setMsg("Your current password is incorrect.", false); return; }
    if(String(me.pw || "") === nw){ setMsg("The new password is the same as your current one.", false); return; }
    me.pw = nw;
    // whole-array write → the seed-bridge mirrors shph_partners to the server, so the new password
    // is what /partner-login validates against next time. Only this record was touched; others intact.
    try{ localStorage.setItem("shph_partners", JSON.stringify(partners)); }catch(e){}
    setMsg("✓ Password changed. Use your new password next time you log in.", true);
    ["paCur", "paNew", "paNew2"].forEach(function(id){ const el = document.getElementById(id); if(el) el.value = ""; });
}

/* ---------- Users page: Partner Logins section (admin-only) ---------- */
function renderPartnerLogins(){
    const el = document.getElementById("partnerLoginsList");
    if(!el) return;
    const list = loadPartners();
    if(!list.length){
        el.innerHTML = '<p class="muted" style="margin:0;">No partners yet. Add them in the Partners section.</p>';
        return;
    }
    el.innerHTML = list.map(p => `<div class="pl-row">
        <div class="pl-who"><strong>${escHtml(p.name)}</strong>${p.haven ? ' <span class="muted">· ' + escHtml(p.haven) + '</span>' : ' <span class="muted">· no haven set</span>'}</div>
        <input type="text" id="pl_login_${p.id}" value="${escAttr(p.login || "")}" placeholder="username" autocomplete="off">
        <input type="text" id="pl_pw_${p.id}" value="${escAttr(p.pw || "")}" placeholder="password" autocomplete="off">
        <button class="btn" onclick="savePartnerLogin(${p.id})">Save</button>
    </div>`).join("");
}
function savePartnerLogin(id){
    const list = loadPartners();
    const i = list.findIndex(p => p.id === id);
    if(i < 0) return;
    list[i].login = document.getElementById("pl_login_" + id).value.trim();
    list[i].pw = document.getElementById("pl_pw_" + id).value;
    savePartnersStore(list);
    if(typeof logActivity === "function") logActivity("updated partner login for " + list[i].name);
    const btn = event && event.target;
    if(btn){ const t = btn.textContent; btn.textContent = "Saved ✓"; setTimeout(() => { btn.textContent = t; }, 1200); }
}

/* ============================================================
   Register the Partners pages into the dashboard shell.
   Runs once, right after this script loads (main script already ran).
   ============================================================ */
/* ---------- Notice Board (admin/super-admin posts; partners view read-only) ---------- */
// Notices are TARGETED: board = { "all": {text,updatedAt,updatedBy}, "<Haven>": {...}, ... }.
// "all" shows to every partner; a haven key shows only to that haven's partner.
const BOARD_KEY = "shph_partner_board";
function normalizeBoard(raw){
    if(!raw || typeof raw !== "object") return {};
    // migrate the old single-note shape { text, updatedAt, updatedBy } → { all: {...} }
    if(typeof raw.text === "string" && raw.all === undefined){
        return { all: { text: raw.text, updatedAt: raw.updatedAt, updatedBy: raw.updatedBy } };
    }
    return raw;
}
function loadBoard(){ try{ return normalizeBoard(JSON.parse(localStorage.getItem(BOARD_KEY)) || {}); }catch(e){ return {}; } }
function boardCanEdit(){ return !window.__PARTNER__ || !!window.__PARTNER__.superAdmin; }
function boardTargetLabel(key){ return key === "all" ? "All partners" : key; }
// who the admin can post to: "All partners" + every haven that has a partner (+ the PR rooms)
function boardTargets(){
    const havens = [];
    const add = function(h){ if(h && havens.indexOf(h) === -1) havens.push(h); };
    try{ (loadPartners() || []).forEach(function(p){ add(p.haven); }); }catch(e){}
    try{ if(typeof PR_ROOMS !== "undefined" && Array.isArray(PR_ROOMS)) PR_ROOMS.forEach(add); }catch(e){}
    havens.sort();
    return [{ value:"all", label:"All partners" }].concat(havens.map(function(h){ return { value:h, label:h }; }));
}
// when the admin switches the "Post to" dropdown, load that target's current text
function onBoardTargetChange(){
    const sel = document.getElementById("boardTarget"), ta = document.getElementById("boardText");
    if(!sel || !ta) return;
    const rec = loadBoard()[sel.value];
    ta.value = (rec && rec.text) || "";
}
function saveBoard(){
    const ta = document.getElementById("boardText"), sel = document.getElementById("boardTarget");
    if(!ta) return;
    const target = (sel && sel.value) || "all";
    const board = loadBoard();
    if(ta.value.trim()){
        board[target] = { text: ta.value, updatedAt: new Date().toISOString(), updatedBy: (typeof currentUser === "function" ? currentUser() : "") };
    } else {
        delete board[target];   // empty text clears that target's notice
    }
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));   // shared key → seed-bridge mirrors it to the server
    if(typeof logActivity === "function") logActivity("updated the partner notice board (" + boardTargetLabel(target) + ")");
    const btn = (typeof event !== "undefined" && event) ? event.target : null;
    if(btn){ const t = btn.textContent; btn.textContent = ta.value.trim() ? "Posted ✓" : "Cleared ✓"; setTimeout(function(){ btn.textContent = t; }, 1200); }
    renderBoard();
}
// one notice card; pass a label to show a target header + a key to show Edit/Delete (admin view),
// or null/null for the partner view (no header, no buttons)
function boardNoteHtml(rec, label, key){
    if(!rec || !(rec.text || "").trim()) return "";
    const when = rec.updatedAt ? new Date(rec.updatedAt).toLocaleString("en-PH") : "";
    const actions = key
        ? '<div style="margin-top:10px; display:flex; gap:16px;">'
            + '<span style="font-size:12px; font-weight:600; color:var(--hv-terra-d); cursor:pointer;" onclick="boardEdit(\'' + escAttr(key) + '\')">Edit</span>'
            + '<span style="font-size:12px; font-weight:600; color:#c0283d; cursor:pointer;" onclick="boardDelete(\'' + escAttr(key) + '\')">Delete</span>'
          + '</div>'
        : '';
    return '<div class="board-note" style="margin-bottom:12px;">'
        + (label ? '<div class="muted" style="font-size:11px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; margin-bottom:6px;">' + escHtml(label) + '</div>' : '')
        + escHtml(rec.text).replace(/\n/g, "<br>")
        + (when ? '<div class="muted" style="margin-top:8px; font-size:12px;">Last updated ADMIN · ' + escHtml(when) + '</div>' : '')
        + actions
        + '</div>';
}
// Edit: pull a posted notice back into the "Post to" + textarea so it can be changed & re-posted
function boardEdit(key){
    const sel = document.getElementById("boardTarget"), ta = document.getElementById("boardText");
    if(sel){
        if(!Array.prototype.some.call(sel.options, function(o){ return o.value === key; })){
            const opt = document.createElement("option"); opt.value = key; opt.textContent = boardTargetLabel(key); sel.appendChild(opt);
        }
        sel.value = key;
    }
    const rec = loadBoard()[key];
    if(ta){ ta.value = (rec && rec.text) || ""; ta.focus(); }
    const box = document.getElementById("boardAdmin"); if(box && box.scrollIntoView) box.scrollIntoView({ behavior:"smooth", block:"center" });
}
// Delete: remove that target's notice
function boardDelete(key){
    if(!confirm("Delete this notice" + (key === "all" ? " for all partners" : " for " + key) + "?")) return;
    const board = loadBoard();
    delete board[key];
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));
    if(typeof logActivity === "function") logActivity("deleted the partner notice board (" + boardTargetLabel(key) + ")");
    renderBoard();
}
function renderBoard(){
    const board = loadBoard();
    const canEdit = boardCanEdit();
    const adminBox = document.getElementById("boardAdmin");
    if(adminBox) adminBox.style.display = canEdit ? "block" : "none";
    if(canEdit){
        const sel = document.getElementById("boardTarget");
        if(sel){
            const prev = sel.value;
            const opts = boardTargets();
            sel.innerHTML = opts.map(function(o){ return '<option value="' + escAttr(o.value) + '">' + escHtml(o.label) + '</option>'; }).join("");
            if(opts.some(function(o){ return o.value === prev; })) sel.value = prev;
        }
        const ta = document.getElementById("boardText");
        if(ta && document.activeElement !== ta){
            const cur = sel ? sel.value : "all";
            ta.value = (board[cur] && board[cur].text) || "";
        }
    }
    const view = document.getElementById("boardView");
    if(!view) return;
    if(canEdit){
        // admin: show every posted notice, "All partners" first then havens A–Z
        const keys = Object.keys(board).filter(function(k){ return board[k] && (board[k].text || "").trim(); });
        keys.sort(function(a, b){ return a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b); });
        view.innerHTML = keys.length
            ? keys.map(function(k){ return boardNoteHtml(board[k], boardTargetLabel(k), k); }).join("")
            : '<p class="muted" style="margin:0;">No notice posted yet.</p>';
    } else {
        // partner: the "all" notice + their own haven's notice
        const ps = window.__PARTNER__ || {};
        const parts = [ boardNoteHtml(board.all, null) ];
        if(ps.haven && ps.haven !== "all") parts.push(boardNoteHtml(board[ps.haven], null));
        const html = parts.filter(Boolean).join("");
        view.innerHTML = html || '<p class="muted" style="margin:0;">No notice posted yet.</p>';
    }
}

function partnersOnShowPage(page){
    if(page === "partners") renderPartners();
    else if(page === "commissions") renderCommissions();
    else if(page === "partnerbookings") renderPartnerBookings();
    else if(page === "prrooms") renderPrRooms();
    else if(page === "users") renderPartnerLogins();
    else if(page === "board") renderBoard();
}

(function registerPartners(){
    const pages = [
        { key:"partners",        label:"Partner List" },
        { key:"addpartner",      label:"Add Partner" },
        { key:"commissions",     label:"Commissions" },
        { key:"partnerbookings", label:"Bookings by Partner" },
        { key:"prrooms",         label:"PR-Rooms" },
        { key:"partnerdash",     label:"Partner Dashboard" },  // nav item only — navigates to /partner-login
        { key:"board",           label:"Board" }
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
        prrooms:["Partners","PR-Rooms"],
        board:["Main","Board"]
    };
    // 3) re-apply permissions so the (now-registered) Partners nav reveals
    //    (in partner mode this runs applyPartnerChrome and lands on Today)
    if(typeof applyPermissions === "function") applyPermissions();
    // 4) if the last-open page was a Partners page, restore it now that it's registered
    //    (skipped in partner mode — chrome already chose the page)
    if(!window.__PARTNER__){
        try{
            const saved = localStorage.getItem("shph_dashboard_page");
            if(saved && pages.some(p => p.key === saved) && typeof showPage === "function") showPage(saved);
        }catch(e){}
    }
})();
