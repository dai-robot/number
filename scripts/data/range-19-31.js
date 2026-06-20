/**
 * 19.0〜31.5秒台のスロット用ファクト（明示定義のみ。テンプレ量産禁止）
 */
const OVERRIDES = {
  19.0: { title: "ボルト200m世界記録", description: "2009年ウサイン・ボルト200m19.19秒。", rarity: "SSR", shortTitle: "200m記録" },
  19.2: { title: "ボルト200m世界記録", description: "2009年19.19秒。", rarity: "SSR", shortTitle: "200m記録" },
  20.0: { title: "男子200m10秒台", description: "男子200mが20秒を切るのは世界トップレベル。", rarity: "SR", shortTitle: "200m" },
  21.0: { title: "女子200m世界記録", description: "1988年フローレンス・グリフィス＝ジョイナー21.34秒。", rarity: "SSR", shortTitle: "女子200m" },
  21.3: { title: "女子200m世界記録", description: "グリフィス＝ジョイナー21.34秒。", rarity: "SSR", shortTitle: "女子200m" },
  22.0: { title: "2時間マラソン", description: "2023年キプチョゲがマラソン2:00:35で世界記録更新。", rarity: "SSR", shortTitle: "2時間マラソン" },
  23.0: { title: "女子マラソンWR", description: "2023年ティグスト・アセファ2:11:53。", rarity: "SSR", shortTitle: "女子マラソン" },
  24.0: { title: "ルービック4×4", description: "4×4キューブの世界記録は20秒台。", rarity: "R" },
  25.0: { title: "ルービック5×5", description: "5×5キューブの世界記録は30秒台。", rarity: "R" },
  26.2: { title: "マラソン26.2マイル", description: "マラソン42.195kmは約26.2マイル。", rarity: "SR", shortTitle: "マラソン" },
  27.0: { title: "F1ピットストップ", description: "2019年レッドブル26.17秒（4タイヤ交換）。", rarity: "SR", shortTitle: "F1ピット" },
  30.0: { title: "CM30秒", description: "テレビCMの定番30秒。", rarity: "R", shortTitle: "CM30秒" },
  31.5: { title: "男子50m自由形", description: "2022年パンパース50m自由形20.91秒。", rarity: "SR", shortTitle: "50m自由形" },
};

const SWIM_50M = [
  [20.9, "パンパース50m自由形", "2022年20.91秒（男子世界記録）。"],
  [21.7, "ドレッセル50m自由形", "2017年21.75秒。"],
  [23.7, "サッカー50m自由形女子", "2023年23.67秒。"],
  [24.5, "50m自由形女子", "2023年23.67秒。"],
  [28.3, "50mバタフライ", "男子50mバタフライ世界記録は22秒台。"],
];

function build() {
  const facts = [];

  for (let i = 190; i <= 315; i++) {
    const value = Math.round(i) / 10;
    const override = OVERRIDES[value];
    if (override) {
      facts.push({
        value,
        title: override.title,
        description: override.description,
        category: "sports",
        rarity: override.rarity || "R",
        sourceType: "sports",
        shortTitle: override.shortTitle,
      });
      continue;
    }

    const swim = SWIM_50M.find(([v]) => Math.abs(v - value) < 0.05);
    if (swim) {
      facts.push({
        value,
        title: swim[1],
        description: swim[2],
        category: "sports",
        rarity: "SR",
        sourceType: "sports",
        shortTitle: swim[1],
      });
    }
  }

  return facts;
}

module.exports = build();
