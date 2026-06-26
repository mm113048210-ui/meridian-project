# Project Meridian Audio Plan

目標風格: 日系 indie sci-fi pixel visual novel。音樂不要太滿,以低頻環境音、柔和合成器、少量 8-bit/terminal texture 為主。音效要短、乾淨、不要卡通化。

## 命名與格式

- Music: `public/audio/bgm_<name>.mp3` 或 `.ogg`
- Ambience: `public/audio/amb_<name>.mp3` 或 `.ogg`
- SFX: `public/audio/sfx_<name>.wav`
- 建議規格:
  - BGM/ambience: 44.1kHz stereo, loop-friendly, -18 到 -14 LUFS
  - SFX: 44.1kHz mono/stereo, 0.05s 到 2.0s, peak 不超過 -3dB
  - 所有 loop 檔頭尾避免 click/pop

## P0: 必做音樂

| ID | 檔名 | 使用場景 | 長度 | 情緒/聲音方向 | 備註 |
|---|---|---|---:|---|---|
| BGM-01 | `bgm_title_drift` | TitleScene | 45-90s loop | 遠方星艦、溫柔但孤獨、慢速 pad、少量鐘琴/電鋼琴 | 第一印象,不要太暗 |
| BGM-02 | `bgm_ship_hub` | HubScene, 六艙選擇 | 60-90s loop | 安靜太空艙、低頻引擎、輕微脈衝節奏 | 主循環音樂 |
| BGM-03 | `bgm_memory_dialogue` | BayScene 對話、喚醒、記憶碎片 | 60-90s loop | 情感、懸疑、柔和合成器,低張力 | 可覆蓋大部分劇情 |
| BGM-04 | `bgm_certification_focus` | ModulesScene 和小遊戲 | 45-75s loop | 有節奏但不吵,terminal pulse,專注感 | 四個認證共用 |
| BGM-05 | `bgm_alarm_pressure` | AwakeningScene, 警報/危機段落 | 30-60s loop | 低頻警報、壓迫、心跳感 | 不要刺耳 |
| BGM-06 | `bgm_final_release` | RankingScene, FinalScene | 60-120s loop | 結局、釋放、帶一點 bittersweet | 最後評測/結尾用 |

## P0: 全局 UI / 對話音效

| ID | 檔名 | 目前對應 | 用途 | 聲音方向 |
|---|---|---|---|---|
| SFX-01 | `sfx_ui_click.wav` | `sfx.click()` | 按鈕、選項確認、開始遊戲 | 短促電子 click, 60ms |
| SFX-02 | `sfx_ui_hover.wav` | `sfx.hover()` | hover/選項掃過 | 很輕的 blip, 30ms |
| SFX-03 | `sfx_text_type.wav` | `sfx.type()` | 打字音 | 柔和 terminal tick, 不要太尖 |
| SFX-04 | `sfx_choice_confirm.wav` | 可取代部分 `click/snap` | 對話選項確認 | 比 click 稍厚、有確定感 |
| SFX-05 | `sfx_panel_open.wav` | 新增 | 系統卡、面板彈出 | 氣壓門/透明 UI whoosh |
| SFX-06 | `sfx_panel_close.wav` | 新增 | 面板收起、場景切換 | 反向 whoosh |
| SFX-07 | `sfx_save.wav` | 新增 | 主動存檔成功 | 溫柔上升提示音 |
| SFX-08 | `sfx_error_soft.wav` | 可取代部分 `alarm()` | 無效操作 | 低音短 buzz, 不要像錯誤警報 |

## P0: 小遊戲音效表

