"use client";

import type { TriviaResult } from "@/types/trivia";

function getShareTrivia(result: TriviaResult) {
  return result.trivia ?? result.nearest;
}

function getShareLine(result: TriviaResult) {
  const trivia = getShareTrivia(result);
  const shortDescription = trivia.description.split("。")[0] || trivia.description;
  return `${trivia.rarity} ${result.stoppedAt.toFixed(2)}秒！\n\n${shortDescription}。\n`;
}

export function buildResultShareText({
  result,
  count,
  total,
}: {
  result: TriviaResult;
  count: number;
  total: number;
}) {
  return `${getShareLine(result)}\n現在 ${count}/${total} コンプリート\n\n#秒トリビア\n${window.location.origin}`;
}

async function saveShareImage({
  result,
  count,
  total,
}: {
  result: TriviaResult;
  count: number;
  total: number;
}) {
  const trivia = getShareTrivia(result);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#12071f");
  gradient.addColorStop(0.48, "#080812");
  gradient.addColorStop(1, "#2b1205");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "rgba(251, 191, 36, 0.16)";
  ctx.beginPath();
  ctx.arc(900, 180, 360, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
  ctx.beginPath();
  ctx.arc(80, 1680, 420, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 160px sans-serif";
  ctx.fillText(trivia.rarity, 540, 360);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 190px monospace";
  ctx.fillText(`${result.stoppedAt.toFixed(2)}秒`, 540, 610);

  ctx.fillStyle = "#e8e8ed";
  ctx.font = "800 72px sans-serif";
  wrapText(ctx, trivia.title, 540, 790, 880, 86);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 48px sans-serif";
  wrapText(ctx, trivia.description.split("。")[0], 540, 980, 860, 62);

  ctx.fillStyle = "#2dd4bf";
  ctx.font = "900 82px monospace";
  ctx.fillText(`${count} / ${total}`, 540, 1360);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 72px sans-serif";
  ctx.fillText("秒トリビア", 540, 1600);

  ctx.fillStyle = "#71717a";
  ctx.font = "500 34px sans-serif";
  ctx.fillText("#秒トリビア", 540, 1670);

  const link = document.createElement("a");
  link.download = `second-trivia-${result.stoppedAt.toFixed(2)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = Array.from(text);
  let line = "";
  let currentY = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = ch;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

export function ShareActions({
  result,
  count,
  total,
}: {
  result: TriviaResult;
  count: number;
  total: number;
}) {
  const shareToX = () => {
    const text = buildResultShareText({ result, count, total });
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        onClick={shareToX}
        className="rounded-xl bg-black py-3 text-sm font-black text-white ring-1 ring-white/15 transition active:scale-95"
      >
        Xでシェア
      </button>
      <button
        onClick={() => saveShareImage({ result, count, total })}
        className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-black text-black transition active:scale-95"
      >
        画像保存
      </button>
    </div>
  );
}
