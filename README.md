# Crystal Lights — Website

A static marketing site for Crystal Lights (permanent outdoor LED lighting, British Columbia).
Plain HTML, CSS and vanilla JavaScript — no build step, no dependencies, no framework.
Upload the folder to any host and it runs.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Homepage — relighting hero, marquee, **scroll-driven scene**, craft detail, **Colour Studio**, services, process, app, stats, holiday slider, drag gallery, testimonials, service areas, FAQ |
| `services.html` | The six services, each with an anchor (`#permanent`, `#seasonal`, `#landscape`, `#architectural`, `#events`, `#planning`) |
| `how-it-works.html` | The hardware explained, the daytime look, the four-step process, the app, specs, FAQ |
| `gallery.html` | Filterable masonry gallery with a lightbox |
| `about.html` | Company story, values, stats, service areas |
| `contact.html` | Four-step quote builder plus direct contact details |
| `privacy.html` | Privacy policy |

Plus `robots.txt` and `sitemap.xml`.

---

## Folder layout

```
crystal lights/
├─ index.html, services.html, how-it-works.html,
│  gallery.html, about.html, contact.html, privacy.html
├─ robots.txt, sitemap.xml
├─ assets/
│  ├─ css/style.css        ← all styling, organised in 26 numbered sections
│  ├─ js/main.js           ← all behaviour, one self-contained module per feature
│  ├─ img/logo.png         ← trimmed + optimised logo used by the site
│  ├─ img/favicon.png      ← tab icon, same source
│  └─ img/gallery/         ← the 14 supplied photos, renamed descriptively
├─ tools/pngtool.py        ← regenerates the two derived logo files
└─ logo.png                ← MASTER logo from the owner — keep
```

---

## ⚠️ Before launch

### 1. Social links — currently omitted, on purpose
The live crystallights.ca has Facebook, X and Instagram icons on its Contact page, but
**none of them carry a URL** — they are empty `<a>` tags that were never connected. There was
nothing to copy across, and shipping dead links is worse than shipping none, so they are left
out.

A ready-to-fill block sits commented out in the footer of every page (search for
`Social links:`). When the owner supplies the actual handles, uncomment it and replace
`YOURPAGE` / `YOURHANDLE`. **Do not guess the URLs** — linking to the wrong account is worse
than having no link.

### 2. Point the contact form at a real destination
Both forms currently open the visitor's email client with everything pre-filled and addressed
to `info@crystallights.ca`, so no enquiry is lost even with no backend. That works, but a
proper form endpoint converts better.

To switch: add a `data-endpoint` attribute to the `<form>` tag and the JavaScript will POST
to it instead.

```html
<form data-quote-form data-mail-form data-endpoint="https://formspree.io/f/xxxxxxx" …>
```

Works with Formspree, Netlify Forms, Basin or any endpoint accepting a `multipart/form-data`
POST and returning JSON.

### 3. Confirm the contact details
The live site lists **two** email addresses — `info@crystallights.ca` and
`crystallights365@gmail.com`. This site uses `info@crystallights.ca` throughout. If the Gmail
address is the one actually monitored, search and replace it.

---

## Branding

The logo is the owner-supplied original, kept in the project root as `logo.png`
(1434 × 1097, transparent, 574 KB) — that file is the **master**; keep it.

Two derived assets are what the site actually loads:

| File | Size | Use |
|---|---|---|
| `assets/img/logo.png` | 170 × 160, 26 KB | header, drawer and footer |
| `assets/img/favicon.png` | 68 × 64, 6 KB | browser tab icon |

The master had ~10% transparent padding on each side and, at 574 KB, was larger than
any image on the site — on every page. Both derived files are trimmed to the artwork
and downscaled, which is a ~95% saving on an asset that loads everywhere.

**To regenerate them** (after a logo change), there is no build step and Pillow is not
installed, so a small stdlib-only tool is included:

```bash
python tools/pngtool.py logo.png assets/img/logo.png 160
python tools/pngtool.py logo.png assets/img/favicon.png 64
```

It trims transparent margins and box-downscales to the given height. It handles 8-bit
RGBA non-interlaced PNGs. If you change the output height, update the `width`/`height`
attributes on the `<img class="brand__img">` tags to match, or the header will reflow
as the page loads.

### Why the logo sits beside a text wordmark

The mark is a **badge that already contains the words "Crystal Lights"**, and at header
size that text is far too small to read. So it is used as a graphic mark with a readable
type lockup beside it — the same arrangement as the company van. The image carries
`alt=""` and `aria-hidden="true"` because the adjacent text already provides the name;
giving both would make screen readers announce it twice.

Sizing lives in `.brand__img`. If a wide/horizontal version of the logo ever arrives,
swap the file, raise the height, and delete the `.brand__text` span next to it.

---

## Testimonials

Reviews live in **`assets/js/reviews.js`** — that is the only file to edit. Each entry has a
`name`, `city`, `stars` (1–5), `date` and `text`, and the homepage renders the stars, score,
name, city and date automatically.

The six reviews there are real 5-star Google reviews, copied word for word from
crystallights.ca/reviews (the owner asked for some names to be left out).

**Cities are blank.** Google reviews do not show where the reviewer lives, so there was no
real city to use. Ask the owner for each customer's city, fill in the `city` field, and it
appears on the card as "City, BC". Do not guess.

---

## The signature pieces

The product is light, so light drives the interface. Three features carry the design.

### 1. The lighting-scenes section (`index.html`, the `.scene` section)