| 小遊戲 | 場景檔 | 需要音效 | 檔名建議 | 觸發點 |
|---|---|---|---|---|
| 通訊解碼 | `DecodeScene.ts` | 符號選中 | `sfx_decode_select.wav` | 點選符號/字元 |
| 通訊解碼 | `DecodeScene.ts` | 正確填入 | `sfx_decode_lock.wav` | 符號對上、字串前進 |
| 通訊解碼 | `DecodeScene.ts` | 錯誤/雜訊 | `sfx_decode_noise.wav` | 選錯或解析失敗 |
| 通訊解碼 | `DecodeScene.ts` | 最終解碼完成 | `sfx_decode_solved.wav` | 完成整段訊號 |
| 結構修復/拼管 | `PipePuzzleScene.ts` | 拿起/放下管件 | `sfx_pipe_pick_place.wav` | tile 放置 |
| 結構修復/拼管 | `PipePuzzleScene.ts` | 旋轉管件 | `sfx_pipe_rotate.wav` | pipe rotate |
| 結構修復/拼管 | `PipePuzzleScene.ts` | 管線接通 | `sfx_pipe_flow.wav` | 有效連線或通水/能量 |
| 結構修復/拼管 | `PipePuzzleScene.ts` | 漏氣/錯接 | `sfx_pipe_leak.wav` | 錯路或未接通提示 |
| 結構修復/拼管 | `PipePuzzleScene.ts` | 完成 | `sfx_pipe_solved.wav` | puzzle solved |
| 資源拓荒/電力分配 | `PowerGridScene.ts` | 節點切換 | `sfx_grid_toggle.wav` | 點開/關電力 |
| 資源拓荒/電力分配 | `PowerGridScene.ts` | 能量流動 | `sfx_grid_power_flow.wav` | 分配後短脈衝 |
| 資源拓荒/電力分配 | `PowerGridScene.ts` | 過載警告 | `sfx_grid_overload.wav` | 超額或錯誤配置 |
| 資源拓荒/電力分配 | `PowerGridScene.ts` | 平衡成功 | `sfx_grid_balanced.wav` | 達成配置 |
| 數據風暴/貨艙分類 | `SortPuzzleScene.ts` | 物品抓取 | `sfx_cargo_pick.wav` | drag start |
| 數據風暴/貨艙分類 | `SortPuzzleScene.ts` | 正確投放 | `sfx_cargo_drop_ok.wav` | drop in correct category |
| 數據風暴/貨艙分類 | `SortPuzzleScene.ts` | 錯誤投放 | `sfx_cargo_drop_bad.wav` | wrong category |
| 數據風暴/貨艙分類 | `SortPuzzleScene.ts` | 全部歸檔 | `sfx_cargo_solved.wav` | all sorted |
| 步驟排序 | `SeqPuzzleScene.ts` | 卡片拖動 | `sfx_card_drag.wav` | drag item |
| 步驟排序 | `SeqPuzzleScene.ts` | 卡片吸附 | `sfx_card_snap.wav` | reorder/drop |
| 步驟排序 | `SeqPuzzleScene.ts` | 順序完成 | `sfx_sequence_solved.wav` | solved |
| 排名排序 | `RankingScene.ts` | 排名拖動 | `sfx_rank_drag.wav` | drag rank item |
| 排名排序 | `RankingScene.ts` | 排名落位 | `sfx_rank_snap.wav` | drop |
| 排名排序 | `RankingScene.ts` | 評測提交 | `sfx_profile_submit.wav` | continue to final |

## P1: 六艙環境音

| 艙區 | 背景 key | 檔名 | 聲音方向 | 何時播放 |
|---|---|---|---|---|
| 動力艙 | `powerbay` | `amb_powerbay_engine` | 引擎低鳴、蒸氣、金屬震動 | BayScene powerbay |
| 溫室 | `greenhouse` | `amb_greenhouse_life_support` | 水循環、玻璃穹頂 hum、微弱植物培養槽 | BayScene datalab |
| 環形走廊 | `muralhall` | `amb_muralhall_empty` | 大空間回音、遠方通風 | BayScene muralhall |
| 醫療艙 | `medbay` | `amb_medbay_monitor` | 心電/醫療儀器低音量、乾淨空氣聲 | BayScene medbay |
| 指揮中心 | `command` | `amb_command_console` | 控制台 beep、資料流、低頻雷達 | BayScene command / ModulesScene |
| 資料艙 | `workshop` | `amb_archive_workshop` | 老舊硬碟、微弱機械臂、資料櫃 | BayScene workshop |

## P1: 劇情重點音效

| ID | 檔名 | 用途 | 聲音方向 |
|---|---|---|---|
| STORY-01 | `sfx_cryo_wake.wav` | 喚醒角色 | 玻璃艙解鎖、氣霧釋放 |
| STORY-02 | `sfx_neural_sync.wav` | 共振/校準提問 | 柔和掃描上升音 |
| STORY-03 | `sfx_memory_flash.wav` | 記憶碎片 | 短暫 reverse shimmer + glitch |
| STORY-04 | `sfx_otis_glitch.wav` | OTIS 可疑/故障 | 數位破音、bitcrush, 0.5s |
| STORY-05 | `sfx_repair_progress.wav` | 修復度增加 | 小型 progress chime |
| STORY-06 | `sfx_ship_shake.wav` | 警報震動/外部衝擊 | 低頻 rumble |
| STORY-07 | `sfx_door_airlock.wav` | 進出艙區 | sci-fi door, soft hydraulic |
| STORY-08 | `sfx_final_choice.wav` | 結局選擇確認 | 深一點的命運感 hit |

