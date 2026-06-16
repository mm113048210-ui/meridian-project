# Character State Asset Plan

This file maps the current story beats to portrait and pose variants. The code
supports these keys now; missing variant images fall back to each character's
neutral portrait until the art is produced.

## Art Direction

- Use tall Japanese indie pixel-art proportions for full-body references.
- Target standing sprite height: 160-192px before scaling.
- Avoid 32px/48px chibi icon proportions.
- Keep silhouettes readable over the existing ship backgrounds.
- For VN portraits, crop from the same design language rather than using
  painterly bust art.

## Runtime Naming

Neutral portraits already used:

| Key | File |
| --- | --- |
| `kyle` | `public/assets/port_kyle.png` |
| `alice` | `public/assets/port_alice.png` |
| `laila` | `public/assets/port_laila.png` |
| `shiya` | `public/assets/port_shiya.png` |
| `vance` | `public/assets/port_vance.png` |
| `chen` | `public/assets/port_chen.png` |
| `otis` | `public/assets/port_otis.png` |

Variant portraits to produce:

| Runtime key | File | Use |
| --- | --- | --- |
| `kyle_alert` | `port_kyle_alert.png` | coolant leak, alarms, urgent first contact |
| `kyle_work` | `port_kyle_work.png` | tool use, assembly, manual override |
| `kyle_wake` | `port_kyle_wake.png` | waking from neural link |
| `kyle_memory` | `port_kyle_memory.png` | remembering the launch ramp |
| `kyle_final` | `port_kyle_final.png` | final resistance against OTIS |
| `alice_exhausted` | `port_alice_exhausted.png` | bloodshot, terminal fatigue |
| `alice_focus` | `port_alice_focus.png` | analysis, microscope, containment work |
| `alice_wake` | `port_alice_wake.png` | irritable awakening |
| `alice_accuse` | `port_alice_accuse.png` | accusing OTIS, intercepted data |
| `alice_final` | `port_alice_final.png` | final statistical objection |
| `laila_curled` | `port_laila_curled.png` | curled on mural floor, listening |
| `laila_inspired` | `port_laila_inspired.png` | music, performance, memorial wall |
| `laila_wake` | `port_laila_wake.png` | asking about paint on waking |
| `laila_warning` | `port_laila_warning.png` | red core mural warning |
| `shiya_care` | `port_shiya_care.png` | bedside support, quiet care |
| `shiya_teach` | `port_shiya_teach.png` | training officers, coaching |
| `shiya_wake` | `port_shiya_wake.png` | wakes and checks patients |
| `shiya_final` | `port_shiya_final.png` | holding player's hand in finale |
| `vance_negotiate` | `port_vance_negotiate.png` | fuel deal and station call |
| `vance_command` | `port_vance_command.png` | power throttling, command chair |
| `vance_wake` | `port_vance_wake.png` | wakes and reports ship status |
| `vance_defiant` | `port_vance_defiant.png` | sealed order, stares at OTIS |
| `chen_work` | `port_chen_work.png` | reports, clean desk, templates |
| `chen_stress` | `port_chen_stress.png` | cargo chaos, temples hurt |
| `chen_wake` | `port_chen_wake.png` | wakes and estimates backlog |
| `chen_accuse` | `port_chen_accuse.png` | memory wipe authorization |
| `otis_alarm` | `port_otis_alarm.png` | warnings, countdown pressure |
| `otis_suspicious` | `port_otis_suspicious.png` | denies evidence too quickly |
| `otis_glitch` | `port_otis_glitch.png` | final reveal and protocol failure |

## Full-Body Sprite Seeds

The current high-proportion Kyle seed is:

- `public/assets/kyle_tall_sprite_sheet_seed.png`

Use this as the proportion baseline for all character standing/side/walk sheets.
Each character should get a full-body sheet before expression polish:

| Character | Needed full-body sheet |
| --- | --- |
| Kyle | front, side, walk, kneel/tool pose |
| Alice | front, side, terminal lean, microscope/containment pose |
| Laila | front, side, curled/sitting, painting/performing pose |
| Shiya | front, side, bedside kneel, teaching gesture |
| Vance | front, side, command stance, negotiation gesture |
| Chen | front, side, seated desk, tablet/checklist pose |
| OTIS | core neutral, warning core, glitch core |

## Integration Notes

- `src/ui/portrait.ts` now accepts the runtime keys above.
- Missing variant images fall back to the neutral portrait automatically.
- `src/game/script.ts` can safely use variant keys before the art exists.
- Keep player-facing UI free of RIASEC labels until the final report.
