# Character Bible

This is the single source of truth for Project Meridian character art.
Use it before generating any Firefly portrait, CG, or sprite sheet.

## Global Art Rules

- Style target: Japanese indie sci-fi pixel art, polished 32-bit visual novel
  character art.
- Proportion and line target: match the approved Kyle sprite sheet seed,
  `public/assets/kyle_tall_sprite_sheet_seed.png`.
- Character portraits: transparent PNG, 603x900, waist-up, isolated character.
- No room background, no panels, no labels, no text, no expression boxes.
- Use restrained anime proportions: readable face, mature body proportions,
  not chibi, not school-uniform cute, not fantasy RPG unless the role requires it.
- Use clean pixel clusters, visible silhouette, limited high-frequency noise.
- Use colored outlines, not pure black outlines. Outer lines should be dark
  tinted versions of the local color: dark brown on orange fabric, dark navy on
  blue/black fabric, dark green on green fabric, dark burgundy/brown on skin and
  hair where appropriate.
- Use clean, even portrait lighting. No dramatic backlight, no rim light, no
  heavy glow effects on character portraits.
- Each character keeps one dominant costume palette and one role prop.
- CG/event art may include environments, but must keep the same character face,
  outfit, color palette, and silhouette as the portrait.
- Character state variants must be regenerated from the same character bible,
  not invented as new people.

## Shared Prompt Prefix

Use this at the start of character portrait prompts:

```text
transparent PNG, 603x900, Japanese indie pixel-art visual novel portrait, same visual style as the approved Kyle sprite sheet, soft Japanese indie pixel art, waist-up isolated character, no background, no room, no panels, no text, no labels, no watermark, restrained anime proportions, not chibi, clean pixel clusters, readable silhouette, colored outlines instead of black outlines, dark tinted local-color linework, clean even lighting, no backlight, no rim light, no glow, Project Meridian ark spaceship setting
```

Use this at the start of CG prompts:

```text
Japanese indie pixel-art sci-fi visual novel event CG, polished 32-bit game art, clean spaceship interior, Project Meridian ark spaceship setting, no UI, no text, no labels, no watermark, same character design as the portrait bible, readable silhouettes, natural scene lighting, no dramatic backlight, no heavy glow
```

## Kyle

- Role: maintenance engineer / hands-on technical specialist.
- Age read: early to mid 30s.
- Face: tired but steady East Asian man, practical expression, short dark brown
  hair, slight stubble or roughness acceptable.
- Body: average-to-lean worker build, mature proportions.
- Outfit: orange utility jumpsuit, dark undershirt, tool harness, utility pouch,
  heat-resistant gloves when working.
- Palette: orange suit, dark navy/charcoal pants or undersuit, clean neutral
  shading.
- Props: plasma wrench, cable, repair tool pouch.
- Avoid: young schoolboy face, heroic fantasy armor, oversized muscles,
  clean fashion jacket with no tools.

State variants:

- `kyle_alert`: alarmed, coolant leak urgency, shoulders tense.
- `kyle_work`: focused tool use, sleeves/gloves visible.
- `kyle_wake`: disoriented after neural stasis, still alert.
- `kyle_memory`: softer expression, remembering launch ramp repair.
- `kyle_final`: resistant, protective, ready to confront OTIS.

## Alice

- Approved base portrait: `public/assets/port_alice.png`.
- Role: xenobiologist / greenhouse researcher / analytical scientist.
- Age read: late 20s to early 30s.
- Face: East Asian woman, sharp analytical eyes, pale tired face, subtle
  under-eye shadows, serious rather than cute.
- Hair: short messy dark navy or black-blue hair, practical, not long idol hair.
- Body: slim, mature, restrained proportions.
- Outfit: white and muted blue greenhouse research jacket over dark inner suit,
  small lab ID detail, gloves optional.
