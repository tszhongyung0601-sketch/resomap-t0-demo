import { useEffect, useState } from "react";
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
import { AFFILIATE_DISCLOSURE, PARTNERS } from "../data/affiliatePartners";
import { DEALS } from "../data/deals";
import { DESTINATIONS, dest } from "../data/destinations";
import {
  CAR_MODES,
  HOME_SERVICES,
  MORE_SERVICES,
  TRANSPORT_MODES,
} from "../data/services";
import { impression } from "../lib/track";
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
        {MORE_SERVICES.map((s) => {
          /* 機票比價 has nothing behind it and, in T0, never will —
             `dealsForService` returns nothing for it on purpose. A live chevron
             into a guaranteed empty screen is the pattern Row was rewritten to
             stop: tapping one teaches the traveller that the app ignores them.
             So it gets the 即將推出 mark and keeps its note, which now reads as
             a promise rather than a claim.

             優惠券 stays live. Its empty screen says 目前沒有屬於你的折扣碼,
             which is an answer to the question, not a missing feature. */
          const live =
            s.id === "tools" ||
            s.id === "coupon" ||
            dealsForService(s.id).length > 0;
          return (
            <Row
              key={s.id}
              icon={s.icon}
              label={s.label}
              value={s.note}
              onClick={
                live
                  ? () => {
                      onClose();
                      if (s.id === "tools") nav.go({ k: "profile" });
                      else nav.go({ k: "service", id: s.id });
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------- stay */

/** The platforms this demo would hand a stay search over to. */
const STAY_PARTNERS = PARTNERS.filter((p) => p.kinds.includes("stay"));

/**
 * The outbound sheet always prints a price, so a synthetic deal with
 * `priceTwd: 0` would read as "NT$ 0 起". ResoMap has no room inventory and
 * will not invent a rate for one, so the card carries the lowest indicative
 * nightly figure already in the demo data — this city's if there is one, the
 * demo-wide floor otherwise — and the screen says out loud that it is
 * indicative rather than a quote.
 *
 * `fromHere` is returned rather than swallowed, because the fallback is the
 * dishonest branch: it prints 台南's floor under "東京 住宿 NT$ 1,850 起 / 晚",
 * which reads as a figure someone looked up for Tokyo. A borrowed number is
 * fine as long as the screen admits it is borrowed, and it cannot admit it if
 * this function does not say.
 */
function indicativeNightly(destId: string): { twd: number; fromHere: boolean } {
  const stays = DEALS.filter((d) => d.category === "stay");
  const here = stays.filter((d) => d.destId === destId);
  const fromHere = here.length > 0;
  const pool = fromHere ? here : stays;
  return { twd: Math.min(...pool.map((d) => d.priceTwd)), fromHere };
}

/**
 * Three questions and one button, then a short list of places to go and look.
 *
 * ResoMap does not sell rooms and will not pretend to: the result of this form
 * is never an availability calendar with invented rates behind it. It is the
 * three platforms that do hold the inventory, named, with the search handed
 * over to them.
 */
export function StayFlow({ destId }: { destId?: string }) {
  const nav = useNav();
  /* Any city the app can route here, not only the Taiwanese ones.
     找住宿 is reached from a trip — Explore's 還沒安排住宿 row and the same row
     inside a trip both pass `trip.destId` — and the demo's flagship trip is
     東京. Validating against TW_DESTINATIONS silently rewrote an overseas
     request as 台北: the traveller asked about one city, got another, and the
     chip row had no way back to theirs. The demo even carries a 東京 stay
     figure that was unreachable because of it. */
  const [city, setCity] = useState(
    destId && dest(destId) ? destId : DESTINATIONS[0].id,
  );
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState(false);

  if (searched) {
    return (
      <StayResults
        city={city}
        guests={guests}
        onBack={() => setSearched(false)}
      />
    );
  }

  return (
    <Screen>
      <TopBar title="找住宿" onBack={nav.back} />

      <div className="px-5 pt-2">
        <div className="text-[13px] font-semibold text-ink-3">目的地</div>
        <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
          {DESTINATIONS.map((d) => (
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
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

/**
 * The handover. Its own component rather than a branch inside StayFlow,
 * because it needs an effect and a branch cannot have one — a `useEffect`
 * after `if (searched) return …` is a hook behind a condition.
 */
function StayResults({
  city,
  guests,
  onBack,
}: {
  city: string;
  guests: number;
  onBack: () => void;
}) {
  const nav = useNav();
  const destName = dest(city)?.name ?? "";
  const { twd, fromHere } = indicativeNightly(city);

  /**
   * One impression per platform per view, carrying the same id as the handover
   * Deal below so impression → click → outbound join up.
   *
   * Without it this was the only commercial surface in the app that emitted
   * clicks nothing had ever been seen for: DealCard and ProductDetail both
   * count a rendered offer, this counted none, and 營運數據 divided the two to
   * print a click-through rate. The clamp in `ctr` hid the result rather than
   * fixing it — which is exactly the failure track.ts was written to avoid.
   */
  useEffect(() => {
    for (const p of STAY_PARTNERS) {
      impression(`stay-${city}-${p.id}`, p.id, "stay");
    }
  }, [city]);

  return (
    <Screen>
      <TopBar title={`${destName}住宿`} onBack={onBack} />

      {/* The dates came from a constant, not a picker, so the mark travels with
          them onto this screen too — the form's label scrolled away two taps
          ago. */}
      <div className="flex items-center gap-1.5 px-5">
        <span className="num text-[13px] text-ink-3">
          {CHECK_IN} - {CHECK_OUT}・{guests} 人
        </span>
        <Tag kind="demo" />
      </div>

      <div className="px-5 pt-6">
        <h2 className="text-[17px] font-bold text-ink">前往平台查看最新價格</h2>
        <div className="mt-3 space-y-2.5">
          {STAY_PARTNERS.map((p) => {
            /* Built here rather than stored in deals.ts: this is a handover,
               not a listing, and it must not end up in any 優惠 feed. */
            const handover: Deal = {
              id: `stay-${city}-${p.id}`,
              category: "stay",
              title: `${destName} 住宿`,
              partner: p.id,
              priceTwd: twd,
              unit: "晚",
              destId: city,
              emoji: "🛏️",
              tint: p.tint,
            };
            return (
              <button
                key={p.id}
                onClick={() => nav.openDeal(handover)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left transition active:bg-surface-2"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-[16px] font-bold text-ink-2"
                  style={{ background: p.tint }}
                >
                  {p.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-ink">
                    {p.name}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                    查看{destName}的住宿選擇
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-bg px-3.5 py-2 text-[12.5px] font-bold text-brand">
                  前往
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Note>
        ResoMap 沒有房源，也不處理訂房：空房與房價都在平台端。
        {fromHere
          ? "示意價格，實際價格以平台為準。"
          : `${destName}在 Demo 裡還沒有住宿資料，示意價格取自其他城市，實際價格以平台為準。`}
        {AFFILIATE_DISCLOSURE}
      </Note>
      <div className="h-24 shrink-0" />
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

/* -------------------------------------------------- transport & car rental */

interface Mode {
  id: string;
  label: string;
  icon: string;
  note: string;
}

/**
 * Transport deals carry no sub-mode field in T0, so a mode is matched by
 * reading the title. Deliberately overlapping: 桃園機場接送 belongs under both
 * 機場交通 and 機場接送, and 成田特快 is airport rail, so both screens are
 * telling the truth about it.
 *
 * 機票 matches nothing on purpose. There is no flight inventory here, and
 * answering 機票 with high speed rail is answering a question nobody asked.
 */
const MODE_MATCH: Record<string, (title: string) => boolean> = {
  flight: () => false,
  rail: (t) => /高鐵|台鐵|捷運|周遊券|特快|JR/.test(t),
  airport: (t) => /機場|機捷|特快/.test(t),
  rental: (t) => t.includes("租車"),
  transfer: (t) => t.includes("接送"),
};

function transportDeals(modeId: string, destId?: string): Deal[] {
  const match = MODE_MATCH[modeId];
  if (!match) return [];
  return DEALS.filter(
    (d) =>
      d.category === "transport" &&
      (!destId || d.destId === destId) &&
      match(d.title),
  );
}

/**
 * One screen shape for 交通 and 租車・接送.
 *
 * Both are the same job — pick a way of moving, see what the platforms have —
 * and giving each mode its own sub-screen would be five screens deep for a
 * list that fits under the row you tapped.
 */
function ModeFlow({
  title,
  intro,
  modes,
  destId,
  icon,
}: {
  title: string;
  intro: string;
  modes: Mode[];
  destId?: string;
  icon: string;
}) {
  const nav = useNav();
  /* Open on something that has content, so the screen does not greet everyone
     with an empty state it could have predicted. */
  const [open, setOpen] = useState(
    () =>
      modes.find((m) => transportDeals(m.id, destId).length > 0)?.id ??
      modes[0].id,
  );

  const list = transportDeals(open, destId);

  return (
    <Screen>
      <TopBar title={title} onBack={nav.back} />

      <p className="px-5 pt-1 text-[13.5px] leading-relaxed text-ink-3">{intro}</p>

      <div className="mt-4">
        {modes.map((m) => (
          <div key={m.id}>
            <Row
              icon={m.icon}
              label={m.label}
              value={m.note}
              onClick={() => setOpen(m.id)}
            />
            {open === m.id && (
              <div className="px-5 pb-4 pt-1">
                {list.length > 0 ? (
                  <div className="space-y-2.5">
                    {list.map((d) => (
                      <DealCard key={d.id} deal={d} onOpen={nav.openDeal} compact />
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={icon}
                    text={
                      m.id === "flight"
                        ? "機票還沒有可以看的選項"
                        : `${m.label}的選項還在整理中`
                    }
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Note>示意價格，實際價格以平台為準。{AFFILIATE_DISCLOSURE}</Note>
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

export function TransportFlow({ destId }: { destId?: string }) {
  const here = destId ? dest(destId) : undefined;
  return (
    <ModeFlow
      title="交通"
      intro={`選一種移動方式，看${here ? `${here.name}` : "目的地"}有什麼選項。ResoMap 不出票，購票在平台完成。`}
      modes={TRANSPORT_MODES}
      destId={destId}
      icon="🚄"
    />
  );
}

export function CarRentalFlow({ destId }: { destId?: string }) {
  const here = destId ? dest(destId) : undefined;
  return (
    <ModeFlow
      title="租車・接送"
      intro={`${here ? `${here.name}的` : ""}用車選項。ResoMap 不處理租賃與派車，預訂在平台完成。`}
      modes={CAR_MODES}
      destId={destId}
      icon="🚗"
    />
  );
}

/* --------------------------------------------------------- other services */

function dealsForService(id: ServiceId): Deal[] {
  switch (id) {
    case "esim":
      return DEALS.filter((d) => d.category === "esim");
    case "insurance":
      return DEALS.filter((d) => d.category === "insurance");
    case "tickets":
      return DEALS.filter((d) => d.category === "ticket");
    case "transport":
    case "carrental":
      return DEALS.filter((d) => d.category === "transport");
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
 * One screen for the services behind 更多. Each of them is, in T0, the same
 * thing: a way out to the platform that actually sells it. Five near-identical
 * booking flows would be five places to maintain a lie.
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
      <div className="h-24 shrink-0" />
    </Screen>
  );
}
