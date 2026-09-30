# UltraMock editor audit

Audited `https://www.ultramock.io/editor` (version 2.50.0) on 2026-09-30 in a 1493×812 viewport. This document is the spec the Beveled 3D mockup editor is built against. Where Beveled deliberately diverges (tangerine branding, no paywall, no timeline), it is noted inline.

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┬──────────────┐
│ top bar (26px tall, transparent, mono uppercase 10px)        │              │
├──────────────────────────────────────────────────────────────┤  right       │
│                                                              │  inspector   │
│  canvas frame (16px radius, fills remaining space,           │  254px wide  │
│  centred, letterboxed to the chosen aspect)                  │  scrolls     │
│                                                              │  vertically  │
│         ┌───────────────────────────────────────┐            │              │
│         │ toast: "Upload media to get started…" │            │              │
├──────────────────────────────────────────────────────────────┤              │
│ bottom bar: SIMPLE/ADVANCED · PRESETS · AUTO-MOTION ·        │              │
│ RECORD KEYFRAMES · time · play · loop · ADD TRACK · guides   │              │
│ timeline (shots, tracks, keyframes)                          │              │
└──────────────────────────────────────────────────────────────┴──────────────┘
```

- **Top bar (left → right):** hamburger menu, logo, `INFO`, `TEMPLATES ▾`, `HELP`, `FREE CAPTURES (3)`, centred `▢ FILL ▾` (viewport ratio), then right-aligned `SAVE PROJECT`, `UPGRADE`, camera-icon button ("Capture image", tangerine), `EXPORT ▾` (black pill).
- **Hamburger menu:** Sign in · Undo ⌘Z · Redo ⇧⌘Z · Toggle timeline (T) · Preferences · Info · Help ▸ · Community ▸ · Changelog.
- **Canvas:** one WebGL canvas that fills the stage, 16px rounded corners, a light grey (`#e9e9e9`) page behind it in light mode and `#0a0a0a` in dark mode. The aspect frame letterboxes inside this area. A floating toast at the bottom-centre of the canvas offers `Upload`.
- **Right inspector:** 254px wide. Top row has an undo (reset all) icon on the left and a light/dark toggle on the right. Sections are collapsible with a chevron; the Camera and Blur sections also have a "reset" icon in their header. Every slider row is a 36px pill: label left, value right, and a tiny keyframe diamond button after animatable values.
- **Bottom bar / timeline:** shots (scenes) laid out on a timeline with transitions, keyframe recording, playhead, loop. This is UltraMock's video authoring model. Beveled replaces the timeline with a simpler **Motion** panel (float / sway / spin / orbit loops) and a bottom toolbar (camera presets, reset view, zoom, hint text).

## 2. Visual style

| Token | UltraMock value |
| --- | --- |
| UI font | Geist Sans (body), **Geist Mono** for every label, uppercase, 10px, weight 500, letter-spacing 0.6px |
| Section headers | 11px mono, weight 700, letter-spacing 0.66px, 65–70% opacity |
| Page background | light `#e9e9e9`, dark `#0a0a0a` |
| Panel / rows | transparent panel, rows are subtle grey pills (light: `rgba(0,0,0,.04)`; dark: `rgba(255,255,255,.06)`), 36px tall, ~8px radius; the filled part of the slider is a slightly darker grey bar behind the label |
| Accent | orange `#fd631f` (switch-on, keyframe diamonds, active shot, Upload button, camera icon) |
| Primary button | black pill (`oklch(.21 .006 285)`) with white 10px mono text, 26px tall, radius ~13px; white on dark mode |
| Canvas frame | 16px radius |
| Icons | thin 1px line icons (Lucide-like), 12–14px |
| Switches | 28×16 toggles, orange when on |
| Dropdowns | in-panel popovers, uppercase mono items, checkmark on active |

Beveled keeps the same structure (uppercase mono labels, pill rows, 16px canvas radius, thin icons) but uses its tangerine `#e05d38` as the accent and forces the dark theme inside the editor.

## 3. Inspector sections and controls

### 3.1 Source
- Upload dropzone: `CLICK TO UPLOAD — DRAG & DROP OR PASTE`. Accepts images and video. Paste from clipboard and drag-drop on the canvas both work.
- Shows the current shot name (`SHOT 1`) on the right.

