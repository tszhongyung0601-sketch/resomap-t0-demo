import type { ReactNode } from "react";
import { useNav } from "../nav";
import { Avatar, Row, Screen, TopBar } from "../components/ui";
import { ME } from "../data/travellers";
import { focusTrip } from "../lib/trip";

/**
 * The drawer of the app.
 *
 * Everything low-frequency lives here — the ledger, the documents, the
 * settings, the business demo — which is what lets the other four tabs each
 * stay a single task. Most rows are honest T0 placeholders: they are listed
 * because the shape of the product includes them, and they do nothing yet.
 *
 * A row carries a value only when that value is computed from data this screen
 * actually holds. The old 收藏 "12" and 行李清單 "0 / 18" were neither counted
 * nor countable, and an invented number on a row that does nothing is the
 * cheapest way to make every real number in the app look invented too.
 */
export function Profile() {
  const nav = useNav();
  /* Everybody named on one of the traveller's OWN trips, minus the person
     holding the phone. It used to count the global demo cast, which is a figure
     from the fixtures rather than from anything this account is doing — the same
     invented number the header comment warns about, one row further down.
     Counting yourself as your own travel companion is the other small lie, and
     small lies are the ones that ship. */
  const companions = new Set(
    nav.trips.flatMap((t) => t.travellers).filter((id) => id !== ME.id),
  ).size;

  /* The same trip the home card and the deals tab are showing. 記帳 / 分帳 is
     per-trip, so the row can only be live when there is one to open. */
  const trip = focusTrip(nav.trips);

  return (
    <Screen>
      <TopBar title="我的" large />

      <div className="flex items-center gap-4 px-5 pb-1 pt-1">
        <Avatar name={ME.name} color={ME.color} initial={ME.initial} size={64} />
        <div className="min-w-0">
          <div className="truncate text-[20px] font-bold text-ink">{ME.name}</div>
          <div className="mt-1 text-[13px] text-ink-3">Demo 帳號</div>
        </div>
      </div>

      <RowGroup title="這趟旅行">
        {/* Live, and it has to be: 旅費 ships, and a 即將推出 stamp on a screen
            the trip page opens two taps away is the drawer contradicting the
            product. Only the trip's own name goes in the value — a total here
            would be a second place for the money to be reported from, and the
            two would disagree the moment a bill is entered. */}
        <Row
          icon="🧾"
          label="記帳 / 分帳"
          value={trip?.title}
          onClick={trip ? () => nav.go({ k: "expenses", tripId: trip.id }) : undefined}
        />
        {/* No「未下載」: the row has no onClick, so Row already stamps it
            即將推出 — and "not downloaded" next to "coming soon" reports the
            state of a feature that does not exist to have a state. It is the
            same fabrication as the old 收藏 "12", just phrased as a status
            instead of a count. */}
        <Row icon="⬇️" label="離線行程" />
        <Row icon="📄" label="下載 PDF" />
        <Row icon="🛂" label="旅行文件" />
        <Row icon="🧳" label="行李清單" />
      </RowGroup>

      <RowGroup title="我的">
        <Row icon="🔖" label="收藏" />
        <Row icon="👥" label="旅伴" value={`${companions} 人`} />
        <Row icon="🔔" label="通知" />
        <Row icon="🎟️" label="優惠券" />
      </RowGroup>

      <RowGroup title="設定">
        <Row icon="🌐" label="語言" value="繁體中文" />
        <Row icon="👤" label="帳號" />
        <Row icon="⚙️" label="一般設定" />
      </RowGroup>

      <RowGroup title="其他">
        {/* 商家洽詢, not 商家合作 — ResoMap has no merchant agreements, and a
            menu row is not the place to imply one. */}
        <Row icon="🏪" label="商家洽詢" />
        {/* Labelled Demo, kept last, styled like every other row: this is the
            founder's slide, and a traveller who taps it should be able to tell
            from the name that it is not part of their trip. */}
        <Row
          icon="📊"
          label="Demo：商業模式"
          onClick={() => nav.go({ k: "business" })}
        />
        <Row icon="🎬" label="Demo 情境" onClick={() => nav.go({ k: "demo" })} />
      </RowGroup>

      <p className="px-5 pb-2 pt-8 text-center text-[11.5px] leading-relaxed text-ink-3">
        Demo 版本・所有資料皆為示意
        <br />
        ResoMap 與各平台、商家皆無合作關係
      </p>
      <div className="h-24 shrink-0" />
    </Screen>
  );
}

/* Named RowGroup, not Group — `Group` is already a screen module in this
   folder, and two different things called Group in one folder is a trap. */
function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-7">
      <div className="px-5 pb-1 text-[12.5px] font-semibold text-ink-3">{title}</div>
      {children}
    </div>
  );
}
