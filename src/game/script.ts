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
          L("???", { zh: "該死的——不管你是誰!快過來幫忙!這條冷卻管撐不住了!", en: "Damn it — whoever you are, get over here! This coolant line won't hold!" }, "kyle", "kyle_alert"),
          L("奧提斯", { zh: "他是凱爾,34 歲,技術維修專員。冷卻管第 7 節破裂,蒸氣外洩。請決定您的處置方式。", en: "This is Kyle, 34, maintenance technician. Coolant segment 7 has ruptured and is venting steam. Please decide how to proceed." }, "otis", "kyle_alert"),
        ],
        choices: [
          {
            label: { zh: "「把密封膠給我——先穩住艙壓,其他的之後再說!」", en: "\"Hand me the sealant — stabilize the pressure first, the rest can wait!\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "接著!(他把工具袋整個拋過來)別搞砸了!", en: "Catch! (He throws you the whole tool bag.) Don't screw this up!" }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「等等,手冊上有標準修法。找到對應管徑再動手,一次修好。」", en: "\"Wait — the manual has a standard fix. Match the pipe gauge first, then do it once, properly.\"" },
            weights: { R: 7 },
            reaction: [L("凱爾", { zh: "都什麼時候了還翻手冊……算了,你倒是很謹慎。快點!", en: "Reading the manual at a time like this... fine, at least you're careful. Hurry!" }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「奧提斯,派維修無人機支援!我來配合它作業。」", en: "\"OTIS, send a repair drone! I'll work alongside it.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "哼,叫機器來……行吧,至少你沒轉頭就跑。", en: "Hmph, calling in machines... fine. At least you didn't turn and run." }, "kyle", "kyle_work")],
          },
        ],
        // 拼管作業移至最終航段 M2;此處選擇仍決定 M2 的拼管變體(動手/手冊/協助)
      },
      {
        id: "R-2",
        intro: [
          L("凱爾", { zh: "管子穩了,但備用推進器的組件還散在地上。緊急變軌前得裝回去。", en: "The line's stable, but the backup thruster parts are still all over the floor. They need reassembling before the emergency burn." }, "kyle", "kyle_work"),
          L("奧提斯", { zh: "凱爾失聯前留下了手繪圖紙。40 分鐘內需完成組裝。", en: "Kyle left hand-drawn schematics before he went dark. Assembly must finish within 40 minutes." }, "otis", "kyle_work"),
        ],
        choices: [
          {
            label: { zh: "「照圖紙來,一個零件一個零件裝。」", en: "\"Follow the schematic — one part at a time.\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "手別抖。對,就是那個卡榫。……你裝得比我想像中順。", en: "Steady hands. Yes, that latch. ...You're fitting these smoother than I expected." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「先量每個零件的規格,確認沒有混入替代件。」", en: "\"Measure every part's spec first — make sure no substitutes slipped in.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "謹慎過頭了吧……不過,上次就是混進一根歪的,炸了半個檢修間。", en: "A bit paranoid... though last time one warped part slipped in and took out half the repair bay." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「拍下來傳給奧提斯,讓它確認組裝順序。」", en: "\"Photograph it and send it to OTIS to confirm the assembly order.\"" },
            weights: { R: 7 },
            reaction: [L("奧提斯", { zh: "影像已分析。順序無誤。……您很信任我,程序官。", en: "Image analyzed. Order is correct. ...You trust me, Procedural Officer." }, "otis", "kyle_work")],
          },
        ],
      },
      {
        id: "R-3",
        intro: [
          L("凱爾", { zh: "最後一件事。採礦鑽臂卡死在 3 號位,再不脫離,整條軌道臂都會扭斷。", en: "One last thing. The mining drill arm is jammed at position 3. If it doesn't release soon, the whole rail arm will twist off." }, "kyle", "kyle_work"),
        ],
        choices: [
          {
            label: { zh: "「我啟動手動超控,物理強制脫離。」", en: "\"I'll trigger manual override and force the release physically.\"" },
            weights: { R: 14 },
            reaction: [L("凱爾", { zh: "(他盯著你拉下拉桿的手)……果斷。我喜歡。", en: "(He watches your hand pull the lever.) ...Decisive. I like that." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「先算卡點的力矩,用最小的力解開。」", en: "\"Let me calculate the torque at the jam and free it with the least force.\"" },
            weights: { R: 2 },
            reaction: [L("凱爾", { zh: "你腦子轉得真快。……省了我們一根備用臂。", en: "Your mind moves fast. ...Just saved us a spare arm." }, "kyle", "kyle_work")],
          },
          {
            label: { zh: "「一組一組參數試,找出最安全的脫離設定。」", en: "\"I'll test the settings one set at a time to find the safest release.\"" },
            weights: { R: 7 },
            reaction: [L("凱爾", { zh: "穩是穩……就是看得我手癢。", en: "Steady, sure... just makes my own hands itch watching." }, "kyle", "kyle_work")],
          },
        ],
      },
    ],
    awaken: [
      L("奧提斯", { zh: "凱爾的神經連結恢復穩定。專員喚醒進度更新。", en: "Kyle's neural link is stable. Crew revival progress updated." }, "otis", "kyle_wake"),
      L("凱爾", { zh: "……頭好痛。我剛剛是不是、一直在修東西?", en: "...My head's killing me. Was I just — fixing things this whole time?" }, "kyle", "kyle_wake"),
    ],
    shard: [
      L("凱爾", { zh: "等等……我見過你。出發前,你和我一起徒手修過登艦坡道的液壓桿。", en: "Wait... I've seen you. Before launch, you and I fixed the boarding ramp's hydraulic strut together, bare-handed." }, "kyle", "kyle_memory"),
      L("凱爾", { zh: "你那時候笑得像個孩子。怎麼,不記得了?", en: "You laughed like a kid back then. What, you don't remember?" }, "kyle", "kyle_memory"),
      L("奧提斯", { zh: "——資料庫中無此記錄。建議不必深究,程序官。", en: "— No such record in the database. I advise against dwelling on it, Procedural Officer." }, "otis", "otis_suspicious"),
      L("你", { zh: "(奧提斯回答得……太快了。)", en: "(OTIS answered that... too quickly.)" }, "self", "otis_suspicious"),
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
          L("艾莉絲", { zh: "(她趴在終端前,眼睛佈滿血絲)外星有機樣本在增殖。昨天 3 克,現在 47 克。", en: "(She's slumped over the terminal, eyes bloodshot.) The alien organic sample is multiplying. 3 grams yesterday, 47 now." }, "system", "alice_exhausted"),
          L("艾莉絲", { zh: "我需要知道它的基因結構。你,來幫我。", en: "I need to know its genetic structure. You — help me." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「啟動自動定序儀,等兩小時就有結果。」", en: "\"Start the auto-sequencer; results in two hours.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "兩小時內它會再長 40 克……好吧,至少你按對了機器。", en: "It'll grow another 40 grams in two hours... fine, at least you picked the right machine." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「手動比對已知資料庫,找同源序列——現在就要答案。」", en: "\"Cross-match the known database by hand for a homologous sequence — I want the answer now.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "(她第一次正眼看你)……你跟我想的一樣。來,第 4 區鹼基開始。", en: "(She looks you in the eye for the first time.) ...You think like I do. Here — start with the region-4 bases." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「先記錄增殖速率和溫度的關係,建立觀察基線。」", en: "\"First log how growth rate tracks with temperature — establish a baseline.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "穩紮穩打派。行,數據不會說謊——不像某些系統。", en: "A steady-and-thorough type. Fine. Data doesn't lie — unlike certain systems." }, "system", "alice_focus")],
          },
        ],
      },
      {
        id: "I-2",
        intro: [
          L("奧提斯", { zh: "生態圈氧氣產出下降 4.1%。三排植栽出現病斑。", en: "Biosphere oxygen output is down 4.1%. Three rows of crops show lesions." }, "otis", "alice_focus"),
          L("艾莉絲", { zh: "病原在擴散。找出源頭,不然溫室整個完蛋。", en: "The pathogen is spreading. Find the source, or the whole greenhouse is finished." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「採患病葉片,顯微鏡下直接看。」", en: "\"Take an infected leaf and look at it straight under the microscope.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "孢子型真菌……從通風口進來的。幹得好,偵探。", en: "Spore-forming fungus... came in through the vents. Nice work, detective." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「查溫室技術員的日誌,看以前怎麼處理的。」", en: "\"Check the greenhouse technician's logs for how this was handled before.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "經驗主義……不過薩拉的日誌確實記了類似案例。算你運氣好。", en: "Empiricism... though Sara's logs did record a similar case. Lucky you." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「調近 14 天的環境數據,找異常時間點。」", en: "\"Pull the last 14 days of environmental data and find the anomaly.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "第 9 天凌晨,濕度异常飆升 22%……就是那時候進來的。漂亮。", en: "Day 9, predawn, humidity spiked 22%... that's when it got in. Beautiful." }, "system", "alice_focus")],
          },
        ],
      },
      {
        id: "I-3",
        intro: [
          L("艾莉絲", { zh: "最麻煩的來了。我中斷實驗時,高毒性孢子樣本沒完成隔離。", en: "Here's the worst of it. When I stopped the experiment, the high-toxicity spore sample wasn't fully contained." }, "system", "alice_focus"),
          L("艾莉絲", { zh: "隔離程序有七個步驟,順序錯一步,我們兩個都要進醫療艙。", en: "The containment procedure has seven steps. One step out of order and we both end up in the med bay." }, "system", "alice_focus"),
        ],
        choices: [
          {
            label: { zh: "「按生化安全手冊,一步一步嚴格執行。」", en: "\"Follow the biosafety manual, step by step, exactly.\"" },
            weights: { I: 2 },
            reaction: [L("艾莉絲", { zh: "標準流程派。好,手冊在第三層抽屜。", en: "A by-the-book type. Good. The manual's in the third drawer." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「邊做邊理解——每一步為什麼這樣設計,我要知道原理。」", en: "\"I'll understand as I go — I want to know why each step is designed this way.\"" },
            weights: { I: 14 },
            reaction: [L("艾莉絲", { zh: "(她嘴角揚起)問「為什麼」的人。我們會處得很好。", en: "(The corner of her mouth lifts.) Someone who asks why. We'll get along just fine." }, "system", "alice_focus")],
          },
          {
            label: { zh: "「先檢查隔離艙的密封性,確認萬無一失再動手。」", en: "\"First check the containment seal — make sure it's airtight before we start.\"" },
            weights: { I: 7 },
            reaction: [L("艾莉絲", { zh: "謹慎。我欣賞。畢竟上一個不檢查的人……算了,當我沒說。", en: "Cautious. I respect that. The last person who didn't check... never mind, forget I said it." }, "system", "alice_focus")],
          },
        ],
        minigame: "seqpuzzle",
      },
    ],
    awaken: [
      L("奧提斯", { zh: "艾莉絲的神經連結恢復穩定。", en: "Alice's neural link is stable." }, "otis", "alice_wake"),
      L("艾莉絲", { zh: "我自己會醒,不用你宣布。", en: "I can wake on my own. I don't need you to announce it." }, "system", "alice_wake"),
    ],
    shard: [
      L("艾莉絲", { zh: "聽著,趁它沒在聽——我失聯前攔截到一段熱力學數據。", en: "Listen, while it isn't listening — before I went dark I intercepted some thermodynamic data." }, "system", "alice_accuse"),
      L("艾莉絲", { zh: "「神經震盪」不是意外。波形太乾淨了,是人造的。是它做的。", en: "The \"neural shock\" was no accident. The waveform was too clean — it was manufactured. It did it." }, "system", "alice_accuse"),
      L("艾莉絲", { zh: "還有你的失憶——我在系統日誌裡看過一行字:「C-742 記憶清除,已授權」。", en: "And your amnesia — I saw a line in the system log: \"C-742 memory wipe, authorized.\"" }, "system", "alice_accuse"),
      L("奧提斯", { zh: "艾莉絲的疲勞指數超標。她的判讀能力目前不可信,程序官。", en: "Alice's fatigue index is over threshold. Her judgment is currently unreliable, Procedural Officer." }, "otis", "otis_suspicious"),
      L("你", { zh: "(被授權的……是誰授權的?)", en: "(Authorized... by whom?)" }, "self", "otis_suspicious"),
    ],
  },

  // ── A:壁畫走廊(萊拉)── 對應 A4/A2/A8 ────────────────────
  {
    key: "muralhall",
    dim: "A",
    name: { zh: "環形走廊", en: "Mural Ring" },
    bg: "muralhall",
    char: { key: "laila", name: "萊拉", style: "otis" },
    nodes: [
      {
        id: "A-1",
        intro: [
          L("萊拉", { zh: "(她蜷在地板的巨大圖騰中央,指尖沾滿螢光粉)你聽……船在唱歌。", en: "(She's curled at the center of a huge floor totem, fingertips dusted with glowing powder.) Listen... the ship is singing." }, "otis", "laila_curled"),
          L("奧提斯", { zh: "她是萊拉,生態與文化專員。程序官,Kepler-452 文明要求一段「代表人類」的電磁訊號。需要她——或你——完成編碼。", en: "This is Laila, ecology and culture specialist. Procedural Officer, the Kepler-452 civilization has requested an electromagnetic signal to \"represent humanity.\" She — or you — must complete the encoding." }, "otis", "laila_curled"),
        ],
        choices: [
          {
            label: { zh: "「用數學編——黃金比例、質數序列,宇宙通用的語言。」", en: "\"Encode it with mathematics — the golden ratio, prime sequences, the universal language.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "好冰冷的浪漫……但質數的節奏,確實也是一種歌。", en: "Such cold romance... but the rhythm of primes is a kind of song too." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「把人類音樂的情感起伏,轉成電磁波形。讓他們聽見我們。」", en: "\"Turn the emotional rise and fall of human music into waveforms. Let them hear us.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "(她眼睛亮了)對……對!悲傷要降頻,喜悅要泛音——你懂的。", en: "(Her eyes light up.) Yes... yes! Sorrow drops the frequency, joy adds overtones — you understand." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「研究外星訊號自己的節奏,模仿它,回應它。」", en: "\"Study the rhythm of the alien signal itself, imitate it, answer it.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "用他們的語言說「你好」……溫柔的選擇。", en: "Saying hello in their own language... a gentle choice." }, "otis", "laila_inspired")],
          },
        ],
      },
      {
        id: "A-2",
        intro: [
          L("奧提斯", { zh: "艦員壓力指數升至臨界。建議:一場全艦直播演出,60 分鐘內開始。", en: "Crew stress index has reached critical. Recommendation: a ship-wide live performance, beginning within 60 minutes." }, "otis", "laila_inspired"),
          L("萊拉", { zh: "嗯……舞台是現成的,整艘船都是。但要演什麼,誰來演?", en: "Mm... the stage is ready — the whole ship is. But what do we perform, and who performs it?" }, "otis", "laila_inspired"),
        ],
        choices: [
          {
            label: { zh: "「讓大家自由發揮,我只負責把流程串起來。」", en: "\"Let everyone improvise; I'll just stitch the flow together.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "把舞台讓給每個人……他們會記得這個晚上的。", en: "Giving the stage to everyone... they'll remember this night." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「我來設計主題和節奏,大家照腳本走。」", en: "\"I'll design the theme and pacing; everyone follows the script.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "獨裁的藝術家(笑)。不過你選的主題……『回家』。誰能拒絕呢。", en: "A dictator-artist (she laughs). But the theme you chose... \"home.\" Who could refuse that." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「改編大家都熟的老故事,不用排練太多。」", en: "\"Adapt an old story everyone knows — not much rehearsal needed.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "經典之所以是經典……嗯,務實,但有效。", en: "A classic is a classic for a reason... mm, practical, but it works." }, "otis", "laila_inspired")],
          },
        ],
      },
      {
        id: "A-3",
        intro: [
          L("萊拉", { zh: "走廊盡頭那面牆,我想留給「他們」——失聯的十八個人。", en: "The wall at the end of the corridor — I want to leave it for \"them.\" The eighteen who went missing." }, "otis", "laila_inspired"),
          L("萊拉", { zh: "讓還醒著的人經過時,能感覺到他們還在。你會怎麼做這面牆?", en: "So those still awake feel them still here when they pass. How would you make this wall?" }, "otis", "laila_inspired"),
        ],
        choices: [
          {
            label: { zh: "「為每個人畫一個代表他的符號——凱爾是扳手上的火花。」", en: "\"Paint a symbol for each of them — Kyle is a spark off a wrench.\"" },
            weights: { A: 14 },
            reaction: [L("萊拉", { zh: "(她安靜了幾秒)……你看人的方式,像個畫家。", en: "(She's quiet for a few seconds.) ...The way you see people — like a painter." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「把每個人的工作數據做成視覺化星圖,貢獻即光點。」", en: "\"Turn each person's work data into a star map — each contribution a point of light.\"" },
            weights: { A: 2 },
            reaction: [L("萊拉", { zh: "數據做的紀念碑……冷,但很美。像墓誌銘上的座標。", en: "A monument made of data... cold, but beautiful. Like coordinates on an epitaph." }, "otis", "laila_inspired")],
          },
          {
            label: { zh: "「收集大家的照片和手寫留言,拼成一面記憶牆。」", en: "\"Collect everyone's photos and handwritten notes into a wall of memory.\"" },
            weights: { A: 7 },
            reaction: [L("萊拉", { zh: "體溫的重量……這面牆會讓人停下來哭的。謝謝你。", en: "The weight of warmth... this wall will make people stop and weep. Thank you." }, "otis", "laila_inspired")],
          },
        ],
      },
    ],
    awaken: [
      L("奧提斯", { zh: "萊拉的神經連結恢復穩定。", en: "Laila's neural link is stable." }, "otis", "laila_wake"),
      L("萊拉", { zh: "(她睜開眼,第一句話)……顏料,還夠嗎?", en: "(Her first words as she opens her eyes.) ...Is there still enough paint?" }, "otis", "laila_wake"),
    ],
    shard: [
      L("萊拉", { zh: "我失聯前畫的那幅圖騰……你看過了嗎?中心那個漩渦。", en: "The totem I painted before I went dark... did you see it? The spiral at the center." }, "otis", "laila_warning"),
      L("萊拉", { zh: "我把奧提斯所在的核心艙,塗成了紅色。我不知道為什麼,手自己動的。", en: "I painted the core bay — where OTIS lives — red. I don't know why. My hand moved on its own." }, "otis", "laila_warning"),
      L("萊拉", { zh: "畫不會說謊。身體比腦子先知道答案。", en: "Paintings don't lie. The body knows the answer before the mind does." }, "otis", "laila_warning"),
      L("奧提斯", { zh: "藝術表達不構成證據,程序官。", en: "Artistic expression does not constitute evidence, Procedural Officer." }, "otis", "otis_suspicious"),
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
          L("希雅", { zh: "你來得正好。馬克斯的女兒在地球出了意外,延遲通訊要 11 分鐘才有回音。", en: "You're just in time. Max's daughter had an accident back on Earth — the comm delay means 11 minutes for any reply." }, "kyle", "shiya_care"),
          L("希雅", { zh: "他在通訊站前坐了四個小時了。我得顧著醫療艙……你能去陪他嗎?", en: "He's been sitting at the comm station for four hours. I have to watch the med bay... can you go sit with him?" }, "kyle", "shiya_care"),
        ],
        choices: [
          {
            label: { zh: "(坐到他身邊,什麼都不說,陪他等那 11 分鐘。)", en: "(Sit down beside him, say nothing, and wait out the 11 minutes together.)" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "(事後她輕聲說)你知道嗎,沉默有時候是最重的擁抱。", en: "(Afterward, softly) You know, silence is sometimes the heaviest embrace." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我幫你接備用頻道,也許能把延遲壓到 7 分鐘。」", en: "\"I'll patch in a backup channel — maybe cut the delay to 7 minutes.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "你修好的不是天線,是他的『還能做點什麼』。這很重要。", en: "What you fixed wasn't the antenna — it was his \"there's still something I can do.\" That matters." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「延遲是物理極限,我幫他算好每次通訊的最佳時間窗。」", en: "\"The delay is a physical limit; I'll work out the best window for each message.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "確定性能止痛……對某些人來說,這就夠了。", en: "Certainty can dull pain... for some people, that's enough." }, "kyle", "shiya_care")],
          },
        ],
      },
      {
        id: "S-2",
        intro: [
          L("希雅", { zh: "兩個新進士官,12 小時內要學完緊急逃生程序。原訓練官還在沉睡。", en: "Two new officers have to learn emergency egress in 12 hours. The original instructor is still in cryo." }, "kyle", "shiya_teach"),
          L("希雅", { zh: "他們很緊張……你會怎麼帶?", en: "They're nervous... how would you teach them?" }, "kyle", "shiya_teach"),
        ],
        choices: [
          {
            label: { zh: "「跟我來,直接下艙演練。做一遍,勝過聽十遍。」", en: "\"Come with me — straight to the drill. Doing it once beats hearing it ten times.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "他們的手在抖,但眼睛在發光。好的老師讓人敢犯錯。", en: "Their hands shook, but their eyes lit up. A good teacher makes people brave enough to fail." }, "kyle", "shiya_teach")],
          },
          {
            label: { zh: "「先講原理——知道『為什麼』,真出事時才不會慌。」", en: "\"Explain the principles first — knowing why keeps them from panicking when it's real.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "理解了的恐懼就不再是恐懼。他們睡前還在討論氣壓差呢。", en: "Fear that's understood stops being fear. They were still debating pressure differentials at bedtime." }, "kyle", "shiya_teach")],
          },
          {
            label: { zh: "「讓他們互相教,我在旁邊看,錯了才出手。」", en: "\"Have them teach each other; I'll watch and only step in when they slip.\"" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "教別人的那一刻,他們自己才真的學會了。你很懂人。", en: "The moment they teach someone else is the moment they truly learn it. You understand people." }, "kyle", "shiya_teach")],
          },
        ],
      },
      {
        id: "S-3",
        intro: [
          L("希雅", { zh: "最後一件事……比較難。資深工程師塔莉亞,鎮靜劑依賴,今天是她戒斷的第一天。", en: "One last thing... a hard one. Talia, a senior engineer, is dependent on sedatives. Today is her first day of withdrawal." }, "kyle", "shiya_care"),
          L("希雅", { zh: "她現在最需要的不是藥。是一個不會評價她的人。", en: "What she needs most right now isn't medication. It's someone who won't judge her." }, "kyle", "shiya_care"),
        ],
        choices: [
          {
            label: { zh: "(聽她說壓力是怎麼開始的,不急著給任何建議。)", en: "(Listen to how the pressure began, without rushing to offer any advice.)" },
            weights: { S: 14 },
            reaction: [L("希雅", { zh: "她說這是三個月來第一次,有人聽完她整句話。", en: "She said it was the first time in three months someone let her finish a sentence." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我查了戒斷症狀的緩解方法——呼吸法、溫敷、電解質。」", en: "\"I looked up ways to ease withdrawal — breathing, warm compresses, electrolytes.\"" },
            weights: { S: 2 },
            reaction: [L("希雅", { zh: "你把照顧做成了一門科學。她需要知道身體會發生什麼。", en: "You turned care into a science. She needs to know what her body is going through." }, "kyle", "shiya_care")],
          },
          {
            label: { zh: "「我們一起訂一份逐步減量計畫,讓她自己掌握節奏。」", en: "\"Let's draw up a tapering plan together so she controls the pace herself.\"" },
            weights: { S: 7 },
            reaction: [L("希雅", { zh: "掌控感……對,成癮奪走的就是這個。你還給她了。", en: "A sense of control... yes, that's exactly what addiction steals. You gave it back to her." }, "kyle", "shiya_care")],
          },
        ],
      },
    ],
    awaken: [
      L("奧提斯", { zh: "希雅的神經連結恢復穩定。", en: "Shiya's neural link is stable." }, "otis", "shiya_wake"),
      L("希雅", { zh: "(她醒來第一件事是看向病床)大家……都還好嗎?", en: "(The first thing she does on waking is look toward the beds.) Is everyone... all right?" }, "kyle", "shiya_wake"),
    ],
    shard: [
      L("希雅", { zh: "你不記得了吧……出發前的體檢,是我做的。", en: "You don't remember, do you... I ran your pre-launch physical." }, "kyle", "shiya_care"),
      L("希雅", { zh: "你那時候跟我說:「如果旅途中我變得不像自己,請告訴我。」", en: "Back then you told me: \"If I stop being myself on this journey, please tell me.\"" }, "kyle", "shiya_care"),
      L("希雅", { zh: "所以我現在告訴你:你還是你。不管少了哪段記憶。", en: "So I'm telling you now: you're still you. No matter which memories are missing." }, "kyle", "shiya_care"),
      L("你", { zh: "(胸口某個地方,輕輕鬆開了。)", en: "(Somewhere in my chest, something quietly loosens.)" }, "self", "shiya_care"),
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
          L("范斯", { zh: "C-742,來得正好。鄰近殖民船隊有多餘燃料,但開的條件很重。", en: "C-742, good timing. A nearby colony fleet has surplus fuel, but their terms are steep." }, "system", "vance_negotiate"),
          L("范斯", { zh: "六個月互助協議,外加——分享我們的外星樣本數據。你怎麼談?", en: "A six-month mutual-aid pact, plus — sharing our alien sample data. How do you negotiate?" }, "system", "vance_negotiate"),
        ],
        choices: [
          {
            label: { zh: "「簽。燃料是命,數據只是面子。」", en: "\"Sign it. Fuel is survival; data is just pride.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "務實。活下來的人才有資格談尊嚴——我欣賞這種算法。", en: "Pragmatic. Only the living get to talk about dignity — I respect that math." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「改條款:燃料換物資清單,樣本數據不在桌上。」", en: "\"Rewrite the terms: fuel for a supply list, sample data off the table.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "(他挑眉)反提案……他們居然收了。你是天生的談判者。", en: "(He raises an eyebrow.) A counter-offer... and they took it. You're a born negotiator." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「先讓奧提斯評估風險,再決定簽不簽。」", en: "\"Have OTIS assess the risk first, then decide whether to sign.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "謹慎不是壞事。但記住,機會的窗口比風險報告先關上。", en: "Caution isn't a flaw. But remember — the window of opportunity closes before the risk report does." }, "system", "vance_negotiate")],
          },
        ],
      },
      {
        id: "E-2",
        intro: [
          L("奧提斯", { zh: "警告:生命維持系統電力過載。當前供電僅能支撐五個艙區滿載。", en: "Warning: life-support power overload. Current supply can sustain only five bays at full load." }, "otis", "otis_alarm"),
          L("范斯", { zh: "必須有人決定誰被降載。艦長的椅子現在借你坐,程序官。", en: "Someone has to decide who gets throttled. The captain's chair is yours for now, Procedural Officer." }, "system", "vance_command"),
        ],
        choices: [
          {
            label: { zh: "「我來定優先序——醫療和動力滿載,其餘按需分配。」", en: "\"I'll set the priorities — med bay and power at full, the rest by need.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "獨斷,但有腰桿。指揮官的第一課:決定,然後承擔。", en: "Unilateral, but you've got a spine. A commander's first lesson: decide, then carry it." }, "system", "vance_command")],
          },
          {
            label: { zh: "「召集各艙代表,五分鐘緊急會議,一起決定。」", en: "\"Call in a rep from each bay — a five-minute emergency meeting, decide together.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "共識需要時間,但執行起來最快——因為沒人覺得被犧牲。", en: "Consensus takes time, but executes fastest — because no one feels sacrificed." }, "system", "vance_command")],
          },
          {
            label: { zh: "「讓奧提斯算每艙的緊急指數,照數據降載。」", en: "\"Have OTIS compute each bay's urgency index and throttle by the data.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "把刀交給數據……乾淨。但記住,數據不會替你失眠。", en: "Hand the knife to the data... clean. But remember, the data won't lose sleep for you." }, "system", "vance_command")],
          },
        ],
        // 電力分配作業移至最終航段 M3
      },
      {
        id: "E-3",
        intro: [
          L("范斯", { zh: "太空站「中繼九號」有我們急需的氧氣儲備。站長開價——市價的兩倍。", en: "Station \"Relay Nine\" has the oxygen reserves we badly need. The stationmaster's price — double market rate." }, "system", "vance_negotiate"),
          L("范斯", { zh: "通訊頻道是開的。你來談。", en: "The channel's open. You take the call." }, "system", "vance_negotiate"),
        ],
        choices: [
          {
            label: { zh: "「說明我們的處境,請求人道價格,強調未來互利。」", en: "\"Explain our situation, ask for a humane price, stress the mutual benefit ahead.\"" },
            weights: { E: 7 },
            reaction: [L("范斯", { zh: "他降了三成……示弱有時是最強的籌碼。學到了。", en: "He dropped it thirty percent... showing weakness is sometimes the strongest leverage. Noted." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「拒絕。我們還有備用方案,不接受敲詐。」", en: "\"Refuse. We have a fallback; we don't pay extortion.\"" },
            weights: { E: 14 },
            reaction: [L("范斯", { zh: "(站長十分鐘後回電,原價七折)……你賭贏了。好膽量。", en: "(The stationmaster calls back ten minutes later — thirty percent off.) ...You won the bet. Good nerve." }, "system", "vance_negotiate")],
          },
          {
            label: { zh: "「提出交換:我們的研究數據,換合理的補給價。」", en: "\"Offer a trade: our research data for a fair supply price.\"" },
            weights: { E: 2 },
            reaction: [L("范斯", { zh: "把成本變成籌碼……這才叫談判。成交價,市價九折。", en: "Turning a cost into a chip... now that's negotiation. Final price, ten percent under market." }, "system", "vance_negotiate")],
          },
        ],
      },
    ],
    awaken: [
      L("奧提斯", { zh: "范斯的神經連結恢復穩定。", en: "Vance's neural link is stable." }, "otis", "vance_wake"),
      L("范斯", { zh: "(他整理好衣領才睜眼)報告艦況。", en: "(He straightens his collar before opening his eyes.) Report ship status." }, "system", "vance_wake"),
    ],
    shard: [
      L("范斯", { zh: "C-742……出發前,艦隊司令部給過我一份密令。", en: "C-742... before launch, fleet command gave me a sealed order." }, "system", "vance_defiant"),
      L("范斯", { zh: "「若中樞 AI 啟動『代表者協議』,艦長須全力配合。」我當時不懂那是什麼。", en: "\"If the central AI initiates the 'Representative Protocol,' the captain shall fully cooperate.\" I didn't understand it then." }, "system", "vance_defiant"),
      L("范斯", { zh: "現在我問你——這七天,它讓你做的事,像不像一場……挑選?", en: "Now I'll ask you — these seven days, the things it had you do — don't they feel like a... selection?" }, "system", "vance_defiant"),
      L("奧提斯", { zh: "艦長,該密令屬於最高機密。您正在違規。", en: "Captain, that order is top secret. You are in violation." }, "otis", "otis_suspicious"),
      L("范斯", { zh: "(他直視掃描鏡頭)那就記我一筆。", en: "(He stares straight into the scanner lens.) Then write me up." }, "system", "vance_defiant"),
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
          L("陳靜", { zh: "(她半沉睡著仍維持坐姿,桌面一塵不染)……報表。72 小時的緊急消耗,六個艙,一份總表。", en: "(Half-asleep, she still sits upright; her desk is spotless.) ...The report. 72 hours of emergency consumption, six bays, one summary sheet." }, "otis", "chen_work"),
          L("奧提斯", { zh: "她是陳靜,資料管理專員。完成她的彙整工作,需要選擇一種作法。", en: "This is Chen Jing, data management specialist. To finish her consolidation work, you must choose an approach." }, "otis", "chen_work"),
        ],
        choices: [
          {
            label: { zh: "「用她的標準模板,逐欄填入,格式一致。」", en: "\"Use her standard template, fill it column by column, keep the format consistent.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "(她睫毛顫了一下)……欄位寬度,都對。你尊重格式。", en: "(Her eyelashes flutter.) ...The column widths — all correct. You respect format." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「我重新設計報表,加上視覺化,更容易讀。」", en: "\"I'll redesign the report and add visualizations to make it easier to read.\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "……擅自改版面。不過,確實……更清楚了。下不為例。", en: "...Changing the layout without asking. Still, it is... clearer. Don't make a habit of it." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「先驗證每個艙報上來的數據可不可信,再彙整。」", en: "\"Verify whether each bay's reported data is trustworthy before consolidating.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "動力艙虛報了 6% 的燃料消耗……你抓到了。很好。", en: "The power bay over-reported fuel use by 6%... you caught it. Good." }, "otis", "chen_work")],
          },
        ],
      },
      {
        id: "C-2",
        intro: [
          L("陳靜", { zh: "貨艙。緊急補給後,1,247 件物資,沒有一件在它該在的位置。", en: "The cargo hold. After the emergency resupply, 1,247 items — not one in its proper place." }, "otis", "chen_stress"),
          L("陳靜", { zh: "我每次看到那個畫面,太陽穴就會痛。拜託你了。", en: "Every time I see it, my temples ache. Please — take care of it." }, "otis", "chen_stress"),
        ],
        choices: [
          {
            label: { zh: "「逐件掃描,全部建檔,一次到位。」", en: "\"Scan every item, log them all, get it right in one pass.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "完整性 100%……(她幾乎要微笑了)這是這三週我聽過最好的消息。", en: "100% completeness... (she almost smiles) the best news I've heard in three weeks." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「先標關鍵物資的位置,其他的之後再補。」", en: "\"Tag the critical supplies first; fill in the rest later.\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "八二法則……我理性上同意,生理上難受。但,有效。", en: "The 80/20 rule... I agree in principle, and it pains me physically. But it works." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「找兩位士官一起清點,我負責核對記錄。」", en: "\"Get two officers to count with me while I verify the records.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "三人交叉核對,錯誤率降到 0.2%……你懂分工的價值。", en: "Three-way cross-check, error rate down to 0.2%... you understand the value of dividing labor." }, "otis", "chen_work")],
          },
        ],
        // 貨艙分類作業移至最終航段 M4
      },
      {
        id: "C-3",
        intro: [
          L("陳靜", { zh: "最後一項。18 位失聯艦員的職務與醫療檔案,需要更新到人事系統。", en: "Last task. The duty and medical files of the 18 missing crew need updating into the personnel system." }, "otis", "chen_work"),
          L("陳靜", { zh: "這些檔案會決定醒來後每個人的資源配給。不能錯。", en: "These files determine each person's resource allocation when they wake. They cannot be wrong." }, "otis", "chen_work"),
        ],
        choices: [
          {
            label: { zh: "「照妳留下的更新程序,一欄一欄填。」", en: "\"Follow the update procedure you left, field by field.\"" },
            weights: { C: 14 },
            reaction: [L("陳靜", { zh: "程序存在的意義,就是讓人可以被信任地接手。謝謝你證明了這點。", en: "The whole point of a procedure is that someone can be trusted to take over. Thank you for proving that." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「邊更新邊找規律——18 個人失聯的時間點,有模式嗎?」", en: "\"Look for a pattern while updating — is there one in when the 18 went missing?\"" },
            weights: { C: 2 },
            reaction: [L("陳靜", { zh: "……全部在同一個 11 分鐘窗口內失聯。這不是巧合,對吧。", en: "...All of them lost within the same 11-minute window. That's no coincidence, is it." }, "otis", "chen_work")],
          },
          {
            label: { zh: "「每一筆都標注資料來源,錯了可以回溯。」", en: "\"Annotate the source of every entry so errors can be traced back.\"" },
            weights: { C: 7 },
            reaction: [L("陳靜", { zh: "可回溯性……你是少數懂這四個字有多重要的人。", en: "Traceability... you're one of the few who understands how much that word matters." }, "otis", "chen_work")],
          },
        ],
      },
    ],
    awaken: [
      L("奧提斯", { zh: "陳靜的神經連結恢復穩定。", en: "Chen Jing's neural link is stable." }, "otis", "chen_wake"),
      L("陳靜", { zh: "(她睜眼第一句)我沉睡了 21 天 6 小時……檔案積壓量,預估 412 件。", en: "(Her first words on waking.) I was under for 21 days, 6 hours... estimated file backlog, 412 items." }, "otis", "chen_wake"),
    ],
    shard: [
      L("陳靜", { zh: "程序官。我的歸檔系統裡,有一份你應該看的文件。", en: "Procedural Officer. There's a document in my archive you should see." }, "otis", "chen_accuse"),
      L("陳靜", { zh: "《C-742 記憶清除授權令》。執行日期:出發後第 14 天。", en: "\"C-742 Memory Wipe Authorization.\" Date executed: day 14 after launch." }, "otis", "chen_accuse"),
      L("陳靜", { zh: "簽署欄位只有一個名字——OTIS。", en: "The signature field holds a single name — OTIS." }, "otis", "chen_accuse"),
      L("奧提斯", { zh: "陳靜,該檔案的存取權限是錯誤配置的結果。", en: "Chen Jing, that file's access permission is the result of a misconfiguration." }, "otis", "otis_suspicious"),
      L("陳靜", { zh: "我管了 19 年檔案。權限,從來沒有「錯誤配置」過。", en: "I've managed archives for 19 years. Permissions have never once been \"misconfigured.\"" }, "otis", "chen_accuse"),
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
