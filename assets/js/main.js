/* App.Deals — core interactions (no dependencies) */
(function () {
  "use strict";
  var S = window.SITE || {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    json: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    put: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  window.AD_STORE = store;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* Toast */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  window.AD_TOAST = toast;

  /* Theme */
  var root = document.documentElement, saved = store.get("ad-theme");
  if (saved) root.setAttribute("data-theme", saved);
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next); store.set("ad-theme", next);
    });
  });

  /* Mobile menu + active link */
  var mb = $(".menu-btn"), nav = document.getElementById("nav");
  if (mb && nav) mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  var here = location.pathname.split("/").pop() || "index.html";
  $$("#nav a").forEach(function (a) { if (a.getAttribute("href").split("/").pop() === here) a.setAttribute("aria-current", "page"); });

  /* Year */
  $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* Cookie consent (non-personalised ads unless accepted) */
  var c = document.getElementById("consent"), choice = store.get("ad-consent");
  if (choice !== "all") (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
  if (c && !choice) {
    c.hidden = false;
    $$("[data-consent]", c).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-consent"); store.set("ad-consent", v);
        (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = v === "all" ? 0 : 1;
        c.hidden = true;
      });
    });
  }

  /* Form relay (address assembled at runtime, never present in markup) */
  function relay() {
    var k = S._k || [];
    var rev = function (b) { return atob(b).split("").reverse().join(""); };
    return "https://formsubmit.co/ajax/" + rev(k[0]) + String.fromCharCode(64) + rev(k[1]);
  }

  /* Multi-step forms */
  $$("form[data-steps]").forEach(function (f) {
    var steps = $$(".step", f), bars = $$(".steps-bar i", f), i = 0;
    function show(n) {
      steps.forEach(function (s, j) { s.hidden = j !== n; });
      bars.forEach(function (b, j) { b.classList.toggle("on", j <= n); });
      i = n;
      var first = steps[n].querySelector("input,select,textarea"); if (first && n > 0) first.focus();
    }
    $$("[data-next]", f).forEach(function (b) {
      b.addEventListener("click", function () {
        var ok = true, st = f.querySelector(".form-status");
        $$("[required]", steps[i]).forEach(function (el) { if (ok && !el.checkValidity()) { el.reportValidity(); ok = false; } });
        var group = steps[i].querySelector("[data-need-one]");
        if (ok && group && !group.querySelector("input:checked")) { ok = false; if (st) { st.className = "form-status err"; st.textContent = "Pick at least one option to continue."; } }
        if (ok) { if (st) st.textContent = ""; show(i + 1); }
      });
    });
    $$("[data-prev]", f).forEach(function (b) { b.addEventListener("click", function () { show(i - 1); }); });
    show(0);
  });

  /* All forms → relay */
  $$("form[data-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = f.querySelector(".form-status"), btn = f.querySelector("[type=submit]");
      var hp = f.querySelector(".hp input"); if (hp && hp.value) return;
      var data = {};
      new FormData(f).forEach(function (v, k) { if (k === "_hp") return; data[k] = data[k] ? data[k] + ", " + v : v; });
      data._subject = "App.Deals: " + f.getAttribute("data-form") + (data.name ? " from " + data.name : "");
      data._template = "table"; data._captcha = "false"; data.page = location.href;
      if (typeof f._extra === "function") { var x = f._extra(); for (var key in x) data[key] = x[key]; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
      if (status) { status.className = "form-status"; status.textContent = ""; }
      fetch(relay(), { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () {
          var go = f.getAttribute("data-redirect");
          if (go) { location.href = go; return; }
          if (status) { status.className = "form-status ok"; status.textContent = f.getAttribute("data-ok") || "Sent. We reply within two business days."; }
          f.reset();
        })
        .catch(function () {
          if (status) { status.className = "form-status err"; status.textContent = "That didn't go through. Check your connection and try again, or use the contact page."; }
        })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  /* Lite YouTube: nothing loads from YouTube until the visitor clicks */
  $$("[data-yt],[data-ytlist]").forEach(function (box) {
    var id = box.getAttribute("data-yt"), list = box.getAttribute("data-ytlist");
    if (id) box.style.backgroundImage = "url(https://i.ytimg.com/vi/" + id + "/hqdefault.jpg)";
    var b = box.querySelector("button"); if (!b) return;
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = id ? "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0"
                 : "https://www.youtube-nocookie.com/embed/videoseries?list=" + list + "&autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label") || "Video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
  });

  /* Support tiers + optional payment links */
  var tiers = $$(".tier");
  if (tiers.length) {
    var amt = document.getElementById("amount");
    tiers.forEach(function (t) {
      t.addEventListener("click", function () {
        tiers.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        t.setAttribute("aria-pressed", "true"); if (amt) amt.value = t.getAttribute("data-amount");
      });
    });
    var p = S.payments || {}, box = document.getElementById("pay-links");
    if (box) {
      var any = false;
      [["paypal", "Give with PayPal"], ["stripe", "Give by card (Stripe)"], ["buymeacoffee", "Buy us a coffee"]].forEach(function (l) {
        if (p[l[0]]) { any = true; var a = document.createElement("a"); a.href = p[l[0]]; a.className = "btn primary"; a.target = "_blank"; a.rel = "noopener"; a.textContent = l[1]; box.appendChild(a); }
      });
      if (any) { var n = document.getElementById("pay-note"); if (n) n.hidden = false; }
    }
  }

  /* Countdown to the next sale event */
  $$("[data-events]").forEach(function (card) {
    var evs; try { evs = JSON.parse(card.getAttribute("data-events")); } catch (e) { return; }
    var now = new Date(), next = null;
    for (var j = 0; j < evs.length; j++) { var d = new Date(evs[j][1] + "T00:00:00"); if (d > now) { next = [evs[j][0], d, evs[j][2]]; break; } }
    if (!next) return;
    var nm = card.querySelector("[data-ev-name]"), dt = card.querySelector("[data-ev-date]"), lk = card.querySelector("[data-ev-link]");
    if (nm) nm.textContent = next[0];
    if (dt) dt.textContent = next[1].toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" });
    if (lk && next[2]) lk.setAttribute("href", next[2]);
    function tick() {
      var ms = Math.max(0, next[1] - new Date());
      var v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
      $$("[data-cd]", card).forEach(function (el, k) { el.textContent = String(v[k]).padStart(2, "0"); });
    }
    tick(); setInterval(tick, 1000);
  });

  /* Calendar page: mark past / next and days-away */
  var tl = $(".timeline");
  if (tl) {
    var marked = false, today = new Date(); today.setHours(0, 0, 0, 0);
    $$(".event", tl).forEach(function (ev) {
      var d = new Date(ev.getAttribute("data-date") + "T00:00:00"), diff = Math.round((d - today) / 864e5), out = ev.querySelector(".days");
      if (diff < 0) { ev.classList.add("past"); if (out) out.textContent = "Passed"; }
      else { if (out) out.textContent = diff === 0 ? "Today" : "In " + diff + " day" + (diff === 1 ? "" : "s"); if (!marked) { ev.classList.add("next"); marked = true; } }
    });
  }

  /* Saved deals (browser only) */
  var saved = store.json("ad-saved", []);
  function syncSaved() { $$("[data-save]").forEach(function (b) { b.setAttribute("aria-pressed", saved.indexOf(b.getAttribute("data-save")) > -1 ? "true" : "false"); }); var n = $("[data-saved-count]"); if (n) n.textContent = saved.length; }
  $$("[data-save]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-save"), i = saved.indexOf(id);
      if (i > -1) { saved.splice(i, 1); toast("Removed from your saved deals"); } else { saved.push(id); toast("Saved. Find it under the Saved filter"); }
      store.put("ad-saved", saved); syncSaved();
      if (window.AD_FILTER) window.AD_FILTER();
    });
  });
  syncSaved();

  /* Share / copy */
  $$("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = new URL(b.getAttribute("data-share"), location.href).href, title = b.getAttribute("data-title") || document.title;
      if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }); else prompt("Copy this link", url);
    });
  });

  /* Generic filter engine: [data-filter-scope] containing [data-item] with data-* facets */
  $$("[data-filter-scope]").forEach(function (scope) {
    var items = $$("[data-item]", scope), q = $("[data-q]", scope), sort = $("[data-sort]", scope), count = $("[data-count]", scope), empty = $("[data-empty]", scope);
    var selects = $$("select[data-facet]", scope), chipGroups = {};
    $$("[data-chip]", scope).forEach(function (ch) {
      var g = ch.getAttribute("data-chip"); (chipGroups[g] = chipGroups[g] || []).push(ch);
      ch.addEventListener("click", function () {
        chipGroups[g].forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        ch.setAttribute("aria-pressed", "true"); run(true);
      });
    });
    var params = new URLSearchParams(location.search);
    if (q && params.get("q")) q.value = params.get("q");
    Object.keys(chipGroups).forEach(function (g) {
      var want = params.get(g); if (!want) return;
      chipGroups[g].forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-value") === want ? "true" : "false"); });
    });
    selects.forEach(function (s) { var v = params.get(s.getAttribute("data-facet")); if (v) s.value = v; });
    function run(push) {
      var term = q ? q.value.trim().toLowerCase() : "", shown = 0, state = {};
      Object.keys(chipGroups).forEach(function (g) { var on = chipGroups[g].filter(function (x) { return x.getAttribute("aria-pressed") === "true"; })[0]; state[g] = on ? on.getAttribute("data-value") : "all"; });
      selects.forEach(function (s) { state[s.getAttribute("data-facet")] = s.value; });
      items.forEach(function (it) {
        var ok = true;
        Object.keys(state).forEach(function (g) {
          var v = state[g]; if (!ok || v === "all") return;
          if (g === "saved") { ok = saved.indexOf(it.getAttribute("data-id")) > -1; return; }
          var have = (it.getAttribute("data-" + g) || "").split(" ");
          ok = have.indexOf(v) > -1;
        });
        if (ok && term) ok = (it.getAttribute("data-text") || it.textContent).toLowerCase().indexOf(term) > -1;
        it.hidden = !ok; if (ok) shown++;
      });
      if (sort) {
        var by = sort.value, parent = items[0] && items[0].parentNode;
        if (parent) items.slice().sort(function (a, b) {
          if (by === "az") return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
          if (by === "za") return b.getAttribute("data-name").localeCompare(a.getAttribute("data-name"));
          return (+a.getAttribute("data-order")) - (+b.getAttribute("data-order"));
        }).forEach(function (el) { parent.appendChild(el); });
      }
      if (count) count.textContent = shown + (shown === 1 ? " result" : " results");
      if (empty) empty.hidden = shown > 0;
      if (push && history.replaceState) {
        var p = new URLSearchParams();
        if (term) p.set("q", term);
        Object.keys(state).forEach(function (g) { if (state[g] !== "all") p.set(g, state[g]); });
        history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
      }
    }
    window.AD_FILTER = function () { run(false); };
    if (q) q.addEventListener("input", function () { run(true); });
    if (sort) sort.addEventListener("change", function () { run(true); });
    selects.forEach(function (s) { s.addEventListener("change", function () { run(true); }); });
    var reset = $("[data-reset]", scope);
    if (reset) reset.addEventListener("click", function () {
      if (q) q.value = ""; selects.forEach(function (s) { s.value = "all"; });
      Object.keys(chipGroups).forEach(function (g) { chipGroups[g].forEach(function (x, k) { x.setAttribute("aria-pressed", k === 0 ? "true" : "false"); }); });
      run(true);
    });
    run(false);
  });

  /* Site search page */
  window.addEventListener("load", function () {
  var sOut = document.getElementById("search-results");
  if (sOut && window.AD_INDEX) {
    var sIn = document.getElementById("search-input");
    var qp = new URLSearchParams(location.search).get("q") || "";
    sIn.value = qp;
    var render = function () {
      var t = sIn.value.trim().toLowerCase(), words = t.split(/\s+/).filter(Boolean);
      if (!words.length) { sOut.innerHTML = "<p class='muted'>Type to search deals, perks, free alternatives, guides and tools.</p>"; return; }
      var hits = window.AD_INDEX.map(function (r) {
        var hay = (r.t + " " + r.d + " " + r.k).toLowerCase(), score = 0;
        words.forEach(function (w) { if (hay.indexOf(w) > -1) score += 1; if (r.t.toLowerCase().indexOf(w) > -1) score += 2; });
        return [score, r];
      }).filter(function (x) { return x[0] >= words.length; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 40);
      sOut.innerHTML = hits.length ? hits.map(function (h) {
        var r = h[1], e = function (s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); };
        return "<a class='card' href='" + e(r.u) + "'><span class='badge'>" + e(r.c) + "</span><h3 style='margin-top:8px'>" + e(r.t) + "</h3><p class='muted small'>" + e(r.d) + "</p></a>";
      }).join("") : "<div class='empty'>No matches. Try a broader word like “students”, “free” or “video”.</div>";
    };
    sIn.addEventListener("input", render); render();
  }
  });

  /* "/" focuses the main search box */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    var s = $("[data-q]") || $("#search-input") || $(".searchbar input"); if (s) { e.preventDefault(); s.focus(); }
  });

  /* Guides: reading progress + table of contents */
  var art = $(".article[data-toc]");
  if (art) {
    var heads = $$("h2", art), tocBox = document.getElementById("toc");
    if (tocBox && heads.length > 2) {
      var ol = document.createElement("ol");
      heads.forEach(function (h, k) {
        if (!h.id) h.id = "s-" + (k + 1);
        var li = document.createElement("li"), a = document.createElement("a"); a.href = "#" + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li);
      });
      tocBox.appendChild(ol); tocBox.hidden = false;
    }
    var bar = $(".progress");
    if (bar) window.addEventListener("scroll", function () {
      var r = art.getBoundingClientRect(), total = art.offsetHeight - window.innerHeight;
      bar.style.width = Math.min(100, Math.max(0, (-r.top / (total > 0 ? total : 1)) * 100)) + "%";
    }, { passive: true });
  }

  /* Back to top */
  var tt = $(".to-top");
  if (tt) { window.addEventListener("scroll", function () { tt.classList.toggle("show", window.scrollY > 900); }, { passive: true }); tt.addEventListener("click", function () { window.scrollTo(0, 0); }); }
})();
