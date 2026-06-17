"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

type SubmitStatus = "idle" | "loading" | "ok" | "err";

export default function HomeCaptureForm() {
  const t = useTranslations("captureForm");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    const form = e.currentTarget;
    const data = {
      email: (form.elements.namedItem("EMAIL") as HTMLInputElement).value,
      firstName: (form.elements.namedItem("FNAME") as HTMLInputElement).value,
      phone:
        (form.elements.namedItem("PHONE") as HTMLInputElement)?.value || "",
      formId: "home",
    };

    try {
      const res = await fetch("/api/mailchimp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && !result.error) {
        setStatus("ok");
        setMsg(result.message || t("successDefault"));
      } else {
        setStatus("err");
        setMsg(result.error || t("errorDefault"));
      }
    } catch {
      setStatus("err");
      setMsg(t("networkError"));
    }
  }

  if (status === "ok") {
    return (
      <div className="max-w-[560px] mx-auto text-center">
        <div className="p-5 bg-[rgba(208,2,27,0.1)] border border-[rgba(208,2,27,0.3)] rounded-[10px] text-dr-red-mid text-[15px] leading-relaxed">
          &#10003; {msg}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto text-center">
      <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red-mid mb-3.5">
        {t("eyebrow")}
      </div>
      <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-tight leading-[1.15] text-white mb-3">
        {t.rich("title", {
          br: () => <br />,
          em: (chunks) => <em className="italic text-dr-red-mid">{chunks}</em>,
        })}
      </h2>
      <p className="text-base text-[#aaa] mb-9 leading-relaxed">
        {t("subtitle")}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
            type="text"
            name="FNAME"
            placeholder={t("firstName")}
            required
            disabled={status === "loading"}
          />
          <input
            className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
            type="email"
            name="EMAIL"
            placeholder={t("email")}
            required
            disabled={status === "loading"}
          />
        </div>
        <input
          className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
          type="tel"
          name="PHONE"
          placeholder={t("phone")}
          disabled={status === "loading"}
        />
        {status === "err" && <p className="text-red-400 text-sm">{msg}</p>}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-4 bg-dr-red text-white border-none rounded-[10px] text-base font-semibold cursor-pointer hover:opacity-85 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? t("submitting") : t("submit")}
        </button>
      </form>
      <p className="text-[13px] text-[#555] mt-2">{t("footnote")}</p>
    </div>
  );
}
