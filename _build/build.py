#!/usr/bin/env python3
"""Generates App.Deals data-driven pages as Jekyll source files (front matter + HTML).
GitHub Pages applies the layouts in _layouts/. Run from the repo root:  python3 _build/build.py
Generated: deals.html, alternatives.html, calendar.html, guides.html, videos.html, sitemap.html,
sitemap.xml, assets/js/search-index.js, and the featured block inside index.html."""
import datetime, html, json, os, re, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "_build"))
from data import DEALS, MARKETS, ALTS, ALT_CATS, EVENTS, VIDEOS, VIDEO_SEARCHES, LISTED  # noqa: E402

E = lambda s: html.escape(str(s), quote=True)
PALETTE = ["#ff4d2e", "#5b3df5", "#0a8f5a", "#b86e00", "#0f6fd1", "#c2185b", "#00897b", "#6d4c41", "#3949ab", "#d84315"]
AUD = {"students": "Students", "educators": "Educators", "startups": "Startups", "nonprofits": "Nonprofits", "everyone": "Everyone"}
TYPE = {"free": "Free", "discount": "Discount", "credits": "Credits", "bundle": "Bundle"}
TOPIC = {"dev": "Developer tools", "cloud": "Cloud & hosting", "design": "Design", "productivity": "Productivity", "creative": "Creative",
         "learning": "Learning", "business": "Business", "media": "Music, video & books", "games": "Games", "security": "Security"}
OUT = []


def color(name):
    return PALETTE[sum(ord(c) for c in name) % len(PALETTE)]


def initials(name):
    w = [x for x in re.split(r"[\s\-]+", name) if x and x[0].isalnum()]
    return (w[0][0] + (w[1][0] if len(w) > 1 else "")).upper()


def fm(**kw):
    lines = ["---"] + ["%s: %s" % (k, json.dumps(v, ensure_ascii=False)) for k, v in kw.items()] + ["---", ""]
    return "\n".join(lines)


def write(path, text):
    assert "{{" not in text.split("---", 2)[-1] and "{%" not in text.split("---", 2)[-1], "Liquid tag in " + path
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)
    OUT.append(path)


def page(path, title, desc, body, base="", scripts=""):
    meta = dict(layout="default", title=title, description=desc, canon="" if path == "index.html" else path, base=base)
    if scripts:
        meta["scripts"] = scripts
    write(path, fm(**meta) + body)


# ------------------------------------------------------------------ deals
def deal_card(d, i):
    auds = d["audience"].split()
    badges = '<span class="badge %s">%s</span>' % (d["type"], TYPE[d["type"]]) + "".join('<span class="badge">%s</span>' % AUD[a] for a in auds)
    steps = "".join("<li>%s</li>" % E(s) for s in d["steps"])
    return f'''<article class="deal" id="{d["id"]}" data-item data-id="{d["id"]}" data-name="{E(d["name"])}" data-order="{i}" data-audience="{d["audience"]}" data-type="{d["type"]}" data-topic="{d["topic"]}">
 <div class="deal-top"><span class="mono" style="background:{color(d["name"])}" aria-hidden="true">{initials(d["name"])}</span><div><h3>{E(d["name"])}</h3><span class="by">by {E(d["by"])}</span></div></div>
 <div class="badges">{badges}</div>
 <p class="offer">{E(d["offer"])}</p>
 <p>{E(d["why"])}</p>
 <details><summary>Eligibility and how to claim</summary><p><strong>Who qualifies:</strong> {E(d["who"])}</p><ol>{steps}</ol></details>
 <div class="deal-foot"><span class="meta">Listed {LISTED}</span>
  <button class="save-btn" type="button" data-save="{d["id"]}" aria-pressed="false" aria-label="Save {E(d["name"])}">&#9734;</button>
  <button class="save-btn" type="button" data-share="deals.html#{d["id"]}" data-title="{E(d["name"])} on App.Deals" aria-label="Share {E(d["name"])}">&#8599;</button>
  <a class="btn dark sm" href="{E(d["url"])}" target="_blank" rel="noopener nofollow">Official page</a></div>
</article>'''


