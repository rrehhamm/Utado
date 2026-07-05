import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingDistributionChart } from "../components/stats/RatingDistributionChart";

describe("RatingDistributionChart", () => {
  it("renders a label for each rating bucket", () => {
    const distribution = [
      { rating: 1, count: 0 },
      { rating: 2, count: 1 },
      { rating: 3, count: 2 },
      { rating: 4, count: 5 },
      { rating: 5, count: 10 },
    ];
    render(<RatingDistributionChart distribution={distribution} />);
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(screen.getByText(`${rating}★`)).toBeInTheDocument();
    }
  });

  it("gives the highest-count bucket the tallest bar", () => {
    const distribution = [
      { rating: 1, count: 1 },
      { rating: 2, count: 1 },
      { rating: 3, count: 1 },
      { rating: 4, count: 1 },
      { rating: 5, count: 10 },
    ];
    const { container } = render(<RatingDistributionChart distribution={distribution} />);
    const bars = container.querySelectorAll(".bg-gold");
    expect(bars).toHaveLength(5);
    const heights = Array.from(bars).map((bar) => parseFloat((bar as HTMLElement).style.height));
    expect(heights[4]).toBeGreaterThan(heights[0]);
  });

  it("still renders a sliver for a zero-count bucket rather than nothing", () => {
    const distribution = [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 1 },
    ];
    const { container } = render(<RatingDistributionChart distribution={distribution} />);
    const bars = container.querySelectorAll(".bg-gold");
    expect(bars[0].getAttribute("style")).toContain("height");
  });
});
