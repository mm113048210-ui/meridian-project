// ── 星圖 Dashboard(手機分頁)──────────────────────────────────
// 回訪者的家:最新身分鑑定雷達 + 多次重測疊圖(看興趣怎麼變) + 連續探索天數
// + 距上次重測天數提示 + 「快速重測」入口(不跑劇情)。
import { careerStore } from "../game/storage";
import { radarSVG, type RadarSeries } from "./radarchart";
import { tt, loc } from "../game/lang";
import { ARCHETYPE } from "../game/script";
import { sfx } from "./sfx";
import { closePhone } from "./phone";
import { DIM_REWARD_ASSET, STAR_MAP_ASSETS } from "./rewardAssets";

const DAY_MS = 24 * 60 * 60 * 1000;

// 主原型對應的房間背景(閒置美術)當星圖標頭橫幅,讓頁面生動。
const DIM_BG: Record<string, string> = {
  R: "powerbay",
  I: "greenhouse",
  A: "lounge",
  S: "medbay_white",
  E: "command",
  C: "workshop",
};

function startScene(key: string) {
  const game = (window as unknown as { __game?: Phaser.Game }).__game;
  if (!game) return;
  closePhone(true);
  game.scene.getScenes(true).forEach((s) => {
    if (s.scene.key !== "boot") game.scene.stop(s.scene.key);
  });
  game.scene.start(key);
}

export async function renderDashboard(container: HTMLElement): Promise<void> {
  const meta = await careerStore.touchVisit();
  const list = await careerStore.listAssessments(); // 由舊到新

  if (!list.length) {
    container.innerHTML = `<div class="dash-empty">${tt(
      "完成一次航程後,你的身分鑑定書會出現在這裡,並可隨時重測、追蹤興趣變化。",
      "After your first voyage, your identity chart appears here. You can re-assess anytime and track how your interests shift.",
    )}</div>`;
    return;
  }

  const latest = list[list.length - 1];
  const top = latest.code[0];
  const daysSince = Math.floor((Date.now() - latest.createdAt) / DAY_MS);

  // 疊圖:最近最多 4 次,越舊越淡,最新最亮
  const recent = list.slice(-4);
  const series: RadarSeries[] = recent.map((a, i) => {
    const isLatest = i === recent.length - 1;
    const age = recent.length - 1 - i; // 0=最新
    return {
      scores: a.scores,
      color: isLatest ? "#00f5ff" : "#8fb3c4",
      fillOpacity: isLatest ? 0.22 : 0,
      strokeOpacity: isLatest ? 1 : Math.max(0.18, 0.5 - age * 0.12),
      strokeWidth: isLatest ? 2.2 : 1.2,
    };
  });

  const retakeHint =
    daysSince >= 60
      ? tt(
          `距上次重測已 ${daysSince} 天。興趣會隨成長悄悄改變 —— 要不要再測一次?`,
          `It's been ${daysSince} days. Interests quietly shift as you grow — want to re-assess?`,
        )
      : tt(
          "興趣會隨經歷改變。隨時可以重測,看看自己變了沒。",
          "Interests change with experience. Re-assess anytime to see if yours have.",
        );

  container.innerHTML = `
    <div class="dash-head has-bg" style="background-image:url(assets/backgrounds/${DIM_BG[top]}.png)">
      <div>
        <div class="dash-arche">${loc(ARCHETYPE[top])}</div>
        <div class="dash-code">Holland ${latest.code.join(" · ")}</div>
      </div>
      <img class="dash-head-asset raw-asset" src="${DIM_REWARD_ASSET[top]}" alt="" loading="lazy" />
      <div class="dash-streak" role="img" aria-label="${tt(`連續探索 ${meta.streakDays} 天`, `${meta.streakDays}-day exploration streak`)}"><svg class="ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1.2 2.8 4 4.3 4 7.8a4 4 0 0 1-8 0c0-1.3.5-2.2 1.2-3 .1 1.3.9 2 1.6 2.2-.3-2.4 .4-5.2 1.2-7z"/></svg> <span style="font-variant-numeric:tabular-nums">${meta.streakDays}</span></div>
    </div>
    <div class="dash-art-row" aria-hidden="true">
      <img class="raw-asset" src="${STAR_MAP_ASSETS.orb}" alt="" loading="lazy" />
      <img class="raw-asset" src="${STAR_MAP_ASSETS.console}" alt="" loading="lazy" />
      <img class="raw-asset" src="${STAR_MAP_ASSETS.progress}" alt="" loading="lazy" />
    </div>
    <div class="dash-radar">${radarSVG(series, 280)}</div>
    ${recent.length > 1 ? `<div class="dash-legend"><span class="dash-dot-latest"></span>${tt("最新", "Latest")}　<span class="dash-dot-old"></span>${tt("過往重測", "Past tests")}（${recent.length}）</div>` : ""}
    <p class="dash-hint">${retakeHint}</p>
    <div class="dash-actions">
      <button class="dash-btn primary" data-act="retest">${tt("✦ 快速重測", "✦ Quick Re-assess")}</button>
      <button class="dash-btn" data-act="replay">${tt("↻ 重玩劇情", "↻ Replay Story")}</button>
    </div>
    <button class="dash-export" data-act="export">${tt("⤓ 匯出我的資料", "⤓ Export my data")}</button>`;

  container.querySelector("[data-act=retest]")?.addEventListener("click", () => {
    sfx.click();
    startScene("retest");
  });
  container.querySelector("[data-act=replay]")?.addEventListener("click", () => {
    sfx.click();
    startScene("prologue");
  });
  container.querySelector("[data-act=export]")?.addEventListener("click", () => {
    sfx.click();
    void exportMyData();
  });
}

/** 把生涯資料下載成 JSON(資料可攜 + 試點 baseline 蒐集;檔內無個資)。 */
async function exportMyData(): Promise<void> {
  const json = await careerStore.exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meridian-data-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