### 3.2 Scene
| Control | Type | Default | Range / options |
| --- | --- | --- | --- |
| Scene picker | card + `CHANGE` | Custom scene (free) | Custom scene · Concrete Desk · Dark Room MacBook · Dark Grid MacBook · Concrete Dark · Bright Studio (all except Custom are Pro environments) |
| Lighting | dropdown | Default | Default · Studio Soft · Dark Rim · Two Tone · Warm Glow |
| Light Rotation X | slider (keyframable) | 0 | 0 – 360 |
| Light Rotation Y | slider (keyframable) | 263 | 0 – 360 |
| Contact Shadow | switch | off | |
| Background | dropdown | Image | Color · Preset · Image |
| Bg Color (Background=Color) | hex + swatch | `#F2F2F2` | any |
| Bg Preset (Background=Preset) | dropdown with swatch | Mono | None · Mono · Metal · Airy · Aurora · Spectrum · Sunset · Ocean · Violet · Emerald · Ember |
| Bg Image (Background=Image) | thumbnail grid | Whisp | ~24 abstract images (whisp, silk, chrome, prism, waves, gradients, clouds, sky, landscapes); the last ~10 are Pro; plus an `UPLOAD` tile |
| Bg Blur (Background=Image) | slider | 0.85 | 0 – 1 |

### 3.3 Mockup
| Control | Type | Default | Range / options |
| --- | --- | --- | --- |
| Device picker | card + `CHANGE` | iPhone 17 (1,206 × 2,622) | grid of tiles, see §4 |
| Finish | dropdown | White (phone) / Silver (MacBook) | Phone: White · Black · Mist Blue · Sage · Lavender. MacBook: Silver · Blush · Citrus · Indigo |
| Reflection | slider | 0.99 | 0 – 1 |
| Border Radius | slider | 0.000 | 0 – 0.080 |
| Status Bar | switch (phone) | off | |
| Notch | switch (phone) | on | |
| Lid Angle | slider (laptop, keyframable) | 110 | 0 – 135 |
| Screen BG | dropdown (laptop) | Color | Color · Image |
| Color | hex + swatch (laptop) | `#1E1E1E` | |
| Screen Padding | slider (laptop) | 0.05 | 0 – 0.45 |
| Rotate Y | slider (keyframable) | 0 | -50 – 50 |
| Rotate X | slider (keyframable) | 0 | -90 – 90 |
| Orientation | segmented | Portrait | Landscape · Portrait (phones/tablets) |

`Flat` (bare screen, "any size") exposes only Reflection, Border Radius, Rotate Y, Rotate X.

### 3.4 Camera
Header has a reset button. Two tabs: `MANUAL` / `PRESETS`.

| Control | Hint chip | Default | Range |
| --- | --- | --- | --- |
| X Axis | DRAG | -29 | -360 – 360 |
| Y Axis | DRAG | 64 | -360 – 360 |
| Z Axis | | 0 | -360 – 360 |
| FOV | | 24 | 10 – 100 |
| Zoom | SCROLL | 1.90 | 0.5 – 10 |
| Pan X | SPACE DRAG | 0.06 | -3 – 3 |
| Pan Y | SPACE DRAG | -0.17 | -3 – 3 |

Presets tab: `HERO · ANGLED · FLAT · BOTTOM · DETAIL`.

Canvas interaction: drag = orbit (X/Y axis), scroll = zoom, space + drag = pan. Every camera value is keyframable.

### 3.5 Blur
Header has a reset button. `MODE` dropdown: `NONE · RADIAL · DIRECTIONAL · TILT SHIFT · LENS (new)`.

| Mode | Controls (default, range) |
| --- | --- |
| Radial | Strength (10, 0–20) · Focus Size (0.52, 0–1) · Falloff (0, 0–1) · Bokeh switch (on) · Focus Position 2-D pad (drag a dot on a mini canvas) |
| Directional | Strength (10, 0–20) · Falloff (0, 0–1) · Bokeh (on) · Angle (0, 0–360) · Position (0.5, 0–1) |
| Tilt Shift | Strength (10, 0–20) · Falloff (0, 0–1) · Bokeh (on) · Angle (45, 0–180) · Focus Size (0.10, 0–0.6) · Scan (0.5, 0–1) |
| Lens | `AUTO` / `MANUAL` segmented. Strength (7.5, 0–60) · Focus Range (0.8, 0.1–2). Manual adds Focus Distance (1.99, 0.2–10) and a `CLICK MOCKUP TO SET` button that lets you click the canvas to place focus. Opens a one-time "Lens blur is more demanding" notice. |

### 3.6 Post Processing
| Control | Default | Range |
| --- | --- | --- |
| Exposure | 0.00 | -2 – 2 |
| Brightness | 0.00 | -1 – 1 |
| Shadows | 0.00 | -1 – 1 |
| Midtones | 0.00 | -1 – 1 |
| Highlights | 0.00 | -1 – 1 |
| Saturation | 1.00 | 0 – 2 |

