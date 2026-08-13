import { useState } from "react";
import type { ReactNode } from "react";
import { useNav } from "../nav";
import { Button, Empty, Note, Screen, Tag, TopBar } from "../components/ui";
import { clearEvents, ctr, funnel } from "../lib/track";
import { dest } from "../data/destinations";
import { partner } from "../data/affiliatePartners";
import { DEAL_CATEGORY_LABELS } from "../types";

/**
 * The business screen. Not in the tab bar — it is reached from 我的 >
 * Demo：商業模式, because it answers a question the boss has and the traveller
 * does not.
 *
 * Every number here comes from clicks made on this device during the demo, so
 * the screen leads with that and repeats it at the bottom. It is the one screen
 * where being mistaken for real data would actually matter, and the only one
 * allowed to print a click-through rate or a commission at all.
 */

/** The two ways the product can earn, as the pitch tells it. */
const MODELS: {
  tag: string;
  title: string;
  line: string;
  chain: string[];
  /** One quiet line, on the model that carries the thesis. */
  key?: string;
}[] = [
  {
    tag: "MODEL A",
    title: "首頁服務入口",
    line: "門票、住宿、交通、租車固定放在首頁，用流量換交易。誰打開 App 看到的都是同一組入口。",
    chain: ["首頁", "住宿", "Booking / Agoda", "Outbound", "分潤"],
  },
  {
    tag: "MODEL B",
    title: "行程情境變現",
    line: "ResoMap 知道你要去哪座城市、哪一天、會經過哪些景點，也就知道你接下來會需要什麼。入口出現在行程的那個節點上，而不是首頁。",
    chain: [
      "探索",
      "建立東京旅行",
      "加入迪士尼",
      "查看票券",
      "Klook / KKday",
      "Outbound",
      "分潤",
    ],
    key: "撐得起分潤的是這一條。",
  },
];

