import { useMemo, useState } from "react";
import { AFFILIATE_DISCLOSURE, partner } from "../data/affiliatePartners";
import {
  COUPONS,
  COUPON_DEMO_NOTE,
  COUPON_PARTNERS,
  FEATURED_COUPONS,
  type DemoCoupon,
} from "../data/coupons";
import { Empty, Note, Screen, Sheet, Tabs, Tag, TopBar } from "../components/ui";
import { useI18n } from "../i18n";
import { useNav } from "../nav";

/**
 * 優惠碼 — the coupon wall, built so nobody can mistake it for one that works.
 *
 * NOT WIRED. Nothing imports this screen: `Route` in nav.ts has no `coupons`
 * member and App.tsx renders no case for it, so in the shipping build this file
 * and data/coupons.ts are unreachable. Do not add the route without deciding
 * the product question first, because Services.tsx has already answered it the
 * other way: `dealsForService("coupon")` deliberately returns nothing and the
 * 優惠券 row lands on 「目前沒有屬於你的折扣碼」, on the stated grounds that a
 * platform promo is not the traveller's own discount code. This screen is
 * consistent with that only because it never calls these codes the reader's —
 * it counts them as 示意優惠碼 and nothing here says 我的. If it is ever wired
 * up, it must not be wired under 我的折扣碼.
 *
 * The layout is the one every coupon page in this market uses: a platform tab
 * strip, then a stack of cards with the code on the left and the discount torn
 * off down the right like a ticket stub. That familiarity is the point of the
 * screen; it is also exactly what makes it dangerous, because a viewer who
 * recognises the shape will assume the codes behave like the ones they have
 * used before.
 *
 * So the honesty is not a footnote here, it is load-bearing and it is repeated
 * at every step a person could stop at:
 *
 *   · the code itself reads DEMO-KLOOK-1000, which no checkout will accept and
 *     no reader will mistake for a real one;
 *   · every card prints 「Demo 示意碼，不可使用」 directly under the code, not
 *     at the bottom of the page where it would be scrolled past;
 *   · the card's action is 查看說明, not 立即領取. Both a clipboard write and
 *     the word 領取 are the app performing a success it cannot deliver — one
 *     hands over a string that fails at a checkout, the other says the code is
 *     now yours. The button opens a sheet that explains the code instead;
 *   · the footer says ResoMap has no agreement with any of these platforms,
 *     because a tab strip printing their names implies one.
 *
 * The first tab is 精選, not 熱門: `featured` in the data is a hand-picked flag,
 * and 熱門 would be claiming usage figures this app does not have. Titles name a
 * platform as a place to go, never as a partner — none of the project's banned
 * partnership words appear on this screen and none may be added to it.
 */

type TabId = string;

const FEATURED: TabId = "featured";

