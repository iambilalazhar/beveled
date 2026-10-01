# shots.so audit

Audited `https://shots.so/` on 2026-09-30 with a real browser screenshot loaded. shots.so is a 2-D mockup editor (flat devices and browser windows composited on backgrounds) with a light animation timeline. These are the ideas Beveled borrows.

## Layout
- Left panel with two tabs, **Mockup** and **Frame**. Canvas in the centre with rounded corners on a black page. Right panel for layout and zoom/tilt. Transport under the canvas, timeline at the bottom with an **Animations** track above a **device** track.
- Top bar: logo, `Templates`, undo/redo, command palette, `Start Over`, fullscreen, feedback, and `Upgrade to export`.

## Mockup tab
- **Device picker**: category chips (All · phones · tablets · laptops · desktops · watches) with rich cards: Essentials (Screenshot, Browser, Minimal Desktop — "adapts to media"), iPhone 17 lineup, iPhone 16 & earlier, Android phones (Nothing Phone, Pixel 7 Pro), Tablets (iPad Pro 13/11, Air, Mini), Laptops (MacBook Pro 16, Air M2, Air 13), Desktop (iMac 24, Pro Display XDR, iMac Pro), Wearables (Apple Watch Ultra, Watch 10). Each card shows colour variants (`+3`).
- **Magic Preset** (‹ ›): cycles AI-picked looks.
- **Media**: drop, click or paste images and videos.
- **Style** (browser): Safari Light, Chrome Light, Arc Light, Safari Dark, Chrome Dark, Arc Dark.
- **Window**: UI Scale (100 %) and window size presets (Auto plus seven ratios). **Address bar**: URL text.
- **Shadow**: None · Spread · Realistic · Adaptive, Opacity (36), `Adjust Light`.
- **Visibility**: Hide Mockup. **Details**: device and screen pixels.

## Frame tab
- **Size**: W × H inputs plus ratio chips (16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16) and platform presets: Instagram (Post 1:1, Portrait 4:5, Story 9:16), Twitter (Tweet 16:9, Cover 3:1), YouTube (Banner 16:9, Thumbnail 16:9, Video 16:9), Pinterest (Long 10:21, Optimal 2:3, Square 1:1), Dribbble (Shot 4:3), App Store (iPhone 6.5" 1284:2778, iPhone 5.5" 1242:2208, iPad Pro 12.9" 2048:2732, landscape variants, Mac 16:10).
- **Animation**: Static · Parallax.
- **Effects & watermark**: Lens Blur, Portrait, Watermark, Bg Effects, VFX.
- **Scene**: None · Shadow (leaf/window shadow overlays) · Shapes.
- **Background**: Transparent (Pro) · Color · Image · Unsplash, then **Magic** — gradients generated from the colours in your media — and libraries: Solid, Gradient, Glass, Paper, Cosmic, Mystic, Desktop, Abstract, Earth, Radiant, Texture.

## Right panel
- Device count: 1 · 2 · 3 devices. `Zoom` / `Tilt` tabs. Base Zoom (100 %, hold ⇧ for precision). **Base layout** thumbnails: the same shot framed different ways (centred, zoomed on a corner, tilted left/right, perspective).

## Animation
- `+ Add Animation` appends a keyframe **layout** to the Animations track. Selecting it opens an *Animation* inspector: Transition duration (1 s) with an ease curve button, Zoom / Tilt tabs, a rotation slider, and **Layout presets** (thumbnails of zoomed or tilted framings). Playback interpolates from one layout to the next. Clip widths are dragged to change duration.

## Templates
- Slide-in panel with **All / Image / Animated** filters and categories (Product promotion, Abstract Shapes, Realistic Desktop, …). Every card is a real rendered preview, animated ones marked with a camera icon.

## What Beveled takes from this
- Platform frame-size presets (Instagram, X/Twitter, YouTube, Pinterest, Dribbble, App Store) next to plain ratios.
- Browser chrome styles (Safari / Chrome / Arc, light and dark) and an address bar URL.
- Shadow styles and opacity.
- A **Palette** background that samples colours from the loaded screenshot, plus image backgrounds with blur.
- Templates with real rendered preview images and an Animated filter.
- Device count (1 · 2 · 3) with base layouts, as multi-device arrangements: row, fan, cascade, stack and tilt, each device with its own screen.
- Scene shadow overlays (light through blinds, a window, leaves or palm fronds), as the Light Shadow effect; the leaves sway in video.
- Background libraries (Glass, Cosmic, Abstract, …), as animated procedural shader backgrounds with editable colours.
