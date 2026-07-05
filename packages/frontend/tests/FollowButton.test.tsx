import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FollowButton } from "../components/social/FollowButton";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

describe("FollowButton", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ accessToken: "token123" } as any);
    vi.mocked(api.post).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.delete).mockReset().mockResolvedValue(undefined);
  });

  it("shows Follow, then Following after a successful follow", async () => {
    render(<FollowButton userId="u1" initialIsFollowing={false} />);
    expect(screen.getByText("Follow")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/users/u1/follow", undefined, "token123")
    );
    await waitFor(() => expect(screen.getByText("Following")).toBeInTheDocument());
  });

  it("shows Following, then Follow after a successful unfollow", async () => {
    render(<FollowButton userId="u1" initialIsFollowing />);
    expect(screen.getByText("Following")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/users/u1/follow", "token123"));
    await waitFor(() => expect(screen.getByText("Follow")).toBeInTheDocument());
  });

  it("does nothing when there is no access token", () => {
    vi.mocked(useAuth).mockReturnValue({ accessToken: null } as any);
    render(<FollowButton userId="u1" initialIsFollowing={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(api.post).not.toHaveBeenCalled();
  });
});