def build_deals():
    counts = {a: sum(1 for d in DEALS if a in d["audience"].split()) for a in AUD}
    chips = '<button class="chip" type="button" data-chip="audience" data-value="all" aria-pressed="true">All (%d)</button>' % len(DEALS)
    chips += "".join('<button class="chip" type="button" data-chip="audience" data-value="%s" aria-pressed="false">%s (%d)</button>' % (a, AUD[a], counts[a]) for a in AUD)
    chips += '<button class="chip" type="button" data-chip="audience" data-value="saved" aria-pressed="false">&#9733; Saved (<span data-saved-count>0</span>)</button>'
    type_opts = "".join('<option value="%s">%s</option>' % (k, v) for k, v in TYPE.items())
    topic_opts = "".join('<option value="%s">%s</option>' % (k, v) for k, v in TOPIC.items())
    cards = "\n".join(deal_card(d, i) for i, d in enumerate(DEALS))
    markets = "".join('<a class="card" href="%s" target="_blank" rel="noopener nofollow"><h3>%s &#8599;</h3><p class="small muted">%s</p></a>' % (E(u), E(n), E(t)) for n, u, t in MARKETS)
    options = "".join('<option>%s</option>' % E(d["name"]) for d in DEALS)
    itemlist = {"@context": "https://schema.org", "@type": "ItemList", "name": "Software deals and perks programmes", "numberOfItems": len(DEALS),
                "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": d["name"], "url": "https://app.deals/deals.html#" + d["id"]} for i, d in enumerate(DEALS)]}
    body = f'''<div class="wrap page-head">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <span>Deals &amp; perks</span></nav>
 <h1>Software deals &amp; perks</h1>
 <p class="lede">{len(DEALS)} programmes that make apps and software free or cheaper: student and teacher perks, startup credits, nonprofit donations, free tiers, family sharing and bundles. Each listing explains who qualifies and how to claim, and links to the official page.</p>
 <div class="notice v small" style="margin-top:14px">We list programmes we believe are useful; we do not sell these offers. Terms change, so confirm details on the official page before applying or buying. <a href="editorial-policy.html">How we list deals</a>.</div>
</div>
<section class="wrap" data-filter-scope style="padding-bottom:30px">
 <div class="toolbar" role="search">
  <label class="sr" for="deal-q">Search deals</label><input id="deal-q" type="search" placeholder="Search deals, e.g. cloud, design, Office  ( / )" data-q>
  <label class="sr" for="deal-type">Type</label><select id="deal-type" data-facet="type"><option value="all">All types</option>{type_opts}</select>
  <label class="sr" for="deal-topic">Topic</label><select id="deal-topic" data-facet="topic"><option value="all">All topics</option>{topic_opts}</select>
  <label class="sr" for="deal-sort">Sort</label><select id="deal-sort" data-sort><option value="order">Featured order</option><option value="az">Name A to Z</option><option value="za">Name Z to A</option></select>
  <button class="btn ghost sm" type="button" data-reset>Reset</button>
 </div>
 <div class="filter-row" aria-label="Audience">{chips}</div>
 <p class="result-count" data-count aria-live="polite"></p>
 <div class="deals">
{cards}
 </div>
 <div class="empty" data-empty hidden>No listings match those filters. <button class="btn ghost sm" type="button" data-reset>Clear filters</button></div>
</section>
<section class="section alt">
 <div class="wrap">
  <div class="section-head"><div><h2>Where deal hunters look</h2><p>Marketplaces and directories that regularly carry software offers. Listed for reference, not endorsement; apply the checks in our <a href="guides/spot-fake-discounts.html">fake-discount guide</a> before buying anywhere.</p></div></div>
  <div class="grid g4">{markets}</div>
 </div>
</section>
<section class="section">
 <div class="wrap grid g2" style="align-items:start">
  <div class="card">
   <h2 style="font-size:1.5rem">Know a deal we missed?</h2>
   <p class="muted">Share a programme, perk or offer. Our editors check every tip before listing it.</p>
   <form class="form" data-form="Deal tip" data-ok="Thanks! We'll review your tip.">
    <div class="hp"><label>Leave empty<input name="_hp" tabindex="-1" autocomplete="off"></label></div>
    <div><label for="tip-name">Deal or programme name</label><input id="tip-name" name="deal" required></div>
    <div><label for="tip-url">Official link</label><input id="tip-url" name="url" type="url" required placeholder="https://"></div>
    <div><label for="tip-why">Why it's worth listing</label><textarea id="tip-why" name="details" required></textarea></div>
    <div><label for="tip-email">Your email (optional, for credit)</label><input id="tip-email" name="email" type="email" autocomplete="email"></div>
    <button class="btn primary" type="submit">Send tip</button><p class="form-status" aria-live="polite"></p>
   </form>
  </div>
  <div class="card">
   <h2 style="font-size:1.5rem">Report an outdated listing</h2>
   <p class="muted">Programmes change. Tell us what's wrong and we'll fix it, usually within a few days.</p>
   <form class="form" data-form="Listing report" data-ok="Thanks for the report. We'll check it.">
    <div class="hp"><label>Leave empty<input name="_hp" tabindex="-1" autocomplete="off"></label></div>
    <div><label for="rep-item">Listing</label><select id="rep-item" name="listing">{options}</select></div>
    <div><label for="rep-issue">What's wrong?</label><select id="rep-issue" name="issue"><option>Offer has ended</option><option>Terms or eligibility changed</option><option>Link is broken</option><option>Other</option></select></div>
    <div><label for="rep-more">Details</label><textarea id="rep-more" name="details"></textarea></div>
    <button class="btn dark" type="submit">Send report</button><p class="form-status" aria-live="polite"></p>
   </form>
  </div>
 </div>
</section>
<script type="application/ld+json">{json.dumps(itemlist, separators=(",", ":"))}</script>
'''
    page("deals.html", "Software Deals & Perks for Students, Startups and Nonprofits | App.Deals",
         "%d free and discounted software programmes: student perks, startup cloud credits, nonprofit donations, free tiers and family sharing, with eligibility and how to claim." % len(DEALS), body)


