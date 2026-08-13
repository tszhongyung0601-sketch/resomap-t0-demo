import { useState } from "react";
import { DealCard } from "../components/DealCard";
import { Empty, Note, Screen, Tabs, TopBar } from "../components/ui";
import { AFFILIATE_DISCLOSURE } from "../data/affiliatePartners";
import { DEALS, relevantDeals } from "../data/deals";
import { dest } from "../data/destinations";
import { useNav } from "../nav";
import type { Deal } from "../types";

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
  const here = destId ? dest(destId) : undefined;

  const list =
    tab === "reco" ? recoDeals(destId) : DEALS.filter((d) => d.category === tab);

  return (
    <Screen>
      <TopBar
        title="優惠"
        large
        below={<Tabs items={TABS} value={tab} onChange={setTab} />}
      />

      <div className="px-5 pt-4">
        {/* Not 因為你正在X: the trip in focus is usually still upcoming, and a
            demo that tells somebody where they are standing had better be
            right about it. */}
        {tab === "reco" && here && (
          <p className="pb-3 text-[13px] text-ink-3">為你的{here.name}行程</p>
        )}
        {tab === "local" && (
          <p className="pb-3 text-[13px] leading-relaxed text-ink-3">
            在地商家優惠還沒有開放。這裡先讓你看見方向，目前還不能使用。
          </p>
        )}

        {/* Every 在地優惠 record carries `comingLater`, so DealCard stamps the
            即將推出 label and disables the card without this screen asking. */}
        {list.length > 0 ? (
          <div className="space-y-2.5">
            {list.map((d) => (
              <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
            ))}
          </div>
        ) : (
          <Empty icon="🏷" text="這個分類目前沒有可以看的優惠" />
        )}
      </div>

      <Note>{AFFILIATE_DISCLOSURE}</Note>
      <div className="h-24" />
    </Screen>
  );
}
