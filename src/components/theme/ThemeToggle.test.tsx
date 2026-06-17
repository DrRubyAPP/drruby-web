import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

describe("ThemeToggle", () => {
  it("renders a theme toggle button after mounting", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    // The button only appears once the component has mounted (hydration guard).
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /switch to (light|dark) theme/i }),
      ).toBeInTheDocument();
    });
  });
});
