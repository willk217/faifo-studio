# Deploying Faifo Studio

Static site, zero build step. No `vercel.json` needed — Vercel serves the directory as-is.

## What I set up locally

- `git init` scoped to this folder (not the parent `skills-main` directory)
- `.gitignore` excludes `assets/video/` (382MB, not currently referenced by the live page anyway — see DESIGN.md)
- One commit, 56 files, ~18MB total

I have no `gh`, `vercel`, or `node`/`npm` on this machine, so everything past this point needs your accounts.

## Option A — GitHub + Vercel (recommended, gives you auto-deploy on every push)

1. Create a new empty repo at [github.com/new](https://github.com/new) — name it something like `faifo-studio`, don't initialize it with a README (you already have files).
2. Copy the remote URL it gives you, then run, from this folder:
   ```bash
   git remote add origin <the-url-github-gave-you>
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), sign in, click **Import** next to the `faifo-studio` repo.
4. Framework preset: leave as **Other**. Build command: none needed, leave blank. Output directory: leave as root (`.`). Click **Deploy**.
5. You'll get a `*.vercel.app` URL in under a minute. Check it loads correctly before moving to the domain.

## Option B — Drag-and-drop (fastest, no GitHub, no ongoing auto-deploy)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Drag the whole `faifo-studio` folder onto the page.
3. Deploy. Same result as Option A, but future changes need a manual re-drag instead of a `git push`.

Given we're still actively iterating, Option A is worth the five extra minutes.

## Connecting www.faifostudio.com

1. In the Vercel project → **Settings → Domains**, add `www.faifostudio.com`.
2. Vercel will show you the exact DNS record to create (a CNAME, target usually `cname.vercel-dns.com`, but use whatever it actually displays — these values are occasionally updated on Vercel's end, so trust the dashboard over anything written here).
3. In Cloudflare → your domain → **DNS**, add that record.
   - Set the proxy status to **DNS only** (grey cloud, not orange) for that record. Cloudflare's proxy in front of Vercel adds a layer that can interfere with Vercel's own SSL and routing — Vercel already gives you HTTPS and a CDN, so there's nothing the orange cloud adds here.
4. Decide what the bare domain (`faifostudio.com`, no `www`) does. Two reasonable options:
   - Add `faifostudio.com` as a second domain in the same Vercel project and let Vercel redirect it to `www.faifostudio.com` (Vercel offers this as a one-click option when you add it).
   - Or leave it unconfigured for now and only worry about `www`.
5. DNS propagation is usually minutes, sometimes up to ~24 hours. Vercel's domain settings page shows a live status check.

## Before this goes fully public

- Swap the `README`-style placeholder content flagged in DESIGN.md: real Instagram handle, real testimonials, OTA Playhouse assets if you get them, and eventually a real client quote for the Auko pull-quote.
- The hero video: once you have a short compressed loop (or it's hosted on Cloudflare Stream/Mux), swap it back in — the code for this is straightforward to restore, ask and I'll wire it back up.
