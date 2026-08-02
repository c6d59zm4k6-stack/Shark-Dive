# Shark Life 🦈

A 3D shark survival game — playable in any browser, installable as a PWA.

## What's in this folder

```
index.html                  the game itself
manifest.json                PWA metadata (name, icons, colors)
sw.js                        service worker (offline support)
icons/icon-192.png           app icon
icons/icon-512.png           app icon
icons/icon-180.png           iOS home-screen icon
icons/icon-maskable-512.png  Android adaptive icon (safe-zone padded)
```

This is already a git repository with one commit. You just need to push it
to GitHub and flip on Pages.

---

## 1. Create the GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Pick a name (e.g. `shark-life`)
3. Leave it **empty** — do NOT check "Add a README" or ".gitignore" (this
   folder already has its own git history; adding one on GitHub's side will
   cause a conflict when you push)
4. Click **Create repository**

## 2. Push this folder to it

GitHub will show you a page with commands after creating the repo. Use the
"…or push an existing repository" section, which looks like this (replace
`YOUR-USERNAME` and `shark-life` with your actual username/repo name):

```bash
cd shark-life-pwa
git remote add origin https://github.com/YOUR-USERNAME/shark-life.git
git branch -M main
git push -u origin main
```

If you've never pushed to GitHub from this machine before, it'll ask you to
sign in (a browser window opens, or it prompts for a **Personal Access
Token** instead of a password — GitHub no longer accepts plain passwords for
this). If you get stuck here, GitHub's own guide is reliable:
https://docs.github.com/en/authentication

## 3. Turn on GitHub Pages

1. In your new repo on GitHub, go to **Settings → Pages**
2. Under "Build and deployment" → **Source**, choose **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. Wait ~1 minute, then refresh the page — it'll show you the live URL:
   `https://YOUR-USERNAME.github.io/shark-life/`

That URL is now your game, live, over HTTPS (required for a PWA to be
installable — GitHub Pages gives you this automatically).

## 4. Install it as an app

- **Android (Chrome)**: open the URL, tap the "Install app" prompt or the
  install icon in the address bar.
- **iPhone/iPad (Safari)**: open the URL, tap the Share icon → **Add to Home
  Screen**. (iOS doesn't support Chrome-style install prompts — this is the
  only path on iOS, and it's a manual user action Apple requires; there's no
  way to trigger it automatically.)
- **Desktop (Chrome/Edge)**: an install icon appears in the address bar.

Once installed, it opens in its own window with no browser chrome, uses the
shark icon, and (after the first load) works offline.

## 5. Updating the game later

Whenever you change `index.html` and push a new version, you **must** bump
the cache name at the top of `sw.js`:

```js
const CACHE_NAME = "shark-life-v2";   // was v1 — bump this every release
```

Without this, players who already installed the app will keep seeing the
old cached version, because the service worker's whole job is to *avoid*
re-fetching files it already has. Bumping the name forces it to fetch fresh
copies and discard the old cache (the `activate` handler in `sw.js` already
deletes old-named caches automatically).

## Notes

- Three.js and the Google Fonts used by the game load from public CDNs
  (cdnjs, fonts.googleapis.com). The service worker caches them the first
  time they're fetched, so offline play works after that first visit — but
  the very first load does need an internet connection.
- No build step, no npm install, no bundler — it's a static site. Any static
  host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages); these
  instructions use GitHub Pages since that's what you asked for.
