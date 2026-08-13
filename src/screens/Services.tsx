import { useState } from "react";
import { DealCard } from "../components/DealCard";
import {
  Button,
  Chip,
  Empty,
  Note,
  Row,
  Screen,
  Sheet,
  Tag,
  TopBar,
} from "../components/ui";
import { AFFILIATE_DISCLOSURE } from "../data/affiliatePartners";
import { DEALS } from "../data/deals";
import { TW_DESTINATIONS, dest } from "../data/destinations";
import { HOME_SERVICES, MORE_SERVICES } from "../data/services";
import { useNav } from "../nav";
import type { Deal, ServiceId } from "../types";

/* Fixed, so the demo never shows a date picker that leads nowhere. Matches the
   August the scripted trips live in. */
const CHECK_IN = "8 月 12 日（三）";
const CHECK_OUT = "8 月 14 日（五）";

/** Everything the home row does not have space for. Entry points, not features. */
export function MoreServicesSheet({ onClose }: { onClose: () => void }) {
  const nav = useNav();
  return (
    <Sheet open onClose={onClose} title="更多服務">
      <div className="pb-2">
        {MORE_SERVICES.map((s) => (
          <Row
            key={s.id}
            icon={s.icon}
            label={s.label}
            value={s.note}
            onClick={() => {
              onClose();
              if (s.id === "tools") nav.tab("profile");
              else nav.go({ k: "service", id: s.id });
            }}
          />
        ))}
      </div>
    </Sheet>
  );
}

/**
 * Four questions and one button.
 *
 * ResoMap does not sell rooms and will not pretend to: the result of this form
 * is a short list of places to go and look, not an availability calendar with
 * invented rates behind it.
 */
export function StayFlow({ destId }: { destId?: string }) {
  const nav = useNav();
  const [city, setCity] = useState(
    destId && TW_DESTINATIONS.some((d) => d.id === destId)
      ? destId
      : TW_DESTINATIONS[0].id,
  );
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState(false);

  const here = dest(city);
  const stays = DEALS.filter((d) => d.category === "stay" && d.destId === city);

  if (searched) {
    return (
      <Screen>
        <TopBar title={`${here?.name ?? ""}住宿`} onBack={() => setSearched(false)} />

        <p className="num px-5 text-[13px] text-ink-3">
          {CHECK_IN} - {CHECK_OUT}・{guests} 人
        </p>

        {stays.length > 0 ? (
          <div className="px-5 pt-6">
            <h2 className="text-[17px] font-bold text-ink">前往平台查看最新價格</h2>
            <div className="mt-3 space-y-2.5">
              {stays.map((d) => (
                <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
              ))}
            </div>
          </div>
        ) : (
          <Empty icon="🛏️" text="這個城市的住宿還在整理中" />
        )}

        <Note>
          ResoMap 不處理訂房，空房與房價都在平台端。{AFFILIATE_DISCLOSURE}
        </Note>
        <div className="h-24" />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="找住宿" onBack={nav.back} />

      <div className="px-5 pt-2">
        <div className="text-[13px] font-semibold text-ink-3">目的地</div>
        <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
          {TW_DESTINATIONS.map((d) => (
            <Chip key={d.id} active={d.id === city} onClick={() => setCity(d.id)}>
              {d.name}
            </Chip>
          ))}
        </div>

        {/* The dates are hardcoded, so they are labelled as demo data rather
            than left looking like a picker that quietly refuses to open. */}
        <div className="mt-8 flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink-3">日期</span>
          <Tag kind="demo" />
        </div>
        <div className="mt-2 divide-y divide-line">
          <DateRow label="入住" value={CHECK_IN} />
          <DateRow label="退房" value={CHECK_OUT} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-[15px] text-ink">旅客人數</span>
          <div className="flex items-center gap-1">
            <StepButton
              label="−"
              disabled={guests <= 1}
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
            />
            <span className="num w-9 text-center text-[16px] font-semibold text-ink">
              {guests}
            </span>
            <StepButton
              label="+"
              disabled={guests >= 6}
              onClick={() => setGuests((g) => Math.min(6, g + 1))}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-9">
        <Button onClick={() => setSearched(true)}>查看住宿</Button>
      </div>
      <div className="h-24" />
    </Screen>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[15px] text-ink">{label}</span>
      <span className="num text-[15px] text-ink-2">{value}</span>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label === "+" ? "增加" : "減少"}
      className="grid size-11 place-items-center rounded-full bg-surface text-[17px] font-bold text-ink transition active:bg-surface-2 disabled:opacity-35"
    >
      {label}
    </button>
  );
}

function dealsForService(id: ServiceId): Deal[] {
  switch (id) {
    case "esim":
      return DEALS.filter((d) => d.category === "esim");
    case "insurance":
      return DEALS.filter((d) => d.category === "insurance");
    case "car":
    case "airport":
    case "transport":
      return DEALS.filter((d) => d.category === "transport");
    case "tickets":
      return DEALS.filter((d) => d.category === "ticket");
    /**
     * 機票 and 優惠券 fall through to nothing on purpose.
     *
     * There is no flight inventory in T0, and answering 機票 with high speed
     * rail and airport transfers is answering a question nobody asked. 優惠券
     * is worse: a paid placement is not the traveller's discount code, and
     * filing one under 我的折扣碼 is the kind of small lie that makes every
     * other number on the screen worth doubting.
     */
    default:
      return [];
  }
}

/** Why a service is empty, said in that service's own terms. */
const EMPTY_TEXT: Partial<Record<ServiceId, string>> = {
  flight: "機票還沒有可以看的選項",
  coupon: "目前沒有屬於你的折扣碼",
};

/**
 * One screen for six services. Each of them is, in T0, the same thing: a way
 * out to the platform that actually sells it. Six near-identical booking flows
 * would be six places to maintain a lie.
 */
export function ServiceFlow({ id }: { id: ServiceId }) {
  const nav = useNav();
  const service = [...HOME_SERVICES, ...MORE_SERVICES].find((s) => s.id === id);
  const list = dealsForService(id);

  return (
    <Screen>
      <TopBar title={service?.label ?? "服務"} onBack={nav.back} />

      <p className="px-5 pt-1 text-[13.5px] leading-relaxed text-ink-3">
        目前這裡只做入口：ResoMap 幫你找到選項，比價與下單在你選擇的平台上完成。
      </p>

      {list.length > 0 ? (
        <div className="mt-6 space-y-2.5 px-5">
          {list.map((d) => (
            <DealCard key={d.id} deal={d} onOpen={nav.openDeal} />
          ))}
        </div>
      ) : (
        <Empty icon="🧭" text={EMPTY_TEXT[id] ?? "這個服務還在準備中"} />
      )}

      <Note>{AFFILIATE_DISCLOSURE}</Note>
      <div className="h-24" />
    </Screen>
  );
}