# ------------------------------------------------------------------ alternatives
def build_alts():
    cats = {"creative": "Creative & media", "office": "Office & personal", "team": "Teams & communication", "business": "Business & marketing", "dev": "Developers & data"}
    chips = '<button class="chip" type="button" data-chip="cat" data-value="all" aria-pressed="true">All</button>' + "".join(
        '<button class="chip" type="button" data-chip="cat" data-value="%s" aria-pressed="false">%s</button>' % (k, v) for k, v in cats.items())
    rows, faq = [], []
    for i, (paid, what, picks) in enumerate(ALTS):
        slug = re.sub(r"[^a-z0-9]+", "-", paid.lower()).strip("-")
        pk = "".join('<div class="pick"><a href="%s" target="_blank" rel="noopener">%s &#8599;</a> <span class="badge %s">%s</span><p>%s</p></div>' % (
            E(u), E(n), "free" if "Open source" in lic else "", E(lic), E(note)) for n, u, lic, note in picks)
        text = paid + " " + what + " " + " ".join(p[0] + " " + p[3] for p in picks)
        rows.append(f'<div class="alt-row" id="{slug}" data-item data-name="{E(paid)}" data-order="{i}" data-cat="{ALT_CATS.get(paid, "office")}" data-text="{E(text)}"><div class="paid">{E(paid)}<small>{E(what)}</small></div><div class="alt-picks">{pk}</div></div>')
        if i < 8:
            faq.append({"@type": "Question", "name": "What is a free alternative to %s?" % paid,
                        "acceptedAnswer": {"@type": "Answer", "text": "Free options include " + ", ".join(p[0] for p in picks) + ". " + picks[0][3]}})
    body = f'''<div class="wrap page-head">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <span>Free alternatives</span></nav>
 <h1>Free &amp; open-source alternatives to paid software</h1>
 <p class="lede">{len(ALTS)} popular paid apps, each with free replacements that professionals actually use. Every pick links to its official website. Licence labels tell you whether it is open source, free, or free with limits.</p>
</div>
<section class="wrap" data-filter-scope style="padding-bottom:40px">
 <div class="toolbar" role="search">
  <label class="sr" for="alt-q">Search</label><input id="alt-q" type="search" placeholder="Search, e.g. Photoshop, password, video  ( / )" data-q>
  <label class="sr" for="alt-sort">Sort</label><select id="alt-sort" data-sort><option value="order">Most searched first</option><option value="az">Paid app A to Z</option></select>
  <button class="btn ghost sm" type="button" data-reset>Reset</button>
 </div>
 <div class="filter-row">{chips}</div>
 <p class="result-count" data-count aria-live="polite"></p>
 <div class="alt-list">
{chr(10).join(rows)}
 </div>
 <div class="empty" data-empty hidden>Nothing matches yet. <a href="contact.html">Suggest an app</a> and we'll research free options.</div>
 <div class="notice" style="margin-top:22px">Before switching, check that you can export your existing files in a standard format, and try the alternative on a real task. Read <a href="guides/open-source-vs-freemium.html">open source vs freemium</a> to understand the trade-offs.</div>
</section>
<script type="application/ld+json">{json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq}, separators=(",", ":"))}</script>
'''
    page("alternatives.html", "Free & Open-Source Alternatives to Paid Software (%d Apps) | App.Deals" % len(ALTS),
         "Free and open-source replacements for Photoshop, Office, Premiere, 1Password, Zoom, Slack, Notion, Zapier and %d more paid apps, with licence and platform notes." % (len(ALTS) - 8), body)


