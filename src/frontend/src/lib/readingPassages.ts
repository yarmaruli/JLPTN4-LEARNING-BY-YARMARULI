/**
 * readingPassages.ts
 * Static data: 36 learning reading passages (9 themes × 4 levels)
 * + 14 JLPT-format document passages (2 per type × 7 types).
 * All Japanese text uses real N4/N5 vocabulary and natural grammar.
 * Indonesian comprehension questions match JLPT-style question formats.
 */

import type { ReadingPassage } from "./readingEngine";

// ============================================================================
// LEARNING READING PASSAGES — 9 themes × 4 levels = 36 passages
// ============================================================================

export const READING_PASSAGES: ReadingPassage[] = [
  // ──────────────────────────── OFFICE ────────────────────────────
  {
    id: "office-L1-1",
    mode: "learning" as const,
    theme: "office",
    level: 1,
    title: "朝の会社",
    sentences: ["田中さんは毎朝9時に会社へ行きます。"],
    questions: [
      {
        question: "田中さんは何時に会社へ行きますか？",
        options: ["8時", "9時", "10時", "11時"],
        answer: 1,
      },
      {
        question: "田中さんはどこへ行きますか？",
        options: ["学校", "病院", "会社", "駅"],
        answer: 2,
      },
    ],
    targetVocabulary: ["会社", "仕事"],
  },
  {
    id: "office-L2-1",
    mode: "learning" as const,
    theme: "office",
    level: 2,
    title: "会議の準備",
    sentences: [
      "今日の午後、大切な会議があります。",
      "田中さんは朝から資料を準備しています。",
      "会議の前に課長に報告しなければなりません。",
    ],
    questions: [
      {
        question: "田中さんは何を準備していますか？",
        options: ["食べ物", "資料", "荷物", "プレゼント"],
        answer: 1,
      },
      {
        question: "会議はいつありますか？",
        options: ["今日の朝", "明日", "今日の午後", "来週"],
        answer: 2,
      },
    ],
    targetVocabulary: ["会社", "仕事", "働きます"],
  },
  {
    id: "office-L3-1",
    mode: "learning" as const,
    theme: "office",
    level: 3,
    title: "新しい仕事",
    sentences: [
      "田中さんは新しい会社に入りました。",
      "最初は仕事が難しかったですが、今は仕事に慣れました。",
      "毎日残業することもありますが、仕事がとても好きです。",
    ],
    questions: [
      {
        question: "最初、田中さんはどう思いましたか？",
        options: [
          "仕事が簡単だった",
          "仕事が難しかった",
          "仕事が楽しかった",
          "仕事が嫌だった",
        ],
        answer: 1,
      },
      {
        question: "今の田中さんの状態はどうですか？",
        options: ["まだ難しい", "会社を辞めた", "仕事に慣れた", "仕事が嫌いだ"],
        answer: 2,
      },
      {
        question: "田中さんは毎日何をすることがありますか？",
        options: ["旅行", "残業", "欠席", "休暇"],
        answer: 1,
      },
    ],
    targetVocabulary: ["会社", "仕事", "仕事に慣れます", "働きます"],
  },
  {
    id: "office-L4-1",
    mode: "learning" as const,
    theme: "office",
    level: 4,
    title: "出張報告",
    sentences: [
      "山田部長は先週、大阪に出張しました。",
      "出張では取引先の会社と重要な打ち合わせをしました。",
      "帰ってきてから、チームに詳しい報告をしました。",
      "この仕事のおかげで、会社の売上が増える見込みです。",
    ],
    questions: [
      {
        question: "山田部長はどこへ出張しましたか？",
        options: ["東京", "大阪", "名古屋", "福岡"],
        answer: 1,
      },
      {
        question: "出張で何をしましたか？",
        options: [
          "観光した",
          "研修を受けた",
          "打ち合わせをした",
          "買い物をした",
        ],
        answer: 2,
      },
      {
        question: "帰ってきてから何をしましたか？",
        options: ["休んだ", "チームに報告した", "また出張した", "会議を開いた"],
        answer: 1,
      },
      {
        question: "この仕事の結果として何が期待されますか？",
        options: ["費用が減る", "社員が増える", "売上が増える", "残業が増える"],
        answer: 2,
      },
    ],
    targetVocabulary: ["会社", "仕事", "働きます", "給料"],
  },

  // ──────────────────────────── SCHOOL ────────────────────────────
  {
    id: "school-L1-1",
    mode: "learning" as const,
    theme: "school",
    level: 1,
    title: "学校へ行きます",
    sentences: ["山田さんは毎朝8時に学校へ行きます。"],
    questions: [
      {
        question: "山田さんは何時に学校へ行きますか？",
        options: ["7時", "8時", "9時", "10時"],
        answer: 1,
      },
      {
        question: "山田さんはどこへ行きますか？",
        options: ["会社", "図書館", "学校", "病院"],
        answer: 2,
      },
    ],
    targetVocabulary: ["学校", "先生"],
  },
  {
    id: "school-L2-1",
    mode: "learning" as const,
    theme: "school",
    level: 2,
    title: "試験の日",
    sentences: [
      "今日は学校で試験がありました。",
      "山田さんはよく勉強していたので、高い点数を取りました。",
      "先生はみんなをほめました。",
    ],
    questions: [
      {
        question: "なぜ山田さんは高い点数を取りましたか？",
        options: [
          "運が良かったから",
          "よく勉強していたから",
          "試験が簡単だったから",
          "先生に教えてもらったから",
        ],
        answer: 1,
      },
      {
        question: "先生はどうしましたか？",
        options: ["怒った", "泣いた", "みんなをほめた", "笑った"],
        answer: 2,
      },
    ],
    targetVocabulary: ["学校", "先生", "勉強します"],
  },
  {
    id: "school-L3-1",
    mode: "learning" as const,
    theme: "school",
    level: 3,
    title: "図書館での勉強",
    sentences: [
      "鈴木さんは毎日放課後に図書館で勉強します。",
      "静かな図書館はとても勉強しやすい環境です。",
      "来月、大学の入学試験があるので、今は特に一生懸命勉強しています。",
    ],
    questions: [
      {
        question: "鈴木さんはいつ図書館へ行きますか？",
        options: ["授業の前", "放課後", "昼休み", "週末"],
        answer: 1,
      },
      {
        question: "なぜ鈴木さんは特に一生懸命勉強していますか？",
        options: [
          "先生に言われたから",
          "友達と約束したから",
          "来月入学試験があるから",
          "成績が悪いから",
        ],
        answer: 2,
      },
      {
        question: "図書館はどんな場所ですか？",
        options: ["うるさい", "暗い", "静か", "広い"],
        answer: 2,
      },
    ],
    targetVocabulary: ["学校", "先生", "勉強します", "一生懸命"],
  },
  {
    id: "school-L4-1",
    mode: "learning" as const,
    theme: "school",
    level: 4,
    title: "卒業式",
    sentences: [
      "今日は田中大学の卒業式です。",
      "4年間、たくさん勉強して、多くの友達もできました。",
      "졸업 후에는 大きい会社に就職する予定です。",
      "先生から「いつでも連絡してください」と言われて、とても感謝しています。",
    ],
    questions: [
      {
        question: "この文章は何の日について書かれていますか？",
        options: ["入学式", "卒業式", "誕生日", "試験の日"],
        answer: 1,
      },
      {
        question: "卒業後の予定は何ですか？",
        options: ["大学院に行く", "海外留学する", "会社に就職する", "旅行する"],
        answer: 2,
      },
      {
        question: "先生は何と言いましたか？",
        options: [
          "頑張ってください",
          "いつでも連絡してください",
          "また来てください",
          "元気でいてください",
        ],
        answer: 1,
      },
      {
        question: "何年間学校に通いましたか？",
        options: ["2年間", "3年間", "4年間", "5年間"],
        answer: 2,
      },
    ],
    targetVocabulary: ["学校", "先生", "勉強します", "感謝します"],
  },

  // ──────────────────────────── FAMILY ────────────────────────────
  {
    id: "family-L1-1",
    mode: "learning" as const,
    theme: "family",
    level: 1,
    title: "家族の夕食",
    sentences: ["鈴木さんの家族は毎晩一緒に夕食を食べます。"],
    questions: [
      {
        question: "鈴木さんの家族はいつ一緒に食事しますか？",
        options: ["朝", "昼", "夜", "週末だけ"],
        answer: 2,
      },
      {
        question: "家族は何をしますか？",
        options: ["散歩する", "テレビを見る", "夕食を食べる", "買い物する"],
        answer: 2,
      },
    ],
    targetVocabulary: ["家族", "食べます"],
  },
  {
    id: "family-L2-1",
    mode: "learning" as const,
    theme: "family",
    level: 2,
    title: "両親への電話",
    sentences: [
      "山田さんは東京で一人暮らしをしています。",
      "毎週日曜日に田舎の両親に電話します。",
      "両親の声を聞くと、安心します。",
    ],
    questions: [
      {
        question: "山田さんはどこに住んでいますか？",
        options: ["田舎", "大阪", "東京", "名古屋"],
        answer: 2,
      },
      {
        question: "両親の声を聞くとどうなりますか？",
        options: ["悲しくなる", "寂しくなる", "安心する", "怒る"],
        answer: 2,
      },
    ],
    targetVocabulary: ["家族", "息子", "娘"],
  },
  {
    id: "family-L3-1",
    mode: "learning" as const,
    theme: "family",
    level: 3,
    title: "子供の成長",
    sentences: [
      "田中さんには5歳の息子がいます。",
      "息子は最近ひらがなを勉強し始めました。",
      "田中さんは毎晩息子の勉強を手伝っています。",
    ],
    questions: [
      {
        question: "田中さんの息子は何歳ですか？",
        options: ["3歳", "4歳", "5歳", "6歳"],
        answer: 2,
      },
      {
        question: "息子は最近何を勉強し始めましたか？",
        options: ["英語", "数学", "ひらがな", "漢字"],
        answer: 2,
      },
      {
        question: "田中さんは毎晩何をしていますか？",
        options: [
          "テレビを見る",
          "息子の勉強を手伝う",
          "料理をする",
          "本を読む",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["家族", "息子", "子供たち", "世話をします"],
  },
  {
    id: "family-L4-1",
    mode: "learning" as const,
    theme: "family",
    level: 4,
    title: "結婚式の準備",
    sentences: [
      "来月、鈴木さんの姉が結婚式を挙げる予定です。",
      "家族全員で準備を手伝っています。",
      "お母さんは料理の担当で、お父さんは招待状を送る担当です。",
      "鈴木さんは姉のためにスピーチを準備しています。",
    ],
    questions: [
      {
        question: "誰が結婚しますか？",
        options: [
          "鈴木さん本人",
          "鈴木さんの弟",
          "鈴木さんの姉",
          "鈴木さんの母",
        ],
        answer: 2,
      },
      {
        question: "お母さんの担当は何ですか？",
        options: ["招待状", "スピーチ", "花の準備", "料理"],
        answer: 3,
      },
      {
        question: "鈴木さんは何を準備していますか？",
        options: ["ドレス", "スピーチ", "ケーキ", "写真"],
        answer: 1,
      },
      {
        question: "いつ結婚式がありますか？",
        options: ["今週", "来週", "来月", "来年"],
        answer: 2,
      },
    ],
    targetVocabulary: ["家族", "婚約します", "用意します"],
  },

  // ──────────────────────────── SHOPPING ────────────────────────────
  {
    id: "shopping-L1-1",
    mode: "learning" as const,
    theme: "shopping",
    level: 1,
    title: "スーパーで買い物",
    sentences: ["山田さんは今日スーパーで野菜と果物を買いました。"],
    questions: [
      {
        question: "山田さんはどこで買い物しましたか？",
        options: ["コンビニ", "デパート", "スーパー", "市場"],
        answer: 2,
      },
      {
        question: "何を買いましたか？",
        options: ["肉と魚", "お菓子とジュース", "野菜と果物", "パンと牛乳"],
        answer: 2,
      },
    ],
    targetVocabulary: ["品物", "値段"],
  },
  {
    id: "shopping-L2-1",
    mode: "learning" as const,
    theme: "shopping",
    level: 2,
    title: "セールの日",
    sentences: [
      "今日はデパートで大きなセールがあります。",
      "鈴木さんは朝早くから並んで、割引の服を買いました。",
      "30%引きだったので、とても安く買えました。",
    ],
    questions: [
      {
        question: "鈴木さんはいつから並びましたか？",
        options: ["夜", "昼", "朝早く", "午後"],
        answer: 2,
      },
      {
        question: "何パーセント引きでしたか？",
        options: ["10%", "20%", "30%", "50%"],
        answer: 2,
      },
    ],
    targetVocabulary: ["値段", "品物", "割引", "無料"],
  },
  {
    id: "shopping-L3-1",
    mode: "learning" as const,
    theme: "shopping",
    level: 3,
    title: "保証書の確認",
    sentences: [
      "田中さんは新しい家電を買った後、保証書を確認しました。",
      "保証期間は1年間で、その間は無料で修理してもらえます。",
      "購入の証明として領収書も大切に保管しています。",
    ],
    questions: [
      {
        question: "保証期間は何年ですか？",
        options: ["半年", "1年", "2年", "3年"],
        answer: 1,
      },
      {
        question: "保証期間中の修理はどうなりますか？",
        options: [
          "高い料金がかかる",
          "無料でしてもらえる",
          "できない",
          "半額になる",
        ],
        answer: 1,
      },
      {
        question: "田中さんはなぜ領収書を保管していますか？",
        options: [
          "税金のため",
          "購入の証明のため",
          "次回割引のため",
          "保証延長のため",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["値段", "品物", "割引", "無料", "保証書", "領収書"],
  },
  {
    id: "shopping-L4-1",
    mode: "learning" as const,
    theme: "shopping",
    level: 4,
    title: "オンラインショッピング",
    sentences: [
      "最近、オンラインで買い物をする人が増えています。",
      "便利な宅配便サービスを利用すれば、家にいながら品物が届きます。",
      "ただし、実際に見ないで買うので、品物が想像と違うこともあります。",
      "キャンセルや返品の方法を事前に確認することが大切です。",
    ],
    questions: [
      {
        question: "オンラインショッピングの便利な点は何ですか？",
        options: [
          "安い",
          "品物が多い",
          "家にいながら買い物できる",
          "割引が多い",
        ],
        answer: 2,
      },
      {
        question: "オンラインショッピングのデメリットは何ですか？",
        options: [
          "送料が高い",
          "品物が想像と違うことがある",
          "時間がかかる",
          "品物が少ない",
        ],
        answer: 1,
      },
      {
        question: "事前に確認すべきことは何ですか？",
        options: ["値段", "色と大きさ", "キャンセルと返品の方法", "店員の名前"],
        answer: 2,
      },
      {
        question: "品物を届けるサービスは何ですか？",
        options: ["タクシー", "宅配便", "バス", "電車"],
        answer: 1,
      },
    ],
    targetVocabulary: [
      "値段",
      "品物",
      "宅配便",
      "キャンセルします",
      "届きます",
      "利用します",
    ],
  },

  // ──────────────────────────── TRAVEL ────────────────────────────
  {
    id: "travel-L1-1",
    mode: "learning" as const,
    theme: "travel",
    level: 1,
    title: "旅行の計画",
    sentences: ["山田さんは来月、京都へ旅行する予定です。"],
    questions: [
      {
        question: "山田さんはどこへ旅行しますか？",
        options: ["大阪", "東京", "京都", "北海道"],
        answer: 2,
      },
      {
        question: "旅行はいつですか？",
        options: ["来週", "来月", "来年", "今週"],
        answer: 1,
      },
    ],
    targetVocabulary: ["旅館", "バス停"],
  },
  {
    id: "travel-L2-1",
    mode: "learning" as const,
    theme: "travel",
    level: 2,
    title: "新幹線の旅",
    sentences: [
      "田中さんは新幹線で大阪から東京へ行きます。",
      "新幹線は速いので、約2時間半で着きます。",
      "車内では弁当を食べながら景色を楽しみました。",
    ],
    questions: [
      {
        question: "田中さんはどの交通手段を使いますか？",
        options: ["飛行機", "バス", "新幹線", "電車"],
        answer: 2,
      },
      {
        question: "何時間くらいかかりますか？",
        options: ["約1時間", "約2時間", "約2時間半", "約3時間"],
        answer: 2,
      },
    ],
    targetVocabulary: ["旅館", "バス停", "運びます"],
  },
  {
    id: "travel-L3-1",
    mode: "learning" as const,
    theme: "travel",
    level: 3,
    title: "旅館での一夜",
    sentences: [
      "鈴木さんは温泉地の旅館に一泊しました。",
      "旅館では浴衣を着て温泉に入ることができます。",
      "夕食には地元の新鮮な魚料理が出て、とても美味しかったです。",
    ],
    questions: [
      {
        question: "鈴木さんはどこに泊まりましたか？",
        options: ["ホテル", "旅館", "友達の家", "テント"],
        answer: 1,
      },
      {
        question: "旅館で何を着ましたか？",
        options: ["スーツ", "普段着", "浴衣", "ユニフォーム"],
        answer: 2,
      },
      {
        question: "夕食は何でしたか？",
        options: ["肉料理", "野菜料理", "魚料理", "洋食"],
        answer: 2,
      },
    ],
    targetVocabulary: ["旅館", "泊まります"],
  },
  {
    id: "travel-L4-1",
    mode: "learning" as const,
    theme: "travel",
    level: 4,
    title: "海外旅行の準備",
    sentences: [
      "田中さんは来月初めて海外旅行に行く予定です。",
      "パスポートを取得し、旅行保険にも加入しました。",
      "現地の言葉は少ししか話せないので、翻訳アプリをスマホにインストールしました。",
      "旅行中はスケジュールを決めすぎずに、自由に観光したいと思っています。",
    ],
    questions: [
      {
        question: "田中さんは何を取得しましたか？",
        options: ["ビザ", "パスポート", "免許証", "学生証"],
        answer: 1,
      },
      {
        question: "なぜ翻訳アプリをインストールしましたか？",
        options: [
          "ゲームをするため",
          "写真を撮るため",
          "現地の言葉が少ししか話せないから",
          "地図を見るため",
        ],
        answer: 2,
      },
      {
        question: "旅行中のスケジュールについてどう思っていますか？",
        options: [
          "全部決めたい",
          "決めすぎずに自由にしたい",
          "ガイドに任せたい",
          "決めないでいい",
        ],
        answer: 1,
      },
      {
        question: "田中さんは海外旅行の経験がありますか？",
        options: ["何度もある", "2回ある", "初めて", "わからない"],
        answer: 2,
      },
    ],
    targetVocabulary: ["旅館", "バス停", "スケジュール", "自由に"],
  },

  // ──────────────────────────── RESTAURANT ────────────────────────────
  {
    id: "restaurant-L1-1",
    mode: "learning" as const,
    theme: "restaurant",
    level: 1,
    title: "レストランで",
    sentences: ["鈴木さんは友達とレストランで夕食を食べました。"],
    questions: [
      {
        question: "鈴木さんは誰と食べましたか？",
        options: ["家族", "同僚", "一人", "友達"],
        answer: 3,
      },
      {
        question: "どこで食べましたか？",
        options: ["家", "学校", "レストラン", "公園"],
        answer: 2,
      },
    ],
    targetVocabulary: ["食べます", "飲みます"],
  },
  {
    id: "restaurant-L2-1",
    mode: "learning" as const,
    theme: "restaurant",
    level: 2,
    title: "注文の仕方",
    sentences: [
      "山田さんはイタリアンレストランに入りました。",
      "ウェイターがメニューを持ってきて、注文を聞きました。",
      "山田さんはパスタとサラダを注文しました。",
    ],
    questions: [
      {
        question: "山田さんはどこに入りましたか？",
        options: [
          "和食レストラン",
          "中華レストラン",
          "イタリアンレストラン",
          "ファストフード",
        ],
        answer: 2,
      },
      {
        question: "山田さんは何を注文しましたか？",
        options: [
          "ピザとスープ",
          "パスタとサラダ",
          "ステーキとパン",
          "ラーメンと餃子",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["食べます", "飲みます", "飲み放題"],
  },
  {
    id: "restaurant-L3-1",
    mode: "learning" as const,
    theme: "restaurant",
    level: 3,
    title: "料理教室",
    sentences: [
      "田中さんは週に一度、料理教室に通っています。",
      "先生は丁寧に材料の切り方と調理の手順を教えてくれます。",
      "今日は鶏肉を使った日本料理を作りました。",
    ],
    questions: [
      {
        question: "田中さんはどのくらいの頻度で料理教室に行きますか？",
        options: ["毎日", "週に一度", "月に一度", "年に一度"],
        answer: 1,
      },
      {
        question: "先生は何を教えますか？",
        options: [
          "料理の歴史",
          "材料の切り方と調理の手順",
          "食材の選び方",
          "盛り付けの方法",
        ],
        answer: 1,
      },
      {
        question: "今日は何を作りましたか？",
        options: ["魚料理", "野菜料理", "鶏肉の日本料理", "デザート"],
        answer: 2,
      },
    ],
    targetVocabulary: ["食べます", "飲みます", "材料"],
  },
  {
    id: "restaurant-L4-1",
    mode: "learning" as const,
    theme: "restaurant",
    level: 4,
    title: "食レポ",
    sentences: [
      "鈴木さんはグルメブログを書いていて、毎週新しいレストランを訪問しています。",
      "先週訪れた和食レストランは、料理の見た目も味もとても素晴らしかったです。",
      "特に刺身の鮮度が高く、味がします、とても評判が良いそうです。",
      "次回は友人を連れて、また来たいと思っています。",
    ],
    questions: [
      {
        question: "鈴木さんは何を書いていますか？",
        options: ["小説", "料理レシピ", "グルメブログ", "旅行記"],
        answer: 2,
      },
      {
        question: "和食レストランの評価はどうでしたか？",
        options: ["普通だった", "素晴らしかった", "少し失望した", "高すぎた"],
        answer: 1,
      },
      {
        question: "特に何が良かったですか？",
        options: ["サービス", "雰囲気", "刺身の鮮度", "値段"],
        answer: 2,
      },
      {
        question: "次回はどうしたいですか？",
        options: [
          "一人で行く",
          "友人を連れて行く",
          "家族と行く",
          "もう行かない",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["食べます", "飲みます", "味がします"],
  },

  // ──────────────────────────── HEALTH ────────────────────────────
  {
    id: "health-L1-1",
    mode: "learning" as const,
    theme: "health",
    level: 1,
    title: "病院へ行きます",
    sentences: ["田中さんは風邪を引いたので、病院へ行きました。"],
    questions: [
      {
        question: "田中さんはなぜ病院へ行きましたか？",
        options: [
          "骨折したから",
          "検査のため",
          "風邪を引いたから",
          "薬をもらうため",
        ],
        answer: 2,
      },
      {
        question: "田中さんはどこへ行きましたか？",
        options: ["学校", "薬局", "病院", "会社"],
        answer: 2,
      },
    ],
    targetVocabulary: ["健康", "救急車"],
  },
  {
    id: "health-L2-1",
    mode: "learning" as const,
    theme: "health",
    level: 2,
    title: "熱が出ました",
    sentences: [
      "山田さんは昨日から熱が出ています。",
      "今朝、体温を測ったら38度でした。",
      "会社を休んで、薬を飲みながら休んでいます。",
    ],
    questions: [
      {
        question: "山田さんの体温は何度でしたか？",
        options: ["36度", "37度", "38度", "39度"],
        answer: 2,
      },
      {
        question: "山田さんはどうしましたか？",
        options: [
          "病院へ行った",
          "会社を休んだ",
          "学校へ行った",
          "薬局へ行った",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["健康", "救急車", "熱が出ます"],
  },
  {
    id: "health-L3-1",
    mode: "learning" as const,
    theme: "health",
    level: 3,
    title: "健康診断",
    sentences: [
      "鈴木さんは毎年会社の健康診断を受けています。",
      "今年は血圧が少し高かったので、医者に塩分を控えるよう言われました。",
      "最近運動不足なので、毎朝散歩を始めることにしました。",
    ],
    questions: [
      {
        question: "鈴木さんはいつ健康診断を受けますか？",
        options: ["半年ごと", "毎月", "毎年", "2年ごと"],
        answer: 2,
      },
      {
        question: "医者から何と言われましたか？",
        options: [
          "もっと食べるよう",
          "塩分を控えるよう",
          "薬を飲むよう",
          "入院するよう",
        ],
        answer: 1,
      },
      {
        question: "鈴木さんは何を始めることにしましたか？",
        options: ["ジョギング", "水泳", "毎朝散歩", "ヨガ"],
        answer: 2,
      },
    ],
    targetVocabulary: ["健康", "熱が出ます", "長生きします"],
  },
  {
    id: "health-L4-1",
    mode: "learning" as const,
    theme: "health",
    level: 4,
    title: "緊急事態",
    sentences: [
      "田中さんが突然倒れたので、同僚がすぐに119番に電話しました。",
      "救急車が5分後に到着して、田中さんは病院に運ばれました。",
      "検査の結果、重大な病気ではなく、疲労と脱水が原因だとわかりました。",
      "医者からは十分な休養と水分補給を指示されました。",
    ],
    questions: [
      {
        question: "同僚はまず何をしましたか？",
        options: [
          "水を持ってきた",
          "医者を呼んだ",
          "119番に電話した",
          "会社に報告した",
        ],
        answer: 2,
      },
      {
        question: "救急車は何分後に来ましたか？",
        options: ["2分後", "5分後", "10分後", "15分後"],
        answer: 1,
      },
      {
        question: "倒れた原因は何でしたか？",
        options: ["心臓病", "骨折", "疲労と脱水", "食中毒"],
        answer: 2,
      },
      {
        question: "医者の指示は何でしたか？",
        options: ["すぐ手術", "入院", "休養と水分補給", "薬を飲む"],
        answer: 2,
      },
    ],
    targetVocabulary: ["健康", "救急車", "119番", "原因"],
  },

  // ──────────────────────────── DAILY LIFE ────────────────────────────
  {
    id: "daily_life-L1-1",
    mode: "learning" as const,
    theme: "daily_life",
    level: 1,
    title: "朝の日課",
    sentences: ["私は毎朝6時に起きて、シャワーを浴びます。"],
    questions: [
      {
        question: "毎朝何時に起きますか？",
        options: ["5時", "6時", "7時", "8時"],
        answer: 1,
      },
      {
        question: "起きてから何をしますか？",
        options: ["朝食を食べる", "散歩する", "シャワーを浴びる", "新聞を読む"],
        answer: 2,
      },
    ],
    targetVocabulary: ["目が覚めます", "目覚まし時計"],
  },
  {
    id: "daily_life-L2-1",
    mode: "learning" as const,
    theme: "daily_life",
    level: 2,
    title: "雨の日の過ごし方",
    sentences: [
      "昨日は雨でした。",
      "だから家にいました。",
      "テレビを見たり、本を読んだりして過ごしました。",
    ],
    questions: [
      {
        question: "昨日の天気はどうでしたか？",
        options: ["晴れ", "雪", "雨", "曇り"],
        answer: 2,
      },
      {
        question: "なぜ家にいましたか？",
        options: [
          "疲れていたから",
          "病気だったから",
          "雨だったから",
          "仕事があったから",
        ],
        answer: 2,
      },
    ],
    targetVocabulary: ["目が覚めます", "過ごします", "番組"],
  },
  {
    id: "daily_life-L3-1",
    mode: "learning" as const,
    theme: "daily_life",
    level: 3,
    title: "通勤の日常",
    sentences: [
      "私は毎朝6時に起きます。",
      "朝ご飯を食べてから会社へ行きます。",
      "会社まで電車で30分かかります。",
    ],
    questions: [
      {
        question: "毎朝何時に起きますか？",
        options: ["5時", "6時", "7時", "8時"],
        answer: 1,
      },
      {
        question: "会社まで何で行きますか？",
        options: ["バス", "自転車", "電車", "徒歩"],
        answer: 2,
      },
      {
        question: "会社まで何分かかりますか？",
        options: ["10分", "20分", "30分", "40分"],
        answer: 2,
      },
    ],
    targetVocabulary: [
      "目が覚めます",
      "目覚まし時計",
      "鳴ります",
      "過ごします",
    ],
  },
  {
    id: "daily_life-L4-1",
    mode: "learning" as const,
    theme: "daily_life",
    level: 4,
    title: "ライフスタイルの変化",
    sentences: [
      "山田さんは以前、毎日終電近くまで残業していました。",
      "しかし、健康に悪いと感じて、生活習慣を変えることにしました。",
      "今は定時に退社して、ジムで運動してから帰るようにしています。",
      "生活が規則正しくなってから、体の具合もよくなりました。",
    ],
    questions: [
      {
        question: "山田さんは以前どうしていましたか？",
        options: [
          "早く帰宅していた",
          "終電近くまで残業していた",
          "週休3日だった",
          "在宅勤務していた",
        ],
        answer: 1,
      },
      {
        question: "なぜ生活を変えましたか？",
        options: [
          "給料が上がったから",
          "上司に言われたから",
          "健康に悪いと感じたから",
          "家族に頼まれたから",
        ],
        answer: 2,
      },
      {
        question: "今は何をしてから帰りますか？",
        options: ["食事", "買い物", "ジムで運動", "友達と会う"],
        answer: 2,
      },
      {
        question: "生活を変えてからどうなりましたか？",
        options: [
          "仕事が楽しくなった",
          "体の具合がよくなった",
          "友達が増えた",
          "給料が増えた",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: ["具合", "過ごします", "目が覚めます", "鳴ります"],
  },

  // ──────────────────────────── TECHNOLOGY ────────────────────────────
  {
    id: "technology-L1-1",
    mode: "learning" as const,
    theme: "technology",
    level: 1,
    title: "スマートフォン",
    sentences: ["田中さんは毎日スマートフォンでメールをチェックします。"],
    questions: [
      {
        question: "田中さんは何で何をしますか？",
        options: [
          "パソコンで映画を見る",
          "スマートフォンでメールをチェック",
          "テレビでニュースを見る",
          "ラジオで音楽を聴く",
        ],
        answer: 1,
      },
      {
        question: "どのくらいの頻度でしますか？",
        options: ["週に一度", "時々", "毎日", "月に一度"],
        answer: 2,
      },
    ],
    targetVocabulary: ["メールアドレス", "スケジュール"],
  },
  {
    id: "technology-L2-1",
    mode: "learning" as const,
    theme: "technology",
    level: 2,
    title: "パソコンの問題",
    sentences: [
      "鈴木さんのパソコンが突然壊れました。",
      "大切なファイルが消えてしまって、とても困りました。",
      "次からは定期的にデータをバックアップすることにしました。",
    ],
    questions: [
      {
        question: "何が起きましたか？",
        options: [
          "インターネットが遅くなった",
          "パソコンが壊れた",
          "スマホが盗まれた",
          "ソフトがなくなった",
        ],
        answer: 1,
      },
      {
        question: "鈴木さんはどうすることにしましたか？",
        options: [
          "新しいパソコンを買う",
          "修理に出す",
          "データをバックアップする",
          "パソコンを使わない",
        ],
        answer: 2,
      },
    ],
    targetVocabulary: ["メールアドレス", "ファイル", "データ", "録音します"],
  },
  {
    id: "technology-L3-1",
    mode: "learning" as const,
    theme: "technology",
    level: 3,
    title: "新しいアプリ",
    sentences: [
      "山田さんは最近、学習アプリを使って日本語の勉強をしています。",
      "このアプリには単語テストや文法解説など、多くの機能があります。",
      "毎日30分スケジュールを決めて勉強することで、着実に上達しています。",
    ],
    questions: [
      {
        question: "山田さんは何に使っていますか？",
        options: ["ゲーム", "SNS", "日本語の勉強", "仕事"],
        answer: 2,
      },
      {
        question: "このアプリには何がありますか？",
        options: [
          "ゲームとアニメ",
          "単語テストと文法解説",
          "音楽と動画",
          "ニュースと天気",
        ],
        answer: 1,
      },
      {
        question: "どのくらいの時間勉強していますか？",
        options: ["毎日1時間", "毎日30分", "週末だけ", "たまに"],
        answer: 1,
      },
    ],
    targetVocabulary: ["メールアドレス", "スケジュール", "ファイル", "データ"],
  },
  {
    id: "technology-L4-1",
    mode: "learning" as const,
    theme: "technology",
    level: 4,
    title: "AIの活用",
    sentences: [
      "最近、人工知能（AI）を使ったサービスが増えています。",
      "田中さんの会社では、AIを使って顧客データを分析するシステムを開発しています。",
      "このシステムを利用することで、より効率的に仕事を進めることができます。",
      "しかし、AIが発展することで、なくなってしまう仕事もあると言われています。",
    ],
    questions: [
      {
        question: "田中さんの会社では何を開発していますか？",
        options: [
          "新しいスマホ",
          "ゲームアプリ",
          "顧客データ分析システム",
          "翻訳ソフト",
        ],
        answer: 2,
      },
      {
        question: "このシステムのメリットは何ですか？",
        options: [
          "コストが下がる",
          "社員が増える",
          "より効率的に仕事できる",
          "残業が増える",
        ],
        answer: 2,
      },
      {
        question: "AIが発展することのデメリットとして何が言われていますか？",
        options: [
          "電力消費が増える",
          "仕事がなくなる可能性がある",
          "個人情報が危険になる",
          "機械が壊れやすくなる",
        ],
        answer: 1,
      },
      {
        question: "AIはどんな目的で使われていますか？",
        options: [
          "エンタメのため",
          "コミュニケーションのため",
          "データ分析のため",
          "教育のため",
        ],
        answer: 2,
      },
    ],
    targetVocabulary: ["データ", "利用します", "開発します", "スケジュール"],
  },
];

// ============================================================================
// JLPT FORMAT PASSAGES — 7 types × 2 = 14 passages
// ============================================================================

export const JLPT_PASSAGES: ReadingPassage[] = [
  // ──────────── POSTER (ポスター) ────────────
  {
    id: "jlpt-poster-1",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "poster",
    title: "日本語スピーチコンテスト開催！",
    sentences: [
      "第15回 日本語スピーチコンテスト",
      "",
      "日時：2024年11月10日（日）午前10時〜午後5時",
      "場所：市民文化センター 大ホール",
      "対象：外国人学習者（N5〜N2レベル）",
      "参加費：無料",
      "",
      "応募締め切り：10月20日（日）",
      "スピーチ時間：3〜5分",
      "",
      "優勝者には賞金5万円と副賞を授与します。",
      "申し込みはウェブサイトまたは窓口で受け付けています。",
    ],
    questions: [
      {
        question: "このコンテストに参加できる人は誰ですか？",
        options: [
          "日本人の学生",
          "外国人学習者（N5〜N2）",
          "日本語教師",
          "大学生だけ",
        ],
        answer: 1,
      },
      {
        question: "参加するためにまず何をしなければなりませんか？",
        options: [
          "会場に直接行く",
          "お金を払う",
          "10月20日までに申し込む",
          "スピーチを書いて送る",
        ],
        answer: 2,
      },
      {
        question: "優勝するとどうなりますか？",
        options: [
          "旅行券がもらえる",
          "賞金5万円と副賞がもらえる",
          "特別な認定書がもらえる",
          "次の大会に招待される",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-poster-2",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "poster",
    title: "夏祭り開催のお知らせ",
    sentences: [
      "✦ 第30回 中央町夏祭り ✦",
      "",
      "日時：8月15日（土）午後4時〜午後9時",
      "場所：中央公園",
      "入場料：無料",
      "",
      "内容：",
      "・盆踊り（午後5時〜）",
      "・花火（午後8時30分〜）",
      "・屋台（焼きそば、たこ焼き、かき氷など）",
      "",
      "雨天の場合は翌日（8月16日）に延期します。",
      "お問い合わせ：中央町役場 ☎ 03-1234-5678",
    ],
    questions: [
      {
        question: "夏祭りは何時に始まりますか？",
        options: ["午後2時", "午後3時", "午後4時", "午後5時"],
        answer: 2,
      },
      {
        question: "雨が降った場合はどうなりますか？",
        options: [
          "中止になる",
          "翌日に延期される",
          "屋内で行われる",
          "日程は変わらない",
        ],
        answer: 1,
      },
      {
        question: "花火は何時から始まりますか？",
        options: ["午後7時", "午後7時30分", "午後8時", "午後8時30分"],
        answer: 3,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── SCHEDULE (時刻表・スケジュール) ────────────
  {
    id: "jlpt-schedule-1",
    mode: "jlpt" as const,
    theme: "school" as const,
    level: 1 as const,
    jlptType: "schedule",
    title: "日本語教室 時間割",
    sentences: [
      "さくら日本語教室 10月スケジュール",
      "",
      "月曜日：初級クラス（午前9:00〜10:30）",
      "火曜日：中級クラス（午後6:00〜7:30）",
      "水曜日：会話クラス（午前10:00〜11:30）",
      "木曜日：JLPT対策クラス（午後7:00〜9:00）",
      "金曜日：文法クラス（午前9:00〜10:30）",
      "土曜日：集中コース（午前10:00〜午後3:00）",
      "",
      "※ 日曜日は休み",
      "※ 祝日はクラスなし",
      "※ 初回体験無料",
    ],
    questions: [
      {
        question: "JLPT対策クラスは何曜日ですか？",
        options: ["水曜日", "木曜日", "金曜日", "土曜日"],
        answer: 1,
      },
      {
        question: "土曜日のクラスは何時から何時までですか？",
        options: [
          "午前9時〜10時半",
          "午前10時〜11時半",
          "午前10時〜午後3時",
          "午後1時〜5時",
        ],
        answer: 2,
      },
      {
        question: "どのクラスが最初は無料で受けられますか？",
        options: [
          "初級クラス",
          "会話クラス",
          "すべてのクラス",
          "初回体験は全クラス無料",
        ],
        answer: 3,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-schedule-2",
    mode: "jlpt" as const,
    theme: "school" as const,
    level: 1 as const,
    jlptType: "schedule",
    title: "コミュニティセンター 施設利用案内",
    sentences: [
      "○○市コミュニティセンター 利用時間案内",
      "",
      "【図書室】",
      "月〜金：午前9時〜午後8時",
      "土・日：午前9時〜午後5時",
      "",
      "【スポーツジム】",
      "月〜土：午前6時〜午後10時",
      "日：午前8時〜午後6時",
      "",
      "【会議室（要予約）】",
      "毎日：午前9時〜午後9時",
      "1時間500円（市民は無料）",
      "",
      "休館日：毎月第1・第3月曜日（祝日の場合は翌火曜日）",
    ],
    questions: [
      {
        question: "日曜日に図書室は何時まで開いていますか？",
        options: ["午後4時", "午後5時", "午後6時", "午後8時"],
        answer: 1,
      },
      {
        question: "会議室を利用したい場合はどうしますか？",
        options: ["直接行けばいい", "予約が必要", "会員証が必要", "電話で聞く"],
        answer: 1,
      },
      {
        question: "市民が会議室を使う場合、料金はいくらですか？",
        options: ["500円", "1000円", "無料", "半額の250円"],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── ANNOUNCEMENT (お知らせ) ────────────
  {
    id: "jlpt-announcement-1",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "announcement",
    title: "図書館からのお知らせ",
    sentences: [
      "○○市立図書館 重要なお知らせ",
      "",
      "システムメンテナンスのため、以下の期間中、図書館のオンラインサービスをご利用いただけません。",
      "",
      "期間：11月5日（月）〜 11月7日（水）",
      "",
      "影響するサービス：",
      "・インターネット予約",
      "・更新手続き",
      "・データベース検索",
      "",
      "館内での通常サービス（貸出・返却）は通常通りご利用いただけます。",
      "ご不便をおかけして申し訳ございません。",
    ],
    questions: [
      {
        question: "このお知らせは何について書かれていますか？",
        options: [
          "図書館の閉館",
          "オンラインサービスの停止",
          "新しい本の入荷",
          "会員証の更新",
        ],
        answer: 1,
      },
      {
        question: "期間中もできることは何ですか？",
        options: [
          "インターネット予約",
          "データベース検索",
          "本の貸出と返却",
          "更新手続き",
        ],
        answer: 2,
      },
      {
        question: "サービスが使えなくなるのは何日間ですか？",
        options: ["1日間", "2日間", "3日間", "4日間"],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-announcement-2",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "announcement",
    title: "アパートからのお知らせ",
    sentences: [
      "入居者各位",
      "",
      "この度、エレベーターの定期点検を行います。",
      "点検中はエレベーターをご利用いただけません。",
      "",
      "点検日時：12月3日（土）午前10時〜午後3時",
      "対象：A棟・B棟エレベーター",
      "",
      "点検中は階段をご利用ください。",
      "ご不便をおかけして大変申し訳ございません。",
      "",
      "管理事務所",
    ],
    questions: [
      {
        question: "エレベーターの点検はいつですか？",
        options: [
          "12月3日午前10時〜午後1時",
          "12月3日午前10時〜午後3時",
          "12月4日午前10時〜午後3時",
          "12月3日午後1時〜午後5時",
        ],
        answer: 1,
      },
      {
        question: "点検中、住民はどうすればいいですか？",
        options: [
          "外出しない",
          "管理事務所に連絡する",
          "階段を使う",
          "他の棟のエレベーターを使う",
        ],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── EMAIL (メール) ────────────
  {
    id: "jlpt-email-1",
    mode: "jlpt" as const,
    theme: "office" as const,
    level: 1 as const,
    jlptType: "email",
    title: "会議変更のメール",
    sentences: [
      "送信者：田中一郎 <tanaka@abc-corp.co.jp>",
      "宛先：山田花子 <yamada@abc-corp.co.jp>",
      "件名：来週の会議について",
      "",
      "山田さん",
      "",
      "お世話になっております。田中です。",
      "",
      "来週月曜日に予定していた会議ですが、",
      "急な出張のため、水曜日の午後2時に変更させていただきたいと思います。",
      "",
      "ご都合はいかがでしょうか？",
      "もし問題がございましたら、ご連絡ください。",
      "",
      "よろしくお願いいたします。",
      "田中一郎",
    ],
    questions: [
      {
        question: "田中さんはなぜ会議を変更したいのですか？",
        options: [
          "体調が悪いから",
          "急な出張のため",
          "別の会議があるから",
          "資料が準備できないから",
        ],
        answer: 1,
      },
      {
        question: "新しい会議はいつですか？",
        options: [
          "月曜日の午後2時",
          "火曜日の午後2時",
          "水曜日の午後2時",
          "木曜日の午後2時",
        ],
        answer: 2,
      },
      {
        question: "山田さんに何をするよう求めていますか？",
        options: [
          "資料を準備すること",
          "都合が悪い場合は連絡すること",
          "すぐに返信すること",
          "他のメンバーに連絡すること",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-email-2",
    mode: "jlpt" as const,
    theme: "office" as const,
    level: 1 as const,
    jlptType: "email",
    title: "問い合わせメール",
    sentences: [
      "送信者：鈴木太郎 <suzuki.taro@email.jp>",
      "宛先：info@nihongo-school.jp",
      "件名：入学について",
      "",
      "ご担当者様",
      "",
      "初めてメールいたします。鈴木太郎と申します。",
      "",
      "御校の日本語コースに興味があります。",
      "来年の4月に入学したいと思っているのですが、",
      "現在、応募の締め切りと必要な書類について教えていただけますか？",
      "",
      "また、オンラインでのコースはありますか？",
      "",
      "お返事をお待ちしております。",
      "鈴木太郎",
    ],
    questions: [
      {
        question: "鈴木さんはいつ入学したいと思っていますか？",
        options: ["今すぐ", "来月", "来年の4月", "来年の9月"],
        answer: 2,
      },
      {
        question: "鈴木さんが知りたいことは何ですか？",
        options: [
          "学費と生活費",
          "締め切りと必要書類",
          "先生の経歴",
          "学校の場所",
        ],
        answer: 1,
      },
      {
        question: "鈴木さんはさらに何について聞いていますか？",
        options: [
          "寮について",
          "オンラインコースについて",
          "奨学金について",
          "ビザについて",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── BROCHURE (パンフレット) ────────────
  {
    id: "jlpt-brochure-1",
    mode: "jlpt" as const,
    theme: "school" as const,
    level: 1 as const,
    jlptType: "brochure",
    title: "語学学校パンフレット",
    sentences: [
      "★ みんなの日本語スクール ★",
      "",
      "私たちは1995年に設立された日本語専門学校です。",
      "現在、50カ国以上から700名以上の学生が在籍しています。",
      "",
      "【コース紹介】",
      "・超初級コース（ひらがな・カタカナから）",
      "・初級コース（N5対応）",
      "・中級コース（N4対応）",
      "・上級コース（N2・N1対応）",
      "",
      "【学費】",
      "入学金：50,000円（一回のみ）",
      "授業料：月額30,000円",
      "",
      "【特典】",
      "・無料の進路相談",
      "・図書室24時間利用可能",
      "・外国語サポートあり",
    ],
    questions: [
      {
        question: "この学校は何年に設立されましたか？",
        options: ["1985年", "1990年", "1995年", "2000年"],
        answer: 2,
      },
      {
        question: "N4対応のコースはどれですか？",
        options: ["超初級コース", "初級コース", "中級コース", "上級コース"],
        answer: 2,
      },
      {
        question: "無料でできることは何ですか？",
        options: [
          "授業の受講",
          "進路相談",
          "宿舎への入居",
          "テキストの貸し出し",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-brochure-2",
    mode: "jlpt" as const,
    theme: "school" as const,
    level: 1 as const,
    jlptType: "brochure",
    title: "温泉旅館パンフレット",
    sentences: [
      "◆ 山の湯 旅館 ◆",
      "",
      "自然に囲まれた静かな温泉旅館です。",
      "日本の伝統的なおもてなしをご体験ください。",
      "",
      "【宿泊プラン】",
      "・素泊まり：1泊 8,000円〜（1名）",
      "・1泊2食付き：1泊 15,000円〜（1名）",
      "・特別プラン（記念日・誕生日）：要相談",
      "",
      "【施設】",
      "・大浴場（男女別）",
      "・露天風呂",
      "・個室食事処",
      "・お土産コーナー",
      "",
      "チェックイン：午後3時〜",
      "チェックアウト：午前10時まで",
      "ご予約は公式サイトまたはお電話で。",
    ],
    questions: [
      {
        question: "食事なしで1泊する場合、最低いくらですか？",
        options: ["6,000円", "8,000円", "12,000円", "15,000円"],
        answer: 1,
      },
      {
        question: "チェックアウトは何時までですか？",
        options: ["午前9時", "午前10時", "午前11時", "正午"],
        answer: 1,
      },
      {
        question: "記念日のプランはどうすればいいですか？",
        options: [
          "公式サイトで選ぶ",
          "直接旅館に行く",
          "相談が必要",
          "特別プランはない",
        ],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── EVENT INFO (イベント情報) ────────────
  {
    id: "jlpt-event_info-1",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "event_info",
    title: "文化交流イベント",
    sentences: [
      "国際文化交流フェスティバル",
      "",
      "日時：3月20日（土）午前10時〜午後6時",
      "場所：○○国際センター 1F・2F・屋外広場",
      "入場料：大人 500円 / 中学生以下 無料",
      "",
      "プログラム：",
      "10:00 開会式",
      "11:00 各国料理の出店（屋外広場）",
      "13:00 文化パフォーマンス（1Fホール）",
      "15:00 ワークショップ（2F各室）",
      "17:30 表彰式・閉会式",
      "",
      "ワークショップ参加は事前予約が必要です。",
      "お申し込みは3月10日までにウェブサイトから。",
    ],
    questions: [
      {
        question: "中学生はいくら払いますか？",
        options: ["500円", "250円", "100円", "無料"],
        answer: 3,
      },
      {
        question: "各国料理の出店はどこにありますか？",
        options: ["1Fホール", "2F各室", "屋外広場", "地下"],
        answer: 2,
      },
      {
        question: "ワークショップに参加するためにはどうしますか？",
        options: [
          "当日直接参加できる",
          "3月10日までに予約する",
          "会場で受付する",
          "入場料を払うだけでいい",
        ],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-event_info-2",
    mode: "jlpt" as const,
    theme: "daily_life" as const,
    level: 1 as const,
    jlptType: "event_info",
    title: "料理コンテスト",
    sentences: [
      "第5回 家庭料理コンテスト",
      "",
      "テーマ：「健康と季節の食材を使った料理」",
      "",
      "応募資格：",
      "・アマチュアの料理好き（プロ不可）",
      "・1人1品のみ応募可",
      "・グループ参加も可（最大3名）",
      "",
      "審査基準：",
      "・味（40点）",
      "・見た目（30点）",
      "・独創性（30点）",
      "",
      "賞品：",
      "優勝：旅行券10万円分",
      "2位：商品券3万円分",
      "3位：食材セット",
      "",
      "応募締め切り：9月15日",
    ],
    questions: [
      {
        question: "プロの料理人はこのコンテストに参加できますか？",
        options: [
          "はい、できます",
          "いいえ、できません",
          "グループなら参加できます",
          "審査員になれます",
        ],
        answer: 1,
      },
      {
        question: "一番点数が高い審査基準は何ですか？",
        options: ["見た目", "独創性", "味", "材料の種類"],
        answer: 2,
      },
      {
        question: "2位の賞品は何ですか？",
        options: ["旅行券10万円分", "商品券3万円分", "食材セット", "調理器具"],
        answer: 1,
      },
    ],
    targetVocabulary: [],
  },

  // ──────────── TABLE (表) ────────────
  {
    id: "jlpt-table-1",
    mode: "jlpt" as const,
    theme: "travel" as const,
    level: 1 as const,
    jlptType: "table",
    title: "バスの時刻表",
    sentences: [
      "○○市 路線バス 時刻表",
      "路線：中央駅 → 市立病院 → 大学前 → 空港",
      "",
      "中央駅 発  |  市立病院  |  大学前  |  空港 着",
      "----------------------------------------------------",
      " 7:00      |   7:15   |   7:30  |  8:00",
      " 8:30      |   8:45   |   9:00  |  9:30",
      "10:00      |  10:15   |  10:30  | 11:00",
      "12:00      |  12:15   |  12:30  | 13:00",
      "15:00      |  15:15   |  15:30  | 16:00",
      "18:00      |  18:15   |  18:30  | 19:00",
      "20:30      |  20:45   |  21:00  | 21:30",
      "",
      "※ 土・日・祝日は12:00発以降のみ運行",
      "※ 空港まで片道 550円",
    ],
    questions: [
      {
        question: "中央駅8:30発のバスは大学前に何時に着きますか？",
        options: ["8:45", "9:00", "9:15", "9:30"],
        answer: 1,
      },
      {
        question: "日曜日に7:00のバスに乗れますか？",
        options: [
          "はい、乗れます",
          "いいえ、乗れません",
          "予約すれば乗れます",
          "時刻表に書いていない",
        ],
        answer: 1,
      },
      {
        question: "中央駅から空港まで何円かかりますか？",
        options: ["350円", "450円", "550円", "650円"],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },
  {
    id: "jlpt-table-2",
    mode: "jlpt" as const,
    theme: "travel" as const,
    level: 1 as const,
    jlptType: "table",
    title: "習い事の料金表",
    sentences: [
      "ABC カルチャースクール 料金表（月額）",
      "",
      "クラス名       |  回数/月  |  料金",
      "-------------------------------------",
      "英会話（初級）   |   4回    | 8,000円",
      "英会話（中級）   |   4回    | 10,000円",
      "ピアノ         |   8回    | 15,000円",
      "習字           |   4回    | 6,000円",
      "ヨガ           |   12回   | 8,000円",
      "料理           |   2回    | 12,000円",
      "",
      "※ 入会金：10,000円（初回のみ）",
      "※ 2クラス以上受講で授業料10%割引",
      "※ 体験レッスン：1回1,000円",
    ],
    questions: [
      {
        question: "月に一番多く通えるクラスはどれですか？",
        options: ["ピアノ", "ヨガ", "英会話（中級）", "料理"],
        answer: 1,
      },
      {
        question:
          "英会話（初級）と習字の2クラスを受ける場合、割引後の合計はいくらですか？",
        options: ["12,600円", "14,000円", "12,000円", "13,500円"],
        answer: 0,
      },
      {
        question: "体験レッスンを受けるにはいくら払いますか？",
        options: ["無料", "500円", "1,000円", "2,000円"],
        answer: 2,
      },
    ],
    targetVocabulary: [],
  },
];
