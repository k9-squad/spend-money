// The fortune in question. One-point-three trillion United States dollars.
const BUDGET = 1_300_000_000_000;

// Each item: id, emoji, price (USD), and bilingual name + a deadpan caption.
// Ordered roughly from "trivial snack" to "existential purchase".
const ITEMS = [
  {
    id: "bigmac", emoji: "🍔", price: 3,
    name: { en: "Big Mac", zh: "巨无霸汉堡" },
    desc: { en: "Where every great fortune ends up.", zh: "再多的钱，最终都流向了它。" }
  },
  {
    id: "tea", emoji: "🫖", price: 4,
    name: { en: "A Proper Cup of Tea", zh: "一杯正经的红茶" },
    desc: { en: "Milk in last. We won't discuss it further.", zh: "牛奶最后倒，这点没得商量。" }
  },
  {
    id: "coffee", emoji: "☕", price: 6,
    name: { en: "Artisan Flat White", zh: "手工馥芮白咖啡" },
    desc: { en: "Tastes faintly of someone else's wages.", zh: "隐约喝出别人月薪的味道。" }
  },
  {
    id: "cinema", emoji: "🎟️", price: 15,
    name: { en: "Cinema Ticket", zh: "一张电影票" },
    desc: { en: "Popcorn sold separately, naturally.", zh: "爆米花当然是另算钱的。" }
  },
  {
    id: "book", emoji: "📚", price: 20,
    name: { en: "A Hardback Book", zh: "一本精装书" },
    desc: { en: "To be displayed, rarely read.", zh: "用来摆着的，很少真读。" }
  },
  {
    id: "game", emoji: "🎮", price: 70,
    name: { en: "Video Game", zh: "一款电子游戏" },
    desc: { en: "Day-one patch is 90 gigabytes.", zh: "首日补丁有 90 个 G。" }
  },
  {
    id: "airpods", emoji: "🎧", price: 250,
    name: { en: "AirPods Pro", zh: "AirPods Pro 耳机" },
    desc: { en: "You will lose one within the fortnight.", zh: "两周内你必丢一只。" }
  },
  {
    id: "iphone", emoji: "📱", price: 1_200,
    name: { en: "The Latest iPhone", zh: "最新款 iPhone" },
    desc: { en: "Identical to last year's. Buy it anyway.", zh: "和去年的一模一样。照买不误。" }
  },
  {
    id: "bike", emoji: "🚲", price: 2_500,
    name: { en: "Carbon Road Bike", zh: "碳纤维公路自行车" },
    desc: { en: "Lighter than your excuses for not using it.", zh: "比你不骑它的借口还轻。" }
  },
  {
    id: "rolex", emoji: "⌚", price: 12_000,
    name: { en: "Rolex Watch", zh: "劳力士手表" },
    desc: { en: "Tells the time. Mostly tells everyone else.", zh: "能看时间，主要是给别人看的。" }
  },
  {
    id: "tesla", emoji: "🚗", price: 42_000,
    name: { en: "Tesla Model 3", zh: "特斯拉 Model 3" },
    desc: { en: "Supporting the local economy, you understand.", zh: "你懂的，支持一下本地经济。" }
  },
  {
    id: "salary", emoji: "💼", price: 65_000,
    name: { en: "A Year of Average Salary", zh: "普通人一年的工资" },
    desc: { en: "For you, a rounding error.", zh: "对你而言，只是个零头。" }
  },
  {
    id: "lambo", emoji: "🏎️", price: 250_000,
    name: { en: "Lamborghini", zh: "兰博基尼" },
    desc: { en: "Loud, low, and impossible to park.", zh: "又吵又矮，根本停不进车位。" }
  },
  {
    id: "house", emoji: "🏠", price: 350_000,
    name: { en: "A Family Home", zh: "一套普通住宅" },
    desc: { en: "Somebody's life savings. Pocket change for you.", zh: "别人一辈子的积蓄，你的零钱。" }
  },
  {
    id: "ferrari", emoji: "🚘", price: 500_000,
    name: { en: "Ferrari", zh: "法拉利" },
    desc: { en: "The waiting list is the real luxury.", zh: "排队等车才是真正的奢侈。" }
  },
  {
    id: "monalisa", emoji: "🖼️", price: 870_000_000,
    name: { en: "The Mona Lisa", zh: "《蒙娜丽莎》" },
    desc: { en: "France would rather you didn't. Do it.", zh: "法国不太情愿。买就完事了。" }
  },
  {
    id: "island", emoji: "🏝️", price: 5_000_000,
    name: { en: "A Private Island", zh: "一座私人岛屿" },
    desc: { en: "Comes with sand. Wi-Fi not included.", zh: "附赠沙子，不含 Wi-Fi。" }
  },
  {
    id: "f1car", emoji: "🏁", price: 15_000_000,
    name: { en: "Formula 1 Car", zh: "一辆 F1 赛车" },
    desc: { en: "Not road legal. Not even slightly.", zh: "不能上路，一点都不能。" }
  },
  {
    id: "yacht", emoji: "🛥️", price: 30_000_000,
    name: { en: "Superyacht", zh: "超级游艇" },
    desc: { en: "A hole in the water you pour money into.", zh: "海上一个专门用来倒钱的洞。" }
  },
  {
    id: "jet", emoji: "✈️", price: 75_000_000,
    name: { en: "Private Jet", zh: "私人飞机" },
    desc: { en: "For when first class feels a tad crowded.", zh: "头等舱都嫌挤的时候用。" }
  },
  {
    id: "footballer", emoji: "⚽", price: 120_000_000,
    name: { en: "A Star Footballer", zh: "一名球星" },
    desc: { en: "Transfer fee only. Wages are extra.", zh: "这只是转会费，工资另算。" }
  },
  {
    id: "blockbuster", emoji: "🎬", price: 250_000_000,
    name: { en: "Fund a Blockbuster Film", zh: "投拍一部商业大片" },
    desc: { en: "The sequel is already greenlit.", zh: "续集已经立项了。" }
  },
  {
    id: "boeing", emoji: "🛩️", price: 420_000_000,
    name: { en: "A Boeing 747", zh: "一架波音 747" },
    desc: { en: "Parking it is the hard part.", zh: "难的是找地方停。" }
  },
  {
    id: "skyscraper", emoji: "🏙️", price: 1_000_000_000,
    name: { en: "A Skyscraper", zh: "一栋摩天大楼" },
    desc: { en: "Put your name on top. Squint to read it.", zh: "把名字刻在楼顶，眯眼才看得见。" }
  },
  {
    id: "club", emoji: "🏟️", price: 4_000_000_000,
    name: { en: "A Football Club", zh: "一家足球俱乐部" },
    desc: { en: "The fans will hate you by Tuesday.", zh: "到周二球迷就会恨你了。" }
  },
  {
    id: "twitter", emoji: "🐦", price: 44_000_000_000,
    name: { en: "A Social Media Platform", zh: "一个社交媒体平台" },
    desc: { en: "He's done this before. It went brilliantly.", zh: "他干过一次，结果非常“精彩”。" }
  },
  {
    id: "mars", emoji: "🚀", price: 230_000_000_000,
    name: { en: "A Mission to Mars", zh: "一次火星任务" },
    desc: { en: "One-way ticket. Bring a coat.", zh: "单程票，记得带件外套。" }
  },
  {
    id: "country", emoji: "🗺️", price: 500_000_000_000,
    name: { en: "A Small Nation's GDP", zh: "一个小国的 GDP" },
    desc: { en: "Buy it. Rename it. Regret nothing.", zh: "买下，改名，绝不后悔。" }
  }
];