# ------------------------------------------------------------------ calendar
def build_calendar():
    items = []
    for d, name, exact, note, kind in EVENTS:
        dt = datetime.date.fromisoformat(d)
        label = dt.strftime("%b %-d") if exact else "From ~" + dt.strftime("%b %-d")
        items.append(f'<div class="event" data-date="{d}"><div class="when">{label}<small>{dt.year} · {"Fixed date" if exact else "Typical window"}</small></div><div><h3 style="margin:0 0 4px">{E(name)}</h3><p class="small muted" style="margin:0">{E(note)}</p></div><span class="days"></span></div>')
    evs = json.dumps([[n, d, "guides/black-friday-software-strategy.html"] for d, n, ex, _, _ in EVENTS if ex], separators=(",", ":"))
    body = f'''<div class="wrap page-head">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <span>Sale calendar</span></nav>
 <h1>Software &amp; app sale calendar</h1>
 <p class="lede">When software, apps and games are usually cheapest. Fixed dates are exact; "typical windows" are based on when the event has run in recent years, so confirm with the retailer as it approaches.</p>
</div>
<section class="wrap grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:28px;align-items:start;padding-bottom:40px">
 <div class="timeline">
{chr(10).join(items)}
 </div>
 <aside style="position:sticky;top:90px;display:grid;gap:16px">
  <div class="count-card" data-events='{evs}'>
   <span class="tag">Next fixed date</span>
   <h3 style="margin:12px 0 2px" data-ev-name>Next sale</h3><p class="small" data-ev-date style="margin:0"></p>
   <div class="count"><div><b data-cd>00</b><small>Days</small></div><div><b data-cd>00</b><small>Hrs</small></div><div><b data-cd>00</b><small>Min</small></div><div><b data-cd>00</b><small>Sec</small></div></div>
   <a data-ev-link href="guides/black-friday-software-strategy.html">Plan your shopping list &#8594;</a>
  </div>
  <div class="card"><h3>Don't watch the calendar</h3><p class="small muted">Tell us your platforms and categories and we'll email you when the sales you care about start.</p><a class="btn primary" href="alerts.html" style="width:100%">Get deal alerts</a></div>
  <div class="card"><h3>Before you buy</h3><ul style="padding-left:1.1em;margin:0" class="small"><li><a href="tools/deal-checker.html">Score a deal in 60 seconds</a></li><li><a href="guides/spot-fake-discounts.html">Spot inflated 'was' prices</a></li><li><a href="tools/annual-vs-monthly.html">Annual vs monthly maths</a></li></ul></div>
 </aside>
</section>
<style>@media (max-width:900px){{section.wrap.grid{{grid-template-columns:1fr!important}}section.wrap.grid aside{{position:static!important}}}}</style>
'''
    page("calendar.html", "Software & App Sale Calendar 2026–2027: Black Friday, Steam, Prime Day | App.Deals",
         "When apps, software and games go on sale: Black Friday 27 Nov 2026, Cyber Monday, Steam seasonal sales, back-to-school, Prime Day and more, with a live countdown.", body)
    return evs


