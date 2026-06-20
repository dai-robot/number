import { diffToEmoji, scoreFromDiff } from "@/lib/daily";
import type { Lang } from "@/lib/i18n";

interface ShareParams {
  lang: Lang;
  dayNumber: number;
  target: number;
  attempts: number[];
  streak: number;
}

/** ネタバレなしの絵文字シェアテキストを生成 */
export function buildShareText({ lang, dayNumber, target, attempts, streak }: ShareParams): string {
  const title = lang === "ja" ? "秒トリビア デイリー" : "Second Trivia Daily";
  const head = `${title} #${dayNumber}`;

  const bestDiff = attempts.length ? Math.min(...attempts) : 1;
  const { rank } = scoreFromDiff(bestDiff);

  const lines = attempts.map((d) => diffToEmoji(d)).join("\n");
  const rankLine = `${rank === "S" ? "\uD83C\uDFC6" : "\uD83C\uDFAF"} ${rank}`;
  const streakLine =
    streak > 0 ? `\uD83D\uDD25 ${streak}${lang === "ja" ? "日連続" : " day streak"}` : "";

  const url = typeof window !== "undefined" ? window.location.origin : "";

  return [head, rankLine, lines, streakLine, url].filter(Boolean).join("\n");
}

/** Web Share API → クリップボードの順でシェア。成功時 "shared" | "copied" を返す */
export async function shareResult(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    // ユーザーキャンセル等 → クリップボードにフォールバック
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
