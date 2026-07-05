import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LikeButton } from "../components/social/LikeButton";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";

vi.mock("../lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

describe("LikeButton", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" } as any,
      accessToken: "token123",
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(api.post).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.delete).mockReset().mockResolvedValue(undefined);
  });

  it("optimistically increments and calls the like endpoint", async () => {
    render(<LikeButton logId="log1" initialLiked={false} initialCount={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("3")).toBeInTheDocument();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/logs/log1/like", undefined, "token123")
    );
  });

  it("calls the unlike endpoint when already liked", async () => {
    render(<LikeButton logId="log1" initialLiked initialCount={5} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("4")).toBeInTheDocument();
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/logs/log1/like", "token123"));
  });

  it("reverts the optimistic update if the API call fails", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("network error"));
    render(<LikeButton logId="log1" initialLiked={false} initialCount={2} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("3")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("disables the button when there's no logged-in user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      accessToken: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(<LikeButton logId="log1" initialLiked={false} initialCount={0} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
