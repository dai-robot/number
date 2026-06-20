"use client";

import type { SecondStory } from "@/data/stories";
import { track } from "@/lib/analytics";

const PRODUCTION_URL = "https://number-flame.vercel.app/";

export function buildStoryShareText({
  stoppedSeconds,
  story,
  count,
  total,
}: {
  stoppedSeconds: number;
  story: SecondStory;
  count: number;
  total: number;
}) {
  return `${stoppedSeconds.toFixed(2)}秒で止まった。\n\n【${story.second}秒の物語】\n\n${story.story.join("\n")}\n\n${count} / ${total} 発見\n\n#秒の物語\n${PRODUCTION_URL}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  let line = "";
  let currentY = y;
  for (const char of Array.from(text)) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function saveStoryImage({
  stoppedSeconds,
  story,
  count,
  total,
}: {
  stoppedSeconds: number;
  story: SecondStory;
  count: number;
  total: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#16091d");
  gradient.addColorStop(0.5, "#050508");
  gradient.addColorStop(1, "#211206");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "rgba(251, 146, 60, 0.18)";
  ctx.beginPath();
  ctx.arc(900, 160, 360, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
  ctx.beginPath();
  ctx.arc(120, 1660, 460, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fb923c";
  ctx.font = "900 64px sans-serif";
  ctx.fillText("秒の物語", 540, 210);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 148px monospace";
  ctx.fillText(`${stoppedSeconds.toFixed(2)}秒`, 540, 440);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 116px sans-serif";
  ctx.fillText(`${story.second}秒の物語`, 540, 630);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "700 42px sans-serif";
  ctx.fillText(`${story.category} / ${story.tone}`, 540, 725);

  ctx.fillStyle = "#f4f4f5";
  ctx.font = "700 60px sans-serif";
  let y = 920;
  for (const line of story.story) {
    y = wrapText(ctx, line, 540, y, 860, 76);
    y += 12;
  }

  ctx.fillStyle = "#fbbf24";
  ctx.font = "700 42px sans-serif";
  wrapText(ctx, story.shareText, 540, 1540, 860, 56);

  ctx.fillStyle = "#71717a";
  ctx.font = "500 36px sans-serif";
  ctx.fillText(`${count} / ${total} 発見`, 540, 1710);

  ctx.fillStyle = "#52525b";
  ctx.font = "500 30px sans-serif";
  ctx.fillText("#秒の物語", 540, 1765);
  ctx.fillText(PRODUCTION_URL, 540, 1818);

  const link = document.createElement("a");
  link.download = `second-story-${story.second}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function StoryShareActions({
  stoppedSeconds,
  story,
  count,
  total,
}: {
  stoppedSeconds: number;
  story: SecondStory;
  count: number;
  total: number;
}) {
  const shareToX = async () => {
    const text = buildStoryShareText({ stoppedSeconds, story, count, total });
    track("share_click", { method: "x", storySecond: story.second });
    if (navigator.share) {
      try {
        await navigator.share({ text, url: PRODUCTION_URL });
        return;
      } catch {
        // fall through
      }
    }
    try {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore
      }
    }
  };

  const onSaveImage = () => {
    track("image_save_click", { storySecond: story.second });
    saveStoryImage({ stoppedSeconds, story, count, total });
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        onClick={shareToX}
        className="min-h-12 rounded-xl bg-black px-3 py-3 text-sm font-black text-white ring-1 ring-white/15 transition active:scale-95"
      >
        Xでシェア
      </button>
      <button
        onClick={onSaveImage}
        className="min-h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-3 text-sm font-black text-black transition active:scale-95"
      >
        画像保存
      </button>
    </div>
  );
}
