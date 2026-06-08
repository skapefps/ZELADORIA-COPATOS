import {
  analyticsViewOptions,
  getDefaultAnalyticsView,
  normalizeAnalyticsView,
} from "./analyticsView";

describe("analyticsView", () => {
  it("keeps only known visible analytics sections", () => {
    const visible = normalizeAnalyticsView(["summary", "ghost", "status"]);

    expect(visible).toEqual(["summary", "status"]);
  });

  it("falls back to every section when nothing valid is selected", () => {
    const visible = normalizeAnalyticsView(["ghost"]);

    expect(visible).toEqual(getDefaultAnalyticsView());
    expect(visible).toHaveLength(analyticsViewOptions.length);
  });
});