A full-width photo of a house with a row of buttons: Off, Everyday, Halloween, Christmas,
Spring, Anything. It **starts on Off**, and each button relights the house and changes the
headline. It is not tied to scrolling (the owner didn't want the pinned-scroll version).

Everything lives in the `sceneSwitcher` module in `assets/js/main.js`. To change a scene,
edit the `STOPS` array — rotation, saturation, brightness, glow, colour, headline and copy.

**The buttons in `index.html` must match `STOPS` one for one, in the same order.**
They are two separate lists and nothing enforces the pairing.

### 2. The hero relight (`index.html`)

The hero photograph cycles through six colours on a slow loop, so the product demonstrates
itself before a word is read. Driven by `heroCycle` in `main.js`.

### 3. The Colour Studio (`index.html`, `#studio`)

The visitor picks a scene or a colour and a real installation photograph relights to match.
Driven by `colourStudio` in `main.js`.

---

## ⚠️ How the colour effect actually works — read before changing a photo

All three features recolour a photograph with CSS `hue-rotate()`. Two things govern whether
it looks convincing:

**The photo must have a dark sky.** Hue-rotate recolours the entire frame. On a photo with a
blue sky, rotating the house also turns the sky green, which looks broken. Only night shots
with a black sky work. Currently that is `home-green.jpg` and `home-violet.jpg`
(and the two `ranch-*` files, which are letterboxed).

**The rotation values are measured, not calculated.** CSS `hue-rotate()` is a linear matrix
approximation, not a true hue rotation, so computing a rotation from a target colour does not
land on that colour. The tables in `main.js` were calibrated by rendering the actual photo at
30-degree steps and reading off the result.

For `home-green.jpg`, the measured mapping is:

| Rotation | Result | | Rotation | Result |
|---|---|---|---|---|
| 0° | green (base) | | 180° | magenta / pink |
| 60° | cyan | | 210° | red |
| 90° | light blue | | 240° | orange |
| 120° | violet | | 270° | amber / warm white |
| 150° | magenta | | 300° | yellow-green |

**If you swap in a different photo, re-calibrate.** Open the page, and in the browser console
render the new photo at 30-degree steps to read off which rotation gives which colour, then
update the tables. Do not compute the values from a hex colour — it will not match.

Rotations in the tables wind past 360° on purpose (for example 480°). That keeps the
transition sweeping one way round the colour wheel instead of snapping backwards through
every hue at the end of a lap. Leave them as they are.

---

## Editing content

- **Text** — edit the HTML directly; everything is plain, commented markup.
- **Colours, spacing, type** — all in the token block at the top of `style.css` (`:root`).
  Changing `--gold-400` re-themes the whole site.
- **Gallery** — copy a `<figure class="tile">` block. The `data-tags` attribute drives the
  filter buttons, `data-title` / `data-sub` drive the lightbox caption, and the `tile--wide`
  / `tile--tall` / `tile--half` / `tile--full` classes vary the shape in the masonry.
- **FAQ** — copy a `.faq__item` block. `data-faq="single"` on the wrapper means one open at a
  time; remove it to allow several.

---

## Photo notes

The 14 supplied photos were renamed so they are identifiable in the markup:

| Original | Renamed | Used for |
|---|---|---|
| 1, 2 | `home-green`, `home-violet` | Colour Studio base + gallery |
| 3, 4 | `ranch-spectrum`, `ranch-red` | App section, gallery |
| 5, 6 | `craftsman-warm`, `craftsman-christmas` | Everyday ↔ Christmas comparison slider |
| 7, 8 | `cottage-warm`, `cottage-teal` | Warm ↔ Emerald comparison slider |
| 9, 11 | `install-okanagan`, `install-valley` | About page, install-day proof |
| 10 | `daytime-discreet` | "Discreet by day" |
| 12 | `track-detail` | Hardware close-up |
| 13, 14 | `modern-front`, `modern-rear` | Hero, CTA bands |

Photos 3 and 4 are portrait phone screenshots with large black letterbox bars. They are
cropped in CSS via `object-position` so only the house band shows. If you re-export those two
without the bars, the CSS crop can be removed.

**Worth doing:** the photos are full-resolution phone captures (some over 2 MB). Compressing
them and exporting WebP versions would noticeably speed up the site. Nothing is broken as-is —
everything below the fold is lazy-loaded — but it is the single biggest performance win
available.

---

## Browser support & accessibility

- Works in all current browsers. Layout uses CSS Grid, custom properties and `aspect-ratio`.
- Fully responsive from 320px up.
- Keyboard accessible throughout: skip link, focus rings, Escape closes the drawer and
  lightbox, arrow keys drive the lightbox and the comparison sliders. The scroll scene is
  decorative — every claim it makes is also stated in ordinary text elsewhere on the page.
- Respects `prefers-reduced-motion` throughout: the intro is skipped, the cursor light and
  magnetic buttons are disabled, the hero stops cycling, and the scroll scene unpins into a
  normal static section rather than hijacking the scroll.
- Semantic landmarks, labelled controls, and `LocalBusiness` structured data on the homepage.

---

## Local preview

Use the included server — **not** plain `python -m http.server`:

```bash
python tools/serve.py
```

Then open http://localhost:4176. Plain `http.server` sends no cache headers, so the
browser keeps showing old copies of pages, styles and scripts after they change, and
edits look like they didn't work. `tools/serve.py` tells the browser never to cache.

CSS and JS links also carry a version tag (`style.css?v=…`). When you publish changes to
a live host, bump that tag in every page so visitors' browsers fetch the new files.
