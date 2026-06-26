// ── 鑑定書後自陳(1–5)──────────────────────────────────────────
// 唯一的滿意度訊號,符合鐵則「評分只來自選擇與主觀回饋」。
// 鑑定書是 canvas 畫面 → 用 DOM 小卡浮在頂部中央,不擋底部按鈕;答完淡出。
import { careerStore } from "../game/storage";
import { tt } from "../game/lang";
import { sfx } from "./sfx";

/** 在鑑定書畫面浮出「這份結果對你有幫助嗎？」1–5。答案寫進該筆快照。 */
export function askHelpful(assessmentId: string): void {
  if (document.getElementById("helpful-prompt")) return; // 同畫面只問一次
  const card = document.createElement("div");
  card.id = "helpful-prompt";
  card.className = "helpful-card";
  card.setAttribute("role", "group");
  card.setAttribute("aria-label", tt("回饋", "Feedback"));

  const dots = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button class="helpful-dot" data-v="${n}" aria-label="${tt(`${n} 分`, `${n} of 5`)}">${n}</button>`,
    )
    .join("");

  card.innerHTML = `
    <div class="helpful-q">${tt("這份結果，對你認識自己有幫助嗎？", "Did this result help you understand yourself?")}</div>
    <div class="helpful-scale">${dots}</div>
    <div class="helpful-ends">
      <span>${tt("沒什麼幫助", "Not really")}</span>
      <span>${tt("很有幫助", "A lot")}</span>
    </div>`;

  document.getElementById("app")?.appendChild(card);
  requestAnimationFrame(() => card.classList.add("show"));

  card.querySelectorAll<HTMLButtonElement>(".helpful-dot").forEach((btn) =>
    btn.addEventListener("click", async () => {
      sfx.click();
      const v = Number(btn.dataset.v);
      await careerStore.setAssessmentFeedback(assessmentId, v);
      card.innerHTML = `<div class="helpful-thanks">${tt("謝謝你的回饋 ✦", "Thanks for the feedback ✦")}</div>`;
      window.setTimeout(() => {
        card.classList.remove("show");
        window.setTimeout(() => card.remove(), 320);
      }, 1100);
    }),
  );
}