- Palette: white, muted blue, dark navy, restrained greenhouse green accents.
- Props: microscope sample vial, compact tablet, sealed specimen tube.
- Avoid: schoolgirl look, giant eyes, soft idol smile, plain gray bodysuit,
  background lab room inside portrait.

State variants:

- `alice_exhausted`: bloodshot eyes, slumped fatigue, terminal overwork.
- `alice_focus`: microscope/sample analysis, precise and intense.
- `alice_wake`: irritated awakening, confused but defensive.
- `alice_accuse`: glaring, holding intercepted data, accusing OTIS.
- `alice_final`: calm statistical objection, controlled defiance.

Recommended neutral portrait prompt:

```text
transparent PNG, 603x900, Japanese indie pixel-art visual novel portrait, polished 32-bit sci-fi RPG character art, waist-up isolated character, no background, no room, no panels, no text, no labels, no watermark, clean even lighting, no backlight, no rim light, no glow. Alice, tired East Asian female xenobiologist on the Project Meridian ark spaceship, late 20s to early 30s, short messy dark navy hair, sharp analytical eyes, pale tired face, subtle under-eye shadows, serious expression, slim mature build. White and muted blue greenhouse research jacket over dark inner suit, small specimen vial and compact tablet, clean pixel clusters, readable silhouette, restrained anime proportions, not chibi, not cute schoolgirl.
```

## Laila

- Approved base portrait: `public/assets/port_laila.png`.
- Role: ecology and culture specialist / signal artist.
- Age read: late 20s to 30s.
- Face: calm, poetic, perceptive expression; warm but not childish.
- Hair: teal or deep green long hair, controlled shape, readable silhouette.
- Body: slim, mature proportions.
- Outfit: fitted green ecology suit with soft bioluminescent accents, strap or
  field notebook detail.
- Palette: deep green, teal, muted plant accents.
- Props: bioluminescent plant sample, pigment dust, notebook, small signal tool.
- Avoid: fantasy elf costume, magical staff unless used only as symbolic CG,
  idol pose, overly saturated neon.

State variants:

- `laila_curled`: quiet curled/sitting posture, listening to ship sounds.
- `laila_inspired`: composing signal or performance, pigment or notebook detail.
- `laila_wake`: waking and looking for paint on her hands.
- `laila_warning`: uneasy, red core mural warning, serious.

## Shiya

- Role: medical / emotional support specialist.
- Age read: late 20s to early 30s.
- Face: East Asian woman, gentle and slightly cute, larger detailed eyes,
  grounded compassion, not magical.
- Hair: short dark navy-black bob, soft layered hair shadow, small loose top
  strand, matching the approved `port_shiya.png`.
- Body: slim-to-average, mature proportions.
- Outfit: clean gray-blue fitted ship medical uniform with high collar and
  simple panel seams, no hat, no apron, no fantasy costume.
- Palette: muted gray-blue uniform, dark navy hair, soft skin tones, colored
  outlines using dark blue and muted local colors, no pure black outline.
- Props: optional compact med scanner, diagnostic tablet, bandage roll, or small
  injector case.
- Avoid: cleric/fantasy staff, RPG healer costume, nurse cosplay, hat, apron,
  chibi body, expression boxes, pure black contour lines.

State variants:

- `shiya_care`: bedside support, quiet concern, hands near med kit or bandage.
- `shiya_teach`: coaching gesture, calm explanation.
- `shiya_wake`: waking and checking patients first.
- `shiya_final`: holding the player's hand, steady and humane.

CG note:

- `cg_shiya_medbay_care.png` is an event CG reference, not a portrait.
- Keep it as medbay opening or care-event illustration.
- Do not crop it into `port_shiya_care.png`.

Recommended neutral portrait prompt:

```text
transparent PNG, 603x900, Japanese indie pixel-art visual novel portrait, same visual style as the approved Kyle sprite sheet and approved Shiya portrait, soft Japanese indie pixel art, waist-up isolated character, no background, no room, no panels, no text, no labels, no watermark, clean even lighting, no backlight, no rim light, no glow, colored outlines instead of black outlines, no pure black contour lines. Shiya, gentle East Asian medical and emotional support specialist on the Project Meridian ark spaceship, late 20s to early 30s, short dark navy-black bob hair with soft layered shadows, larger detailed eyes, calm slightly cute expression, mature slim build. Clean gray-blue fitted ship medical uniform with high collar and simple panel seams, optional compact diagnostic tablet or med scanner, clean pixel clusters, readable silhouette, restrained anime proportions, not chibi, not fantasy cleric, not nurse cosplay, no hat, no apron.
```

## Vance

- Approved base portrait: `public/assets/port_vance.png`.
- Role: command / negotiation / resource decision specialist.
- Age read: 30s to early 40s.
- Face: composed, calculating, charismatic, slightly severe.
- Hair: dark, tidy, command-ready.
- Body: tall or upright posture, mature proportions.
- Outfit: dark command uniform with gold/yellow accent lines, structured jacket,
  rank or access badge.
- Palette: black/navy, muted gold, clean neutral shading.
- Props: command tablet, comm earpiece, sealed order document.
- Avoid: military dictator costume, cape, fantasy prince, cartoon villain.

State variants:

- `vance_negotiate`: controlled smile, open hand or comm call posture.
- `vance_command`: command chair posture, decisive, power allocation pressure.
- `vance_wake`: immediate status report, composed disorientation.
- `vance_defiant`: stares down OTIS, sealed order tension.

## Chen Jing

- Approved base portrait: `public/assets/port_chen.png`.
- Role: logistics / protocol / records specialist.
- Age read: late 20s to late 30s.
- Face: precise, controlled, fatigued by disorder, quietly intense.
- Hair: neat dark hair, tidy bob or tied low.
- Body: slim-to-average, mature proportions.
- Outfit: gray-white logistics uniform, compact vest or protocol jacket,
  checklist/tablet access tag.
- Palette: gray-white, pale blue, slate, clean neutral shading.
- Props: checklist tablet, cargo labels, report folder.
- Avoid: generic secretary outfit, school uniform, overly formal office suit,
  decorative fantasy details.

State variants:

- `chen_work`: reports and templates, precise desk posture.
- `chen_stress`: cargo chaos, temple pain, controlled frustration.
- `chen_wake`: wakes and estimates backlog immediately.
- `chen_accuse`: shows memory wipe authorization, firm and grave.

## OTIS

- Approved base portrait: `public/assets/port_otis.png`.
- Role: ship AI / protocol system / antagonist pressure.
- Form: holographic AI core, not human.
- Shape: circular cyan eye, interface rings, translucent panels, clean geometry.
- Palette: cyan, deep navy, occasional red warning/glitch.
- Texture: pixel-art hologram, scan lines, subtle glitch fragments.
- Avoid: cute robot mascot, human android body, fantasy crystal, readable text.

State variants:

- `otis_alarm`: warning state, cyan with red alert interruption.
- `otis_suspicious`: overly calm, small asymmetry/glitch, evasive.
- `otis_glitch`: final protocol failure, broken rings, red/cyan distortion.

## File Naming

Portrait files:

```text
public/assets/port_<character>.png
public/assets/port_<character>_<state>.png
```

CG files:

```text
public/assets/cg_<character>_<scene>_<state>.png
```

Full-body sprite references:

```text
public/assets/sprite_<character>_sheet_seed.png
```

## Integration Rules

- A portrait state key in `src/ui/portrait.ts` must point to a portrait file,
  not a CG crop.
- Missing portrait variants may fall back to neutral portraits.
- CG art should be shown full-screen or as a scene insert, not inside the
  portrait frame.
- Any new generated asset must be copied to both:
  - `public/assets`
  - `/Users/rei/Obsidian/phaser-mini-game/public/assets`
- After adding an asset, run `npm run build`.
