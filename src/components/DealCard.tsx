import { useEffect, useState } from "react";
import { AFFILIATE_DISCLOSURE, partner } from "../data/affiliatePartners";
import { impression, track } from "../lib/track";
import { Sheet, Tag, Thumb } from "./ui";
import type { Deal } from "../types";

/**
 * A commercial card, and the honest version of one.
 *
 * The platform's name is on the card, because "查看優惠" that silently leaves
 * the app is worse than saying where you are going. What is deliberately NOT on
 * the card: any word implying ResoMap and the platform have an agreement. They
 * do not. "查看 Klook 優惠" is what an affiliate link is; "官方合作夥伴" is a
 * claim, and inventing one in a prototype is how a demo becomes a liability.
 */
export function DealCard({
  deal,
  onOpen,
  compact,
}: {
  deal: Deal;
  onOpen: (d: Deal) => void;
  compact?: boolean;
}) {
  const p = deal.partner ? partner(deal.partner) : null;

  useEffect(() => {
    if (deal.partner) impression(deal.id, deal.partner, deal.category);
  }, [deal.id, deal.partner, deal.category]);

  const price = `NT$ ${deal.priceTwd.toLocaleString()} 起${
    deal.unit ? ` / ${deal.unit}` : ""
  }`;

  return (
    <button
      onClick={() => !deal.comingLater && onOpen(deal)}
      disabled={deal.comingLater}
      className={`flex w-full items-center gap-3 rounded-2xl bg-surface text-left transition ${
        deal.comingLater ? "opacity-70" : "active:bg-surface-2"
      } ${compact ? "p-3" : "p-3.5"}`}
    >
      <Thumb emoji={deal.emoji} tint={deal.tint} size={compact ? 44 : 52} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-semibold leading-snug text-ink">
            {deal.title}
          </span>
          {deal.sponsored && <Tag kind="sponsored" />}
          {deal.comingLater && <Tag kind="later" />}
        </div>
        <div className="num mt-0.5 truncate text-[12.5px] text-ink-3">
          {deal.comingLater || !p ? "在地商家・尚未開放" : `${p.name} · ${price}`}
        </div>
      </div>
      {!deal.comingLater && (
        <span className="shrink-0 rounded-full bg-bg px-3.5 py-2 text-[12.5px] font-bold text-brand">
          查看
        </span>
      )}
    </button>
  );
}

/**
 * The outbound step, simulated.
 *
 * A real integration would open the platform in a browser with an affiliate
 * parameter. Here it shows exactly what would happen and stops, because a demo
 * that actually sends somebody to a checkout page is a demo that can take
 * somebody's money by accident.
 */
export function OutboundSheet({
  deal,
  onClose,
}: {
  deal: Deal | null;
  onClose: () => void;
}) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (deal) {
      setGone(false);
      track("affiliate_click", {
        dealId: deal.id,
        partner: deal.partner,
        category: deal.category,
        destId: deal.destId,
      });
    }
  }, [deal]);

  if (!deal || !deal.partner) return null;
  const p = partner(deal.partner);
  /* Dropping the unit here turns "NT$ 4,200 起 / 晚" into what reads as a total
     for the whole stay. */
  const price = `NT$ ${deal.priceTwd.toLocaleString()} 起${
    deal.unit ? ` / ${deal.unit}` : ""
  }`;

  return (
    <Sheet open onClose={onClose}>
      <div className="px-5 pb-2 pt-2">
        <div className="flex items-center gap-3">
          <Thumb emoji={deal.emoji} tint={deal.tint} size={52} />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold text-ink">{deal.title}</div>
            <div className="num text-[13px] text-ink-3">
              {p.name} · {price}
            </div>
          </div>
        </div>

        {!gone ? (
          <>
            <div className="mt-4 rounded-2xl bg-surface p-4">
              <div className="text-[13.5px] leading-relaxed text-ink-2">
                接下來會離開 ResoMap，前往 <b>{p.site}</b> 查看最新價格與可訂日期。
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  track("affiliate_outbound", {
                    dealId: deal.id,
                    partner: deal.partner,
                    category: deal.category,
                    destId: deal.destId,
                  });
                  setGone(true);
                }}
                className="h-13 w-full rounded-full bg-brand text-[15px] font-bold text-white active:bg-brand-press"
              >
                前往 {p.name}
              </button>
            </div>
          </>
        ) : (
          <div className="rm-in mt-4">
            <div className="rounded-2xl bg-surface p-5 text-center">
              <div className="text-[28px]">🔗</div>
              <div className="mt-2 text-[15px] font-bold text-ink">
                正式版會在這裡開啟 {p.name}
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
                Demo 不會真的跳轉。你可以模擬一筆成交，看看後台的數字怎麼跑。
              </p>
            </div>
            <button
              onClick={() => {
                track("mock_booking", {
                  dealId: deal.id,
                  partner: deal.partner,
                  category: deal.category,
                  destId: deal.destId,
                  valueTwd: deal.priceTwd,
                });
                onClose();
              }}
              className="mt-3 h-12 w-full rounded-full bg-surface text-[14.5px] font-bold text-ink active:bg-surface-2"
            >
              模擬完成一筆預訂
            </button>
          </div>
        )}

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-3">
          {AFFILIATE_DISCLOSURE}
        </p>
      </div>
    </Sheet>
  );
}
