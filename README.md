# Project Meridian — 星火號《最後不能被壓縮的 14%》

互動式人格鑑定遊戲(隱性 RIASEC 測評)。Phaser 3 + TypeScript + Vite。

## 執行

```bash
npm install
npm run dev
```

打開 Vite 顯示的網址(預設 http://127.0.0.1:5173)。

## 遊戲流程(對應 PRD)

```
封面 → 選裝備(L1) → 甦醒 → Hub 自由探索
  → 六艙區對話抉擇(L2,RIASEC 主分)
  → 中點轉折(完成 3 艙後)
  → 四大核心任務 M1–M4(小遊戲 + 有趣/無聊回饋,L3)
  → 休眠艙強迫排序(L4)
  → 奧提斯揭露 → 最終抉擇 → 身分鑑定書(雷達圖)
```

## ⛔ 隱性評估鐵則

玩家可見的 UI **永遠不得**出現 R/I/A/S/E/C、維度分數、進度或任何
評估暗示。六維只在最終「身分鑑定書」揭曉一次。
小遊戲表現不計分(只記遙測);分數只來自選擇與主觀回饋。

## 存檔 / 續玩

`localStorage`(key `meridian.save.v1`)自動存檔:完成每一艙、進入各
大階段時寫入(`flow` + RIASEC 內部分數)。封面偵測到存檔會顯示
「繼續航程 / 重新開始」。通關後 `stage="done"`,不再提示續玩。

## 對話節奏

- **按住 Space**:快轉(極速打字 + 自動推進)
- **Tab / ▶▶ 跳過**:已讀跳過(整句到位、自動推進)
- **文字速度**:控制列可切 慢 / 標準 / 快(存 localStorage)
- 控制列只在對話時顯示(右下角)

## 結構

- `src/game/script.ts` — 劇情資料(六艙 × 3 節點、L4 排序題、原型/維度解說)
- `src/game/riasec.ts` — 隱性計分引擎 + 遙測 + 存讀檔序列化(不可外洩到 UI)
- `src/game/flow.ts` — 流程狀態 + autosave(完成艙區、修復度、續玩階段)
- `src/scenes/` — Boot/Title/Equip/Awakening/Hub/Bay/Modules/
  Decode/PipePuzzle/PowerGrid/SortPuzzle/SeqPuzzle/Ranking/Final
- `src/ui/` — DOM 對話(打字機 + 節奏控制)、VN 立繪、節奏 pacing、8-bit 音效
- `public/assets/` — 像素美術(背景、立繪、裝備圖示)

## 待辦(技術)

- 背景 PNG 約 1.2–1.4MB ×8(~10MB);可轉 WebP/AVIF 並保留 PNG fallback,
  大幅縮短 BootScene 載入。Phaser 已單獨拆 chunk(見 `vite.config.ts`)。

## 除錯

瀏覽器 console:`__game`(Phaser 實例)、`__riasec`(分數引擎)、
`__flow`(流程狀態)。
