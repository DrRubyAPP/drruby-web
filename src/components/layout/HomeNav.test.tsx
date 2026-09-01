import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeNav from "@/components/layout/HomeNav";

// Mutable state shared with the hoisted mocks below, so each test can flip
// the env-derived flag and the session without re-importing modules.
const state = vi.hoisted(() => ({
  hideLogin: false,
  session: null as null | {
    user: { name: string; email: string; image: string | null; role?: string };
  },
}));

vi.mock("@/config/site", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/site")>();
  return {
    ...actual,
    // Getter keeps the flag live: HomeNav reads it at render time.
    get HIDE_HOME_LOGIN() {
      return state.hideLogin;
    },
  };
});

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn(() => state.session),
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: ComponentProps<"img"> & { priority?: boolean }) => <img {...props} />,
}));

vi.mock("@/components/auth/UserMenu", () => ({
  default: () => <div data-testid="user-menu" />,
}));

vi.mock("@/components/DownloadWaitlist", () => ({
  NavDownloadButton: () => <button type="button">Download</button>,
}));

// LocaleSwitcher pulls in next-intl's navigation (next/navigation), which
// cannot resolve under jsdom — stub it since the tests never assert on it.
vi.mock("@/components/i18n/LocaleSwitcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

async function renderNav(props: Parameters<typeof HomeNav>[0] = {}) {
  // Homepage usage: session-aware without the appControls toggles.
  render(await HomeNav({ authAware: true, ...props }));
}

beforeEach(() => {
  state.hideLogin = false;
  state.session = null;
});

describe("HomeNav", () => {
  describe("flag off (default)", () => {
    it("shows the Log in button when signed out", async () => {
      await renderNav();

      expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Download" }),
      ).toBeInTheDocument();
    });

    it("swaps Log in for the user avatar when signed in", async () => {
      state.session = {
        user: {
          name: "Ada",
          email: "ada@example.com",
          image: null,
          role: "user",
        },
      };
      await renderNav();

      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Log in" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("NEXT_PUBLIC_HIDE_HOME_LOGIN=true", () => {
    beforeEach(() => {
      state.hideLogin = true;
    });

    it("hides the Log in button when signed out, keeps Download", async () => {
      await renderNav();

      expect(
        screen.queryByRole("link", { name: "Log in" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Download" }),
      ).toBeInTheDocument();
    });

    it("hides the user avatar when signed in", async () => {
      state.session = {
        user: {
          name: "Ada",
          email: "ada@example.com",
          image: null,
          role: "user",
        },
      };
      await renderNav();

      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Log in" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Download" }),
      ).toBeInTheDocument();
    });

    it("also hides both entries on appControls pages", async () => {
      state.session = {
        user: {
          name: "Ada",
          email: "ada@example.com",
          image: null,
          role: "user",
        },
      };
      await renderNav({ authAware: false, appControls: true });

      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Log in" }),
      ).not.toBeInTheDocument();
    });
  });
});
