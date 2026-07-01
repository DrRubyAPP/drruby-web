import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  // Clear the theme cookie between tests.
  document.cookie = "theme=; path=/; max-age=0";
});

describe("ThemeToggle", () => {
  it("renders a toggle button reflecting the SSR data-theme", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /switch to dark theme/i }),
    ).toBeInTheDocument();
  });

  it("flips document data-theme and writes the theme cookie on click", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    // Label updates to offer switching back to light.
    expect(
      screen.getByRole("button", { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });
});
