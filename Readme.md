# Actual Algos — website

This is the website for Actual Algos, a trading-signal service. It is a
single landing page with three jobs:

1. Explain the service and pricing.
2. Let prospects **book an onboarding call** (via Calendly).
3. Let prospects **leave their details** (via a Web3Forms contact form).

It also tracks **referral links** so you know who sent each lead.

The site is built with [Zola](https://www.getzola.org/) (a static-site
generator) and published automatically to GitHub Pages. You do **not** need to
understand Zola to run this — almost everything you'll change lives in two
files: `config.toml` and `content/_index.md`.

---

## ✅ Go-live checklist (do these once)

### 1. Add your Calendly link and Web3Forms key

Open **`config.toml`** and replace the two placeholder values near the bottom:

| Setting         | What to put there | Where to get it |
|-----------------|-------------------|-----------------|
| `calendly_url`  | Your scheduling link, e.g. `https://calendly.com/your-name/onboarding-call` | Free account at [calendly.com](https://calendly.com) → create an event type → copy its link |
| `web3forms_key` | Your access key | Go to [web3forms.com](https://web3forms.com), enter the email you want submissions sent to, and it emails you a key |

Until you do this, the booking calendar and contact form show a friendly
"not configured yet" note instead of the real widgets.

### 2. Turn on GitHub Pages (one-time setting on GitHub)

1. On GitHub, open this repository → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. That's it. Nothing else to configure there.

### 3. Publish

Every time you push a change to the **`V3`** branch, the site rebuilds and
deploys automatically (takes ~1–2 minutes). You can watch it under the
repo's **Actions** tab.

Your live site will be at: **https://Actual-Investments.github.io**

---

## ✏️ Editing the page

All the page text lives in **`content/_index.md`**.

- It's mostly plain HTML with your wording in between the tags.
- **Search the file for `EDIT ME`** — those comments mark every spot you'll
  most likely want to change (prices, markets you cover, how signals are
  delivered, your email, etc.).
- Anything inside `<!-- ... -->` is a private note and does **not** appear on
  the website.
- Leave the two lines `{{ calendly() }}` and `{{ contact_form() }}` exactly as
  they are — those pull in your booking calendar and contact form.

### Changing colors / branding

In `config.toml` under `[extra]`:

- `accent_color` — `blue`, `green`, `orange`, `pink`, `purple`, or `red`.
- `background_color` — `dark`, `light`, `auto`, or a color name.
- `logo_text` — the text shown top-left.
- `title` — the browser tab title.

---

## 🔗 Referral links (tracking who refers leads)

Share your site with a `?ref=` code on the end of the URL. For example, give a
partner this link:

```
https://Actual-Investments.github.io/?ref=PARTNER123
```

When someone visits with that link:

- The code is remembered in their browser.
- If they **submit the contact form**, the code is attached to the submission
  (you'll see `referral_code: PARTNER123` in the email Web3Forms sends you).
- If they **book a call**, the code is passed to Calendly as a campaign tag
  (visible in your Calendly booking details and notification emails).

You can hand out as many different codes as you like — just change the part
after `?ref=`. No setup required.

---

## 👀 Previewing locally (optional)

You don't need this to run the site, but if you want to see changes on your own
computer before publishing:

1. Install Zola: <https://www.getzola.org/documentation/getting-started/installation/>
2. In a terminal, from this folder, run:

   ```
   zola serve
   ```

3. Open the address it prints (usually <http://127.0.0.1:1111>). It updates live
   as you edit files.

---

## 🛠️ How it's wired (for the curious)

| File / folder | What it does |
|---|---|
| `config.toml` | Site-wide settings: branding, colors, Calendly link, Web3Forms key. |
| `content/_index.md` | The landing page content (the part you edit most). |
| `templates/index.html` | Page layout (header, footer, where content goes). |
| `templates/shortcodes/calendly.html` | Renders the Calendly booking widget. |
| `templates/shortcodes/contact_form.html` | Renders the Web3Forms contact form. |
| `static/js/referral.js` | Captures `?ref=` codes and wires them into the form + booking, and submits the form without a page reload. |
| `sass/custom.scss` | Styles specific to this page. |
| `themes/terminimal/` | The base theme (you generally won't touch this). |
| `.github/workflows/build_site.yml` | Builds and deploys the site on every push to `V3`. |

---

## ⚠️ A note on compliance

This site offers a financial service. The page includes a generic risk
disclaimer (bottom of `content/_index.md` and in the footer), but **please have
a qualified professional review your wording, claims, and disclaimers before
going live**, and avoid stating specific performance/return figures you can't
substantiate.
