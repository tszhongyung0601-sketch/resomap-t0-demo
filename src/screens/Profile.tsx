import type { ReactNode } from "react";
import { useNav } from "../nav";
import { Avatar, Row, Screen, TopBar } from "../components/ui";
import { ME, TRAVELLERS } from "../data/travellers";

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
  /* The demo cast minus the person holding the phone. Counting yourself as your
     own travel companion is a small lie, and small lies are the ones that ship. */
  const companions = TRAVELLERS.filter((t) => t.id !== ME.id).length;

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
        {/* No「4 人」here: the two demo trips are solo (travellers: []), so a
            head count taken from the global cast contradicts the trip itself. */}
        <Row icon="🧾" label="記帳 / 分帳" />
        <Row icon="⬇️" label="離線行程" value="未下載" />
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
          onClick={() => nav.go({ k: "admin" })}
        />
        <Row icon="🎬" label="Demo 情境" onClick={() => nav.go({ k: "demo" })} />
      </RowGroup>

      <p className="px-5 pb-2 pt-8 text-center text-[11.5px] leading-relaxed text-ink-3">
        Demo 版本・所有資料皆為示意
        <br />
        ResoMap 與各平台、商家皆無合作關係
      </p>
      <div className="h-24" />
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
