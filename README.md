# ResoMap T0 Demo

**ResoMap 是旅途中會即時幫你調整的 AI 旅行助手。**

一個什麼都能做、但每個畫面都只叫你做一件事的旅遊 App。
純前端、假資料、可點擊的手機原型。沒有後端，沒有 API key，沒有登入。

線上版：https://tszhongyung0601-sketch.github.io/resomap-t0-demo/

---

## 產品原則

功能可以很多，**但使用者任何一個畫面都不能感覺功能很多。**

App 涵蓋探索、行程規劃、地圖、多人旅行、AI 協調、AI 動態重排、景點內容、
語音導覽、住宿、門票、機票、租車、接送、eSIM、旅平險、優惠券、在地商家、旅行工具。
首頁只顯示其中五個入口。其他全部靠 Progressive Disclosure 收在需要它們的地方。

第一層簡單，第二層完整，旅途中 AI 才變聰明。

---

## 怎麼跑

```bash
npm install
npm run dev      # http://localhost:5173/resomap-t0-demo/
npm run build    # tsc -b && vite build
```

視窗 520px 以上會顯示手機外框（393×852），以下全螢幕。
**簡報前確認喇叭有聲音** — 語音導覽會真的出聲。

---

## Demo 腳本

情境在「我的 → Demo 情境」手動觸發；正式版由時間、定位、天氣自動觸發。

**探索與規劃**
1. 探索 → 點「台南兩天」→ 搜尋結果 → 前往台南
2. 台南頁 → 推薦／景點／美食／故事／活動 → 點赤崁樓
3. 赤崁樓 → 試聽故事、門票（KKday）、附近景點的真實距離 → 加入行程
4. 探索 → 規劃行程 → 五個問題 → 邀請旅伴（單人可跳過）

**多人協調（東京）**
5. 行程 → 東京 5 天 4 夜 → 還沒準備門票？（晴空塔／迪士尼）
6. 看大家想去哪 → AI 幫大家找共識 → Day 3 分頭行動 → 採用

**旅途中（這是核心）**
7. Demo 情境 → **台南・行程延後**
   晚了 1 小時 20 分 → 照這樣走晚餐會延到 19:50
   → 幫我重新安排 → 取消府中街商圈、保留晚餐訂位、**新的抵達時間 18:47**
   → 套用 → 時間軸真的變成 18:47
8. Demo 情境 → **花蓮・下午下雨**
   七星潭 → 花蓮文創園區，**18:00 晚餐完全不動**
9. Demo 情境 → **抵達赤崁樓** → 語音導覽（逐句高亮，真的出聲）

**商業模式**
10. 優惠 → 任一張卡 → 前往平台 → 模擬完成一筆預訂
11. 我的 → 營運數據 → 曝光 → 點擊 → 前往平台 → 模擬預訂 → 模擬佣金

---

## Information Architecture

```
探索 Explore    情境感知首頁。沒旅程＝找靈感；快出發＝那趟旅程優先；
                旅行中＝只剩今天的事
地圖 Map        OSM、叢集、四個篩選、底部清單
行程 Trips      旅程列表 → 總覽 → 每日時間軸 → 路線地圖
優惠 Deals      為你推薦／門票／住宿／交通／在地優惠
我的 Profile    低頻工具全在這裡，加上營運數據與 Demo 情境
```

AI **不在** Bottom Navigation。一顆浮動按鈕，標籤跟著情境變：
探索「問 AI」／地圖「附近推薦」／規劃中「幫我排」／旅行中「調整行程」。
已經有明確 CTA 的畫面（共識、景點詳情、建立行程）不顯示它。

---

## 架構

