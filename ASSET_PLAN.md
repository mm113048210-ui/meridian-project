# Project Meridian Asset Plan

## Direction

Game: `Project Meridian - 星火號《最後不能被壓縮的 14%》`

Visual target: clean pixel-art sci-fi visual novel with playable puzzle interfaces. The player should feel like they are operating a damaged ark ship, not taking a visible personality test.

Do not show `R/I/A/S/E/C`, dimension colors, scoring hints, or assessment labels in any player-facing asset.

## Current Asset Inventory

Located in `public/assets/`.

### Backgrounds

| Key | File | Current Size | Use |
| --- | --- | ---: | --- |
| `title` | `title.png` | 1280x697 | title / hub ambience |
| `powerbay` | `powerbay.png` | 1280x714 | power bay / pipe puzzle |
| `workshop` | `workshop.png` | 1280x714 | workshop bay |
| `greenhouse` | `greenhouse.png` | 1344x768 | ecology / greenhouse bay |
| `command` | `command.png` | 1280x714 | command / final modules |
| `lounge` | `lounge.png` | 1280x955 | lounge / social bay |
| `datalab` | `datalab.png` | 1280x714 | observation / data lab |
| `medbay` | `medbay.png` | 2752x1536 | medical bay |
| `muralhall` | `muralhall.png` | 1280x714 | circular mural hall |

### Equipment Icons

All current equipment icons are 220x220 PNG.

| Key | File |
| --- | --- |
| `eq_plasma_wrench` | `eq_plasma_wrench.png` |
| `eq_spectrum_scanner` | `eq_spectrum_scanner.png` |
| `eq_holo_canvas` | `eq_holo_canvas.png` |
| `eq_bio_resonator` | `eq_bio_resonator.png` |
| `eq_resource_terminal` | `eq_resource_terminal.png` |
| `eq_protocol_library` | `eq_protocol_library.png` |

### Portraits

Current portrait images are 603x900 PNG.

| Character | Key | Status |
| --- | --- | --- |
| 艾莉絲 | `port_alice.png` | exists |
| 希雅 | `port_shiya.png` | exists |
| 范斯 | `port_vance.png` | exists |
| 凱爾 | `port_kyle.png` | missing, currently glyph fallback |
| 萊拉 | `port_laila.png` | missing, currently glyph fallback |
| 陳靜 | `port_chen.png` | missing, currently glyph fallback |
| 奧提斯 | `port_otis.png` or UI core asset | missing, currently glyph fallback |

## Target Specs

### Backgrounds

- Format: PNG.
- Working canvas: 1280x720.
- Runtime crop: keep critical content inside center 960x540 safe area.
- Style: pixel-art sci-fi interior, readable silhouettes, no text baked into the image.
- Lighting: damaged ark ship, cyan system glow, limited warm accent lights.
- Avoid: real-world logos, English labels, visible personality-test symbols.

### Portraits

- Format: transparent PNG.
- Canvas: 603x900 to match current portraits.
- Character position: waist-up, facing slightly toward camera, enough empty transparent area for CSS cropping.
- Style: same pixel-art VN portrait language across all characters.
- Deliver one neutral expression first. Add expression variants only after all core portraits exist.
- Naming:
  - `port_kyle.png`
  - `port_laila.png`
  - `port_chen.png`
  - `port_otis.png` if OTIS becomes visual instead of glyph.

### Equipment Icons

- Format: transparent PNG.
- Canvas: 220x220.
- Style: pixel-art object render, readable at 110px display size.
- Keep all icons same visual weight and angle.
- Avoid dimension-colored hints. Use neutral blue/cyan UI lighting for every item.

### Puzzle UI Assets

Current puzzle pieces are mostly generated in Phaser code. Keep that for prototype speed, then replace only if polish is needed.

Recommended target:

- Pipe puzzle tiles: 86x86 transparent PNG.
- Sort puzzle item icons: 64x64 transparent PNG plus text labels in code.
- Power grid UI: keep code-generated bars and knobs.
- Decode symbols: keep text glyphs for now; optional 48x48 symbol tiles later.
- Sequence cards: keep DOM/Phaser text cards for readability.

### Audio

Current audio is synthesized in `src/ui/sfx.ts`. Add files only after visual pass.

Recommended optional files:

- `audio/hover.ogg`
- `audio/click.ogg`
- `audio/snap.ogg`
- `audio/solve.ogg`
- `audio/alarm.ogg`
- `audio/amb_ship_low.ogg`
- `audio/amb_powerbay.ogg`
- `audio/amb_datalab.ogg`

## Priority Plan

### P0 - Must Have For Consistency

1. Add missing portraits:
   - 凱爾, 萊拉, 陳靜.
2. Add OTIS visual identity:
   - Either keep glyph `◉`, or create a holographic AI core portrait.
3. Normalize all portrait zoom/crop in `src/ui/portrait.ts`.
4. Confirm all background files are visually consistent at 16:9 crop.

### P1 - Gameplay Polish

1. Replace pipe puzzle generated textures with PNG tiles:
   - `pipe_socket.png`
   - `pipe_straight.png`
   - `pipe_elbow.png`
   - `pipe_valve.png`
   - `pipe_mainline.png`
2. Add category icons for sort puzzle:
   - `icon_med.png`
   - `icon_fuel.png`
   - `icon_food.png`
   - `icon_part.png`
3. Add deliverable cards for module results:
   - `doc_logbook.png`
   - `doc_lander_blueprint.png`
   - `doc_resource_report.png`
   - `doc_crisis_log.png`

