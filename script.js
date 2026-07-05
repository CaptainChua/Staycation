let adults = 1;
let children = 0;

function changeCount(type, amount){

    if(type === "adults"){
        adults = Math.max(1, Math.min(4, adults + amount));
        document.getElementById("adults").textContent = adults;
    }

    if(type === "children"){
        children = Math.max(0, Math.min(2, children + amount));
        document.getElementById("children").textContent = children;
    }

    let summary = adults + " Adult";

    if(adults > 1){
        summary = adults + " Adults";
    }

    if(children > 0){
        summary += ", " + children + " Child";
        if(children > 1){
            summary += "ren";
        }
    }

    document.getElementById("guestSummary").textContent = summary;

    // keep the already-shown "Available Havens" cards in sync with the new
    // guest count, so the link each card carries reflects the current pax
    refreshResultsIfShown();
}

// re-run the availability search (without scrolling) if results are on screen
function refreshResultsIfShown(){
    const results = document.getElementById("results");
    if(results && results.querySelector(".cards")){
        checkAvailability({ scroll: false });
    }
}

function addDaysIso(iso, n){
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function loadBookings(){
    try { return JSON.parse(localStorage.getItem("shph_bookings_v3")) || []; }
    catch(e){ return []; }
}

function sameHaven(a, b){
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

// is a haven free for the requested stay? slot-aware for 6-hour stays.
function havenAvailable(havenName, startIso, endIso, hours){
    const reqEnd = (endIso && endIso > startIso) ? endIso : addDaysIso(startIso, 1);
    const overlapping = loadBookings().filter(b => {
        if(b.deleted || b.cancelled) return false;   // deleted/cancelled → slot is free again
        if(!sameHaven(b.haven, havenName)) return false;
        const bEnd = (b.checkout && b.checkout > b.checkin) ? b.checkout : addDaysIso(b.checkin, 1);
        return startIso < bEnd && b.checkin < reqEnd;   // half-open overlap
    });
    if(overlapping.length === 0) return true;            // nothing booked → free

    // 10h / 21h need the whole day(s); any overlap blocks them
    if(hours === 10 || hours === 21) return false;

    // 6h or "Any": free unless a full-day booking exists or BOTH 6h slots are taken
    if(overlapping.some(b => Number(b.stayHours) !== 6)) return false;
    const slots = new Set(overlapping.filter(b => Number(b.stayHours) === 6).map(b => b.slot || "morning"));
    return !(slots.has("morning") && slots.has("evening"));
}

function checkAvailability(opts){
    const scroll = !opts || opts.scroll !== false;
    const dates = (window.getStayDates && window.getStayDates()) || {};
    const start = dates.start, end = dates.end;
    const results = document.getElementById("results");

    if(!start){
        // only nag when the guest actively clicked the button (scroll = true)
        if(scroll){
            alert("Please select your check-in date first.");
            if(window.openCalendar) window.openCalendar();
        }
        return;
    }

    const hoursSel = document.getElementById("searchHours");
    const hours = hoursSel ? (Number(hoursSel.value) || 0) : 0;   // 0 = Any
    const havens = (typeof loadHavens === "function") ? loadHavens() : [];

    const available = havens.filter(h => havenAvailable(h.name, start, end, hours));

    const fmt = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-GB");
    const dateRange = (end && end > start) ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
    const range = dateRange + (hours ? ` · ${hours} hours` : "");

    let html = `<h2>Available Havens</h2><p style="color:#777;margin-bottom:20px;">${range}</p>`;
    if(available.length === 0){
        html += `<div class="available-card">😔 No havens are available for these dates. Please try different dates.</div>`;
    } else {
        // carry the search-bar details through to the haven page so guests
        // don't have to re-enter check-in / hours / guests
        const stay = new URLSearchParams({ checkin: start });
        if (end && end > start) stay.set("checkout", end);
        if (hours) stay.set("hours", hours);
        stay.set("adults", adults);
        stay.set("children", children);
        const query = stay.toString();

        html += `<div class="cards">` + available.map(h => `
            <a class="card" href="havens.html?id=${h.id}&${query}">
                <img src="${h.image}" alt="${h.name}">
                <h3>${h.name}</h3>
                <p>${h.description}</p>
            </a>`).join("") + `</div>`;
    }

    results.innerHTML = html;

    // hide the default "Our Havens" list once a search has been made
    const ourHavens = document.getElementById("our-havens");
    if(ourHavens) ourHavens.style.display = "none";

    if(scroll) results.scrollIntoView({ behavior: "smooth" });
}

function toggleGuests() {
    document
        .querySelector(".guest-popup")
        .classList.toggle("show");
}

// close the guest popup when clicking anywhere outside the guest selector
document.addEventListener("click", function(e){
    const popup = document.querySelector(".guest-popup");
    if(!popup || !popup.classList.contains("show")) return;
    if(e.target.closest(".guest-selector")) return;   // clicks on trigger / +/- stay open
    popup.classList.remove("show");
});

// keep the shown results in sync when the search-bar hours change
(function(){
    const hoursSel = document.getElementById("searchHours");
    if(hoursSel) hoursSel.addEventListener("change", refreshResultsIfShown);
})();