import { Note, Screen, TopBar } from "../components/ui";
import { LOCALES, useI18n, type Locale } from "../i18n";
import { useNav } from "../nav";

/**
 * Nine languages, switching immediately.
 *
 * Each row shows the language in its own script, because somebody looking for
 * ไทย is looking for ไทย — a list that reads 泰文 / Thai / Thailändisch depending
 * on where you already are is a list that only helps people who do not need it.
 * The English name sits underneath so the row is still identifiable to a reader
 * who cannot read the script but knows what they are hunting for.
 *
 * No 儲存 button. The choice takes effect on tap and persists on its own; a
 * confirm step here would only be a chance to get it wrong.
 */
export function Language() {
  const nav = useNav();
  const { locale, setLocale, t } = useI18n();

  return (
    <Screen>
      <TopBar title={t("語言")} onBack={nav.back} />

      <div className="mt-2">
        {LOCALES.map((l) => {
          const on = l.id === locale;
          return (
            <button
              key={l.id}
              onClick={() => setLocale(l.id as Locale)}
              aria-current={on ? "true" : undefined}
              className="flex min-h-[56px] w-full items-center gap-3 px-5 py-2.5 text-left transition active:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[15.5px] ${on ? "font-bold text-ink" : "text-ink"}`}>
                  {l.label}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-ink-3">{l.english}</div>
              </div>
              {/* A tick, not a filled pill: this is a list of nine, and nine
                  orange rows would be nine things shouting on one screen. */}
              {on && <span className="shrink-0 text-[17px] font-bold text-brand">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Said here as well as at the top of every translated screen. Somebody
          choosing a language is exactly the person who should know what they are
          about to get, before they get it. */}
      <Note>
        中文以外的語言為機器翻譯，尚未人工校對。景點名稱與介紹已翻譯；
        語音導覽的逐字稿目前只有中文。
      </Note>

      <div className="h-24 shrink-0" />
    </Screen>
  );
}