### P2 - Atmosphere

1. Add subtle ship ambience per major area.
2. Add small UI overlays:
   - warning stripe frame
   - terminal scanline panel
   - completed bay stamp
3. Add expression variants for the six specialists:
   - neutral
   - tense
   - relieved

## Proposed Folder Structure

```text
public/assets/
  backgrounds/
    title.png
    powerbay.png
    workshop.png
    greenhouse.png
    command.png
    lounge.png
    datalab.png
    medbay.png
    muralhall.png
  portraits/
    port_kyle.png
    port_alice.png
    port_laila.png
    port_shiya.png
    port_vance.png
    port_chen.png
    port_otis.png
  equipment/
    eq_plasma_wrench.png
    eq_spectrum_scanner.png
    eq_holo_canvas.png
    eq_bio_resonator.png
    eq_resource_terminal.png
    eq_protocol_library.png
  puzzles/
    pipe_socket.png
    pipe_straight.png
    pipe_elbow.png
    icon_med.png
    icon_fuel.png
    icon_food.png
    icon_part.png
  ui/
    panel_terminal.png
    frame_warning.png
    stamp_stable.png
  audio/
    hover.ogg
    click.ogg
    snap.ogg
    solve.ogg
    alarm.ogg
```

Short-term note: keep the current flat `public/assets/` paths until the code is updated. Move into folders only when also updating `BootScene.ts` and `portrait.ts`.

## Character Asset Briefs

### 凱爾 / Kyle

- Role: technical maintenance specialist.
- Mood: direct, practical, impatient but reliable.
- Visual cues: utility jumpsuit, tool harness, heat-resistant gloves, small burn marks, orange work-light accent.
- Prompt:
  - `transparent PNG, 603x900, waist-up pixel-art sci-fi visual novel portrait, rugged spaceship maintenance engineer, Taiwanese sci-fi ark ship setting, orange utility jumpsuit, tool harness, heat-resistant gloves, tired eyes, practical expression, cyan rim light, consistent clean pixel clusters, no background, no text`

### 萊拉 / Laila

- Role: ecology and culture specialist.
- Mood: poetic, sensitive, sees patterns and meaning.
- Visual cues: soft green accents, field notebook, bio-cultural ornaments, luminescent dust on fingers.
- Prompt:
  - `transparent PNG, 603x900, waist-up pixel-art sci-fi visual novel portrait, ecology and culture specialist on an ark spaceship, soft green bioluminescent accents, field notebook strap, glowing pigment on fingertips, calm poetic expression, cyan ship light, consistent clean pixel clusters, no background, no text`

### 陳靜 / Chen Jing

- Role: protocol / order / medical or logistics-aligned specialist.
- Mood: restrained, precise, dependable.
- Visual cues: gray-white uniform, checklist tablet, neat hair, archival or medical tag details.
- Prompt:
  - `transparent PNG, 603x900, waist-up pixel-art sci-fi visual novel portrait, precise protocol specialist on a damaged ark spaceship, gray white uniform, compact checklist tablet, composed expression, restrained posture, cyan and white interface glow, consistent clean pixel clusters, no background, no text`

### 奧提斯 / OTIS

- Role: ship AI, calm and suspicious.
- Recommended visual: holographic circular core or synthetic avatar, not a human face.
- Prompt:
  - `transparent PNG, 603x900, pixel-art sci-fi visual novel portrait frame asset, holographic ship AI core, circular cyan eye, layered translucent interface rings, subtle glitch fragments, calm unsettling presence, no human body, no background, no text`

## Background Refresh Briefs

Use these only if current backgrounds need replacement or consistency pass.

### Title / Hub

`1280x720 pixel-art sci-fi ark spaceship command vista, damaged but elegant starship interior, distant Kepler-like planet through forward viewport, cyan terminal glow, quiet emergency lighting, center-safe composition, no text, no logos`

### Power Bay

`1280x720 pixel-art sci-fi spaceship power bay, exposed cooling pipes, steam vents, orange maintenance lights, cyan status displays, center area readable for puzzle overlay, no text, no logos`

### Data Lab

`1280x720 pixel-art sci-fi observation data lab, glass sample containers, sensor arrays, starfield monitor glow, blue cyan light, clean center-safe composition, no text, no logos`

### Greenhouse

`1280x720 pixel-art sci-fi spaceship greenhouse, hydroponic racks, alien plant samples, condensation, green and cyan lighting, damaged ark ship mood, no text, no logos`

### Mural Hall

`1280x720 pixel-art circular spaceship corridor with luminous cultural murals, subtle alien pattern references, cyan emergency light, wide center-safe corridor, no text, no logos`

## Code Integration Checklist

1. Add files under `public/assets/`.
2. Load new images in `src/scenes/BootScene.ts`.
3. Update `src/ui/portrait.ts` to replace glyph entries with image entries.
4. Keep `zoom` values per portrait until crops align.
5. For any folder move, update every asset path in:
   - `BootScene.ts`
   - `portrait.ts`
   - any scene that directly references asset keys.
6. Run:

```bash
npm run build
```

7. Start the game and check:
   - no missing texture placeholders
   - portrait crop does not cut faces
   - player-facing UI still hides assessment logic
   - text remains readable over backgrounds

## Production Order

1. `port_kyle.png`
2. `port_laila.png`
3. `port_chen.png`
4. `port_otis.png`
5. portrait crop pass in code
6. pipe puzzle tile polish
7. sort puzzle category icons
8. module deliverable cards
9. ambience and final SFX pass
