import type { Trivia } from "@/types/trivia";
import rawTrivia from "@/data/trivia.json";
import { MAX_SECONDS, sortTriviaByValue } from "@/lib/findTrivia";

/** trivia.json を読み込み、利用範囲（0〜MAX_SECONDS）のみ返す */
export function loadTrivia(): Trivia[] {
  return sortTriviaByValue(
    (rawTrivia as Trivia[]).filter((t) => t.value >= 0 && t.value <= MAX_SECONDS)
  );
}
