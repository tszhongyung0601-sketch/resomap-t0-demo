# ResoMap T0 Demo

**ResoMap 是旅途中會即時幫你調整的 AI 旅行助手。**

純前端、假資料、可點擊的手機原型。沒有後端，沒有 API key，沒有登入。

線上版：https://tszhongyung0601-sketch.github.io/resomap-t0-demo/

---

## 這個 demo 想證明什麼

不是「又一個 AI 行程產生器」。產生行程是最容易被取代的一段。

真正難的、也是這個 demo 的兩個主軸：

1. **出發前** — 一群人意見不同時，AI 幫大家找出共識與衝突，並提出一個可執行的分頭方案。
2. **旅途中** — 睡過頭、下雨時，AI 主動提出「取消什麼、保留什麼、幾點回得來」，一鍵套用。

語音導覽維持 ResoMap 原本的介面（插畫、語言、創作者、播放數、喜歡、逐字稿），
只改成「抵達景點後才出現」，不佔用首頁。

---

## 怎麼跑

```bash
npm install
npm run dev      # http://localhost:5173/resomap-t0-demo/
npm run build    # tsc -b && vite build
npm run preview
```

視窗寬度 520px 以上會顯示手機外框（390×844），以下全螢幕。
**簡報前確認喇叭有聲音** — 語音導覽會真的出聲。

---

## Demo 腳本（照這個走）

情境在「更多 → Demo 情境」手動觸發；正式版由時間、定位、天氣自動觸發。

1. **探索** → 右下角 `AI 幫我找靈感`
2. 四個問題：東京 → 8/20-8/24 → 朋友 → 美食／文化／購物 → **建立旅程**
3. **邀請旅伴**（LINE／WhatsApp／複製連結）
4. 旅程首頁 → `看大家想去哪` → 四個人的偏好與限制
5. `AI 幫大家找共識` → 一致的三件事 ＋ **1 個需要協調（迪士尼）**
6. AI 建議 **Day 3 分頭行動** → `採用這個方案`
7. Day 3 的時間軸從中間分成兩條，18:30 新宿會合
8. 更多 → Demo 情境 → **開始旅行**（跳到 Day 2，首頁變成「旅行進行中」）
9. **睡過頭** — AI 卡片：晚了 1 小時 30 分，照這樣走晚餐會延到 20:00
   → `幫我重新安排` → 取消原宿、保留晚餐訂位、**新的抵達時間 18:40**
   → `套用新行程` → 時間軸真的變成 18:40
10. **下午下雨** — 上野公園 → 東京國立博物館，**18:30 晚餐訂位完全不動**
11. **抵達淺草寺** → 你到了 → `開始播放` → 語音導覽逐句高亮

---

## 架構

```
src/
  App.tsx              Tab ＋ 路由堆疊（流程很短，沒有 router library）
  types.ts             全部型別
  data/demo.ts         全部假資料，一個檔案
  lib/
    adapt.ts           旅途重排的唯一計算來源
    speech.ts          Web Speech API，一句一個 utterance
  components/
    AppShell.tsx       5 個 tab ＋ 一顆會隨情境改變的浮動 AI 按鈕
    ui.tsx             Screen / TopBar / Button / Card / Chip / Sheet …
    AdaptCard.tsx      旅途中的 Action Card（兩段式）
    Story.tsx          抵達提示 ＋ 語音播放器
  screens/
    Explore.tsx        首頁
    CreateTrip.tsx     四步驟建立旅程 ＋ 邀請
    TripHome.tsx       旅程首頁／旅伴／共識／其他方案
    DayPlan.tsx        每日行程 ＋ 景點詳情
    Spots.tsx          地圖（OSM ＋ 自製 grid clustering）
    DealsAndMore.tsx   優惠／更多／Demo 面板
    Ops.tsx            營運數據（收在「更多」裡，不出現在主要頁面）
```

---

## 設計上的硬規則

改動前請先想清楚這幾條：

- **卡片上的數字必須跟時間軸來自同一個計算。**
  `previewAdapt()` 同時產生「AI 承諾的時間」與「套用後的行程」，
  所以卡片不可能承諾一個時間軸做不到的時間。
- **已經排好的行程有它的餘裕，不能重算。**
  18:30 的晚餐是有人訂位訂在 18:30，不是走路時間加總出來的。
  `adapt.ts` 用位移而不是重算，下雨情境下晚餐才不會被擠到 16:09。
- **每個方案都要說出代價。** 取消了什麼、保留了什麼，寫在同一張卡上。
- **共識畫面不出現數學。** 沒有 %、沒有「計算 127 種方案」。
  一群人要的是「誰想去、誰不想去、那怎麼辦」。
- **語音用逐句合成。** 一次送整段是顯而易見但錯誤的做法：Chrome 會截斷長語音，
  `onboundary` 對中文不可靠，進度條會跟聲音漂移。
- **`button { color: inherit }` 一定要放在 `@layer base`。**
  沒有 layer 的 CSS 會贏過所有 Tailwind utility，`text-white` 會整個失效。

---

## 已知範圍界線

- 全部假資料。景點座標為真，價格為市場行情估值，
  品牌名（Klook／KKday／Agoda）與播放數為示意。
- 沒有帳號、沒有付款、不呼叫任何 LLM／OTA／訂房 API。
- 語音用瀏覽器 TTS 即時合成，不是預錄音檔；
  裝置沒有繁中語音時自動降級為字幕模式。
- 地圖圖磚即時取自 OpenStreetMap（© OpenStreetMap contributors），需要網路。

---

## 技術

React 19 · Vite 8 · TypeScript · Tailwind 4 · Leaflet（OSM raster tiles）· Web Speech API

地圖 clustering 是自己寫的 grid clustering，沒有多裝套件。

## 部署

GitHub Pages，`gh-pages` branch。`vite.config.ts` 的 `base` 是 `/resomap-t0-demo/`。
