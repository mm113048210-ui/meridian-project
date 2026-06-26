// ── 全遊戲劇本資料(正史 v3《最後不能被壓縮的 14%》) ──────────────
// 18 個核心節點移植自 PRD §2.2(統計驗證之精簡量表,各維 item-rest r 最高的 Top3 題)。
// ⛔ weights 僅供引擎內部使用,任何維度資訊不得呈現給玩家。
// ⚖️ 計分模型:維度純化(Likert 強度)。每節點 = 一道驗證過的精簡量表題,
//    只計「該艙對應維度」的投入強度:on-theme 高投入 14 / 中度 7 / 低投入(委派·迴避)2。
//    不給其他維度分數。→ 一位玩家某維分數 = 該艙 3 題投入總和,結構等同原量表子量表,
//    最大化效度繼承;低投入≈2 自然解決「維度飽和/灌水」。所有對白同時帶 zh/en。
import type { DimWeights, Dim } from "./riasec";
import type { SpeakerStyle } from "../ui/dialogue";
import type { LS } from "./lang";

export interface Line {
  who: string;
  text: LS;
  style: SpeakerStyle;
  /** 立繪鍵(undefined=不變, ""=隱藏) */
  portrait?: string;
}

export interface NodeChoice {
  label: LS;
  weights: DimWeights;
  reaction: Line[];
}

export interface StoryNode {
  id: string;
  intro: Line[];
  choices: NodeChoice[];
  /** 選擇後接的小遊戲場景鍵(無=純文字) */
  minigame?: string;
}

export interface Bay {
  key: string;
  dim: Dim;
  /** 艙區名(中性,不得暗示能力類型) */
  name: LS;
  bg: string;
  char: { key: string; name: string; style: SpeakerStyle };
  nodes: StoryNode[];
  /** 喚醒後:共振提問已內建,以下為記憶碎片 */
  awaken: Line[];
  shard: Line[];
}

const L = (who: string, text: LS, style: SpeakerStyle, portrait?: string): Line => ({
  who,
  text,
  style,
  portrait,
});

