import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get: () => null }),
}));

// Passthrough translator: returns the key so assertions can target stable strings.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const sendVerificationOtp = vi.fn();
const signInEmailOtp = vi.fn();
const signInSocial = vi.fn();
vi.mock("@/lib/auth/client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: (...args: unknown[]) => sendVerificationOtp(...args),
    },
    signIn: {
      emailOtp: (...args: unknown[]) => signInEmailOtp(...args),
      social: (...args: unknown[]) => signInSocial(...args),
    },
  },
}));

import AuthForm from "@/components/forms/AuthForm";

function typeInto(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("AuthForm", () => {
  beforeEach(() => {
    push.mockReset();
    sendVerificationOtp.mockReset();
    signInEmailOtp.mockReset();
    signInSocial.mockReset();
  });

  it("renders the email step by default", () => {
    render(<AuthForm />);
    expect(screen.getByLabelText("emailLabel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "sendCode" }),
    ).toBeInTheDocument();
  });

  it("advances to the code step after sending the code", async () => {
    sendVerificationOtp.mockResolvedValue({ data: {}, error: null });
    render(<AuthForm />);

    typeInto("emailLabel", "jane@example.com");
    fireEvent.click(screen.getByRole("button", { name: "sendCode" }));

    await waitFor(() => {
      expect(screen.getByLabelText("codeLabel")).toBeInTheDocument();
    });
    expect(sendVerificationOtp).toHaveBeenCalledWith({
      email: "jane@example.com",
      type: "sign-in",
    });
  });

  it("shows an error when the code is invalid", async () => {
    sendVerificationOtp.mockResolvedValue({ data: {}, error: null });
    signInEmailOtp.mockResolvedValue({ data: null, error: { message: "bad" } });
    render(<AuthForm />);

    typeInto("emailLabel", "jane@example.com");
    fireEvent.click(screen.getByRole("button", { name: "sendCode" }));
    await screen.findByLabelText("codeLabel");

    typeInto("codeLabel", "123456");
    fireEvent.click(screen.getByRole("button", { name: "verify" }));

    await waitFor(() => {
      expect(screen.getByText("errors.invalidCode")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("validates the email before calling the API", async () => {
    render(<AuthForm />);
    const input = screen.getByLabelText("emailLabel");
    fireEvent.change(input, { target: { value: "not-an-email" } });
    // Submit the form directly to bypass jsdom's native constraint validation
    // and exercise the Zod check in the handler.
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("errors.invalidEmail")).toBeInTheDocument();
    });
    expect(sendVerificationOtp).not.toHaveBeenCalled();
  });

  it("triggers Google OAuth on the Google button", () => {
    signInSocial.mockResolvedValue({ data: {}, error: null });
    render(<AuthForm />);

    fireEvent.click(screen.getByRole("button", { name: "google" }));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/portal",
    });
  });
});