# ------------------------------------------------------------------ guides
def read_guides():
    gs = []
    for fn in sorted(os.listdir(os.path.join(ROOT, "guides"))):
        if not fn.endswith(".md"):
            continue
        raw = open(os.path.join(ROOT, "guides", fn), encoding="utf-8").read()
        head = raw.split("---", 2)[1]
        meta = {}
        for line in head.strip().splitlines():
            k, v = line.split(":", 1)
            v = v.strip()
            meta[k.strip()] = json.loads(v) if v.startswith('"') else v
        meta["slug"] = fn[:-3]
        meta["words"] = len(raw.split("---", 2)[2].split())
        gs.append(meta)
    order = ["spot-fake-discounts", "black-friday-software-strategy", "cancel-app-subscriptions", "student-software-perks", "lifetime-deals-checklist",
             "annual-vs-monthly-billing", "free-trials-without-charges", "app-store-refunds", "startup-credits-playbook", "nonprofit-software-discounts",
             "open-source-vs-freemium", "family-plans-and-bundles", "software-key-safety", "launch-an-app-deal"]
    gs.sort(key=lambda g: order.index(g["slug"]) if g["slug"] in order else 99)
    return gs


def build_guides(gs):
    cats = []
    for g in gs:
        if g["cat"] not in cats:
            cats.append(g["cat"])
    chips = '<button class="chip" type="button" data-chip="cat" data-value="all" aria-pressed="true">All guides</button>' + "".join(
        '<button class="chip" type="button" data-chip="cat" data-value="%s" aria-pressed="false">%s</button>' % (re.sub(r"\W+", "-", c.lower()), E(c)) for c in cats)
    cards = "".join(f'<a class="card" href="guides/{g["slug"]}.html" data-item data-name="{E(g["h1"])}" data-order="{i}" data-cat="{re.sub(r"[^a-z0-9]+", "-", g["cat"].lower())}"><span class="badge">{E(g["cat"])}</span><h3 style="margin-top:10px">{E(g["h1"])}</h3><p class="small muted">{E(g["description"])}</p><span class="small" style="font-weight:700">{E(g["read"])} read &#8594;</span></a>' for i, g in enumerate(gs))
    body = f'''<div class="wrap page-head">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <span>Guides</span></nav>
 <h1>Guides to paying less for software</h1>
 <p class="lede">Practical, independent guides: how to spot fake discounts, cancel subscriptions, claim student and startup perks, judge lifetime deals and time your purchases.</p>
</div>
<section class="wrap" data-filter-scope style="padding-bottom:40px">
 <div class="filter-row">{chips}</div>
 <div class="grid g3">{cards}</div>
</section>
'''
    page("guides.html", "Guides: Save Money on Apps, Software and Subscriptions | App.Deals",
         "Independent guides on spotting fake discounts, cancelling subscriptions, student and startup software perks, lifetime deals, refunds and Black Friday strategy.", body)


# ------------------------------------------------------------------ videos
def build_videos():
    cards = []
    for kind, vid, title, ch, note in VIDEOS:
        attr = 'data-yt="%s"' % vid if kind == "yt" else 'data-ytlist="%s"' % vid
        cls = "vid" if kind == "yt" else "vid channel"
        cards.append(f'<div class="card" style="padding:12px"><div class="{cls}" {attr}><button type="button" aria-label="Play: {E(title)}">{E(title)}</button></div><h3 style="margin:12px 4px 4px;font-size:1rem">{E(title)}</h3><p class="small muted" style="margin:0 4px 6px">{E(ch)} · {E(note)}</p></div>')
    searches = "".join('<a class="chip" href="https://www.youtube.com/results?search_query=%s" target="_blank" rel="noopener">%s &#8599;</a>' % (urllib.parse.quote_plus(q), E(t)) for t, q in VIDEO_SEARCHES)
    body = f'''<div class="wrap page-head">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <span>Videos</span></nav>
 <h1>Videos: free software, perks and smarter buying</h1>
 <p class="lede">A hand-picked library of YouTube videos and channels about free and open-source tools, developer perks and tech buying advice. Videos load only when you press play, so the page stays fast and private.</p>
</div>
<section class="wrap" style="padding-bottom:20px">
 <div class="grid g3">{"".join(cards)}</div>
 <p class="small muted" style="margin-top:14px">Videos are embedded from YouTube and belong to their creators. App.Deals is not affiliated with these channels. Channel playlists show each creator's latest uploads.</p>
</section>
<section class="section">
 <div class="wrap">
  <h2>Quick how-to searches</h2>
  <p class="muted">Short walkthroughs change often, so these open fresh YouTube results for the most common questions.</p>
  <div class="chips">{searches}</div>
 </div>
</section>
<section class="section alt">
 <div class="wrap lead">
  <div><h2>Make app or software videos?</h2><p>We feature creators who explain tools honestly. Pitch a review, tutorial or deal round-up and get your work in front of readers actively looking for apps.</p></div>
  <div class="panel"><h3>Pitch your channel</h3><p class="small">Paid creator roles are listed on the careers page.</p><a class="btn primary" href="careers.html">See creator roles</a></div>
 </div>
</section>
'''
    page("videos.html", "Videos: Free Software, Student Perks & Smart Software Buying | App.Deals",
         "Curated YouTube videos and channels about free and open-source software, developer and student perks, subscriptions and tech buying advice.", body)


