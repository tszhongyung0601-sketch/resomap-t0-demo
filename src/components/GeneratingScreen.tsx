import { useEffect, useState } from "react";

const MESSAGES = [
  "正在分析你的興趣偏好...",
  "正在規劃九份最佳路線...",
  "正在加入在地合作推薦...",
  "行程準備好了！",
];

export function GeneratingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= MESSAGES.length - 1) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="mb-8 h-14 w-14 animate-spin rounded-full border-4 border-orange-tint border-t-orange" />
      <p className="font-mono text-sm text-ink-soft">{MESSAGES[step]}</p>
    </div>
  );
}