```
src/
  App.tsx           整合層：route stack、情境 AI 按鈕、所有 overlay
  nav.ts            Route / Nav 契約 — 每個 screen 只認得這個
  types.ts          全部型別
  data/
    destinations.ts 12 個城市（台灣 8 ＋ 海外 4）＋ 7 個旅遊區域
    poi.tw-north.ts 台北／新北／台中
    poi.tw-south.ts 台南／高雄
    poi.tw-east.ts  宜蘭／花蓮／台東
    poi.overseas.ts 東京／大阪／京都／首爾
    stories.ts      8 篇語音導覽
    deals.ts        商業內容（門票／住宿／交通／eSIM／旅平險／在地）
    trips.ts        3 趟示範行程 ＋ 3 個旅途情境 ＋ 共識資料
    travellers.ts   旅伴
    services.ts     首頁 5 個入口 ＋ 更多服務 7 個
    affiliatePartners.ts
  lib/
    adapt.ts        旅途重排的唯一計算來源
    geo.ts          距離、叢集、bounds
    speech.ts       Web Speech API，一句一個 utterance
    track.ts        模擬 affiliate 追蹤（localStorage）
  components/
    AppShell.tsx    5 tab ＋ 情境浮動按鈕
    ui.tsx          Screen TopBar Section Button Card Thumb Chip Tabs
                    Segmented Avatar Sheet Empty Row Tag Note
    MapView.tsx     全 App 唯一的地圖
    DealCard.tsx    商業卡片 ＋ 模擬外部跳轉
    AdaptCard.tsx   旅途中的 Action Card
    Story.tsx       抵達提示 ＋ 語音播放器
  screens/          15 個畫面
```

79 個 POI，座標全部是真的（自動驗證每一個都落在自己的城市裡）。

---

## 設計上的硬規則

改動前請先想清楚：

- **卡片上的數字必須跟時間軸來自同一個計算。**
  `previewAdapt()` 同時產生「AI 承諾的時間」與「套用後的行程」，
  所以卡片不可能承諾一個時間軸做不到的時間。
- **已經排好的行程有它的餘裕，不能重算。**
  18:00 的晚餐是有人訂在 18:00，不是走路時間加總出來的。
  `adapt.ts` 用位移而不是重算。
- **距離要用座標算出來，不能寫死。**
  行程的每一段步行距離都是從真實座標推導的，地圖上量得出來。
- **`ticketed` 只給真的賣門票的地方。** 免費的廟、老街、夜市、公園不會出現門票 CTA。
- **商業內容一定標示。** 贊助標「贊助」，在地商家標「即將推出」，
  所有價格頁都有 Demo 示意說明。
- **不要宣稱不存在的合作關係。** 文案一律是「查看 Klook 優惠」「前往 Booking」，
  不是「官方合作」。
- **共識畫面不出現數學。** 沒有 %、沒有「計算 127 種方案」。
- **`button { color: inherit }` 一定要放在 `@layer base`。**
  沒有 layer 的 CSS 會贏過所有 Tailwind utility，`text-white` 會整個失效。
- **地圖一定要有自己的 stacking context。**
  Leaflet 的 pane 在 z-400～700，沒有隔離就會蓋掉上面的 UI。

---

## 已知範圍界線

- 全部假資料。POI 座標為真，價格為市場行情估值。
- **ResoMap 目前與 Klook、KKday、Booking.com、Agoda、Trip.com 皆無合作關係。**
  App 內所有平台名稱都只是聯盟連結的目的地。
- 營運數據來自這台裝置的模擬點擊，佣金以各平台公開參考分潤區間估算。
- 沒有帳號、沒有付款、不呼叫任何 LLM／OTA／訂房 API，不會真的跳轉外部網站。
- 語音是瀏覽器 TTS 即時合成；沒有繁中語音時自動降級字幕模式。
- 地圖圖磚即時取自 OpenStreetMap（© OpenStreetMap contributors），需要網路。
- 在地商家優惠是 Coming Later，不是現有合作。

---

## T0 / P1 / P2

**T0（已做）** 探索首頁・目的地・OSM 地圖・建立行程・行程時間軸・加入景點・
AI 動態重排・語音導覽・Affiliate 入口・優惠頁

**P1（已做）** 旅伴偏好・AI 共識・情境式 OTA 推薦・台灣目的地資料集

**P2（入口 ＋ Mock）** 機票・租車・機場接送・eSIM・旅平險・優惠券・
記帳分帳・離線行程・PDF・行李清單・在地商家

---

## 技術

React 19 · Vite 8 · TypeScript · Tailwind 4 · Leaflet（OSM raster tiles）· Web Speech API

地圖叢集是自己寫的 grid clustering。沒有額外套件。

## 部署

GitHub Pages，`gh-pages` branch。`vite.config.ts` 的 `base` 是 `/resomap-t0-demo/`。