### 3.7 Effects
A `+` button opens a menu; each added effect becomes a row with an eye (toggle) and `–` (remove). Single-value effects show an editable, draggable value on the row. Multi-value effects expand.

| Effect | Controls (default) |
| --- | --- |
| Depth | disabled in the free tier |
| Glass Border | Width (3) |
| Sharpen | amount (0.00) |
| Vignette | amount (0.00) |
| Grain | amount (0.00) |
| Fish Eye | amount (0.00) |
| Pixel Grid | amount (0.00) |
| Chromatic Abb. | amount (0.00) |
| Bloom | Strength (1.00) · Threshold (0.35) · Radius (0.50) |
| Screen Fade | Fade Angle (135) · Fade Intensity (0.45) · Fade Softness (0.50) |
| Ghost | greyed out |
| Liquid Glass | Applies To (Frame · Mockup) · Strength (0.50) · Shine (0.30) |

## 4. Device list (Mockup → Change)

Tiles in a 2-column grid with a small render, name, and FREE / PRO badge.

Flat · iPhone Duo · iPhone 18 Pro · iPhone 18 Pro Max · **iPhone 17 (free)** · iPhone 17 Pro · iPhone 17 Pro Max · Galaxy S26 Ultra · Pixel 10 Pro · Apple Watch Ultra 3 · iPad Pro · iPad Air · **MacBook Neo (free)** · MacBook Air 13" · MacBook Pro 14" · MacBook Pro 16" · Studio Display · XDR Display.

Beveled ships one procedural device per family instead: iPhone (Dynamic Island), Android (punch-hole), iPad, MacBook (adjustable lid, notch), Studio display on a stand, floating browser window, bare screen ("Flat"), Watch. All free.

## 5. Viewport ratio (top bar `FILL ▾`)

`Fill (default) · 21:9 · 16:9 · 3:2 · 4:3 · 1:1 · 4:5 · 3:4 · 2:3 · 9:16`, then an `APP STORE` group: iPhone 1290×2796 · iPad 2064×2752 · Mac 2880×1800 · Video Horizontal 1920×1080 · Video Vertical 1080×1920.

Beveled: `Auto · 16:9 · 1:1 · 4:5 · 9:16 · 3:2 · 4:3 · 21:9 · Custom (W×H)`.

## 6. Templates (top bar)

Popover with a `STARTER` tab and a 2-column grid of preview cards (image + name + PRO badge, play icon for animated ones): iPhone duo unfold · Concrete MacBook · MacBook 2 · Dark Room MacBook · MacBook 1 · Watch Ultra 1 · iPhone 1 · iPhone 2 · App Store iPhone Images · XDR 1 · Tablet corner · Linear · Brutal phone · Spectrum Warfare · Hero detail · Flat look · Violet Glass · Clean demo.

## 7. Timeline, motion and video

Audited on the template `?template=cmtxa4ajj0000chpep3axe1n7` (Shot 1 → Logo 1 → Shot 2, 9 s) with a real screenshot loaded.

### 7.1 Model
- A project is a **sequence of clips** laid end to end. Clip kinds come from `+` → *Add to timeline*: **Media** (new 3D shot from image or video), **Text** (title or caption card), **Logo** (brand mark card), **Audio** (music or voiceover track).
- **Each shot owns a full scene**: source media, scene/lighting/background, mockup, camera, blur, post and effects. Selecting a clip swaps the inspector to that clip; the Source header shows the clip name (`SHOT 1`).
- Default shot length 3.0 s; presets can change it (Slow zoom out set 4.0 s). Total length shows in the transport (`00:12.00`) and grows as clips are added.
- **Transitions** live on the junction between two clips (a small bow-tie button): `CUT` or `FADE`. The first clip's start and last clip's end have their own buttons ("Hard cut at the start — click to add a fade-in" / "…fade-out").