export function Coupons() {
  const nav = useNav();
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>(FEATURED);
  const [explaining, setExplaining] = useState<DemoCoupon | null>(null);

  /* Tabs come from COUPON_PARTNERS, which is itself filtered against the rows.
     A hardcoded strip of four names would keep offering Trip.com after the last
     Trip.com row was cut — a control whose only possible result is the empty
     state. */
  const tabs = useMemo(
    () => [
      { id: FEATURED, label: t("精選") },
      ...COUPON_PARTNERS.map<{ id: TabId; label: string }>((p) => ({
        id: p.id,
        label: p.name,
      })),
    ],
    [t],
  );

  const list =
    tab === FEATURED ? FEATURED_COUPONS : COUPONS.filter((c) => c.partner === tab);

  return (
    <Screen>
      <TopBar
        title={t("優惠碼")}
        onBack={nav.back}
        below={<Tabs items={tabs} value={tab} onChange={setTab} />}
      />

      <div className="px-5 pt-4">
        {/* One Demo tag for the whole list, at its head. Every discount, every
            expiry and every condition below is invented, and a tag per card
            would turn the disclosure into wallpaper by card three — the same
            rule 導覽庫 applies to its ratings. The per-card line under each code
            is the one that stays, because that one is about the code. */}
        <div className="flex items-center gap-2 pb-3">
          <span className="num text-[13px] font-semibold text-ink-2">
            {list.length} {t("張示意優惠碼")}
          </span>
          <span className="ml-auto shrink-0">
            <Tag kind="demo" />
          </span>
        </div>

        {/* A platform tab can never be empty — COUPON_PARTNERS is derived from
            the rows, so a tab only exists if something is behind it. 精選 can:
            it filters on a flag, and clearing every `featured` empties it. So
            the empty state has to answer the tab that can actually reach it,
            rather than saying 這個平台 on a tab that is not a platform. */}
        {list.length === 0 ? (
          <Empty
            icon="🎟"
            text={
              tab === FEATURED
                ? t("目前沒有精選的示意優惠碼")
                : t("這個平台目前沒有示意優惠碼")
            }
          />
        ) : (
          <div className="space-y-2.5">
            {list.map((c) => (
              <CouponCard key={c.id} coupon={c} onExplain={setExplaining} />
            ))}
          </div>
        )}
      </div>

      <Note>
        {t("這裡的優惠碼皆為 Demo 示意資料，無法在任何平台使用。")}
        <br />
        {AFFILIATE_DISCLOSURE}
      </Note>
      <div className="h-24 shrink-0" />

      {/* Keyed on the coupon so the sheet's own outbound state resets when a
          different card is tapped, rather than opening already spent. */}
      <CouponSheet
        key={explaining?.id ?? "none"}
        coupon={explaining}
        onClose={() => setExplaining(null)}
      />
    </Screen>
  );
}

/**
 * One card.
 *
 * The card is a `div`, not a button: 查看說明 lives inside it, and a button
 * inside a button is invalid markup that browsers resolve by silently dropping
 * one of them. Making the whole card tappable would also mean the only
 * explanation of what these codes are could be reached by accident.
 */
function CouponCard({
  coupon,
  onExplain,
}: {
  coupon: DemoCoupon;
  onExplain: (c: DemoCoupon) => void;
}) {
  const { t } = useI18n();
  const p = partner(coupon.partner);

  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-surface">
      <div className="min-w-0 flex-1 p-3.5">
        {/* The platform's own tint, read from PARTNERS — the same colour its
            cards carry everywhere else in the app. */}
        <span
          className="inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-ink-2"
          style={{ background: p.tint }}
        >
          {p.name}
        </span>

        <div className="mt-1.5 text-[14.5px] font-semibold leading-snug text-ink">
          {t(coupon.title)}
        </div>

        {/* The code and its warning are one block. Separating them is how a
            screenshot of the code ends up with no warning in it. */}
        <div className="mt-2 rounded-xl border border-dashed border-line bg-bg px-3 py-2">
          <div className="num text-[14px] font-bold tracking-wide text-ink">
            {coupon.code}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-ink-3">
            {t(COUPON_DEMO_NOTE)}
          </div>
        </div>

        <div className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
          {t(coupon.terms)}
          <br />
          {t("有效期限（示意）")} {coupon.expiry}
        </div>

        {/* 查看說明, not 立即領取. 領取 tells the reader the code is now theirs,
            which is the same lie a clipboard write tells, minus the clipboard.
            The button describes what tapping it does and nothing more.

            Not a filled orange button either. Seven of those down one page
            would make the screen a wall of calls to action and leave the app
            with no way to mark the one thing that matters — which here is the
            sheet's outbound step. `bg-bg` on a `bg-surface` card is the same
            treatment DealCard's 查看 uses. Pill is ~33px (py-2 on a 12.5px line
            box); the pseudo-element adds 6px top and bottom, so the tap target
            clears 44px without inflating the pill — the arithmetic Chip's own
            comment spells out. */}
        <button
          onClick={() => onExplain(coupon)}
          className="relative mt-2.5 inline-flex items-center rounded-full bg-bg px-4 py-2 text-[12.5px] font-bold text-brand transition after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-[''] active:bg-surface-2"
        >
          {t("查看說明")}
        </button>
      </div>

      <Stub coupon={coupon} />
    </div>
  );
}

