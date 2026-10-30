# App.Deals

An independent guide to paying less for software: 59 student, startup, nonprofit and everyday perks programmes, 40 paid apps with free and open-source alternatives, a software sale calendar with a live Black Friday countdown, 7 calculators, 14 guides, a video library, and lead-generation, sponsorship, donation, contest and careers pages. Monetised with Google AdSense (ca-pub-6620975821265271).

- **Hosting:** GitHub Pages from the `main` branch (root). Pages builds the Jekyll layouts automatically; there are no plugins and no build step on GitHub.
- **Live URL:** https://webworksa1.github.io/app-deals/ (once Pages is enabled: Settings → Pages → Deploy from a branch → `main` / `(root)`).
- **Custom domain:** once DNS for app.deals points to GitHub Pages, add a `CNAME` file containing `app.deals` (or set it under Settings → Pages) and tick "Enforce HTTPS".

## Editing
| What | Where |
|---|---|
| Perks, free alternatives, sale dates, videos | `_build/data.py`, then run `python3 _build/build.py` |
| Guides | `guides/*.md` (Markdown with front matter); rerun `build.py` to refresh the guides index, sitemap and search |
| Shared header and footer | `_layouts/default.html` |
| Payment links for donations | `assets/js/config.js` |
| Styles and scripts | `assets/css/style.css`, `assets/js/main.js`, `assets/js/tools.js` |

Local preview (emulates the Jekyll features used): `pip install markdown && python3 _build/preview.py && python3 -m http.server -d _site 8080`

## Forms
All forms post through the FormSubmit AJAX relay to a single inbox. The address is assembled at runtime from encoded parts in `config.js` and never appears in page markup. The **first** submission triggers a one-time activation email from FormSubmit; confirm it, and every later submission arrives directly.

## Docs
- `PROMPTS.md`: business case, revenue model and the phase-wise build prompt.
- `RESEARCH.md`: 36-site competitive review.

## Trademark notice
App.Deals is an independent website. It is not affiliated with any company, app or service named "AppDeals", "App Deals" or similar, or with any brand it mentions. See `trademark.html`.
