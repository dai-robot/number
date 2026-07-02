# 秒で日本史

止めた秒が、そのまま西暦になるストップウォッチ型の日本史タイムスリップアプリです。

## 概要

1. `START` を押す
2. 好きな瞬間に `STOP` を押す
3. STOPした秒数を100倍して西暦年に変換する
4. その年の日本史イベント、近い重要イベント、または時代背景を表示する
5. 結果をSNS向けに共有する

## 歴史データ

本アプリでは、西暦0001年〜2026年までの年別日本史データを持っています。

各年のデータは以下の3種類です。

- exact: その年の具体的出来事
- near: その年に近い重要出来事
- era: その頃の時代背景

古代など、年単位の出来事が確認しにくい時代では、無理に出来事を作らず、時代背景として表示しています。

データは `src/data/history/` に分割しています。

- `types.ts`: 型定義
- `eraRanges.ts`: 時代区分と時代背景テンプレート
- `importantEvents.ts`: 主要な日本史イベント
- `generateJapanHistoryFull.ts`: 0001〜2026年の全年度データ生成
- `japanHistoryFull.ts`: アプリで使う最終配列

## 秒数と西暦年

STOPした秒数を100倍し、四捨五入して西暦年に変換します。

```ts
const year = Math.round(stoppedSeconds * 100);
const safeYear = Math.max(1, Math.min(2026, year));
```

例：

- 0.50秒 → 50年
- 2.34秒 → 234年
- 6.45秒 → 645年
- 18.68秒 → 1868年
- 20.26秒 → 2026年

## 進捗と図鑑

発見した年は `localStorage` に保存されます。

```txt
history-timeslip.v1.discoveredYears
history-timeslip.v1.playCount
history-timeslip.v1.lastResult
```

トップ画面では重要年と全年度の進捗を表示します。

```txt
重要年 3 / 250
全年度 12 / 2026
```

`importance >= 4` の年度を重要年として扱います。

## テスト

```bash
npm run validate-history
npm run build
```

`validate-history` では以下を確認します。

- 2026件のデータ件数
- 1〜2026年の連続性
- 必須項目の存在
- `exact` / `near` / `era` の条件
- 秒数から西暦年への変換
- coverage、importance、時代、カテゴリ別の集計

## 今後の拡張

- 重要イベントを500件以上に増やす
- アメリカ史版
- 世界史版
- 中国史版
- ヨーロッパ史版
- 英語版
- 歴史カード画像生成
- SNS自動投稿
