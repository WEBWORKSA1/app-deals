# App.Deals: business case and phase-wise build prompt

## 1. The idea: "the honest software savings hub"

**Positioning:** App.Deals helps people and small organisations pay less for software they actually need: student/educator, startup and nonprofit perks programmes; free and open-source alternatives; sale timing; and calculators that replace marketing percentages with real numbers. It is a publisher, not a marketplace. It never sells keys, so it carries no fulfilment, refund or licensing risk.

### Why this beats the obvious alternatives for this domain

| Option | Verdict | Reason |
|---|---|---|
| Daily app price-drop feed (AppAdvice / AppRaven style) | Rejected as core | Needs daily manual posting or paid data feeds; content goes stale in 24 h; thin pages are an AdSense rejection risk. Kept as a future module. |
| Lifetime-deal marketplace (AppSumo style) | Rejected | Needs payments, vendor contracts, refunds and support. Capital-heavy and crowded. |
| Coupon-code site | Rejected | Heavily saturated, low trust and weak with AdSense reviewers. |
| **Evergreen perks + alternatives + tools + guides hub** | **Chosen** | Evergreen pages index and rank for years, with high-intent searches ("free alternative to X", "student discount X", "startup credits"). Software/SaaS ad categories carry above-average CPCs. Tools drive repeat visits and backlinks. The two-sided model monetises vendors as well as visitors. |

### Revenue stack (in order of expected contribution)

1. **AdSense auto ads** on 45+ substantive pages. Highest-traffic surfaces are the alternatives pages, perk listings and calculators.
2. **Developer lead generation:** "Submit your app deal", a 4-step qualifying form (product, deal, paid add-ons, budget). Converts into featured listings ($49/wk), newsletter slots ($99/issue), category sponsorships ($299/mo) and video walkthroughs ($499). These are launch rates; adjust once traffic data exists.
3. **Consumer lead generation:** a 3-step deal-alerts form with platform, category, budget and frequency segmentation. That segmentation is what makes newsletter sponsorships sellable.
4. **Donations** via a pledge form now; it switches to instant checkout as soon as a PayPal, Stripe or Buy Me a Coffee link is pasted into `assets/js/config.js`.
5. **Contests:** Deal Hunter of the Month (skill-judged, so legal in most places), plus vendor-sponsored prize slots that act as a sponsorship upsell.
6. **Domain/website/partnership inquiries** routed to web.works/contact from a bar on every page.

### Illustrative economics (assumptions, not forecasts)

| Monthly pageviews | Assumed AdSense RPM | Ad revenue | Sponsorship (assumed) | Total |
|---|---|---|---|---|
| 20,000 | $6 | $120 | 2 featured weeks = $98 | ~$218 |
| 100,000 | $8 | $800 | 1 category + 4 newsletter = $695 | ~$1,495 |
| 300,000 | $10 | $3,000 | 3 categories + 8 newsletter + 2 videos = $2,687 | ~$5,687 |

RPM varies widely by country, season and niche. Treat these as planning ranges and replace them with real AdSense data after 60 days.

### The flaw to watch

Perk listings decay. A listing that is wrong costs trust and rankings. **Mitigation:** listings use benefit descriptions instead of dollar amounts that go stale, every card is dated, and there is a reader "report outdated listing" form. Re-check the whole catalogue quarterly (`LISTED` in `_build/data.py`).

---

## 2. Phase-wise build prompt (reusable)

> Copy each phase into your AI builder in order. Each phase must end with a working, deployable site.

### Phase 0: Guardrails (apply to every phase)
- Domain: **App.Deals**. Static site for GitHub Pages (free plan, `main` branch, Jekyll layouts only, no plugins). Relative links everywhere so it works at `username.github.io/app-deals/` and at the custom domain.
- AdSense on every page `<head>`: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>`, plus `ads.txt` with `google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`. Use auto ads only; no manual ad units next to buttons.
- A top bar on every page: "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership", linking to https://web.works/contact.
- All forms go to one inbox through an AJAX form relay. The address is assembled at runtime from encoded parts and must never appear in HTML, JS strings or page text.
- Trademark: never use "appdeals" as a brand. Include a trademark/copyright page disclaiming affiliation with any "AppDeals"/"App Deals" business, plus nominative-use language for third-party marks. Use no third-party logos.
- AdSense compliance: original content, no thin pages, About, Contact, Privacy (with the AdSense cookie disclosure and opt-out links), Terms, Disclaimer, Editorial policy, cookie consent with a non-personalised ads option, no misleading claims, no pirated or grey-market software.

### Phase 1: Foundation and design system
Build `_layouts/default.html` (owner bar, sticky header, mega footer, consent banner, back-to-top) and a CSS design system: ink and paper base with a coral price-tag accent, a display font, light and dark themes, cards, chips, badges, forms, multi-step forms and an accessible focus style. Add `main.js` for theme, mobile menu, consent, form relay, multi-step forms, lite YouTube embeds, toasts, share and save, and the generic filter engine.

### Phase 2: Data and core money pages
Create `_build/data.py` with about 60 perks programmes. Each needs: audience, type, topic, offer, why it's worth it, who qualifies, steps to claim, and the official URL. Add 40 paid-to-free alternative groups and a dated sale calendar. Generate `deals.html` (search, type, topic and audience chips, sort, saved filter, share, report-outdated and tip forms), `alternatives.html` (FAQ schema), and `calendar.html` (live countdown, past and next markers).

### Phase 3: Tools (engagement and backlinks)
Seven browser-only calculators: subscription audit (CSV export, local save), lifetime-deal break-even with survival risk, deal checker (8-question red-flag score), annual vs monthly (expected cost), family plan splitter, perk finder, and price watchlist (import/export plus an email alert request). Each page needs explanatory content beneath the tool.

### Phase 4: Content depth for AdSense
At least 12 original guides of 500+ words each, in Markdown with a `guide` layout (TOC, reading progress, related tools, Article schema). Topics: fake discounts, lifetime deals, cancelling subscriptions, refunds, student, startup and nonprofit perks, annual vs monthly, free trials, Black Friday strategy, open source vs freemium, family plans, buying keys safely, and launching an app deal (for the developer lead funnel).

### Phase 5: Lead generation and monetisation
- `alerts.html`: 3-step segmented consumer signup.
- `submit-deal.html`: 4-step developer qualification with paid add-ons and budget.
- `advertise.html`: rate card, sponsorship standards and an inquiry form.
- `support.html`: donation tiers and pledge form, with configurable payment links.
- `contests.html`: skill contest with full official rules.
- `careers.html`: roles plus an application form.
- Homepage: hero search, Black Friday countdown, audience paths, featured perks, tools, alerts lead block, alternatives teaser, guides, developer CTA, video and FAQ schema.

### Phase 6: SEO and distribution
Canonical URLs, Open Graph tags, Organization/WebSite/SearchAction/ItemList/FAQ/Article schema, `sitemap.xml`, HTML sitemap, robots, a client-side search index and page, a video library (verified embeds plus channel playlists), and a manifest.

### Phase 7: QA and launch
Headless-browser pass over every page with zero JS errors and no horizontal overflow at 390 px. Check for zero broken internal links or anchors, zero email exposure, AdSense and the owner bar on 100% of pages. Push to `main`, enable Pages, then connect the custom domain (CNAME plus DNS) and apply to AdSense.

### Phase 8: Growth (post-launch)
Add one guide a week, targeting "free alternative to X" and "X student discount" long-tail queries. Quarterly listing review. Publish a weekly alerts newsletter. Add a "Free today" app price-drop module once there is newsletter demand, and sell the first three featured slots at founding rates.