# ------------------------------------------------------------------ index featured block
def build_index_featured(evs):
    path = os.path.join(ROOT, "index.html")
    src = open(path, encoding="utf-8").read()
    pick = ["github-student-pack", "jetbrains-education", "aws-activate", "google-nonprofits", "apple-family-sharing", "libby"]
    cards = "\n".join(deal_card(d, i) for i, d in enumerate([x for x in DEALS if x["id"] in pick]))
    src = re.sub(r"<!--FEATURED-->.*?<!--/FEATURED-->", "<!--FEATURED-->\n" + cards + "\n<!--/FEATURED-->", src, flags=re.S)
    src = re.sub(r"data-events='[^']*'", "data-events='%s'" % json.dumps([[n, d, "guides/black-friday-software-strategy.html"] for d, n, ex, _, _ in EVENTS if ex and "Black Friday" in n or (ex and "Cyber" in n)], separators=(",", ":")), src)
    for key, val in {"STAT_DEALS": len(DEALS), "STAT_ALTS": len(ALTS), "STAT_GUIDES": len(read_guides())}.items():
        src = re.sub(r'(<strong data-stat="%s">)[^<]*' % key, r"\g<1>%s" % val, src)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)


# ------------------------------------------------------------------ sitemaps + search index
STATIC = [
 ("index.html", "Home", "Main"), ("deals.html", "Deals & perks", "Main"), ("alternatives.html", "Free alternatives", "Main"),
 ("calendar.html", "Sale calendar", "Main"), ("tools.html", "Tools", "Main"), ("guides.html", "Guides", "Main"), ("videos.html", "Videos", "Main"),
 ("search.html", "Search", "Main"), ("alerts.html", "Deal alerts", "Get involved"), ("submit-deal.html", "Submit your app deal", "Get involved"),
 ("advertise.html", "Advertise & sponsor", "Get involved"), ("contests.html", "Contests & giveaways", "Get involved"), ("careers.html", "Careers", "Get involved"),
 ("support.html", "Support App.Deals", "Get involved"), ("about.html", "About", "About"), ("editorial-policy.html", "How we list deals", "About"),
 ("contact.html", "Contact", "About"), ("privacy.html", "Privacy & cookies", "Legal"), ("terms.html", "Terms of use", "Legal"),
 ("disclaimer.html", "Disclaimer", "Legal"), ("trademark.html", "Trademark & copyright", "Legal"), ("sitemap.html", "Sitemap", "About"),
]
TOOLS = [
 ("tools/subscription-audit.html", "Subscription audit", "Total every subscription by year and find the ones you barely use."),
 ("tools/lifetime-deal-calculator.html", "Lifetime deal calculator", "Break-even month and risk-adjusted value of a lifetime deal."),
 ("tools/deal-checker.html", "Deal checker", "Score any offer for red flags in under a minute."),
 ("tools/annual-vs-monthly.html", "Annual vs monthly calculator", "When paying yearly actually saves money."),
 ("tools/family-plan-splitter.html", "Family plan splitter", "Cost per person on family plans versus individual plans."),
 ("tools/perk-finder.html", "Perk finder", "Three questions to find perks you qualify for."),
 ("tools/price-watchlist.html", "Price watchlist", "Track target prices for apps you want, saved in your browser."),
]