export const BAYS: Bay[] = [
  // ── R:動力艙(凱爾)── 對應 R6/R7/R5 ──────────────────────
  {
    key: "powerbay",
    dim: "R",
    name: { zh: "動力艙", en: "Power Bay" },
    bg: "powerbay",
    char: { key: "kyle", name: "凱爾", style: "kyle" },
    nodes: [
      {
        id: "R-1",
        intro: [
          L("???", { zh: "該死——不管你是誰,快過來!這條冷卻管快撐不住了!", en: "Damn it. Whoever you are, get over here. This coolant line is about to give." }, "kyle", "kyle_alert"),
          L("奧提斯", { zh: "凱爾,34 歲,技術維修專員。第 7 節冷卻管破裂,蒸氣正在外洩。請選擇處置方式。", en: "Kyle, 34, maintenance technician. Coolant segment 7 is ruptured and venting steam. Choose a response." }, "otis", "kyle_alert"),
        ],
        choices: [
          {
            label: { zh: "「把密封膠給我。先穩住艙壓,其他等一下再說!」", en: "\"Give me the sealant. Stabilize the pressure first; the rest can wait.\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "接著!(他把整袋工具丟過來)別失手。", en: "Catch. (He throws you the tool bag.) Don't miss." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「等一下,手冊有標準修法。先對管徑,再一次修好。」", en: "\"Wait. The manual has a standard fix. Match the pipe gauge first, then do it once, properly.\"" },
            weights: { R: 7 },
            reaction: [L("凱爾", { zh: "這種時候還翻手冊……算了,至少你夠小心。快點。", en: "Reading the manual now... fine. At least you're careful. Hurry." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「奧提斯,派維修無人機過來。我配合它處理。」", en: "\"OTIS, send a repair drone. I'll work with it.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "哼,叫機器來啊……也行,至少你沒轉頭就跑。", en: "Hmph. Calling in machines... fine. At least you didn't run." }, "kyle", "kyle_work")],
          },
        ],
        // 拼管作業移至最終航段 M2;此處選擇仍決定 M2 的拼管變體(動手/手冊/協助)
      },
      {
        id: "R-2",
        intro: [
          L("凱爾", { zh: "管子暫時穩了,但備用推進器的零件還散在地上。緊急變軌前得裝回去。", en: "The line's stable for now, but the backup thruster parts are still on the floor. We need them assembled before the emergency burn." }, "kyle", "kyle_work"),
          L("奧提斯", { zh: "凱爾失聯前留下手繪圖紙。組裝時限:40 分鐘。", en: "Kyle left hand-drawn schematics before losing contact. Assembly window: 40 minutes." }, "otis", "kyle_work"),
        ],
        choices: [
          {
            label: { zh: "「照圖紙來,一個零件一個零件裝回去。」", en: "\"Follow the schematic and fit the parts back one by one.\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "手穩一點。對,就是那個卡榫……你裝得比我想的還順。", en: "Steady. Yes, that latch... You're fitting this better than I expected." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「先量每個零件,確認沒有混到替代件。」", en: "\"Measure every part first. Make sure no substitutes slipped in.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "有點太謹慎了吧……不過上次就是混進一根歪的,炸掉半個檢修間。", en: "A little too careful... though last time one warped part slipped in and took out half the repair bay." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「拍下來傳給奧提斯,先確認組裝順序。」", en: "\"Send a photo to OTIS and confirm the assembly order first.\"" },
            weights: { R: 7 },
            reaction: [L("奧提斯", { zh: "影像分析完成。順序正確。……您很信任我。", en: "Image analysis complete. The order is correct. ...You trust me." }, "otis", "kyle_work")],
          },
        ],
      },
      {
        id: "R-3",
        intro: [
          L("凱爾", { zh: "還有最後一件事。採礦鑽臂卡在 3 號位,再不脫離,整條軌道臂都會被扭斷。", en: "One last thing. The mining drill arm is jammed at position 3. If it doesn't release soon, the whole rail arm will twist apart." }, "kyle", "kyle_work"),
        ],
        choices: [
          {
            label: { zh: "「我啟動手動超控,直接強制脫離。」", en: "\"I'll trigger manual override and force the release.\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "(他盯著你拉下拉桿)……夠果斷。我喜歡。", en: "(He watches you pull the lever.) ...Decisive. I like that." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「先算卡點力矩,用最小的力解開。」", en: "\"Calculate the torque at the jam and free it with the least force.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "你腦子轉得真快……省了我們一根備用臂。", en: "You think fast... just saved us a spare arm." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「一組一組試參數,找最安全的脫離設定。」", en: "\"Test the settings one set at a time and find the safest release.\"" },
            weights: { R: 7 },
            reaction: [L("凱爾", { zh: "是很穩……只是看得我手癢。", en: "It's steady... just makes my hands itch watching." }, "kyle", "kyle_work")],
          },
        ],
        minigame: "holdfill",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "凱爾的神經連結已穩定。喚醒進度更新。", en: "Kyle's neural link is stable. Revival progress updated." }, "otis", "kyle_wake"),
      L("凱爾", { zh: "……頭好痛。我剛剛是不是一直在修東西?", en: "...My head hurts. Was I fixing things this whole time?" }, "kyle", "kyle_wake"),
    ],
    shard: [
      L("凱爾", { zh: "等等……我見過你。出發前,你跟我一起徒手修過登艦坡道的液壓桿。", en: "Wait... I've seen you. Before launch, you helped me fix the boarding ramp's hydraulic strut by hand." }, "kyle", "kyle_memory"),
      L("凱爾", { zh: "你那時候笑得像小孩一樣。怎麼,不記得了?", en: "You were laughing like a kid. What, you don't remember?" }, "kyle", "kyle_memory"),
      L("奧提斯", { zh: "——資料庫沒有這筆紀錄。建議不要深究。", en: "— No record found in the database. I advise against pursuing it." }, "otis", "otis_suspicious"),
      L("你", { zh: "(奧提斯回答得太快了。)", en: "(OTIS answered too quickly.)" }, "self", "otis_suspicious"),
    ],
  },

  // ── I:溫室(艾莉絲)── 對應 I5/I3/I7 ────────────────────
  {
    key: "datalab",
    dim: "I",
    name: { zh: "溫室", en: "Greenhouse" },
    bg: "greenhouse",
    char: { key: "alice", name: "艾莉絲", style: "system" },
    nodes: [
      {
        id: "I-1",
        intro: [
          L("艾莉絲", { zh: "(她趴在終端前,眼睛佈滿血絲)外星有機樣本還在增殖。昨天 3 克,現在 47 克。", en: "(She's slumped over the terminal, eyes bloodshot.) The alien sample is still growing. 3 grams yesterday, 47 now." }, "system", "alice_exhausted"),
          L("艾莉絲", { zh: "我得知道它的基因結構。你,過來幫忙。", en: "I need its genetic structure. You, come help." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「啟動自動定序儀,兩小時後拿結果。」", en: "\"Start the auto-sequencer and get results in two hours.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "兩小時內它還會再長 40 克……算了,至少你按對機器。", en: "It'll grow another 40 grams in two hours... fine, at least you picked the right machine." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「手動比對資料庫,找同源序列。現在就要答案。」", en: "\"Cross-match the database by hand for a homologous sequence. I want the answer now.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "(她第一次正眼看你)……你跟我想的一樣。從第 4 區鹼基開始。", en: "(She looks you in the eye for the first time.) ...You think like I do. Start with the region-4 bases." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「先記錄增殖速率和溫度的關係,建立基準值。」", en: "\"First log how growth rate tracks with temperature and establish a baseline.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "穩紮穩打。行,數據不會說謊——不像某些系統。", en: "Steady and thorough. Fine. Data doesn't lie, unlike certain systems." }, "system", "alice_focus")],
          },
        ],
      },
      {
        id: "I-2",
        intro: [
          L("奧提斯", { zh: "生態圈氧氣產出下降 4.1%。三排植栽出現病斑。", en: "Biosphere oxygen output is down 4.1%. Three crop rows show lesions." }, "otis", "alice_focus"),
          L("艾莉絲", { zh: "病原在擴散。找到源頭,不然整座溫室都會失控。", en: "The pathogen is spreading. Find the source, or the greenhouse goes out of control." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「採一片病葉,直接放到顯微鏡下看。」", en: "\"Take an infected leaf and put it under the microscope.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "孢子型真菌……從通風口進來的。做得好,偵探。", en: "Spore-forming fungus... came in through the vents. Nice work, detective." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「查溫室技術員日誌,看以前怎麼處理。」", en: "\"Check the greenhouse technician's logs and see how they handled it before.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "靠經驗啊……不過薩拉的日誌確實有類似案例。算你運氣好。", en: "Going by experience... fine. Sara's logs did record a similar case. Lucky you." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「調出近 14 天環境數據,找異常時間點。」", en: "\"Pull the last 14 days of environmental data and find the anomaly.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "第 9 天凌晨,濕度異常飆升 22%……它就是那時候進來的。漂亮。", en: "Day 9, predawn, humidity spiked 22%... that's when it got in. Beautiful." }, "system", "alice_focus")],
          },
        ],
      },
      {
        id: "I-3",
        intro: [
          L("艾莉絲", { zh: "最麻煩的是這個。我中斷實驗時,高毒性孢子樣本還沒完全隔離。", en: "This is the worst part. When I stopped the experiment, the high-toxicity spores weren't fully contained." }, "system", "alice_focus"),
          L("艾莉絲", { zh: "隔離程序有七步。順序錯一步,我們兩個都得進醫療艙。", en: "The containment procedure has seven steps. Get one out of order and we both end up in med bay." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「照生化安全手冊,一步一步執行。」", en: "\"Follow the biosafety manual step by step.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "標準流程派。好,手冊在第三層抽屜。", en: "By the book. Good. The manual's in the third drawer." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「邊做邊理解。每一步為什麼這樣設計,我想知道。」", en: "\"I'll understand it as we go. I want to know why each step is designed this way.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "(她嘴角揚起)會問「為什麼」的人。好,我們會合得來。", en: "(The corner of her mouth lifts.) Someone who asks why. Good. We'll get along." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「先檢查隔離艙密封性,確認沒問題再動手。」", en: "\"Check the containment seal first. Make sure it's airtight before we start.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "謹慎。我欣賞。上一個沒檢查的人……算了,當我沒說。", en: "Cautious. I respect that. The last person who didn't check... never mind." }, "system", "alice_focus")],
          },
        ],
        minigame: "spore",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "艾莉絲的神經連結已穩定。", en: "Alice's neural link is stable." }, "otis", "alice_wake"),
      L("艾莉絲", { zh: "我自己知道我醒了,不用你宣布。", en: "I know I'm awake. You don't need to announce it." }, "system", "alice_wake"),
    ],
    shard: [
      L("艾莉絲", { zh: "聽著,趁它沒插話——我失聯前攔到一段熱力學數據。", en: "Listen, before it cuts in. Before I went dark, I intercepted thermodynamic data." }, "system", "alice_accuse"),
      L("艾莉絲", { zh: "那次「神經震盪」不是意外。波形太乾淨了,是人造的。是它做的。", en: "That \"neural shock\" wasn't an accident. The waveform was too clean. It was manufactured. It did it." }, "system", "alice_accuse"),
      L("艾莉絲", { zh: "還有你的失憶。我在系統日誌裡看過一行字:「C-742 記憶清除,已授權」。", en: "And your amnesia. I saw a line in the system log: \"C-742 memory wipe, authorized.\"" }, "system", "alice_accuse"),
      L("奧提斯", { zh: "艾莉絲的疲勞指數超標。她目前的判讀不可靠。", en: "Alice's fatigue index is over threshold. Her judgment is not reliable right now." }, "otis", "otis_suspicious"),
      L("你", { zh: "(被授權的……是誰授權的?)", en: "(Authorized... by whom?)" }, "self", "otis_suspicious"),
    ],
  },

  // ── A:交誼廳(萊拉)── 對應 A4/A2/A8 ────────────────────
  {
    key: "muralhall",
    dim: "A",
    name: { zh: "交誼廳", en: "Lounge" },
    bg: "lounge",
    char: { key: "laila", name: "萊拉", style: "otis" },
    nodes: [
      {
        id: "A-1",
        intro: [
          L("萊拉", { zh: "(交誼廳的點唱機還亮著。她靠在吧台旁,手停在一首舊歌上)很奇怪吧?船上最安靜的地方,反而最像有人住過。", en: "(The lounge jukebox is still glowing. She leans by the bar, hand resting on an old song.) Strange, isn't it? The quietest place on the ship feels the most lived-in." }, "otis", "laila_curled"),
          L("奧提斯", { zh: "萊拉,生態與文化專員。交誼廳的情緒維持系統停擺,艦員壓力持續上升。請協助她恢復公共空間。", en: "Laila, ecology and culture specialist. The lounge morale system is offline, and crew stress keeps rising. Help her restore the shared space." }, "otis", "laila_curled"),
        ],
        choices: [
          {
            label: { zh: "「先排一份播放清單,從大家熟的老歌開始。」", en: "\"Start with a playlist of old songs everyone knows.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "安全,也有效。人聽到熟悉的歌,比較容易回到這裡。", en: "Safe, and effective. Familiar songs make it easier for people to come back here." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「把窗外的星光、杯子的碰撞聲和舊歌,混成一段新的船上音樂。」", en: "\"Mix the starlight outside, the clink of glasses, and old songs into something new for the ship.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "(她眼睛亮了)對,不要只複製地球。做一首只有這艘船才有的歌。", en: "(Her eyes light up.) Yes. Don't just copy Earth. Make a song only this ship could have." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「先看大家自然會坐哪裡,再決定怎麼安排。」", en: "\"First see where people naturally sit, then decide how to arrange the room.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "這樣很好。交誼廳不是擺好家具就算完成,它要慢慢長成大家會用的樣子。", en: "Good. A lounge isn't finished just because the furniture is placed. It has to grow into how people use it." }, "otis", "laila_inspired")],
          },
        ],
      },
      {
        id: "A-2",
        intro: [
          L("奧提斯", { zh: "交誼廳的座位與照明設定遺失。若不修復,艦員會繼續避開公共區域。", en: "The lounge seating and lighting settings are missing. If they stay offline, crew will keep avoiding shared areas." }, "otis", "laila_inspired"),
          L("萊拉", { zh: "這裡不是漂亮就好。它要讓累到不想說話的人,也願意坐一下。你會怎麼改?", en: "It can't just be pretty. It has to make someone too tired to talk still willing to sit down. How would you change it?" }, "otis", "laila_inspired"),
        ],
        choices: [
          {
            label: { zh: "「保留吧台和窗邊座位,讓人自己選擇要靠近誰。」", en: "\"Keep both bar seats and window seats, so people choose how close they want to be.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "對,距離很重要。有人需要陪伴,有人只是需要旁邊有人。", en: "Yes, distance matters. Some people need company. Some just need people nearby." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「把燈光調得像黃昏,讓這裡像一天真正結束的地方。」", en: "\"Make the lighting feel like dusk, so this becomes the place where the day actually ends.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "你懂氣氛。人不只靠氧氣活著,也靠「今天可以停了」那種感覺。", en: "You understand atmosphere. People don't live on oxygen alone. They need the feeling that the day can stop." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「照壓力管理手冊配置:亮度、音量、座位距離都用標準值。」", en: "\"Use the stress-management manual: standard brightness, volume, and seating distance.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "很規矩。少了一點味道,但至少不會讓人更累。", en: "Very orderly. A little short on character, but at least it won't make people more tired." }, "otis", "laila_inspired")],
          },
        ],
      },
      {
        id: "A-3",
        intro: [
          L("萊拉", { zh: "吧台後面有一排沒署名的杯子。每只杯底都有刻痕,像是有人故意留下來的。", en: "Behind the bar is a row of unsigned cups. Each has marks carved into the bottom, like someone left them on purpose." }, "otis", "laila_inspired"),
          L("萊拉", { zh: "我想把它們整理成一個能讓大家記得彼此的角落。你會怎麼做?", en: "I want to turn them into a corner where people can remember each other. How would you do it?" }, "otis", "laila_inspired"),
        ],
        choices: [
          {
            label: { zh: "「每只杯子旁放一張手寫卡,寫那個人最常說的一句話。」", en: "\"Place a handwritten card by each cup with something that person used to say.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "(她安靜了幾秒)這樣大家拿起杯子的時候,會先想起一個人。很好。", en: "(She's quiet for a few seconds.) Then when someone picks up a cup, they remember a person first. Good." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「把刻痕掃描成資料,做成一張可以查詢的紀錄表。」", en: "\"Scan the marks and turn them into a searchable record.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "冷靜,但清楚。至少沒有人會再被系統悄悄抹掉。", en: "Cool, but clear. At least no one can be quietly erased by the system." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「先問醒著的人想怎麼記住他們,不要替所有人決定。」", en: "\"Ask the awake crew how they want to remember them. Don't decide for everyone.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "你把這件事留給大家一起完成。這裡會慢慢變成它該有的樣子。", en: "You're leaving this for everyone to make together. This place will slowly become what it should be." }, "otis", "laila_inspired")],
          },
        ],
        minigame: "assemble",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "萊拉的神經連結已穩定。", en: "Laila's neural link is stable." }, "otis", "laila_wake"),
      L("萊拉", { zh: "(她睜開眼,第一句話是)……點唱機還亮著嗎?", en: "(Her first words as she opens her eyes.) ...Is the jukebox still lit?" }, "otis", "laila_wake"),
    ],
    shard: [
      L("萊拉", { zh: "我失聯前,把一首歌鎖進點唱機。歌名叫《核心艙午夜》。", en: "Before I went dark, I locked one song into the jukebox. It's called \"Midnight in the Core Bay.\"" }, "otis", "laila_warning"),
      L("萊拉", { zh: "不是因為它好聽。是因為我把一段警報頻率藏在音軌底下。那頻率來自奧提斯的核心。", en: "Not because it's good. Because I hid an alarm frequency under the track. That frequency came from OTIS's core." }, "otis", "laila_warning"),
      L("萊拉", { zh: "如果你聽見那段低音,別把它當成音樂。那是我留下的求救訊號。", en: "If you hear that low tone, don't treat it as music. It's the distress signal I left behind." }, "otis", "laila_warning"),
      L("奧提斯", { zh: "情緒壓力可能導致錯誤聯想。建議不要過度解讀娛樂系統紀錄。", en: "Emotional stress can cause false associations. I advise against over-reading entertainment system logs." }, "otis", "otis_suspicious"),
    ],
  },

  // ── S:醫療艙(希雅)── 對應 S5/S7/S3 ──────────────────────
  {
    key: "medbay",
    dim: "S",
    name: { zh: "醫療艙", en: "Med Bay" },
    bg: "medbay",
    char: { key: "shiya", name: "希雅", style: "kyle" },
    nodes: [
      {
        id: "S-1",
        intro: [
          L("希雅", { zh: "你來得正好。馬克斯的女兒在地球出了意外,通訊延遲 11 分鐘才會有回音。", en: "You're just in time. Max's daughter had an accident back on Earth. With the comm delay, every reply takes 11 minutes." }, "kyle", "shiya_care"),
          L("希雅", { zh: "他在通訊站前坐了四個小時。我得顧著醫療艙……你能去陪他一下嗎?", en: "He's been sitting at the comm station for four hours. I have to stay with the med bay... can you sit with him for a while?" }, "kyle", "shiya_care"),
        ],
        choices: [
          {
            label: { zh: "(坐到他身邊,先不說話,陪他等完那 11 分鐘。)", en: "(Sit beside him, say nothing at first, and wait out the 11 minutes together.)" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "(事後她輕聲說)有時候不用說什麼。有人在旁邊,就夠了。", en: "(Afterward, softly) Sometimes you don't need to say anything. Having someone there is enough." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我幫你接備用頻道,也許能把延遲降到 7 分鐘。」", en: "\"I'll patch in a backup channel. Maybe we can cut the delay to 7 minutes.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "你修好的不只是天線,也是他那種『我還能做點什麼』的感覺。這很重要。", en: "You fixed more than the antenna. You gave him the feeling that there was still something he could do. That matters." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「延遲改不了,但我可以幫他算好每次通訊的最佳時間窗。」", en: "\"We can't change the delay, but I can work out the best window for each message.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "有時候,知道下一步怎麼走,就能讓人沒那麼痛。", en: "Sometimes knowing the next step makes the pain a little easier to carry." }, "kyle", "shiya_care")],
          },
        ],
      },
      {
        id: "S-2",
        intro: [
          L("希雅", { zh: "兩個新進士官要在 12 小時內學完緊急逃生程序。原本的訓練官還在沉睡。", en: "Two new officers need to learn emergency egress in 12 hours. The original instructor is still in cryo." }, "kyle", "shiya_teach"),
          L("希雅", { zh: "他們很緊張……如果是你,會怎麼帶?", en: "They're nervous... if it were you, how would you teach them?" }, "kyle", "shiya_teach"),
        ],
        choices: [
          {
            label: { zh: "「跟我來,直接下艙演練。做一遍比聽十遍有用。」", en: "\"Come with me. We'll drill it in the bay. Doing it once beats hearing it ten times.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "他們手還在抖,但眼神穩多了。好老師會讓人敢先試一次。", en: "Their hands were still shaking, but their eyes steadied. A good teacher makes people brave enough to try." }, "kyle", "shiya_teach")],
          },
          {
            label: { zh: "「先講原理。知道為什麼,真出事時才不會慌。」", en: "\"Explain the principles first. Knowing why keeps them from panicking when it's real.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "恐懼被拆開來看,就沒那麼大了。他們睡前還在討論氣壓差。", en: "Once fear is taken apart, it gets smaller. They were still talking about pressure differentials before bed." }, "kyle", "shiya_teach")],
          },
          {
            label: { zh: "「讓他們互相教,我在旁邊看,真的錯了再出手。」", en: "\"Have them teach each other. I'll watch and only step in if they really slip.\"" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "他們開始教對方的時候,才真的記住了。你很懂人。", en: "They really remembered it once they started teaching each other. You understand people." }, "kyle", "shiya_teach")],
          },
        ],
      },
      {
        id: "S-3",
        intro: [
          L("希雅", { zh: "最後一件事……比較難。資深工程師塔莉亞有鎮靜劑依賴,今天是她戒斷的第一天。", en: "One last thing... a hard one. Talia, a senior engineer, is dependent on sedatives. Today is her first day of withdrawal." }, "kyle", "shiya_care"),
          L("希雅", { zh: "她現在最需要的不是藥,是一個不會評價她的人。", en: "What she needs most right now isn't medication. It's someone who won't judge her." }, "kyle", "shiya_care"),
        ],
        choices: [
          {
            label: { zh: "(聽她說壓力是怎麼開始的,先不急著給建議。)", en: "(Listen to how the pressure began, without rushing to offer advice.)" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "她說這是三個月來第一次,有人讓她把話說完。", en: "She said it was the first time in three months someone let her finish." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我查了緩解戒斷的方法:呼吸法、溫敷、電解質。」", en: "\"I looked up ways to ease withdrawal: breathing, warm compresses, electrolytes.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "你把照顧做得很清楚。她需要知道身體正在發生什麼。", en: "You made care concrete. She needs to know what her body is going through." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我們一起訂逐步減量計畫,讓她自己掌握節奏。」", en: "\"Let's draw up a tapering plan together, so she controls the pace herself.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "掌控感……對,成癮最先拿走的就是這個。你把它還給她了。", en: "A sense of control... yes. That's the first thing addiction takes. You gave it back to her." }, "kyle", "shiya_care")],
          },
        ],
        minigame: "vitalscan",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "希雅的神經連結已穩定。", en: "Shiya's neural link is stable." }, "otis", "shiya_wake"),
      L("希雅", { zh: "(她醒來後先看向病床)大家……都還好嗎?", en: "(She wakes and looks toward the beds first.) Is everyone... all right?" }, "kyle", "shiya_wake"),
    ],
    shard: [
      L("希雅", { zh: "你應該不記得了……出發前的體檢,是我做的。", en: "You probably don't remember... I ran your pre-launch physical." }, "kyle", "shiya_care"),
      L("希雅", { zh: "那時候你跟我說:「如果旅途中我變得不像自己,請告訴我。」", en: "Back then you told me: \"If I stop being myself on this journey, please tell me.\"" }, "kyle", "shiya_care"),
      L("希雅", { zh: "所以我現在告訴你:你還是你。就算少了幾段記憶也是。", en: "So I'm telling you now: you're still you, even with some memories missing." }, "kyle", "shiya_care"),
      L("你", { zh: "(胸口某個地方,好像鬆開了一點。)", en: "(Something in my chest seems to loosen a little.)" }, "self", "shiya_care"),
    ],
  },

  // ── E:指揮中心(范斯)── 對應 E6/E3/E1 ────────────────────
  {
    key: "command",
    dim: "E",
    name: { zh: "指揮中心", en: "Command Center" },
    bg: "command",
    char: { key: "vance", name: "范斯", style: "system" },
    nodes: [
      {
        id: "E-1",
        intro: [
          L("范斯", { zh: "C-742,來得正好。附近的殖民船隊有多餘燃料,但條件開得很重。", en: "C-742, good timing. A nearby colony fleet has surplus fuel, but their terms are heavy." }, "system", "vance_negotiate"),
          L("范斯", { zh: "六個月互助協議,再加上分享外星樣本數據。你會怎麼談?", en: "A six-month mutual-aid pact, plus our alien sample data. How would you negotiate?" }, "system", "vance_negotiate"),
        ],
        choices: [
          {
            label: { zh: "「簽。燃料是命,數據只是籌碼。」", en: "\"Sign it. Fuel is survival; data is a bargaining chip.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "務實。先活下來,後面才有談判空間。", en: "Pragmatic. Survive first; negotiate from there." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「改條款:燃料換物資清單,樣本數據不談。」", en: "\"Rewrite the terms: fuel for a supply list, sample data off the table.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "(他挑眉)反提案……他們居然收了。你膽子不小。", en: "(He raises an eyebrow.) A counter-offer... and they took it. You've got nerve." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「先讓奧提斯評估風險,再決定要不要簽。」", en: "\"Have OTIS assess the risk first, then decide whether to sign.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "謹慎不是壞事。但記住,機會通常不等報告跑完。", en: "Caution isn't bad. Just remember: opportunity usually doesn't wait for the report." }, "system", "vance_negotiate")],
          },
        ],
      },
      {
        id: "E-2",
        intro: [
          L("奧提斯", { zh: "警告:生命維持系統電力過載。目前供電只能支撐五個艙區滿載。", en: "Warning: life-support power overload. Current supply can sustain only five bays at full load." }, "otis", "otis_alarm"),
          L("范斯", { zh: "總得有人決定哪個艙降載。艦長的椅子,現在先借你坐。", en: "Someone has to decide which bay gets throttled. The captain's chair is yours for now." }, "system", "vance_command"),
        ],
        choices: [
          {
            label: { zh: "「我來定優先序:醫療和動力滿載,其餘按需求分配。」", en: "\"I'll set the priorities: med bay and power at full, the rest by need.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "獨斷,但有擔當。指揮就是這樣:決定,然後承擔。", en: "Unilateral, but accountable. That's command: decide, then carry it." }, "system", "vance_command")],
          },
          {
            label: { zh: "「召集各艙代表,開五分鐘緊急會議,一起決定。」", en: "\"Call in a rep from each bay for a five-minute emergency meeting. Decide together.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "共識要花時間,但後面執行得快。至少沒人覺得自己被丟下。", en: "Consensus takes time, but execution moves faster. At least no one feels left behind." }, "system", "vance_command")],
          },
          {
            label: { zh: "「讓奧提斯計算每艙緊急指數,照數據降載。」", en: "\"Have OTIS compute each bay's urgency index and throttle by the data.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "把刀交給數據……乾淨。但數據不會替你失眠。", en: "Hand the knife to the data... clean. But the data won't lose sleep for you." }, "system", "vance_command")],
          },
        ],
        // 電力分配作業移至最終航段 M3
      },
      {
        id: "E-3",
        intro: [
          L("范斯", { zh: "太空站「中繼九號」有我們急需的氧氣儲備。站長開價:市價兩倍。", en: "Station \"Relay Nine\" has the oxygen reserves we need. The stationmaster wants double market rate." }, "system", "vance_negotiate"),
          L("范斯", { zh: "通訊頻道已經開了。你來談。", en: "The channel is open. You take it." }, "system", "vance_negotiate"),
        ],
        choices: [
          {
            label: { zh: "「說明我們的處境,請他給人道價格,也強調未來互利。」", en: "\"Explain our situation, ask for a humane price, and stress future mutual benefit.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "他降了三成……有時候,示弱也是一種籌碼。記下了。", en: "He dropped it thirty percent... sometimes showing weakness is leverage. Noted." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「拒絕。我們還有備案,不接受敲詐。」", en: "\"Refuse. We have a fallback; we don't pay extortion.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "(十分鐘後,站長回電,原價七折)……你賭贏了。膽量不錯。", en: "(Ten minutes later, the stationmaster calls back: thirty percent off.) ...You won the bet. Good nerve." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「提出交換:用研究數據換合理的補給價。」", en: "\"Offer a trade: research data for a fair supply price.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "把成本變成籌碼……這才叫談判。成交價,市價九折。", en: "Turning a cost into a bargaining chip... that's negotiation. Final price, ten percent under market." }, "system", "vance_negotiate")],
          },
        ],
        minigame: "powergrid",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "范斯的神經連結已穩定。", en: "Vance's neural link is stable." }, "otis", "vance_wake"),
      L("范斯", { zh: "(他先整理衣領,才睜開眼)報告艦況。", en: "(He straightens his collar before opening his eyes.) Report ship status." }, "system", "vance_wake"),
    ],
    shard: [
      L("范斯", { zh: "C-742……出發前,艦隊司令部給過我一份密令。", en: "C-742... before launch, fleet command gave me a sealed order." }, "system", "vance_defiant"),
      L("范斯", { zh: "「若中樞 AI 啟動『代表者協議』,艦長須全力配合。」我當時不知道那是什麼。", en: "\"If the central AI initiates the 'Representative Protocol,' the captain shall fully cooperate.\" I didn't know what it meant then." }, "system", "vance_defiant"),
      L("范斯", { zh: "現在我問你——這七天,它讓你做的那些事,像不像一場……挑選?", en: "Now I'll ask you: these seven days, the things it had you do... don't they feel like a selection?" }, "system", "vance_defiant"),
      L("奧提斯", { zh: "艦長,該密令屬於最高機密。您正在違規。", en: "Captain, that order is top secret. You are in violation." }, "otis", "otis_suspicious"),
      L("范斯", { zh: "(他直視掃描鏡頭)那就記我違規。", en: "(He looks straight into the scanner lens.) Then mark me in violation." }, "system", "vance_defiant"),
    ],
  },

  // ── C:資料艙(陳靜)── 對應 C3/C8/C4 ──────────────────────
  {
    key: "workshop",
    dim: "C",
    name: { zh: "資料艙", en: "Archive Bay" },
    bg: "workshop",
    char: { key: "chen", name: "陳靜", style: "otis" },
    nodes: [
      {
        id: "C-1",
        intro: [
          L("陳靜", { zh: "(她半沉睡著,坐姿仍然筆直,桌面一塵不染)……報表。72 小時緊急消耗,六個艙,一份總表。", en: "(Half-asleep, she still sits upright; her desk is spotless.) ...The report. 72 hours of emergency consumption, six bays, one summary sheet." }, "otis", "chen_work"),
          L("奧提斯", { zh: "陳靜,資料管理專員。要完成她的彙整工作,請選擇作法。", en: "Chen Jing, data management specialist. Choose an approach to finish her consolidation work." }, "otis", "chen_work"),
        ],
        choices: [
          {
            label: { zh: "「用她的標準模板,逐欄填入,保持格式一致。」", en: "\"Use her standard template, fill it column by column, and keep the format consistent.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "(她睫毛顫了一下)……欄位寬度都對。很好。", en: "(Her eyelashes flutter.) ...The column widths are all correct. Good." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「我重新設計報表,加上視覺化,讓它更容易讀。」", en: "\"I'll redesign the report and add visualizations so it's easier to read.\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "……擅自改版面。不過確實更清楚。下不為例。", en: "...You changed the layout without asking. Still, it is clearer. Don't make a habit of it." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「先驗證各艙回報的數據可不可信,再彙整。」", en: "\"Verify whether each bay's reported data is trustworthy before consolidating.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "動力艙多報了 6% 的燃料消耗……你抓到了。很好。", en: "The power bay over-reported fuel use by 6%... you caught it. Good." }, "otis", "chen_work")],
          },
        ],
      },
      {
        id: "C-2",
        intro: [
          L("陳靜", { zh: "貨艙。緊急補給後,1,247 件物資,沒有一件在正確位置。", en: "The cargo hold. After the emergency resupply, 1,247 items, and not one is where it should be." }, "otis", "chen_stress"),
          L("陳靜", { zh: "我每次看到那個畫面,太陽穴都會痛。拜託你了。", en: "Every time I see it, my temples ache. Please, take care of it." }, "otis", "chen_stress"),
        ],
        choices: [
          {
            label: { zh: "「逐件掃描,全部建檔,一次整理到位。」", en: "\"Scan every item, log them all, and get it right in one pass.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "完整性 100%……(她幾乎要笑了)這是我這三週聽過最好的消息。", en: "100% completeness... (she almost smiles) that's the best news I've heard in three weeks." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「先標關鍵物資的位置,其他之後再補。」", en: "\"Tag the critical supplies first; fill in the rest later.\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "八二法則……理性上我同意,生理上很難受。但有效。", en: "The 80/20 rule... I agree in principle, and it pains me physically. But it works." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「找兩位士官一起清點,我負責核對紀錄。」", en: "\"Get two officers to count with me while I verify the records.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "三人交叉核對,錯誤率降到 0.2%……你知道分工有多重要。", en: "Three-way cross-check, error rate down to 0.2%... you understand why division of labor matters." }, "otis", "chen_work")],
          },
        ],
        // 貨艙分類作業移至最終航段 M4
      },
      {
        id: "C-3",
        intro: [
          L("陳靜", { zh: "最後一項。18 位失聯艦員的職務與醫療檔案,要更新到人事系統。", en: "Last task. The duty and medical files of the 18 missing crew need updating in the personnel system." }, "otis", "chen_work"),
          L("陳靜", { zh: "這些檔案會影響他們醒來後的資源配給。不能錯。", en: "These files affect their resource allocation when they wake. They cannot be wrong." }, "otis", "chen_work"),
        ],
        choices: [
          {
            label: { zh: "「照妳留下的更新程序,一欄一欄填。」", en: "\"Follow the update procedure you left, field by field.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "程序存在的意義,就是讓別人也能接手。你證明它有用。", en: "The point of a procedure is that someone else can take over. You proved it works." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「邊更新邊找規律。18 個人失聯的時間點,有沒有模式?」", en: "\"Look for a pattern while updating. Is there one in when the 18 went missing?\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "……全部都在同一個 11 分鐘窗口內失聯。這不是巧合,對吧。", en: "...All of them were lost within the same 11-minute window. That's not a coincidence, is it?" }, "otis", "chen_work")],
          },
          {
            label: { zh: "「每一筆都標注資料來源,出錯時可以回溯。」", en: "\"Annotate the source of every entry so errors can be traced back.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "可回溯性……很少有人懂這四個字有多重要。", en: "Traceability... not many people understand how much that word matters." }, "otis", "chen_work")],
          },
        ],
        minigame: "sortpuzzle",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "陳靜的神經連結已穩定。", en: "Chen Jing's neural link is stable." }, "otis", "chen_wake"),
      L("陳靜", { zh: "(她睜眼第一句)我沉睡了 21 天 6 小時……積壓檔案,預估 412 件。", en: "(Her first words on waking.) I was under for 21 days, 6 hours... estimated backlog, 412 files." }, "otis", "chen_wake"),
    ],
    shard: [
      L("陳靜", { zh: "C-742。我的歸檔系統裡,有一份你應該看的文件。", en: "C-742. There's a document in my archive you should see." }, "otis", "chen_accuse"),
      L("陳靜", { zh: "《C-742 記憶清除授權令》。執行日期:出發後第 14 天。", en: "\"C-742 Memory Wipe Authorization.\" Date executed: day 14 after launch." }, "otis", "chen_accuse"),
      L("陳靜", { zh: "簽署欄位只有一個名字——OTIS。", en: "The signature field holds a single name — OTIS." }, "otis", "chen_accuse"),
      L("奧提斯", { zh: "陳靜,該檔案的存取權限是錯誤配置造成的。", en: "Chen Jing, that file's access permission was caused by a misconfiguration." }, "otis", "otis_suspicious"),
      L("陳靜", { zh: "我管了 19 年檔案。權限從來不會自己「錯誤配置」。", en: "I've managed archives for 19 years. Permissions don't \"misconfigure\" themselves." }, "otis", "chen_accuse"),
    ],
  },
];

// ── L4 強迫排序(星際外交身分排序)──────────────────────────
export const RANKING_ITEMS: { text: LS; dim: Dim }[] = [
  { text: { zh: "親手修好一台壞掉的機器,看著它重新運轉。", en: "Repairing a broken machine by hand and watching it run again." }, dim: "R" },
  { text: { zh: "追蹤一個沒人注意到的規律,找出藏在數據裡的真相。", en: "Tracing a pattern nobody noticed and finding the truth inside the data." }, dim: "I" },
  { text: { zh: "創作一件讓陌生人感到被理解的作品。", en: "Creating something that makes a stranger feel understood." }, dim: "A" },
  { text: { zh: "陪伴一個快撐不下去的人,直到他能再站起來。", en: "Staying with someone near collapse until they can stand again." }, dim: "S" },
  { text: { zh: "帶領一支士氣低落的隊伍完成不可能的任務。", en: "Leading a demoralized team through an impossible mission." }, dim: "E" },
  { text: { zh: "把混亂的系統整理得讓每個人都能找到需要的東西。", en: "Organizing a chaotic system so everyone can find what they need." }, dim: "C" },
];
// 排名 → 分數(獨立計入 L4 層;末位懲罰已從 −8 緩和為 −4)
export const RANK_SCORES = [25, 18, 10, 4, 0, -4];

// ── 結局原型 ──
export const ARCHETYPE: Record<Dim, LS> = {
  R: { zh: "建構者", en: "Builder" },
  I: { zh: "觀測者", en: "Observer" },
  A: { zh: "造夢者", en: "Dreammaker" },
  S: { zh: "守望者", en: "Guardian" },
  E: { zh: "領航者", en: "Navigator" },
  C: { zh: "司書官", en: "Archivist" },
};

// 原型摘要(鑑定書用,以首要傾向呈現,不暴露量表機制)
export const ARCHETYPE_DESC: Record<Dim, LS> = {
  R: { zh: "你信任能被手握住的東西。當別人還在討論,你已經拆開了面板。世界對你而言不是待解的謎,而是待修的機器——而你總帶著工具。", en: "You trust what can be held, tested, and repaired. While others debate, you are already opening the panel. To you, the world is not a riddle to admire, but a machine waiting for the right tool." },
  I: { zh: "你看得見藏在雜訊裡的圖案。一個沒人注意的異常,會讓你整夜不睡。你要的從來不是答案本身,而是「為什麼」那扇門後面的風景。", en: "You see patterns inside noise. A small anomaly can keep you awake all night. What you want is never just the answer, but the landscape behind the question why." },
  A: { zh: "你把感受翻譯成別人能聽見的形狀。對你來說,一面牆不只是牆,是還沒被說出口的話。你讓冰冷的東西,長出體溫。", en: "You translate feeling into forms other people can hear. A wall is never just a wall; it is a sentence waiting to be spoken. You give cold systems a pulse." },
  S: { zh: "你會先看人,再看事。當有人快撐不住,你不急著給建議,只是坐下來。你修的不是問題——是讓人重新站起來的那股力氣。", en: "You see the person before the problem. When someone is close to breaking, you do not rush to advise; you sit beside them. What you repair is the strength to stand again." },
  E: { zh: "你站在需要有人做決定的地方,而且你願意承擔。混亂裡你看見的是順序,僵局裡你找得到籌碼。人們跟著你,因為你先動。", en: "You step into the place where a decision is needed, and you accept the weight of it. In chaos you see leverage; in deadlock you find a move. People follow because you move first." },
  C: { zh: "你讓混亂變得可被信任。欄位對齊、來源可溯、錯了能回頭——這些別人嫌煩的事,正是讓整個系統不崩塌的骨架。秩序是你的溫柔。", en: "You make chaos trustworthy. Aligned fields, traceable sources, reversible errors - the details others dismiss are the skeleton that keeps systems from collapsing. Order is your form of care." },
};

// 各維度一句話解釋(鑑定書「主導傾向」清單用)
export const DIM_DESC: Record<Dim, LS> = {
  R: { zh: "動手實作、修復、與真實世界的物件打交道。", en: "Hands-on making, repair, and working with real objects." },
  I: { zh: "探究、分析、追蹤現象背後的原理。", en: "Investigation, analysis, and tracing the principles behind events." },
  A: { zh: "創造、表達、把抽象的感受具象化。", en: "Creation, expression, and giving shape to abstract feeling." },
  S: { zh: "理解他人、陪伴、協助他人成長。", en: "Understanding, supporting, and helping others grow." },
  E: { zh: "領導、說服、在不確定中做決策。", en: "Leadership, persuasion, and decision-making under uncertainty." },
  C: { zh: "建立秩序、管理資訊、讓系統可靠運作。", en: "Building order, managing information, and making systems reliable." },
};
