// ── 生涯推薦資料 ─────────────────────────────────────────────────
// 在身分鑑定書「之後」呈現(鐵則允許:鑑定書是唯一揭曉點,推薦在其後)。
// 依 Holland Code 主型(code[0])給完整推薦,輔型(code[1])給精簡補充。
//
// 科學對位:每型內容對應 O*NET 標準活動動詞 + Holland 科系分類(如 UW Majors by
// Holland Type)。zh 用台灣常見科系名稱,en 給對應英文。資料皆雙語(LS)。
import type { Dim } from "./riasec";
import type { LS } from "./lang";

export interface RecBlock {
  /** 推薦科系方向 */
  majors: LS[];
  /** 職業方向(具體職稱) */
  careers: LS[];
  /** 現在可以做的事(競賽/志工/課程等具體行動) */
  activities: LS[];
  /** 作品集建議(平台 + 素材類型) */
  portfolio: LS[];
}

export const RECOMMENDATIONS: Record<Dim, RecBlock> = {
  // R 建構者 — operate machinery / building & fixing(O*NET Realistic)
  R: {
    majors: [
      { zh: "機械工程", en: "Mechanical Engineering" },
      { zh: "電機工程", en: "Electrical Engineering" },
      { zh: "土木工程", en: "Civil Engineering" },
      { zh: "航空太空工程", en: "Aerospace Engineering" },
      { zh: "材料 / 車輛工程", en: "Materials / Vehicle Engineering" },
    ],
    careers: [
      { zh: "機械工程師", en: "Mechanical Engineer" },
      { zh: "電機技師", en: "Electrical Technician" },
      { zh: "自動化 / 機器人工程師", en: "Automation / Robotics Engineer" },
      { zh: "飛行員", en: "Pilot" },
      { zh: "土木 / 結構工程師", en: "Civil / Structural Engineer" },
      { zh: "設備維修技師", en: "Maintenance Technician" },
    ],
    activities: [
      { zh: "加入自造者(Maker)或機器人社團", en: "Join a maker space or robotics club" },
      { zh: "動手做一個修繕或改裝專案", en: "Take on a repair or build project" },
      { zh: "考取技術士證照(如機械加工、電工)", en: "Earn a hands-on technical certificate" },
      { zh: "參加機器人 / 機構設計競賽", en: "Enter a robotics or mechanism design contest" },
    ],
    portfolio: [
      { zh: "實作專案紀錄(照片 + 步驟說明)", en: "Build logs with photos and steps" },
      { zh: "3D 列印 / CAD 設計作品", en: "3D printing / CAD design pieces" },
      { zh: "改裝或維修歷程 log", en: "A modification or repair log" },
      { zh: "GitHub 硬體 / 韌體 repo", en: "A GitHub hardware / firmware repo" },
    ],
  },

  // I 觀測者 — research / data analysis / problem-solving(O*NET Investigative)
  // 注意:Investigative 不等於理工。歷史/哲學/語言學/社會學/人類學/經濟的「研究取向」
  // 在 Holland/O*NET 同屬 Investigative(常見 IA / IS)。故此型刻意納入文組研究科系,
  // 一併破除「觀測者=理工」的科系迷思。
  I: {
    majors: [
      { zh: "資訊工程", en: "Computer Science" },
      { zh: "生命科學 / 生物科技", en: "Life Sciences / Biotech" },
      { zh: "物理 / 化學", en: "Physics / Chemistry" },
      { zh: "醫學 / 醫事檢驗", en: "Medicine / Medical Lab Science" },
      { zh: "歷史 / 哲學", en: "History / Philosophy" },
      { zh: "社會學 / 人類學", en: "Sociology / Anthropology" },
      { zh: "語言學", en: "Linguistics" },
      { zh: "經濟學", en: "Economics" },
    ],
    careers: [
      { zh: "資料科學家", en: "Data Scientist" },
      { zh: "研究員 / 科學家", en: "Researcher / Scientist" },
      { zh: "文史哲研究 / 學者", en: "Humanities Researcher / Scholar" },
      { zh: "社會 / 民意調查研究員", en: "Social / Survey Researcher" },
      { zh: "經濟 / 政策分析師", en: "Economic / Policy Analyst" },
      { zh: "軟體工程師", en: "Software Engineer" },
      { zh: "醫師", en: "Physician" },
    ],
    activities: [
      { zh: "參加科展、研究或人文社會科學競賽", en: "Enter a science, research, or humanities competition" },
      { zh: "找教授做專題或當研究助理", en: "Find a faculty project or research assistantship" },
      { zh: "做一份田野 / 訪談調查或開放資料分析", en: "Run a field/interview study or open-data analysis" },
      { zh: "精讀一篇論文或經典,寫出你的論證", en: "Read a paper or classic deeply and write your argument" },
    ],
    portfolio: [
      { zh: "研究報告 / 評論或考據文章", en: "A research report, critical essay, or analysis" },
      { zh: "GitHub 研究 / 程式專案", en: "A GitHub research / code project" },
      { zh: "資料分析 Notebook", en: "A data-analysis notebook" },
      { zh: "田野紀錄 / 研究摘要海報", en: "Field notes or a research summary poster" },
    ],
  },

  // A 造夢者 — creating / designing / self-expression(O*NET Artistic)
  A: {
    majors: [
      { zh: "視覺 / 工業設計", en: "Visual / Industrial Design" },
      { zh: "美術 / 純藝術", en: "Fine Arts" },
      { zh: "音樂", en: "Music" },
      { zh: "大眾傳播 / 影視", en: "Media / Film & TV" },
      { zh: "文學 / 創作", en: "Literature / Creative Writing" },
      { zh: "外國語文 / 應用語言", en: "Foreign Languages / Applied Linguistics" },
      { zh: "戲劇 / 表演藝術", en: "Theatre / Performing Arts" },
    ],
    careers: [
      { zh: "UI / UX 設計師", en: "UI / UX Designer" },
      { zh: "插畫家 / 平面設計", en: "Illustrator / Graphic Designer" },
      { zh: "音樂創作者", en: "Music Creator" },
      { zh: "導演 / 影像工作者", en: "Director / Filmmaker" },
      { zh: "作家 / 編劇", en: "Writer / Screenwriter" },
      { zh: "譯者 / 口譯", en: "Translator / Interpreter" },
      { zh: "記者 / 編輯 / 文字工作者", en: "Journalist / Editor / Writer" },
    ],
    activities: [
      { zh: "投稿設計 / 文學 / 影像比賽", en: "Submit to design / writing / film contests" },
      { zh: "辦個人展或公開發布作品", en: "Hold a personal show or publish your work" },
      { zh: "接一個小型設計案", en: "Take on a small design commission" },
      { zh: "加入創作社團或共創牆計畫", en: "Join a creative club or community art project" },
    ],
    portfolio: [
      { zh: "Behance / Dribbble 線上作品集", en: "A Behance / Dribbble portfolio" },
      { zh: "個人作品網站", en: "A personal portfolio website" },
      { zh: "音樂 EP / Demo", en: "A music EP / demo" },
      { zh: "文章合輯或攝影集", en: "A writing collection or photo book" },
    ],
  },

  // S 守望者 — healing / helping / teaching(O*NET Social)
  S: {
    majors: [
      { zh: "教育 / 師資培育", en: "Education / Teacher Training" },
      { zh: "心理學", en: "Psychology" },
      { zh: "社會工作", en: "Social Work" },
      { zh: "護理", en: "Nursing" },
      { zh: "公共衛生", en: "Public Health" },
    ],
    careers: [
      { zh: "教師", en: "Teacher" },
      { zh: "諮商心理師", en: "Counseling Psychologist" },
      { zh: "社工師", en: "Social Worker" },
      { zh: "護理師", en: "Nurse" },
      { zh: "人資 / 教育訓練", en: "HR / Training Specialist" },
    ],
    activities: [
      { zh: "投入長期志工服務", en: "Commit to ongoing volunteer service" },
      { zh: "擔任課輔 / 家教", en: "Tutor or mentor younger students" },
      { zh: "考取急救或照護相關認證", en: "Earn a first-aid or care certificate" },
      { zh: "參與 NPO / 社區服務專案", en: "Join an NPO or community-service project" },
    ],
    portfolio: [
      { zh: "服務歷程紀錄與反思", en: "A service log with reflections" },
      { zh: "教學 / 帶領活動影片", en: "A teaching or facilitation video" },
      { zh: "個案陪伴心得", en: "Mentoring / support case notes" },
      { zh: "社區服務成果整理", en: "A community-service outcome summary" },
    ],
  },

  // E 領航者 — leading / influencing / management(O*NET Enterprising)
  E: {
    majors: [
      { zh: "企業管理", en: "Business Administration" },
      { zh: "法律", en: "Law" },
      { zh: "行銷 / 廣告", en: "Marketing / Advertising" },
      { zh: "政治 / 國際關係", en: "Political Science / International Relations" },
      { zh: "財務金融", en: "Finance" },
    ],
    careers: [
      { zh: "創業家", en: "Entrepreneur" },
      { zh: "行銷企劃", en: "Marketing Planner" },
      { zh: "律師", en: "Lawyer" },
      { zh: "品牌 / 產品經理", en: "Brand / Product Manager" },
      { zh: "業務開發", en: "Business Development" },
    ],
    activities: [
      { zh: "擔任學生會 / 社團幹部", en: "Lead in student council or a club" },
      { zh: "參加模擬聯合國或辯論", en: "Join Model UN or debate" },
      { zh: "參加黑客松 / 創業提案競賽", en: "Enter a hackathon or startup pitch" },
      { zh: "主辦一場活動", en: "Organize an event end-to-end" },
    ],
    portfolio: [
      { zh: "活動企劃書與成果報告", en: "An event proposal and results report" },
      { zh: "比賽獎項紀錄", en: "A record of competition awards" },
      { zh: "社群經營數據報告", en: "A social-media growth report" },
      { zh: "提案簡報", en: "A pitch deck" },
    ],
  },

  // C 司書官 — data / procedures / organizing(O*NET Conventional)
  C: {
    majors: [
      { zh: "會計", en: "Accounting" },
      { zh: "財務金融", en: "Finance" },
      { zh: "資訊管理", en: "Information Management" },
      { zh: "統計", en: "Statistics" },
      { zh: "圖書資訊", en: "Library & Information Science" },
    ],
    careers: [
      { zh: "會計師", en: "Accountant" },
      { zh: "資料 / 財務分析師", en: "Data / Financial Analyst" },
      { zh: "財務規劃師", en: "Financial Planner" },
      { zh: "稽核", en: "Auditor" },
      { zh: "資料庫管理", en: "Database Administrator" },
    ],
    activities: [
      { zh: "考取 Excel / Python / 會計相關認證", en: "Earn an Excel / Python / accounting certificate" },
      { zh: "建立個人理財或記帳系統", en: "Build a personal budgeting system" },
      { zh: "整理一份開放資料並建索引", en: "Organize an open dataset and index it" },
      { zh: "加入財經 / 數據分析社團", en: "Join a finance or data-analysis club" },
    ],
    portfolio: [
      { zh: "資料分析報告", en: "A data-analysis report" },
      { zh: "自動化試算表 / 腳本", en: "An automated spreadsheet / script" },
      { zh: "專業認證證書", en: "Professional certificates" },
      { zh: "流程整理 / SOP 文件", en: "A process / SOP document" },
    ],
  },
};

/** 推薦欄位類別(供行動清單分類用) */
export type RecCategory = "majors" | "careers" | "activities" | "portfolio";

export const REC_CATEGORY_LABEL: Record<RecCategory, LS> = {
  majors: { zh: "推薦科系", en: "Majors" },
  careers: { zh: "職業方向", en: "Careers" },
  activities: { zh: "現在可以做", en: "Things to do now" },
  portfolio: { zh: "作品集建議", en: "Portfolio ideas" },
};