## P2: 角色提示音色

角色不需要配語音,但可以有很輕的「角色 UI tone」,在角色首次出現或重要句前使用。

| 角色 | 檔名 | 音色方向 |
|---|---|---|
| Kyle | `sfx_char_kyle.wav` | 金屬工具、低音 click |
| Alice | `sfx_char_alice.wav` | 掃描儀/玻璃資料音 |
| Laila | `sfx_char_laila.wav` | 柔和和弦、藝術感 shimmer |
| Shiya | `sfx_char_shiya.wav` | 醫療監測短音、溫柔 |
| Vance | `sfx_char_vance.wav` | 指揮台確認音、較硬 |
| Chen | `sfx_char_chen.wav` | 紙張/資料卡/鍵盤短音 |
| OTIS | `sfx_char_otis.wav` | 合成語音前綴、乾淨 cyan tone |

## 最小可交付清單

若時間很短,先做這 16 個:

1. `bgm_title_drift`
2. `bgm_ship_hub`
3. `bgm_memory_dialogue`
4. `bgm_certification_focus`
5. `bgm_final_release`
6. `sfx_ui_click`
7. `sfx_ui_hover`
8. `sfx_text_type`
9. `sfx_panel_open`
10. `sfx_error_soft`
11. `sfx_alarm_pressure`
12. `sfx_solved_chime`
13. `sfx_pipe_rotate`
14. `sfx_pipe_flow`
15. `sfx_cargo_drop_ok`
16. `sfx_memory_flash`

## 實作建議

目前 `src/ui/sfx.ts` 用 WebAudio 生成臨時音效。加入真實音檔時可以保留 fallback:

- 預載音檔: `BootScene.ts`
- 播放音效: 擴充 `src/ui/sfx.ts`, 優先播放 asset, 失敗時用現有 beep
- BGM 管理: 新增 `src/ui/music.ts`, 場景切換時 fade out/in
- 音量建議:
  - BGM 0.28
  - ambience 0.18
  - SFX 0.45
  - type 0.18

## 2026-06-20 本機合成批次

已用本機 wav 合成方式產出:

- 全局 UI / 對話音效: `sfx_ui_click.wav`, `sfx_ui_hover.wav`, `sfx_text_type.wav`, `sfx_choice_confirm.wav`, `sfx_panel_open.wav`, `sfx_panel_close.wav`, `sfx_save.wav`, `sfx_error_soft.wav`, `sfx_alarm_pressure.wav`, `sfx_solved_chime.wav`
- 小遊戲音效: `sfx_decode_*`, `sfx_pipe_*`, `sfx_grid_*`, `sfx_cargo_*`, `sfx_card_*`, `sfx_rank_*`, `sfx_profile_submit.wav`
- 劇情重點音效: `sfx_cryo_wake.wav`, `sfx_neural_sync.wav`, `sfx_memory_flash.wav`, `sfx_otis_glitch.wav`, `sfx_repair_progress.wav`, `sfx_ship_shake.wav`, `sfx_door_airlock.wav`, `sfx_final_choice.wav`
- 角色提示音色: `sfx_char_kyle.wav`, `sfx_char_alice.wav`, `sfx_char_laila.wav`, `sfx_char_shiya.wav`, `sfx_char_vance.wav`, `sfx_char_chen.wav`, `sfx_char_otis.wav`
- 艙區環境 loop 占位: `amb_powerbay_engine.wav`, `amb_greenhouse_life_support.wav`, `amb_muralhall_empty.wav`, `amb_medbay_monitor.wav`, `amb_command_console.wav`, `amb_archive_workshop.wav`

目前已接進遊戲:

- `sfx.ts`: `type`, `click`, `hover`, `snap`, `rotate`, `alarm`, `solve` 會優先播放 wav, 失敗時退回 WebAudio beep。
- BGM: `TitleScene`, `EquipScene`, `AwakeningScene`, `HubScene`, `BayScene`, `ModulesScene`, `RankingScene`, `FinalScene` 會依段落播放對應音樂。

尚未逐一接入的細項:

- 每個小遊戲的專屬動作音效目前多數仍共用 `snap/rotate/alarm/solve`; 可下一步把 `DecodeScene`, `PipePuzzleScene`, `PowerGridScene`, `SortPuzzleScene`, `SeqPuzzleScene`, `RankingScene` 的事件精準替換到專屬檔名。
- 六艙 `amb_*.wav` 已生成但尚未混入場景,建議下一步加 ambience layer,音量約 0.12-0.18。