/**
 * The torn-off right-hand strip.
 *
 * The dashed rule plus two `bg-bg` circles clipped by the card's own
 * `overflow-hidden` is the whole trick — no images, and it stays correct when
 * the card grows a line.
 */
function Stub({ coupon }: { coupon: DemoCoupon }) {
  const { t } = useI18n();
  const d = coupon.discount;

  return (
    <div className="relative flex w-[94px] shrink-0 flex-col items-center justify-center gap-1 border-l border-dashed border-line px-2 py-3 text-center">
      <span className="absolute -left-[7px] -top-[7px] size-3.5 rounded-full bg-bg" />
      <span className="absolute -bottom-[7px] -left-[7px] size-3.5 rounded-full bg-bg" />

      <span className="text-[11px] font-semibold text-ink-3">{t(d.kind)}</span>
      <span className="num flex items-baseline gap-0.5 leading-none">
        {d.prefix && (
          <span className="text-[11.5px] font-bold text-ink-2">{d.prefix}</span>
        )}
        <span className="text-[19px] font-black text-ink">{t(d.amount)}</span>
      </span>
    </div>
  );
}

/**
 * What 查看說明 actually does.
 *
 * A real coupon wall writes the code to the clipboard and says 已複製. Doing
 * that here would be the app simulating a success it cannot deliver, and the
 * person would find out at a checkout rather than on this screen. So the sheet
 * says what the code is, points at the platform's own site for the real thing,
 * and the outbound button stops one step short of a browser — the same place
 * DealCard's OutboundSheet stops, and for the same reason: a demo that sends
 * somebody to a live checkout is a demo that can spend their money.
 */
function CouponSheet({
  coupon,
  onClose,
}: {
  coupon: DemoCoupon | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [gone, setGone] = useState(false);

  if (!coupon) return null;
  const p = partner(coupon.partner);

  return (
    <Sheet open onClose={onClose} title={t("Demo 示意碼")}>
      <div className="px-5 pb-2 pt-1">
        <div className="rounded-2xl bg-surface p-4 text-center">
          <div className="num text-[17px] font-black tracking-wide text-ink">
            {coupon.code}
          </div>
          <div className="mt-1 text-[12px] font-semibold text-ink-3">
            {t(COUPON_DEMO_NOTE)}
          </div>
        </div>

        {/* The sentence this whole screen exists to be able to say out loud.
            Split around the platform name so it survives translation without a
            template string. The spaces are load-bearing typography, not stray
            JSX: 「請前往Klook官網」 sets a Latin word hard against two CJK runs,
            which is what the rest of the app avoids when it writes 前往 {p.name}
            and NT$ 4,200. */}
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
          {t("這是 Demo 示意碼。真實優惠請前往")} {p.name}{" "}
          {t("官網查看。")}
        </p>

        {!gone ? (
          <div className="mt-4">
            {/* The one filled orange control on this screen. */}
            <button
              onClick={() => setGone(true)}
              className="h-13 w-full rounded-full bg-brand text-[15px] font-bold text-white transition active:bg-brand-press"
            >
              {t("前往")} {p.name} {t("官網")}
            </button>
          </div>
        ) : (
          <div className="rm-in mt-4 rounded-2xl bg-surface p-5 text-center">
            <div className="text-[28px]">🔗</div>
            <div className="mt-2 text-[15px] font-bold text-ink">
              {t("正式版會在這裡開啟")} {p.site}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
              {t("Demo 不會真的跳轉，也不會帶著這組示意碼過去。")}
            </p>
          </div>
        )}

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-3">
          {AFFILIATE_DISCLOSURE}
        </p>
      </div>
    </Sheet>
  );
}
