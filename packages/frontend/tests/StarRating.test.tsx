import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StarRating } from "../components/ui/StarRating";

describe("StarRating", () => {
  it("renders 5 star buttons", () => {
    render(<StarRating value={3} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("calls onChange with the clicked star's whole-number value", () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("3 star"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("disables every button and ignores clicks when readOnly", () => {
    const onChange = vi.fn();
    render(<StarRating value={4} onChange={onChange} readOnly />);
    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
    fireEvent.click(screen.getByLabelText("4 star"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
