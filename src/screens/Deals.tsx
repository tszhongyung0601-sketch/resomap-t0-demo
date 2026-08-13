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
 *
 * Its default cap of eight is sized for a home-screen strip, and it counts the
 * padding it is about to hand over. 台南 has ten records of its own and 東京
 * nine, so on both demo cities the cap ran out inside the city's own rows and
 * 台灣 eSIM / 旅平險 never arrived — under a 不分城市都用得到 heading this
 * screen renders specifically to hold them. This is the screen the traveller
 * opened to see offers, and the category tabs below are already uncapped, so
 * the relevant list is shown whole.
 */
function recoDeals(destId: string | null): Deal[] {
  if (!destId) return relevantDeals(null);
  return relevantDeals(destId, DEALS.length).filter(
    (d) => !d.destId || d.destId === destId,
  );
}

interface Why {
  /** The line printed above the card. */
  text: string;
  /** Lower sorts higher. 0 = the traveller has already added this place. */
  rank: number;
}

/**
 * Why a card is in 適合你的旅程, derived from the live trip.
 *
 * Three honest sources, in order of how much they actually know: the place is
 * already on the itinerary, the city is the one being travelled to, the deal is
 * transport for a trip that exists. Anything else gets no line — "ResoMap 推薦"
 * is not a reason, it is the absence of one wearing the word.
 *
 * `rank` is that same order, made load-bearing. The line at the top of this
 * screen promises 已經加入的地點排最上面, and until the list was actually sorted
 * by it that was just a sentence: the cards came out in dataset order, so a deal
 * for a place already on the itinerary landed wherever `deals.ts` happened to
 * list it. A stated ordering rule the code does not follow is the same class of
 * defect as an invented number — it is checkable, and it was wrong.
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

  return (deal: Deal): Why | null => {
    if (deal.poiId && plannedPois.has(deal.poiId)) {
      const name = BY_POI[deal.poiId]?.name;
      if (name) return { text: `你已加入${name}`, rank: 0 };
    }
    if (deal.destId && tripDests.has(deal.destId)) {
      const city = dest(deal.destId)?.name;
      if (city) return { text: `適合你的${city}行程`, rank: 1 };
    }
    if (deal.category === "transport" && home) {
      const city = dest(home)?.name;
      if (city) return { text: `與你的${city}行程相關`, rank: 2 };
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

  /* App passes the focused trip's destination and nothing else, so a name here
     means a real trip to that city exists — the heading is allowed to say 你的.
     Without one it falls back to the tab's own words. Never 熱門優惠: nothing in
     this dataset measures how many people bought anything. */
  const city = destId ? dest(destId)?.name ?? null : null;

  /* Only 為你推薦 splits. On a category tab every card is there because the
     traveller asked for that category, and a reason line would be restating
     the tab they just tapped. */
  const scored =
    tab === "reco" ? list.map((d) => ({ d, why: reason(d) })) : [];
  /* `sort` is stable, so cards sharing a rank keep the city-first order
     `recoDeals` handed over — the two rules compose instead of fighting. The
     array is the one `filter` just produced, so nothing shared is mutated. */
  const forYou = scored
    .filter((s): s is { d: Deal; why: Why } => s.why !== null)
    .sort((a, b) => a.why.rank - b.why.rank);
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
        {/* The ordering rule, said once, in the traveller's words. A list that
            claims to be "為你推薦" and then never says on what basis is asking
            to be read as paid placement. Only the three things that genuinely
            move a card are named — city, added places, and the tail being cut. */}
        {tab === "reco" && (
          <p className="pb-4 text-[13px] leading-relaxed text-ink-3">
            {city
              ? "跟著你的行程排：你要去的城市在前，已經加入的地點排最上面，其他城市的優惠不會出現。"
              : "目前沒有行程可以參考，這裡先照分類排列。"}
          </p>
        )}

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
            <h2 className="pb-3 text-[17px] font-bold text-ink">
              {city ? `你的${city}行程可能用得到` : "為你推薦"}
            </h2>
            <div className="space-y-2.5">
              {forYou.map(({ d, why }) => (
                <ReasonedCard key={d.id} deal={d} why={why.text} onOpen={nav.openDeal} />
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
  /** Never empty — a card without a reason is rendered as a plain DealCard. */
  why: string;
  onOpen: (d: Deal) => void;
}) {
  return (
    <div>
      <p className="px-1 pb-1 text-[12px] text-ink-3">{why}</p>
      <DealCard deal={deal} onOpen={onOpen} />
    </div>
  );
}
