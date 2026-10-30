/* App.Deals — calculators. Everything runs locally in the browser. */
(function () {
  "use strict";
  var store = window.AD_STORE, toast = window.AD_TOAST || function () {};
  function $(id) { return document.getElementById(id); }
  function num(id) { var v = parseFloat(($(id) || {}).value); return isFinite(v) ? v : 0; }
  function money(v) { return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function bind(ids, fn) { ids.forEach(function (id) { var el = $(id); if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); } }); fn(); }
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  /* 1. Subscription audit */
  var sa = $("sa-rows");
  if (sa) {
    var PER_YEAR = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
    var rows = store.json("ad-subs", null);
    var sample = [["Music streaming", 11.99, "monthly", "daily"], ["Video streaming", 15.49, "monthly", "weekly"], ["Cloud storage", 2.99, "monthly", "daily"],
      ["Fitness app", 79.99, "yearly", "rarely"], ["Photo editor", 9.99, "monthly", "monthly"], ["News site", 4, "weekly", "rarely"]];
    if (!rows) rows = sample.map(function (r) { return { n: r[0], p: r[1], c: r[2], u: r[3] }; });
    var draw = function () {
      sa.innerHTML = rows.map(function (r, i) {
        return "<tr><td><input aria-label='Name' data-i='" + i + "' data-k='n' value='" + esc(r.n) + "'></td>" +
          "<td style='width:110px'><input aria-label='Price' type='number' min='0' step='0.01' data-i='" + i + "' data-k='p' value='" + r.p + "'></td>" +
          "<td style='width:130px'><select aria-label='Billing' data-i='" + i + "' data-k='c'>" + ["weekly", "monthly", "quarterly", "yearly"].map(function (c) { return "<option" + (c === r.c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></td>" +
          "<td style='width:120px'><select aria-label='How often you use it' data-i='" + i + "' data-k='u'>" + ["daily", "weekly", "monthly", "rarely"].map(function (c) { return "<option" + (c === r.u ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></td>" +
          "<td style='width:34px'><button class='x-btn' type='button' data-del='" + i + "' aria-label='Remove'>&times;</button></td></tr>";
      }).join("");
      calc();
    };
    var calc = function () {
      var year = 0, rare = 0, list = [];
      rows.forEach(function (r) { var y = (+r.p || 0) * (PER_YEAR[r.c] || 12); year += y; if (r.u === "rarely") rare += y; list.push([r.n || "Untitled", y, r.u]); });
      list.sort(function (a, b) { return b[1] - a[1]; });
      $("sa-year").textContent = money(year);
      $("sa-month").textContent = money(year / 12);
      $("sa-five").textContent = money(year * 5);
      $("sa-rare").textContent = money(rare);
      $("sa-count").textContent = rows.length;
      $("sa-bar").style.width = (year ? Math.round(rare / year * 100) : 0) + "%";
      $("sa-top").innerHTML = list.slice(0, 5).map(function (x) { return "<div class='kv'><span>" + esc(x[0]) + (x[2] === "rarely" ? " <span class='badge discount'>rarely used</span>" : "") + "</span><b>" + money(x[1]) + "/yr</b></div>"; }).join("");
      store.put("ad-subs", rows);
    };
    sa.addEventListener("input", function (e) { var t = e.target, i = t.getAttribute("data-i"); if (i === null) return; rows[+i][t.getAttribute("data-k")] = t.getAttribute("data-k") === "p" ? parseFloat(t.value) || 0 : t.value; calc(); });
    sa.addEventListener("change", function (e) { var t = e.target, i = t.getAttribute("data-i"); if (i === null) return; rows[+i][t.getAttribute("data-k")] = t.value; calc(); });
    sa.addEventListener("click", function (e) { var d = e.target.getAttribute("data-del"); if (d !== null) { rows.splice(+d, 1); draw(); } });
    $("sa-add").addEventListener("click", function () { rows.push({ n: "", p: 0, c: "monthly", u: "weekly" }); draw(); var ins = sa.querySelectorAll("input[data-k='n']"); ins[ins.length - 1].focus(); });
    $("sa-sample").addEventListener("click", function () { rows = sample.map(function (r) { return { n: r[0], p: r[1], c: r[2], u: r[3] }; }); draw(); });
    $("sa-clear").addEventListener("click", function () { rows = []; draw(); });
    $("sa-csv").addEventListener("click", function () {
      var csv = "Name,Price,Billing,Use,Yearly cost\n" + rows.map(function (r) { return ['"' + String(r.n).replace(/"/g, '""') + '"', r.p, r.c, r.u, ((+r.p || 0) * (PER_YEAR[r.c] || 12)).toFixed(2)].join(","); }).join("\n");
      download("subscription-audit.csv", csv, "text/csv"); toast("CSV downloaded");
    });
    draw();
  }

  /* 2. Lifetime deal calculator */
  if ($("ltd-price")) bind(["ltd-price", "ltd-monthly", "ltd-years", "ltd-risk"], function () {
    var price = num("ltd-price"), monthly = num("ltd-monthly"), years = Math.max(1, Math.round(num("ltd-years"))), risk = Math.min(90, Math.max(0, num("ltd-risk"))) / 100;
    $("ltd-risk-out").textContent = Math.round(risk * 100) + "%";
    var be = monthly > 0 ? price / monthly : Infinity, s = 1 - risk, expMonths = 0, bars = "";
    for (var y = 0; y < years; y++) { var alive = Math.pow(s, y); expMonths += 12 * alive; }
    var value = expMonths * monthly, net = value - price;
    $("ltd-be").textContent = isFinite(be) ? be.toFixed(1) + " months" : "n/a";
    $("ltd-exp").textContent = expMonths.toFixed(1) + " months";
    $("ltd-value").textContent = money(value);
    $("ltd-net").textContent = money(net);
    var cum = 0;
    for (y = 0; y < years; y++) { cum += 12 * Math.pow(s, y) * monthly; var pct = Math.min(100, Math.round(cum / Math.max(price, value, 1) * 100)); bars += "<div class='small'>Year " + (y + 1) + ": " + money(cum) + " of subscription avoided</div><div class='bar'><i style='width:" + pct + "%;background:" + (cum >= price ? "var(--save)" : "var(--brand)") + "'></i></div>"; }
    $("ltd-bars").innerHTML = bars;
    var v = $("ltd-verdict");
    if (!monthly || !price) v.textContent = "Enter a lifetime price and the equivalent monthly price.";
    else if (net > price * 0.5) v.textContent = "Strong value, even after allowing for the risk that the product changes or shuts down. Still check the plan limits and refund window.";
    else if (net > 0) v.textContent = "Positive but modest. Worth it only if you need the tool now and the limits fit your usage.";
    else v.textContent = "Not worth it on these numbers. A monthly plan you can cancel is the safer choice.";
  });

  /* 3. Deal checker */
  var dc = $("dc-form");
  if (dc) {
    var run = function () {
      var score = 100, flags = [], answered = 0, total = dc.querySelectorAll(".quiz-q").length;
      dc.querySelectorAll(".quiz-q").forEach(function (q) {
        var on = q.querySelector("input:checked"); if (!on) return; answered++;
        var w = +on.value; if (w > 0) { score -= w; flags.push(q.getAttribute("data-flag")); }
      });
      score = Math.max(0, score);
      $("dc-score").textContent = answered ? score : "--";
      $("dc-bar").style.width = (answered ? score : 0) + "%";
      $("dc-bar").style.background = score >= 75 ? "var(--save)" : score >= 50 ? "var(--amber)" : "var(--brand)";
      $("dc-answered").textContent = answered + " of " + total + " answered";
      $("dc-verdict").textContent = !answered ? "Answer the questions to score the deal." : answered < total ? "Keep going: answer all " + total + " questions for a final verdict." : score >= 75 ? "Looks like a genuine deal. Buy if it's on your list." : score >= 50 ? "Proceed with caution. Resolve the red flags before paying." : "Skip it. Too many warning signs for the money.";
      $("dc-flags").innerHTML = flags.length ? flags.map(function (f) { return "<div class='kv'><span>⚠️ " + esc(f) + "</span></div>"; }).join("") : "";
    };
    dc.addEventListener("change", run); $("dc-reset").addEventListener("click", function () { dc.reset(); run(); }); run();
  }

  /* 4. Annual vs monthly */
  if ($("am-monthly")) bind(["am-monthly", "am-annual", "am-prob", "am-quit"], function () {
    var m = num("am-monthly"), a = num("am-annual"), p = num("am-prob") / 100, q = Math.max(0, Math.min(12, num("am-quit")));
    $("am-prob-out").textContent = Math.round(p * 100) + "%";
    var be = m > 0 ? a / m : 0, full = m * 12, save = full - a, expMonthly = m * (p * 12 + (1 - p) * q);
    $("am-be").textContent = be ? be.toFixed(1) + " months" : "n/a";
    $("am-save").textContent = money(save) + (full ? " (" + Math.round(save / full * 100) + "%)" : "");
    $("am-expm").textContent = money(expMonthly);
    $("am-expa").textContent = money(a);
    $("am-verdict").textContent = !m || !a ? "Enter both prices." : expMonthly > a ? "Annual wins on expected cost. Choose annual if you've already used the app for a few months." : "Monthly wins on expected cost. Start monthly and switch later if the app earns its place.";
  });

  /* 5. Family plan splitter */
  if ($("fp-ind")) bind(["fp-ind", "fp-fam", "fp-people", "fp-cycle"], function () {
    var ind = num("fp-ind"), fam = num("fp-fam"), n = Math.max(1, Math.round(num("fp-people"))), mult = $("fp-cycle").value === "yearly" ? 1 : 12;
    $("fp-people-out").textContent = n;
    var per = fam / n, allInd = ind * n, saving = (allInd - fam) * mult, be = ind > 0 ? Math.ceil(fam / ind) : 0;
    $("fp-per").textContent = money(per);
    $("fp-all").textContent = money(allInd);
    $("fp-save").textContent = money(saving) + " per year";
    $("fp-be").textContent = be ? be + " people" : "n/a";
    $("fp-verdict").textContent = !ind || !fam ? "Enter both prices." : saving > 0 ? "The family plan saves money with " + n + " active users." : "With " + n + " user" + (n > 1 ? "s" : "") + ", individual plans are cheaper. The family plan pays off from " + be + " active people.";
  });

  /* 6. Perk finder */
  var pf = $("pf-form");
  if (pf && window.AD_DEALS) {
    var go = function () {
      var who = (pf.querySelector("input[name=who]:checked") || {}).value || "everyone";
      var needs = Array.prototype.map.call(pf.querySelectorAll("input[name=need]:checked"), function (x) { return x.value; });
      var hits = window.AD_DEALS.filter(function (d) {
        var aud = d.a.split(" "), top = d.t.split(" ");
        var okWho = who === "everyone" ? aud.indexOf("everyone") > -1 : (aud.indexOf(who) > -1 || aud.indexOf("everyone") > -1);
        var okNeed = !needs.length || needs.some(function (n) { return top.indexOf(n) > -1; });
        return okWho && okNeed;
      });
      hits.sort(function (x, y) { return (y.a.indexOf(who) > -1) - (x.a.indexOf(who) > -1); });
      $("pf-count").textContent = hits.length + " programme" + (hits.length === 1 ? "" : "s") + " match";
      $("pf-out").innerHTML = hits.length ? hits.map(function (d) {
        return "<div class='card'><span class='badge " + d.y + "'>" + esc(d.y) + "</span><h3 style='margin-top:8px'>" + esc(d.n) + "</h3><p class='small muted'>" + esc(d.o) + "</p><a class='btn ghost sm' href='../deals.html#" + d.i + "'>Eligibility &amp; steps</a> <a class='btn dark sm' href='" + esc(d.u) + "' target='_blank' rel='noopener nofollow'>Official page</a></div>";
      }).join("") : "<div class='empty'>No matches for that combination. Try fewer needs.</div>";
    };
    pf.addEventListener("change", go); go();
  }

  /* 7. Price watchlist */
  var wl = $("wl-list");
  if (wl) {
    var items = store.json("ad-watch", []);
    var paint = function () {
      store.put("ad-watch", items);
      $("wl-count").textContent = items.length;
      if (!items.length) { wl.innerHTML = "<div class='empty'>Your watchlist is empty. Add an app above.</div>"; return; }
      wl.innerHTML = items.map(function (it, i) {
        var hit = it.cur > 0 && it.cur <= it.target, gap = it.cur - it.target;
        return "<div class='card' style='display:grid;gap:8px'><div style='display:flex;justify-content:space-between;gap:10px;align-items:start'><div><h3 style='margin:0'>" + esc(it.name) + "</h3><span class='small muted'>" + esc(it.plat || "Any platform") + " · added " + esc(it.added) + "</span></div>" +
          (hit ? "<span class='badge free'>Target reached</span>" : "<span class='badge'>" + money(gap) + " to go</span>") + "</div>" +
          "<div class='row' style='display:grid;grid-template-columns:1fr 1fr;gap:10px'><label class='small'>Current price<input type='number' min='0' step='0.01' data-w='" + i + "' value='" + it.cur + "' style='width:100%;border:1px solid var(--line);border-radius:9px;padding:8px;background:var(--paper);color:var(--ink)'></label><div class='small'>Target<br><b style='font-size:1.2rem'>" + money(it.target) + "</b></div></div>" +
          "<div style='display:flex;gap:8px;flex-wrap:wrap'>" + (it.url ? "<a class='btn dark sm' href='" + esc(it.url) + "' target='_blank' rel='noopener nofollow'>Check price</a>" : "") + "<button class='btn ghost sm' type='button' data-wdel='" + i + "'>Remove</button></div></div>";
      }).join("");
    };
    $("wl-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var url = $("wl-url").value.trim();
      if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
      items.unshift({ name: $("wl-name").value.trim(), url: url, plat: $("wl-plat").value, cur: num("wl-cur"), target: num("wl-target"), added: new Date().toLocaleDateString() });
      e.target.reset(); paint(); toast("Added to your watchlist");
    });
    wl.addEventListener("change", function (e) { var i = e.target.getAttribute("data-w"); if (i !== null) { items[+i].cur = parseFloat(e.target.value) || 0; paint(); } });
    wl.addEventListener("click", function (e) { var i = e.target.getAttribute("data-wdel"); if (i !== null) { items.splice(+i, 1); paint(); } });
    $("wl-export").addEventListener("click", function () { download("app-watchlist.json", JSON.stringify(items, null, 2), "application/json"); });
    $("wl-import").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var d = JSON.parse(r.result); if (Array.isArray(d)) { items = d.concat(items); paint(); toast("Imported " + d.length + " items"); } } catch (x) { toast("That file isn't a watchlist export"); } };
      r.readAsText(f);
    });
    var wf = $("wl-alert"); if (wf) wf._extra = function () { return { watchlist: items.map(function (x) { return x.name + " (target " + money(x.target) + ")"; }).join("; ") }; };
    paint();
  }
})();
