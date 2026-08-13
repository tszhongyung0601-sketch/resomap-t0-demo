import { useState } from "react";
import { BY_ADAPT, DEALS } from "../data/demo";
import { DEAL_CATEGORY_LABELS, type DealCategory } from "../types";
import { Chip, Row, Screen, Thumb, TopBar } from "../components/ui";
import { dur } from "../components/AdaptCard";

const CATS: DealCategory[] = ["stay", "ticket", "transport", "car", "esim"];

export function Deals() {
  const [cat, setCat] = useState<DealCategory>("ticket");
  const list = DEALS.filter((d) => d.category === cat);

  return (
    <Screen>
      <TopBar title="優惠" large />
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 pt-1 no-scrollbar">
        {CATS.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {DEAL_CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      <div className="px-5 pt-4">
        {list.map((d) => (
          <div
            key={d.id}
            className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-3.5"
          >
            <Thumb emoji={d.emoji} tint={d.tint} size={52} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold leading-snug text-ink">
                {d.title}
              </div>
              <div className="num mt-0.5 text-[12.5px] text-ink-3">
                {d.provider} · NT$ {d.priceTwd.toLocaleString()} 起
              </div>
            </div>
            <button className="shrink-0 rounded-full bg-bg px-3.5 py-2 text-[12.5px] font-bold text-brand">
              查看
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <p className="py-10 text-center text-[13.5px] text-ink-3">
            這個分類還沒有優惠。
          </p>
        )}
      </div>
      <div className="h-24" />
    </Screen>
  );
}

/**
 * Everything that is not a daily-use surface. Keeping the ledger, offline pack,
 * PDF export and packing list here is what lets the four other tabs stay
 * one-task-per-screen.
 */
export function More({
  onDemo,
  onOps,
}: {
  onDemo: () => void;
  onOps: () => void;
}) {
  return (
    <Screen>
      <TopBar title="更多" large />

      <div className="px-5 pb-2 pt-1">
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <span className="grid size-11 place-items-center rounded-full bg-brand text-[16px] font-bold text-white">
            M
          </span>
          <div>
            <div className="text-[15px] font-semibold text-ink">Mickey</div>
            <div className="text-[12.5px] text-ink-3">1 趟旅程規劃中</div>
          </div>
        </div>
      </div>

      <Group title="這趟旅行">
        <Row icon="🧾" label="記帳 / 分帳" value="4 人" />
        <Row icon="⬇" label="離線行程" value="未下載" />
        <Row icon="📄" label="下載 PDF" />
        <Row icon="🛂" label="旅行文件" />
        <Row icon="🧳" label="行李清單" value="0 / 18" />
      </Group>

      <Group title="設定">
        <Row icon="🌐" label="語言" value="繁體中文" />
        <Row icon="🔔" label="通知" />
        <Row icon="👤" label="帳號" />
      </Group>

      <Group title="其他">
        <Row icon="🏪" label="商家合作" />
        <Row icon="⚙️" label="一般設定" />
        <Row icon="📊" label="營運數據" onClick={onOps} />
        <Row icon="🎬" label="Demo 情境" onClick={onDemo} />
      </Group>

      <div className="px-5 py-6 text-center text-[11.5px] text-ink-3">
        Demo 版本・資料與合作關係皆為示意
      </div>
      <div className="h-20" />
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="px-5 pb-1 text-[12.5px] font-semibold text-ink-3">{title}</div>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/** Presenter-only: forces the two in-trip scenarios and the arrival prompt. */
export function DemoPanel({
  onBack,
  onLate,
  onRain,
  onArrive,
  onStartTrip,
  onReset,
  phase,
}: {
  onBack: () => void;
  onLate: () => void;
  onRain: () => void;
  onArrive: () => void;
  onStartTrip: () => void;
  onReset: () => void;
  phase: string;
}) {
  return (
    <Screen>
      <TopBar title="Demo 情境" onBack={onBack} />
      <div className="px-5 pt-2">
        <p className="text-[13.5px] leading-relaxed text-ink-3">
          正式版由時間、定位與天氣自動觸發。這裡讓你在簡報時手動叫出來。
        </p>

        <div className="mt-5 space-y-2.5">
          <Btn
            label={phase === "ongoing" ? "旅行已開始（Day 2）" : "開始旅行（跳到 Day 2）"}
            sub="首頁會變成「旅行進行中」"
            onClick={onStartTrip}
          />
          <Btn
            label="🕘 睡過頭"
            sub={`Day ${BY_ADAPT.late.day}・晚了 ${dur(BY_ADAPT.late.delayMin ?? 0)}`}
            onClick={onLate}
          />
          <Btn label="🌧 下午下雨" sub="Day 4・上野公園改室內" onClick={onRain} />
          <Btn label="📍 抵達淺草寺" sub="跳出語音故事" onClick={onArrive} />
          <Btn label="⟲ 重置 Demo" sub="回到最初狀態" onClick={onReset} />
        </div>
      </div>
    </Screen>
  );
}

function Btn({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
    >
      <div className="text-[15px] font-semibold text-ink">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-ink-3">{sub}</div>
    </button>
  );
}
