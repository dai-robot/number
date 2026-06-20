import { getStoryBySecond, getStorySecond } from "@/data/stories";

export function mapSecondsToStory(stoppedSeconds: number) {
  const storySecond = getStorySecond(stoppedSeconds);
  return {
    storySecond,
    story: getStoryBySecond(storySecond),
  };
}
