export type AnalyticsEvent =
  | "home_view"
  | "start_tap"
  | "stop_tap"
  | "result_view"
  | "share_click"
  | "image_save_click"
  | "catalog_open";

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[track]", event, payload ?? {});
  }
}
