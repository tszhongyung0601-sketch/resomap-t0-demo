import { useState } from "react";
import { useNav } from "../nav";
import { Button, Empty, Note, Screen, Section, TopBar } from "../components/ui";
import { clearEvents, ctr, funnel } from "../lib/track";
import { dest } from "../data/destinations";
import { partner } from "../data/affiliatePartners";
import { DEAL_CATEGORY_LABELS } from "../types";

/**
 * The business screen. Not in the tab bar — it is reached from 我的 > 營運數據,
 * because it answers a question the boss has and the traveller does not.
 *
 * Every number here comes from clicks made on this device during the demo, so
 * the screen leads with that and repeats it at the bottom. It is the one screen
 * where being mistaken for real data would actually matter.
 */
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

      {!hasData ? (
        <Empty
          icon="📊"
          text="還沒有模擬數據。在優惠頁點幾張卡片再回來。"
          action="去看優惠"
          onAction={() => nav.tab("deals")}
        />
      ) : (
        <>
          <Section title="漏斗">
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
          </Section>

          {f.byDest.length > 0 && (
            <Section title="點擊來自哪些目的地">
              {f.byDest.slice(0, 5).map((d) => (
                <StatRow
                  key={d.destId}
                  label={dest(d.destId)?.name ?? d.destId}
                  value={`${d.clicks} 次`}
                />
              ))}
            </Section>
          )}

          {f.byCategory.length > 0 && (
            <Section title="點擊來自哪些類別">
              {f.byCategory.slice(0, 6).map((c) => (
                <StatRow
                  key={c.category}
                  label={DEAL_CATEGORY_LABELS[c.category]}
                  value={`${c.clicks} 次`}
                />
              ))}
            </Section>
          )}

          {f.byPartner.length > 0 && (
            <Section title="點擊去了哪些平台">
              {f.byPartner.map((p) => (
                <StatRow
                  key={p.partner}
                  label={partner(p.partner).name}
                  value={`${p.clicks} 次 · ${nt(p.commissionTwd)}`}
                />
              ))}
            </Section>
          )}
        </>
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <span className="truncate text-[14.5px] text-ink">{label}</span>
      <span className="num shrink-0 text-[14.5px] font-semibold text-ink-2">{value}</span>
    </div>
  );
}