### 7.2 Simple vs Advanced
- **SIMPLE**: one row of clip pills (`SHOT 1`, `LOGO 1  3-6s`, `TEXT 1  6-9s`), a dashed `+` at the end, and an orange `+ ADD SHOT` button in the transport. Clip edges have drag handles for duration.
- **ADVANCED**: one row per clip with a track header on the left (type icon, drag handle, name, duration). Shot rows expand (chevron) into **keyframe lanes**, one per animated property, labelled with the property and its current value (`X AXIS -38.62`, `Y AXIS -13.99`, `PAN X 0.01`, `PAN Y -0.17`, `ZOOM 1.23`). Keyframes are white diamonds; the selected one is orange.
- Between two keyframes a small curve button opens the **easing editor**: a 2-D bezier graph with two draggable handles, `IN / IN OUT / OUT` segmented control and presets `linear · quad · cubic · quart · quint · sine · expo · circ`.
- Advanced toolbar adds `PRESETS`, `AUTO-MOTION`, a delete (trash) and an easing button when a clip is selected, and `● RECORD KEYFRAMES` (auto-key: every change to an animatable value writes a keyframe at the playhead).
- In the inspector every animatable row has a diamond button: hollow = "Add keyframe at playhead", filled orange = "Remove keyframe at playhead". Animatable: light rotation X/Y, device rotate X/Y, lid angle, camera X/Y/Z axis, FOV, zoom, pan X/Y, blur strength / focus / falloff / angle / position.

### 7.3 Motion presets (per shot, each writes keyframes, 4 s)
Scan left to right · Left – top to bottom · Low-angle pan up · Slow zoom out · Overhead pan · Out and back · Fold up · Flat truck. Cards show a small animated wireframe preview.

### 7.4 Text clip inspector
- Text (multi-line textarea).
- Font: Family (System, Serif, Display, Mono, Geist, Geist Mono, Geist Pixel, Inter, Roboto, Open Sans, Montserrat, Poppins, Lato, Raleway, Playfair Display, Merriweather, Oswald, Bebas Neue, Nunito, Work Sans, DM Sans, Space Grotesk, Sora, Manrope, Archivo, Libre Baskerville, Lora, Source Serif 4, Instrument Serif, JetBrains Mono, IBM Plex Mono), Weight (600), Size (6.0), Spacing (-3), Line height (1.15), Align (Left · Center · Right).
- Color (#FFFFFF). Background: Color · Preset · Image, BG color (#0A0A0A).
- Enter and Exit, each: Per (Line · Word · Character), Duration (1.20 s), Effect (None · Soft Blur · Fade Up · Scale Up · Scale Down · Blur Scale Up · Blur Scale Down · Words In Left · Words In Right · Knock Left · Knock Right).
- Word cycle: `+` cycles the last word through a list, or type `{one|two|three}` in the text.

### 7.5 Logo clip inspector
Source image · Effect (None · Liquid Metal · Gem Smoke · Heatmap, with live previews) · Logo scale (3.5) · Background (#0A0A0A) · Effects `+` · Enter (Effect Fade, Duration 0.40) · Exit (Effect Fade, Duration 0.40).

### 7.6 Transport
Back to start · Play/Pause · Loop · timecode `00:03.20 / 00:09.00` · render-time estimate chip (`⏱ 0:12`) · `+ ADD TRACK` · centre guides · performance playback · timeline zoom slider · minimise timeline. The playhead has a time flag and can be scrubbed from the ruler.

### 7.7 Auto-motion
"Click and drag on your image to create one or more focus areas" — draws dashed rectangles on the screen and generates a camera path that visits each area.

Beveled implements the same clip model (shot / text / logo / audio), per-shot scenes, cut and fade transitions, Simple and Advanced views, keyframe lanes with a bezier easing editor, record-keyframes, slider diamonds, motion presets, and frame-accurate MP4/WebM export with audio. It keeps its looping idle motions (float / sway / spin / orbit) as a per-shot option.

## 8. Export (top bar `EXPORT ▾`)

Popover with `IMAGE` / `VIDEO` tabs.

**Image:** Format select (`JPG — smallest file` · `PNG — lossless, transparency` · `WEBP — modern, small`), `Ultramock watermark` (Pro to remove), `Transparent background` switch, Orientation (Landscape · Square · Portrait), Size select (e.g. `16:9 — 1920×1080 (1080p)`), summary line `1920 × 1080 JPG — Smallest file. No transparency.`, `EXPORT IMAGE` button. The camera icon in the top bar is a one-click "Capture image".

**Video:** Orientation (Landscape; Square/Portrait Pro), Size (`16:9 — 1280×720 (720p)`), Quality (Low · Med · High(Pro) · Ultra(Pro)), Frame rate (30 · 60 Pro), Motion blur (Off · Low · Med · High, Pro), Transparent background (Pro), summary `1280 × 720 · 30 fps · ~7 Mbps`, `EXPORT VIDEO`, note that the tab must stay open.

Beveled: PNG / JPEG / WebP at 1×–4×, quality slider for lossy formats, transparent background, and WebM recording of the motion loop.

## 9. Keyboard
`⌘Z` undo, `⇧⌘Z` redo, `T` toggle timeline, `Space+drag` pan, `Esc` closes popovers.
