# app Demo

This demo runs the real app **panel code** in a normal web page.

It works by swapping the platform seams at build/dev time:

- `src/panel/platform/runtime.ts` → `demo/src/mocks/runtime.ts`
- `src/shared/platform/storage.ts` → `demo/src/mocks/storage.ts`

The demo also serves the real panel UI assets:

- `src/panel/panel.html` is served/emitted as `/__app/panel.html`
- `src/panel/panel.css` is served/emitted as `/__app/panel.css`

Then the demo loads the panel HTML into the page and boots the real entrypoint:

- `src/panel/panel.ts`


## What this demo is (and is not)

- ✅ Interactive simulation of the app UI
- ✅ Uses real app panel code from `src/`
- ✅ Uses mock runtime/storage (no browser extension APIs required)
- ❌ Not connected to a user’s real ChatGPT account
- ❌ Does not access cookies, sessions, or credentials


## Run locally

### Dev mode (hot reload)

```bash
cd demo
npm install
npm run dev -- --host
````

Vite prints a local URL. Open it.

### Build + Preview (production build)

This runs only what is in `demo/dist`:

```bash
cd demo
npm run build
npm run preview -- --host
```

### Build + serve with a dumb static server (extra strict)

```bash
cd demo
npm run build
npx serve dist
```

If something works in this mode, it will work on your VPS as static files too.

## Create a release (extension + demo)

The demo is released at the same time as the extension (same repository / same version), so when the extension updates, the demo updates too.
the demo is copied inside github page in docs/demo so that at each release the demo has the same version that the app 

```bash
./scripts/release-all.sh
```

This script will:

* verify `VERSION`
* build the extension ZIP
* build the demo ZIP
* publish the GitHub release + upload the extension ZIP
* upload the demo ZIP to the same release


```

 