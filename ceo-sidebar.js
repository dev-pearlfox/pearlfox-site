/* PearlFox internal sidebar
 * ---------------------------------------------------------------------
 * ONE source of truth for the left sidebar shown on:
 *   - CEO dashboard      (pearlfox.io/ceo-x7k3m9.html)
 *   - Expenses Tracker   (pearlfox.io/et-9k2m7x4.html)
 *   - Eagle View roadmap pages (eagleview.pearlfox.io/eagleview/roadmap/...)
 * Each page just loads this file:
 *   <script src="https://pearlfox.io/ceo-sidebar.js" defer></script>
 * To add / rename / reorder an item, edit ITEMS below. Nothing else.
 *
 * Open = full width with labels. Collapsed = narrow icon rail (labels stay
 * in the DOM for screen readers and show as tooltips). Phones always get
 * the icon bar across the top. The choice is remembered per site.
 * Sits at z-index 100, under every login / password overlay (>= 1000), so
 * it stays hidden until a page's own gate is unlocked.
 */
(function () {
    "use strict";
    if (document.getElementById("ceo-sidebar")) return;

    var STORAGE_KEY = "ceoSidebarCollapsed";
    var HOME = "https://pearlfox.io/ceo-x7k3m9.html";
    var ITEMS = [
        {
            label: "PearlFox Partners Expenses Tracker",
            href:  "https://pearlfox.io/et-9k2m7x4.html",
            icon:  "<svg viewBox=\"0 0 24 24\"><path d=\"M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3z\"/><path d=\"M8 8h8M8 12h8M8 16h5\"/></svg>"
        },
        {
            label: "Product Launch Roadmap",
            href:  "https://eagleview.pearlfox.io/eagleview/roadmap/product-launch.html",
            icon:  "<svg viewBox=\"0 0 24 24\"><path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\"/><path d=\"M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\"/><path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\"/><path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\"/></svg>"
        },
        {
            label: "Eagle View Roadmap",
            href:  "https://eagleview.pearlfox.io/eagleview/roadmap/",
            icon:  "<svg viewBox=\"0 0 24 24\"><polygon points=\"1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6\"/><line x1=\"8\" y1=\"3\" x2=\"8\" y2=\"18\"/><line x1=\"16\" y1=\"6\" x2=\"16\" y2=\"21\"/></svg>"
        },
        {
            label: "Company Roadmap",
            href:  "https://eagleview.pearlfox.io/eagleview/roadmap/EagleView_Roadmap_CEO.html",
            icon:  "<svg viewBox=\"0 0 24 24\"><path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v8h4\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v11h-4\"/><path d=\"M10 6h4M10 10h4M10 14h4M10 18h4\"/></svg>"
        }
    ];

    var CSS = [
        ":root{--ceo-side-w:280px;--ceo-rail-w:68px}",
        "html.ceo-sb{padding-left:var(--ceo-side-w);transition:padding-left .25s ease}",
        "html.ceo-sb.ceo-sb-collapsed{padding-left:var(--ceo-rail-w)}",

        "#ceo-sidebar,#ceo-sidebar *{box-sizing:border-box}",
        "#ceo-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--ceo-side-w);z-index:100;",
        "  background:#fff;border-right:1px solid rgba(20,10,0,.10);box-shadow:0 1px 2px rgba(20,10,0,.06);",
        "  padding:28px 14px;display:flex;flex-direction:column;gap:6px;overflow-x:hidden;overflow-y:auto;",
        "  font:600 14px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
        "  color:#1A1310;transition:width .25s ease,padding .25s ease}",
        "#ceo-sidebar a{color:inherit;text-decoration:none}",
        "#ceo-sidebar .ceo-brand{display:block;font-size:20px;font-weight:800;letter-spacing:-.3px;",
        "  padding:0 12px 18px;margin-bottom:8px;border-bottom:1px solid rgba(20,10,0,.10)}",
        "#ceo-sidebar .ceo-brand span{display:block;margin-top:2px;font-size:12px;font-weight:600;",
        "  letter-spacing:.6px;text-transform:uppercase;color:#5A4E44}",
        "#ceo-sidebar .ceo-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;",
        "  border:1px solid transparent;transition:background .15s,border-color .15s}",
        "#ceo-sidebar .ceo-item:hover,#ceo-sidebar .ceo-item:focus-visible,",
        "#ceo-sidebar .ceo-item[aria-current='page']{background:#F5DFC9;border-color:#C98F63;outline:none}",
        "#ceo-sidebar .ceo-icon{width:36px;height:36px;border-radius:8px;flex-shrink:0;",
        "  background:linear-gradient(135deg,#FFB245,#F45A08);display:flex;align-items:center;",
        "  justify-content:center;box-shadow:0 2px 8px rgba(252,130,21,.28)}",
        "#ceo-sidebar .ceo-icon svg{width:20px;height:20px;stroke:#1A0E04;stroke-width:2.2;fill:none;",
        "  stroke-linecap:round;stroke-linejoin:round}",

        /* collapsed = icon rail */
        "html.ceo-sb-collapsed #ceo-sidebar{width:var(--ceo-rail-w);padding:60px 10px 28px}",
        "html.ceo-sb-collapsed #ceo-sidebar .ceo-brand{display:none}",
        "html.ceo-sb-collapsed #ceo-sidebar .ceo-item{justify-content:center;padding:8px 0}",
        "html.ceo-sb-collapsed #ceo-sidebar .ceo-label{position:absolute;width:1px;height:1px;overflow:hidden;",
        "  clip-path:inset(50%);white-space:nowrap}",

        /* arrow, riding the sidebar edge */
        "#ceo-sidebar-toggle{position:fixed;top:18px;left:calc(var(--ceo-side-w) - 14px);z-index:101;",
        "  width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center;",
        "  border:1px solid rgba(20,10,0,.22);border-radius:50%;background:#fff;color:#1A1310;cursor:pointer;",
        "  box-shadow:0 1px 2px rgba(20,10,0,.06);transition:left .25s ease,background .15s,border-color .15s}",
        "#ceo-sidebar-toggle:hover,#ceo-sidebar-toggle:focus-visible{background:#F5DFC9;border-color:#C98F63;outline:none}",
        "#ceo-sidebar-toggle svg{width:16px;height:16px;stroke:currentColor;stroke-width:2.6;fill:none;",
        "  stroke-linecap:round;stroke-linejoin:round;transition:transform .25s ease}",
        "html.ceo-sb-collapsed #ceo-sidebar-toggle{left:calc(var(--ceo-rail-w) - 14px)}",
        "html.ceo-sb-collapsed #ceo-sidebar-toggle svg{transform:rotate(180deg)}",

        /* phones: icon bar across the top, scrolls away with the page */
        "@media (max-width:760px){",
        "  html.ceo-sb,html.ceo-sb.ceo-sb-collapsed{padding-left:0;padding-top:64px}",
        "  #ceo-sidebar,html.ceo-sb-collapsed #ceo-sidebar{position:absolute;right:0;bottom:auto;width:auto;height:64px;",
        "    flex-direction:row;justify-content:center;align-items:center;gap:14px;padding:0 12px;",
        "    border-right:none;border-bottom:1px solid rgba(20,10,0,.10);overflow:hidden}",
        "  #ceo-sidebar-toggle{display:none}",
        "}",

        "@media print{#ceo-sidebar,#ceo-sidebar-toggle{display:none!important}",
        "  html.ceo-sb,html.ceo-sb.ceo-sb-collapsed{padding:0!important}}"
    ].join("\n");

    // hostname + path, ignoring index.html and a trailing slash, so "/roadmap/" == "/roadmap/index.html"
    function pageKey(url) {
        try {
            var u = new URL(url, location.href);
            return u.hostname + u.pathname.replace(/index\.html$/, "").replace(/\/$/, "");
        } catch (e) { return ""; }
    }

    function esc(text) {
        return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    }

    function buildItems() {
        var here = pageKey(location.href);
        return ITEMS.map(function (item) {
            var current = pageKey(item.href) === here ? ' aria-current="page"' : "";
            return '<a class="ceo-item" href="' + esc(item.href) + '" title="' + esc(item.label) + '"' + current + '>' +
                   '<span class="ceo-icon" aria-hidden="true">' + item.icon + '</span>' +
                   '<span class="ceo-label">' + esc(item.label) + '</span></a>';
        }).join("");
    }

    function mount() {
        if (document.getElementById("ceo-sidebar")) return;
        var root = document.documentElement;

        var style = document.createElement("style");
        style.id = "ceo-sidebar-style";
        style.textContent = CSS;
        document.head.appendChild(style);

        var nav = document.createElement("nav");
        nav.id = "ceo-sidebar";
        nav.setAttribute("aria-label", "PearlFox tools");
        nav.innerHTML = '<a class="ceo-brand" href="' + esc(HOME) + '">PearlFox<span>CEO Dashboard</span></a>' + buildItems();

        var toggle = document.createElement("button");
        toggle.id = "ceo-sidebar-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-controls", "ceo-sidebar");
        toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

        document.body.appendChild(nav);
        document.body.appendChild(toggle);
        root.classList.add("ceo-sb");

        var saved = false;
        try { saved = localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { /* private mode: not remembered */ }
        var phone = window.matchMedia("(max-width:760px)");

        // Phones always show the icon bar; the saved choice only applies on larger screens.
        function apply() {
            var collapsed = phone.matches || saved;
            root.classList.toggle("ceo-sb-collapsed", collapsed);
            var label = collapsed ? "Show sidebar" : "Hide sidebar";
            toggle.setAttribute("aria-expanded", String(!collapsed));
            toggle.setAttribute("aria-label", label);
            toggle.title = label;
        }
        toggle.addEventListener("click", function () {
            saved = !saved;
            try { localStorage.setItem(STORAGE_KEY, saved ? "1" : "0"); } catch (e) { /* ignore */ }
            apply();
        });
        if (phone.addEventListener) phone.addEventListener("change", apply);
        apply();
    }

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount);
})();
