import {
  CATEGORY_LABELS,
  COMMERCE_KIND_LABELS,
  type PoolItem,
} from "../types";

function itemLabel(item: PoolItem): string {
  return item.kind === "attraction" ? item.name : item.title;
}

export function AddStopModal({
  candidates,
  onPick,
  onClose,
}: {
  candidates: PoolItem[];
  onPick: (item: PoolItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-cream p-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">新增景點／商家</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-mute"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        {candidates.length === 0 && (
          <p className="text-sm text-ink-mute">目前沒有其他可加入的項目了。</p>
        )}
        <div className="flex flex-col gap-2">
          {candidates.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item)}
              className="flex items-center justify-between rounded-md border border-line bg-card p-3 text-left"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">
                  {itemLabel(item)}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-mute">
                  {item.kind === "attraction"
                    ? CATEGORY_LABELS[item.category]
                    : COMMERCE_KIND_LABELS[item.commerceKind]}
                  ・約 {item.stayMinutes || 15} 分鐘
                </div>
              </div>
              {item.kind === "commerce" && (
                <span className="ml-2 flex-none font-mono text-xs text-orange-deep">
                  NT${item.price}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