export function AdminDemo() {
  const nav = useNav();
  /* localStorage is outside React, so the funnel is read once on mount and
     re-read explicitly after a clear. A useMemo keyed on a counter would do the
     same thing while pretending the counter was an input. */
  const [f, setF] = useState(funnel);

  const hasData = f.impressions + f.clicks + f.outbound + f.bookings > 0;
  const share = (n: number) => (f.impressions ? Math.min(1, n / f.impressions) : 0);
  const nt = (n: number) => `NT$ ${n.toLocaleString()}`;

  /**
   * Five rows. Four of them are counts and can honestly be drawn as a share of
   * impressions; the fifth is money and has no share, so it gets the row and no
   * bar. A bar borrowed from the bookings step would be a drawn number nobody
   * measured, which on the one screen labelled Demo Data is exactly the thing
   * not to do.
   */
  const steps: { label: string; value: string; share: number | null }[] = [
    { label: "曝光", value: f.impressions.toLocaleString(), share: share(f.impressions) },
    { label: "點擊", value: f.clicks.toLocaleString(), share: share(f.clicks) },
    { label: "前往平台", value: f.outbound.toLocaleString(), share: share(f.outbound) },
    { label: "模擬預訂", value: f.bookings.toLocaleString(), share: share(f.bookings) },
    { label: "模擬佣金", value: nt(f.commissionTwd), share: null },
  ];

  return (
    <Screen>
      <TopBar title="營運數據" onBack={nav.back} />

      {/* Grey, not brand-wash: orange in this app means primary action, selected
          state or AI highlight. A disclaimer is none of those, and tinting it
          orange turns the brand colour into decoration. */}
      <div className="mx-5 mt-1 rounded-2xl bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink">
        <span className="font-bold">Demo Data</span>{" "}
        — 以下數字來自這台裝置的模擬點擊，不是真實營收。
      </div>

      {/* Body text, not a pull quote. It is the answer to "why would this earn
          anything", and it has to read as the product's own reasoning. */}
      <p className="px-5 pt-4 text-[14px] leading-relaxed text-ink-2">
        ResoMap 的聯盟分潤不是靠大量廣告曝光，而是在旅行需求發生時提供可完成交易的服務入口。
      </p>

      {!hasData ? (
        <Empty
          icon="📊"
          text="還沒有模擬數據。在優惠頁點幾張卡片再回來。"
          action="去看優惠"
          onAction={() => nav.tab("deals")}
        />
      ) : (
        <>
          <Panel title="漏斗">
            <div className="space-y-5">
              {steps.map((s) => (
                <div key={s.label} className="px-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14.5px] text-ink-2">{s.label}</span>
                    <span className="num text-[19px] font-bold text-ink">{s.value}</span>
                  </div>
                  {s.share !== null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${s.share * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Whole percent. One decimal place on a few dozen taps is precision
                the sample size cannot pay for. */}
            <p className="num px-5 pt-5 text-[13.5px] text-ink-2">
              點擊率 {Math.round(ctr(f) * 100)}%
            </p>
          </Panel>

          {/* Titled as a ranking, not as the whole set: `byDest` is sorted by
              clicks and cut at five, and the demo has seven cities carrying
              deals — so「點擊來自哪些目的地」would present a truncated list as if
              it were complete. 類別 below needs no such hedge: there are exactly
              six categories and slice(0, 6) can never drop one. */}
          {f.byDest.length > 0 && (
            <Panel title="點擊最多的目的地">
              {f.byDest.slice(0, 5).map((d) => (
                <StatRow
                  key={d.destId}
                  label={dest(d.destId)?.name ?? d.destId}
                  value={`${d.clicks} 次`}
                />
              ))}
            </Panel>
          )}

          {f.byCategory.length > 0 && (
            <Panel title="點擊來自哪些類別">
              {f.byCategory.slice(0, 6).map((c) => (
                <StatRow
                  key={c.category}
                  label={DEAL_CATEGORY_LABELS[c.category]}
                  value={`${c.clicks} 次`}
                />
              ))}
            </Panel>
          )}
        </>
      )}

      {/* Shown with or without events: it is the model, not a measurement. */}
      <Panel title="兩種變現路徑">
        <div className="space-y-3 px-5">
          {MODELS.map((m) => (
            <div key={m.tag} className="rounded-2xl bg-surface p-4">
              <div className="text-[11px] font-bold tracking-wide text-ink-3">
                {m.tag}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-ink">{m.title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{m.line}</p>
              {/* Joined rather than mapped: the chain has to wrap mid-sequence on
                  a 393px screen, and separate nodes fight the line breaks. */}
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-2">
                {m.chain.join(" › ")}
              </p>
              {m.key && (
                <p className="mt-2 text-[12px] text-ink-3">{m.key}</p>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {f.byPartner.length > 0 && (
        <Panel title="各平台表現">
          <div className="px-5">
            {/* 11px floor: below that the header stops being readable at arm's
                length. The numeric columns are w-12 rather than w-11 because
                「模擬預訂」is four CJK glyphs — 44px at this size, which wraps to
                two lines inside a 44px box and knocks the header off the
                baseline it shares with the figures. */}
            <div className="flex items-baseline gap-2 pb-2 text-[11px] text-ink-3">
              <span className="min-w-0 flex-1">平台</span>
              <span className="w-12 shrink-0 whitespace-nowrap text-right">點擊</span>
              <span className="w-12 shrink-0 whitespace-nowrap text-right">前往</span>
              <span className="w-12 shrink-0 whitespace-nowrap text-right">模擬預訂</span>
              <span className="w-20 shrink-0 whitespace-nowrap text-right">模擬佣金</span>
            </div>
            {f.byPartner.map((p) => (
              <div key={p.partner} className="flex items-baseline gap-2 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                  {partner(p.partner).name}
                </span>
                <Figure>{p.clicks}</Figure>
                <Figure>{p.outbound}</Figure>
                <Figure>{p.bookings}</Figure>
                <span className="num w-20 shrink-0 text-right text-[12.5px] font-semibold text-ink-2">
                  {nt(p.commissionTwd)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Offering to clear an empty store is a button that cannot do anything. */}
      {hasData && (
        <div className="px-5 pt-8">
          <Button
            variant="ghost"
            onClick={() => {
              clearEvents();
              setF(funnel());
            }}
          >
            清除模擬數據
          </Button>
        </div>
      )}

      <Note>
        模擬佣金以各平台公開的參考分潤區間估算（門票 5%、住宿 4%、交通 4%、eSIM
        8%、旅平險 10%、在地優惠 6%），只用來說明商業模式，不是任何一方談定的條件。
        ResoMap 目前與 Klook、KKday、Booking.com、Agoda、Trip.com 皆無合作關係。
      </Note>
      <div className="h-24" />
    </Screen>
  );
}

/**
 * A section head that carries the Demo 資料 mark.
 *
 * Every block on this screen is either a simulated count or an illustration of
 * one, and the banner at the top scrolls away long before the reader reaches
 * 各平台表現 — so the label repeats per section rather than once per screen.
 */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-2 px-5">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        <Tag kind="demo" />
      </div>
      {children}
    </section>
  );
}

/* w-12 to match the header above it — the figures and their labels have to
   share a right edge, or the table reads as four unrelated columns. */
function Figure({ children }: { children: ReactNode }) {
  return (
    <span className="num w-12 shrink-0 text-right text-[13.5px] font-semibold text-ink-2">
      {children}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <span className="truncate text-[14.5px] text-ink">{label}</span>
      <span className="num shrink-0 text-[14.5px] font-semibold text-ink-2">{value}</span>
    </div>
  );
}