def build_maps(gs):
    today = datetime.date.today().isoformat()
    urls = [p for p, _, _ in STATIC] + [p for p, _, _ in TOOLS] + ["guides/%s.html" % g["slug"] for g in gs]
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        loc = "https://app.deals/" + ("" if u == "index.html" else u)
        pr = "1.0" if u == "index.html" else ("0.9" if u in ("deals.html", "alternatives.html", "calendar.html") else "0.7")
        xml.append("  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>" % (loc, today, pr))
    xml.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
        f.write("\n".join(xml) + "\n")
    groups = {}
    for p, t, g in STATIC:
        groups.setdefault(g, []).append((p, t))
    cols = "".join('<div class="card"><h3>%s</h3><ul style="padding-left:1.1em;margin:0">%s</ul></div>' % (g, "".join('<li><a href="%s">%s</a></li>' % (p, E(t)) for p, t in items)) for g, items in groups.items())
    cols += '<div class="card"><h3>Tools</h3><ul style="padding-left:1.1em;margin:0">%s</ul></div>' % "".join('<li><a href="%s">%s</a></li>' % (p, E(t)) for p, t, _ in TOOLS)
    cols += '<div class="card"><h3>Guides</h3><ul style="padding-left:1.1em;margin:0">%s</ul></div>' % "".join('<li><a href="guides/%s.html">%s</a></li>' % (g["slug"], E(g["h1"])) for g in gs)
    page("sitemap.html", "Sitemap | App.Deals", "Every page on App.Deals: deals and perks, free alternatives, sale calendar, tools, guides and company pages.",
         '<div class="wrap page-head"><h1>Sitemap</h1><p class="lede">Every page on App.Deals.</p></div><section class="wrap grid g3" style="padding-bottom:40px">%s</section>' % cols)
    idx = []
    for d in DEALS:
        idx.append({"t": d["name"], "d": d["offer"], "k": " ".join([d["by"], d["audience"], d["topic"], d["who"]]), "u": "deals.html#" + d["id"], "c": "Deal"})
    for paid, what, picks in ALTS:
        slug = re.sub(r"[^a-z0-9]+", "-", paid.lower()).strip("-")
        idx.append({"t": "Free alternatives to " + paid, "d": ", ".join(p[0] for p in picks) + " (" + what + ")", "k": "free open source alternative", "u": "alternatives.html#" + slug, "c": "Alternative"})
    for g in gs:
        idx.append({"t": g["h1"], "d": g["description"], "k": g["cat"], "u": "guides/%s.html" % g["slug"], "c": "Guide"})
    for p, t, dsc in TOOLS:
        idx.append({"t": t, "d": dsc, "k": "tool calculator free", "u": p, "c": "Tool"})
    for p, t, g in STATIC:
        idx.append({"t": t, "d": "App.Deals " + t.lower(), "k": g, "u": p, "c": "Page"})
    for d, n, ex, note, _ in EVENTS:
        idx.append({"t": n, "d": note, "k": "sale calendar " + d, "u": "calendar.html", "c": "Sale date"})
    with open(os.path.join(ROOT, "assets/js/search-index.js"), "w", encoding="utf-8") as f:
        f.write("window.AD_INDEX=" + json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + ";\n")
    lite = [{"i": d["id"], "n": d["name"], "o": d["offer"], "a": d["audience"], "t": d["topic"], "y": d["type"], "u": d["url"]} for d in DEALS]
    with open(os.path.join(ROOT, "assets/js/deals-data.js"), "w", encoding="utf-8") as f:
        f.write("window.AD_DEALS=" + json.dumps(lite, ensure_ascii=False, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    build_deals()
    build_alts()
    evs = build_calendar()
    gs = read_guides()
    build_guides(gs)
    build_videos()
    if os.path.exists(os.path.join(ROOT, "index.html")):
        build_index_featured(evs)
    build_maps(gs)
    print("Generated:", ", ".join(OUT + ["sitemap.xml", "assets/js/search-index.js"]))
    print("Guides:", len(gs), "· words:", sum(g["words"] for g in gs), "· deals:", len(DEALS), "· alternatives:", len(ALTS))
