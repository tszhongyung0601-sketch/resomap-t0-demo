import { useEffect } from "react";
import { INTEREST_LABELS } from "../types";
import type { TravellerId } from "../types";
import { BY_TRAVELLER } from "../data/travellers";
import { AGREED, BY_TRIP, CONFLICT } from "../data/trips";
import { useNav } from "../nav";
import { track } from "../lib/track";
import { Avatar, Button, Empty, Screen, TopBar } from "../components/ui";

/**
 * Group coordination. Optional — a solo trip has nothing to coordinate, and
 * 旅伴 says so rather than borrowing the demo cast to fill the screen.
 *
 * The whole flow is built around one idea: a group arguing about Disneyland does
 * not want a score, it wants to know who wants what and what the way out is. So
 * there is no percentage, no match rating and no count of plans considered
 * anywhere below. Whatever the coordinator weighed up stays invisible; it only
 * has to be explainable, not displayed.
 */

interface GroupProps {
  tripId: string;
}

const names = (ids: TravellerId[]) => ids.map((i) => BY_TRAVELLER[i].name).join("、");

/** Overlapping avatars. `ring` colour has to match whatever sits behind them. */
function Faces({
  who,
  size = 22,
  ring = "ring-bg",
}: {
  who: TravellerId[];
  size?: number;
  ring?: string;
}) {
  return (
    <div className="flex -space-x-1.5">
      {who.map((w) => (
        <span key={w} className={`rounded-full ring-2 ${ring}`}>
          <Avatar {...BY_TRAVELLER[w]} size={size} />
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ travellers */

export function Travellers({ tripId }: GroupProps) {
  const nav = useNav();

  /**
   * The roster comes from the trip, never from the global cast list.
   *
   * Rendering all four demo travellers on a solo trip would invent three people
   * and then offer to find consensus among them — and 台南/花蓮 both ship with
   * `travellers: []`. A trip created at runtime is not in `BY_TRIP` at all, so
   * the lookup has to tolerate a miss rather than assume one.
   */
  const roster = (BY_TRIP[tripId]?.travellers ?? []).map((id) => BY_TRAVELLER[id]);

  return (
    <Screen>
      <TopBar title="旅伴" onBack={nav.back} />

      {roster.length === 0 ? (
        <Empty
          icon="👥"
          text="這趟旅行還沒有其他旅伴。有人加入之後，ResoMap 才會幫大家找共識。"
        />
      ) : (
        <>
          <div className="px-5 pt-2">
            {roster.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 border-b border-line py-4 last:border-0"
              >
                <Avatar {...t} size={40} />
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-ink">{t.name}</div>
                  <div className="mt-0.5 text-[13px] text-ink-3">
                    {t.likes.map((l) => INTEREST_LABELS[l]).join(" / ")}
                    {t.note && ` · ${t.note}`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto px-5 pb-24 pt-8">
            <Button onClick={() => nav.go({ k: "consensus", tripId })}>
              AI 幫大家找共識
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------- consensus */

export function Consensus({ tripId }: GroupProps) {
  const nav = useNav();

  useEffect(() => {
    track("consensus_view");
  }, []);

  const accept = () => {
    track("consensus_accept");
    nav.go({ k: "trip", id: tripId });
  };

  return (
    <Screen>
      <TopBar title="AI 建議" onBack={nav.back} />

      <div className="px-5 pt-2">
        <p className="text-[15px] leading-relaxed text-ink">這趟旅行大家最一致的是：</p>
        <div className="mt-3 space-y-2">
          {AGREED.map((a) => (
            <div key={a.label} className="flex items-center gap-2.5">
              <span className="text-[15px] text-ok">✓</span>
              <span className="text-[15px] font-semibold text-ink">{a.label}</span>
              <div className="ml-auto">
                <Faces who={a.who} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 px-5">
        {/* No count. `CONFLICT` is one object, so a literal "1 個" is a number
            nothing computes and nothing keeps true. */}
        <p className="text-[15px] leading-relaxed text-ink">還有一件事要一起決定：</p>

        <div className="mt-3 rounded-2xl bg-surface p-4">
          <div className="text-[17px] font-bold text-ink">{CONFLICT.topic}</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
              <Faces who={CONFLICT.wants} size={20} ring="ring-surface" />
              {names(CONFLICT.wants)} 想去
            </div>
            <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
              <Faces who={CONFLICT.against} size={20} ring="ring-surface" />
              {names(CONFLICT.against)} {CONFLICT.againstReason}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-5">
        {/* The wash is the AI highlight. An orange hairline on top of it is a
            third orange thing on a screen that already ends in an orange CTA. */}
        <div className="rounded-2xl bg-brand-wash p-4">
          <div className="text-[12px] font-bold tracking-wide text-brand">建議做法</div>
          <div className="mt-1.5 text-[17px] font-bold text-ink">
            Day {CONFLICT.suggestion.day} 分頭行動
          </div>

          <div className="mt-3 space-y-2.5">
            {CONFLICT.suggestion.groups.map((g) => (
              <div key={g.where} className="flex items-center gap-2.5 rounded-xl bg-bg p-3">
                <Faces who={g.who} size={24} />
                <span className="text-[14px] text-ink-3">→</span>
                <span className="text-[14.5px] font-semibold text-ink">{g.where}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 px-1">
              <span className="num text-[14px] font-bold text-ink">
                {CONFLICT.suggestion.meet.at}
              </span>
              <span className="text-[14px] text-ink-3">→</span>
              <span className="text-[14px] text-ink-2">{CONFLICT.suggestion.meet.where}</span>
            </div>
          </div>
        </div>
      </div>

      {/* pb-24 clears the tab bar; the decision must never sit under it. */}
      <div className="mt-auto space-y-2 px-5 pb-24 pt-8">
        <Button onClick={accept}>採用這個方案</Button>
        <Button variant="ghost" onClick={() => nav.go({ k: "alternatives", tripId })}>
          看看其他方案
        </Button>
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------- alternatives */

/**
 * The rejected options, with the cost of each one stated.
 *
 * They are deliberately not selectable: the split day is baked into the Day 3
 * itinerary, so a tap on 整趟不去迪士尼 would hand back the split anyway. Offering
 * a choice the app cannot honour is worse than offering none. What the screen
 * does owe the reader is a way out — otherwise 看看其他方案 is a wall you can only
 * reverse out of — so the recommendation stays reachable from here.
 */
export function Alternatives({ tripId }: GroupProps) {
  const nav = useNav();

  const accept = () => {
    track("consensus_accept");
    nav.go({ k: "trip", id: tripId });
  };

  return (
    <Screen>
      <TopBar title="其他方案" onBack={nav.back} />

      <div className="space-y-3 px-5 pt-2">
        {CONFLICT.alternatives.map((a) => (
          <div key={a.id} className="rounded-2xl bg-surface p-4">
            <div className="text-[15.5px] font-bold text-ink">{a.label}</div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{a.why}</p>
          </div>
        ))}
        {/* No "四個人", no "其他兩個方案" — both were literals that go stale the
            moment the group or the option list changes. */}
        <p className="px-1 pt-2 text-[13px] leading-relaxed text-ink-3">
          分頭行動是唯一讓每個人都拿到想要的東西的做法，其他方案都要有人放棄，所以
          ResoMap 把它排在第一個。
        </p>
      </div>

      <div className="mt-auto px-5 pb-24 pt-8">
        <Button onClick={accept}>還是用分頭行動</Button>
      </div>
    </Screen>
  );
}
