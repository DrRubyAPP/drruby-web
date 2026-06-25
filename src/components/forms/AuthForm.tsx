"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";

type Step = "email" | "code";
type Status = "idle" | "loading";

const emailSchema = z.string().email();
const codeSchema = z.string().regex(/^\d{6}$/);

const inputClass =
  "p-3 border border-dr-border rounded-lg text-[15px] bg-dr-surface text-dr-fg outline-none focus:border-dr-red transition-colors";
const labelClass =
  "text-sm font-semibold tracking-[0.5px] uppercase text-[#555] dark:text-[#9a9a9a]";

export default function AuthForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/portal";

  const [step, setStep] = useState<Step>("email");
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function sendCode() {
    if (!emailSchema.safeParse(email).success) {
      setError(t("errors.invalidEmail"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (sendErr) {
        setError(t("errors.sendFailed"));
        return;
      }
      setStep("code");
      setCode("");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setStatus("idle");
    }
  }

  async function verifyCode() {
    if (!codeSchema.safeParse(code).success) {
      setError(t("errors.codeLength"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const { error: signInErr } = await authClient.signIn.emailOtp({
        email,
        otp: code,
      });
      if (signInErr) {
        setError(t("errors.invalidCode"));
        return;
      }
      router.push(redirectTo);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setStatus("idle");
    }
  }

  async function signInWithGoogle() {
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
    } catch {
      setError(t("errors.generic"));
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === "email") void sendCode();
    else void verifyCode();
  }

  const loading = status === "loading";

  return (
    <div className="bg-dr-off border border-dr-border rounded-[20px] p-9 shadow-[0_4px_40px_rgba(0,0,0,0.06)]">
      <h1 className="text-xl font-bold tracking-tight mb-1.5 text-dr-fg">
        {step === "email" ? t("title") : t("codeTitle")}
      </h1>
      <p className="text-sm text-dr-mid mb-6">
        {step === "email" ? t("subtitle") : t("codeSentTo", { email })}
      </p>

      <form onSubmit={onSubmit}>
        {step === "email" ? (
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="auth-email" className={labelClass}>
              {t("emailLabel")}
            </label>
            <input
              id="auth-email"
              className={inputClass}
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="auth-code" className={labelClass}>
              {t("codeLabel")}
            </label>
            <input
              id="auth-code"
              className={`${inputClass} tracking-[0.4em] text-center`}
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              disabled={loading}
            />
          </div>
        )}

        {error && <p className="text-dr-red text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-dr-red text-white border-none py-[15px] rounded-[10px] text-base font-bold cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {step === "email"
            ? loading
              ? t("sending")
              : t("sendCode")
            : loading
              ? t("verifying")
              : t("verify")}
        </button>
      </form>

      {step === "code" && (
        <div className="flex justify-between mt-3 text-sm">
          <button
            type="button"
            onClick={sendCode}
            disabled={loading}
            className="text-dr-red font-semibold hover:underline disabled:opacity-60"
          >
            {t("resend")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
            }}
            disabled={loading}
            className="text-dr-mid hover:underline disabled:opacity-60"
          >
            {t("changeEmail")}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 my-6">
        <span className="h-px flex-1 bg-dr-border" />
        <span className="text-xs uppercase tracking-[0.16em] text-dr-mid">
          {t("or")}
        </span>
        <span className="h-px flex-1 bg-dr-border" />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-2.5 border border-dr-border rounded-[10px] py-[13px] text-[15px] font-semibold text-dr-fg bg-dr-surface hover:border-dr-ink transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
          />
        </svg>
        {t("google")}
      </button>
    </div>
  );
}
