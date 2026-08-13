import { useMemo, useState } from "react";
import { DealCard } from "../components/DealCard";
import { Empty, Note, Screen, Tabs, TopBar } from "../components/ui";
import { AFFILIATE_DISCLOSURE, BY_POI, DEALS, dest, relevantDeals } from "../data";
import { useNav } from "../nav";
import type { Deal, Trip } from "../types";

type TabId = "reco" | "ticket" | "stay" | "transport" | "local";

const TABS: { id: TabId; label: string }[] = [
  { id: "reco", label: "為你推薦" },
  { id: "ticket", label: "門票" },
  { id: "stay", label: "住宿" },
  { id: "transport", label: "交通" },
  { id: "local", label: "在地優惠" },
];

/**
 * `relevantDeals` pads its tail with other cities once the traveller's own
 * destination runs out. On a city with two records that fills 為你推薦 with
 * Tokyo tickets under a line naming 宜蘭 — the exact thing this screen exists to
 * avoid — so once we know where the trip is, the tail is cut rather than shown.
 */
function recoDeals(destId: string | null): Deal[] {
  const list = relevantDeals(destId);
  return destId ? list.filter((d) => !d.destId || d.destId === destId) : list;
}

/**
 * Why a card is in 適合你的旅程, derived from the live trip.
 *
 * Three honest sources, in order of how much they actually know: the place is
 * already on the itinerary, the city is the one being travelled to, the deal is
 * transport for a trip that exists. Anything else gets no line — "ResoMap 推薦"
 * is not a reason, it is the absence of one wearing the word.
 */
function makeReason(trips: Trip[], focusDestId: string | null) {
  const plannedPois = new Set<string>();
  const tripDests = new Set<string>();
  for (const t of trips) {
    tripDests.add(t.destId);
    for (const d of t.days)
      for (const tr of d.tracks) for (const s of tr.stops) plannedPois.add(s.poiId);
  }
  const home = focusDestId ?? trips[0]?.destId ?? null;

  return (deal: Deal): string | null => {
    if (deal.poiId && plannedPois.has(deal.poiId)) {
      const name = BY_POI[deal.poiId]?.name;
      if (name) return `你已加入${name}`;
    }
    if (deal.destId && tripDests.has(deal.destId)) {
      const city = dest(deal.destId)?.name;
      if (city) return `適合你的${city}行程`;
    }
    if (deal.category === "transport" && home) {
      const city = dest(home)?.name;
      if (city) return `與你的${city}行程相關`;
    }
    return null;
  };
}

/**
 * The commercial tab, ordered by where the traveller is going.
 *
 * A coupon list sorted by category puts Tokyo tickets in front of somebody
 * standing in Tainan — which is the moment an offers page stops being useful
 * and starts being an ad break. 為你推薦 is the traveller's own destination
 * first; the category tabs exist for the rarer case of browsing on purpose.
 */
export function Deals({ destId }: { destId: string | null }) {
  const nav = useNav();
  const [tab, setTab] = useState<TabId>("reco");

  const list =
    tab === "reco" ? recoDeals(destId) : DEALS.filter((d) => d.category === tab);

  const reason = useMemo(() => makeReason(nav.trips, destId), [nav.trips, destId]);

  /* Only 為你推薦 splits. On a category tab every card is there because the
     traveller asked for that category, and a reason line would be restating
     the tab they just tapped. */
  const scored =
    tab === "reco" ? list.map((d) => ({ d, why: reason(d) })) : [];
  const forYou = scored.filter((s) => s.why);
  const rest = scored.filter((s) => !s.why);
  const split = forYou.length > 0;

  return (
    <Screen>
      <TopBar
        title="優惠"
        large
        below={<Tabs items={TABS} value={tab} onChange={setTab} />}
      />

      <div className="px-5 pt-4">
        {tab === "local" && (
          <p className="pb-3 text-[13px] leading-relaxed text-ink-3">
            在地商家優惠還沒有開放。這裡先讓你看見方向，目前還不能使用。
          </p>
        )}

        {/* Every 在地優惠 record carries `comingLater`, so DealCard stamps the
            即將推出 label and disables the card without this screen asking. */}
        {list.length === 0 ? (
          <Empty icon="🏷" text="這個分類目前沒有可以看的優惠" />
        ) : split ? (
          <>
            <h2 className="pb-3 text-[17px] font-bold text-ink">適合你的旅程</h2>
            <div className="space-y-2.5">
              {forYou.map(({ d, why }) => (
                <ReasonedCard key={d.id} deal={d} why={why} onOpen={nav.openDeal} />
              ))}
            </div>
            {rest.length > 0 && (
              <>
                {/* These are the records with no destId at all — eSIM, 旅平險.
                    Saying so is more useful than another 推薦 heading. */}
                <h2 className="pb-3 pt-7 text-[14px] font-semibold text-ink-3">
                  不分城市都用得到
                </h2>
                <div className="space-y-2.5">
                  {rest.map(({ d }) => (
                    <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-2.5">
            {list.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
            ))}
          </div>
        )}
      </div>

      {/* One block, at the bottom, for the whole screen. Repeating this on every
          card would make the page look like a legal notice and get skipped. */}
      <Note>
        部分連結可能為聯盟行銷連結。若透過連結完成預訂，ResoMap
        可能取得分潤，不影響你的購買價格。
        <br />
        {AFFILIATE_DISCLOSURE}
      </Note>
      <div className="h-24" />
    </Screen>
  );
}

/* The reason belongs to the card underneath it, so it sits inside the same
   flex item — otherwise `space-y` reads it as a sibling of the card above. */
function ReasonedCard({
  deal,
  why,
  onOpen,
}: {
  deal: Deal;
  why: string | null;
  onOpen: (d: Deal) => void;
}) {
  return (
    <div>
      {why && <p className="px-1 pb-1 text-[12px] text-ink-3">{why}</p>}
      <DealCard deal={deal} onOpen={onOpen} />
    </div>
  );
}
