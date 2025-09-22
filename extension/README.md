<div align="center">

<img src="public/beveled_icon.png" alt="Beveled icon" width="80" height="80" />

### beveled — make your screenshots better

Beautiful, privacy‑first screenshot tooling that runs in your browser.

</div>

## About

Beveled is an open‑source Chrome extension and web app for creating beautiful screenshots in seconds. Capture from the browser (visible area, full page, or device viewport) or upload an image on the web app, then enhance it with backgrounds, shadows, window chrome, text, and shapes — all processed locally in your browser.

- Extension: quick capture, device presets, full‑page stitching, and instant editing
- Web app: drag & drop upload with the same powerful editor
- Privacy‑first: no servers; images and edits are processed locally

## Features

- Capture modes: visible area, full page (stitch), and device viewport emulation
- Device presets for mobile/tablet/desktop
- Powerful editor: cropping, image scaling/positioning, window chrome bar, shadows, corner radius
- Text and shapes overlays with fine‑grained controls
- Templates to jumpstart compositions
- Light/dark themes, tangerine brand palette, and grainy hero background
- Export PNG or JPEG

## Tech Stack

- React 19 + TypeScript 5
- Vite 7 bundling and dev server
- Tailwind CSS v4
- shadcn/ui + Radix UI primitives
- Lexical (rich text)
- Lucide icons
- Chrome Extension MV3 (service worker, content script, debugger/DevTools protocol)

## Project Structure

```
extension/
  public/               # Static assets and extension manifest
  src/
    editor/             # Editor UI and renderer
    popup/              # Extension popup UI
    components/         # UI components (shadcn/ui)
    background.ts       # MV3 service worker — capture logic
    content-script.ts   # Full-page stitching & viewport simulation
    App.tsx             # Web app entry with routing (home, editor, legal)
    index.css           # Tailwind design tokens & theme
  index.html            # Web app HTML (vite dev/preview)
  editor.html           # Editor page for extension
  popup.html            # Popup page for extension
  vite.config.ts        # Vite config
  package.json          # Scripts & dependencies
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install dependencies

```bash
pnpm install
```

### Run the web app (development)

```bash
pnpm dev
# open the printed localhost URL (typically http://localhost:5173 or :5174)
```

### Build the extension

```bash
pnpm build
# Output is written to extension/dist
```

### Load the extension in Chrome

1. Go to chrome://extensions
2. Turn on “Developer mode”
3. Click “Load unpacked” and select the `extension/dist` folder
4. Pin “Beveled” to your toolbar and open the popup

### Preview the web app (production build)

```bash
pnpm build
pnpm preview
```

## Commands

```bash
pnpm dev       # Start Vite dev server (web app)
pnpm build     # Type-check and build extension + web app to dist
pnpm preview   # Serve the production build locally
pnpm lint      # Run eslint
```

## How It Works (High Level)

- The extension service worker (`background.ts`) handles capture. For viewport emulation it uses the Chrome Debugger Protocol to set device metrics; for full-page capture it coordinates with the `content-script.ts` to scroll and stitch images.
- The editor renders everything client‑side (no server), including shadows and window chrome, then exports a final PNG/JPEG.
- The web app routes between a home page (upload/CTA), the editor, and legal pages.

## Contributing

Contributions are welcome! If you’d like to help:

1. Fork the repo and create a feature branch
2. Run the web app with `pnpm dev` and/or build the extension with `pnpm build`
3. Add tests or stories where reasonable
4. Ensure `pnpm lint` passes
5. Submit a pull request with a clear description and screenshots if UI changes

## License

MIT — see `LICENSE` (please add one if not present). You’re free to use, modify, and distribute with attribution.

---

Made with ❤️ to help you make your screenshots better.
