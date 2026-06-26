import type { Dim } from "../game/riasec";
import type { RecCategory } from "../game/recommendations";

const ROOT = "assets/ui/rewards";

export const DIM_REWARD_ASSET: Record<Dim, string> = {
  R: `${ROOT}/dim_r_wrench.png`,
  I: `${ROOT}/dim_i_vial.png`,
  A: `${ROOT}/dim_a_memory.png`,
  S: `${ROOT}/dim_s_alarm.png`,
  E: `${ROOT}/dim_e_console.png`,
  C: `${ROOT}/dim_c_chip.png`,
};

export const REC_CATEGORY_ASSET: Record<RecCategory, string> = {
  majors: `${ROOT}/cat_majors.png`,
  careers: `${ROOT}/cat_careers.png`,
  activities: `${ROOT}/cat_activities.png`,
  portfolio: `${ROOT}/cat_portfolio.png`,
};

export const STAR_MAP_ASSETS = {
  orb: `${ROOT}/star_orb.png`,
  console: `${ROOT}/star_console.png`,
  progress: `${ROOT}/star_progress.png`,
};

export const EGG_REWARD_ASSET: Record<string, string> = {
  egg_jukebox: `${ROOT}/egg_jukebox.png`,
  egg_neon: `${ROOT}/egg_neon.png`,
  egg_planet: `${ROOT}/egg_planet.png`,
  egg_turbine: `${ROOT}/egg_turbine.png`,
  egg_warnsign: `${ROOT}/egg_warnsign.png`,
  egg_conduit: `${ROOT}/egg_conduit.png`,
  egg_plants: `${ROOT}/egg_plants.png`,
  egg_armrail: `${ROOT}/egg_armrail.png`,
  egg_dome: `${ROOT}/egg_dome.png`,
  egg_cryopod: `${ROOT}/egg_cryopod.png`,
  egg_alarm: `${ROOT}/egg_alarm.png`,
  egg_hatch: `${ROOT}/egg_hatch.png`,
  egg_galaxy: `${ROOT}/egg_galaxy.png`,
  egg_console_l: `${ROOT}/egg_console_l.png`,
  egg_console_r: `${ROOT}/egg_console_r.png`,
  egg_clock: `${ROOT}/egg_clock.png`,
  egg_bench: `${ROOT}/egg_bench.png`,
  egg_gauges: `${ROOT}/egg_gauges.png`,
};
