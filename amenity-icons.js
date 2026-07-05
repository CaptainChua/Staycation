/* ============================================================
   AMENITY ICONS  (shared by index.html + havens.html)
   ------------------------------------------------------------
   Clean line icons in the brand gold (#b8923a) that replace the
   emoji prefixes on amenity lists. Provides:
     amenityIcon(label)  -> inline <svg> string for the best match
     amenityLabel(label) -> the text with any leading emoji removed
   On load it also auto-upgrades any ".amenity-grid > div" items.
   ============================================================ */
(function () {
  "use strict";

  // each icon: a 24x24 line drawing; color/size come from the .amenity-ico CSS
  var I = {
    wifi:     '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M2.5 9.5a14 14 0 0 1 19 0"/><path d="M5.5 13a9.5 9.5 0 0 1 13 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r=".9" style="fill:#b8923a;stroke:none"/></svg>',
    pool:     '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M3 13h18"/><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 17h16"/><path d="M8 9c0-1.5 1-2 1-3.2S8 4 8 4"/><path d="M12 9c0-1.5 1-2 1-3.2S12 4 12 4"/><path d="M16 9c0-1.5 1-2 1-3.2S16 4 16 4"/></svg>',
    kitchen:  '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18"/><path d="M12 6v3"/><path d="M4 13H2"/><path d="M22 13h-2"/></svg>',
    tv:       '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    ac:       '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M3.8 7.5 20.2 16.5"/><path d="M20.2 7.5 3.8 16.5"/><path d="M12 6.5 9.5 4.5M12 6.5l2.5-2M12 17.5 9.5 19.5M12 17.5l2.5 2M4.6 9.6 1.9 9.2M19.4 14.4l2.7.4M19.4 9.6 22 9.2M4.6 14.4 1.9 14.8"/></svg>',
    parking:  '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9.2 17V7h3.4a2.7 2.7 0 0 1 0 5.4H9.2"/></svg>',
    bed:      '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M2 20v-7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7"/><path d="M2 16h20"/><path d="M6 11V8.5A1.5 1.5 0 0 1 7.5 7h3A1.5 1.5 0 0 1 12 8.5V11"/><path d="M3 20v1.5"/><path d="M21 20v1.5"/></svg>',
    washer:   '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 7h16"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="14" r="1.3"/><path d="M7 5h.01"/></svg>',
    workspace:'<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="3" y="5" width="14" height="10" rx="1.5"/><path d="M2 19h20"/><path d="M19 9h2a1 1 0 0 1 1 1v5"/></svg>',
    elevator: '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18"/><path d="M8 9V7M8 7 6.8 8.2M8 7l1.2 1.2"/><path d="M16 15v2M16 17l1.2-1.2M16 17l-1.2-1.2"/></svg>',
    balcony:  '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M3 21V8h18v13"/><path d="M3 12h18"/><path d="M7 12v9"/><path d="M11 12v9"/><path d="M15 12v9"/><path d="M19 12v9"/><path d="M4 8 12 3l8 5"/></svg>',
    coffee:   '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2.5M10 2v2.5M14 2v2.5"/></svg>',
    rice:     '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M3 10h18"/><path d="M9.5 10V8.2A2.5 2.5 0 0 1 12 5.7a2.5 2.5 0 0 1 2.5 2.5V10"/><path d="M12 2.4c-.7.7-.7 1.3 0 2"/></svg>',
    fridge:   '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M6 9.5h12"/><path d="M9 5v2"/><path d="M9 12.5v3"/></svg>',
    dining:   '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M7 3v18"/><path d="M5 3v4a2 2 0 0 0 4 0V3"/><path d="M17 3c-1.4 0-2.3 1.9-2.3 4.5 0 2.2.9 3.3 2.3 3.5V21"/></svg>',
    humidifier:'<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="7" y="12" width="10" height="9" rx="2.5"/><path d="M9.5 16.5h5"/><path d="M12 9.5c1-.8 1-1.9 0-2.8s-1-2 0-2.7"/><path d="M9 10c.7-.5.7-1.3 0-1.9M15 10c-.7-.5-.7-1.3 0-1.9"/></svg>',
    speaker:  '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="2.5"/><circle cx="7" cy="12" r="2"/><circle cx="16.5" cy="12" r="1.4"/><circle cx="19.6" cy="12" r=".7" style="fill:#b8923a;stroke:none"/></svg>',
    games:    '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1" style="fill:#b8923a;stroke:none"/><circle cx="15.5" cy="8.5" r="1.1" style="fill:#b8923a;stroke:none"/><circle cx="12" cy="12" r="1.1" style="fill:#b8923a;stroke:none"/><circle cx="8.5" cy="15.5" r="1.1" style="fill:#b8923a;stroke:none"/><circle cx="15.5" cy="15.5" r="1.1" style="fill:#b8923a;stroke:none"/></svg>',
    bulb:     '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M9.5 18h5"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.3 1.2 1.3 2.4h5c0-1.2.6-1.8 1.3-2.4A6 6 0 0 0 12 3Z"/></svg>',
    pillow:   '<svg class="amenity-ico" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="5"/><path d="M6.5 9 4.8 7.3M17.5 9l1.7-1.7M6.5 15l-1.7 1.7M17.5 15l1.7 1.7"/></svg>',
    hanger:   '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M12 7.5a1.9 1.9 0 1 1 1.7 2.8"/><path d="M12 10.3 3.6 15.8A1 1 0 0 0 4.1 17.6h15.8a1 1 0 0 0 .5-1.8L12 10.3Z"/></svg>',
    shower:   '<svg class="amenity-ico" viewBox="0 0 24 24"><path d="M12 2v2.5"/><path d="M6.5 9a5.5 5.5 0 0 1 11 0Z"/><path d="M9 13v.01M12 14v.01M15 13v.01M10.5 17v.01M13.5 17v.01"/></svg>',
    fallback: '<svg class="amenity-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>'
  };

  // keyword -> icon. First match wins, so order from most to least specific.
  var RULES = [
    [/wi-?fi|internet/i,                      "wifi"],
    [/pool|swim/i,                            "pool"],
    [/rice/i,                                 "rice"],       // "rice cooker" — before generic cook
    [/refrig|fridge|freezer|chiller/i,        "fridge"],
    [/dining|dine/i,                          "dining"],
    [/humidif|diffuser|aroma/i,               "humidifier"],
    [/sound ?bar|speaker|audio|\bsound\b/i,   "speaker"],
    [/board ?game|\bgames?\b|dice|\bcards?\b/i, "games"],
    [/led|light|lamp|bulb/i,                  "bulb"],
    [/pillow|comforter|blanket|duvet|linen/i, "pillow"],
    [/clothes|hanger|\brack\b|wardrobe|closet/i, "hanger"],
    [/shower|bath|toilet/i,                   "shower"],
    [/kitchenette|coffee|kettle/i,            "coffee"],
    [/induction|stove|cook|kitchen\b|dishwash/i, "kitchen"],
    [/netflix|smart ?tv|\btv\b|cable/i,       "tv"],
    [/air ?con|aircon|a\/?c|cooling/i,        "ac"],
    [/park/i,                                 "parking"],
    [/bed|sleep|mattress/i,                   "bed"],
    [/wash|laundry|dryer/i,                   "washer"],
    [/work ?space|workspace|desk|office/i,    "workspace"],
    [/elevator|lift/i,                        "elevator"],
    [/patio|balcon|terrace|garden/i,          "balcony"]
  ];

  function stripEmoji(s) {
    // drop any leading non-letter characters (emoji, symbols, spaces)
    return String(s == null ? "" : s).replace(/^[^\p{L}\p{N}]+/u, "").trim();
  }

  function iconFor(label) {
    var t = String(label == null ? "" : label);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(t)) return I[RULES[i][1]];
    }
    return I.fallback;
  }

  // public helpers
  window.amenityIcon = iconFor;
  window.amenityLabel = stripEmoji;

  // auto-upgrade static amenity grids (e.g. index.html "What Guests Love")
  function upgradeGrids() {
    var items = document.querySelectorAll(".amenity-grid > div");
    items.forEach(function (el) {
      if (el.dataset.iconified) return;
      var raw = el.textContent;
      el.innerHTML = iconFor(raw) + '<span>' + stripEmoji(raw) + '</span>';
      el.dataset.iconified = "1";
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", upgradeGrids);
  } else {
    upgradeGrids();
  }
})();
