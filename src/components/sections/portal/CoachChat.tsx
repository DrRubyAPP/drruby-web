"use client";

import { useRef, useState } from "react";
import {
  COACH_MESSAGES,
  COACH_QUICK_CHIPS,
  type CoachMessage,
} from "@/config/user-portal-mock";

// §11 AI Coach — 4 design principles:
//   1. Proactive push (Insight Engine → chatbot speaks first)
//   2. LLM = translator only (structured output → natural language + citation)
//   3. Chat = data logging ("I started magnesium today" → Intervention Graph)
//   4. Hybrid UI (score card taps → chatbot explains with user's own data)

// Lightweight client-side log detection. The real pipeline runs on the
// server (Layer 3 Insight Engine); this mock simulates the round trip.
function buildSystemReply(input: string): CoachMessage {
  const text = input.toLowerCase();
  if (/(started|began|taking|resumed)\b/.test(text) && /(magnesium|mg|supplement)/.test(text)) {
    return {
      id: `sys-${Date.now()}`,
      type: "system",
      content:
        "Logged to your Intervention Graph. I'll track your Recovery Score and HRV over the next 4 weeks and tell you if we see a response.",
      meta: { label: "✓ LOGGED TO INTERVENTION GRAPH" },
    };
  }
  if (text.includes("vitamin d")) {
    return {
      id: `sys-${Date.now()}`,
      type: "explain",
      content:
        "Your last blood panel (May 30) shows Vitamin D at 28 ng/mL — below the 30–60 ng/mL optimal range. Your supplement log shows 5000 IU D3+K2 daily since Mar 12. Cross-referencing your HRV trend: no degradation, but no clear uplift yet either. Worth retesting in 8 weeks.",
      meta: {
        label: "Based on: Blood panel May 30 · Intervention log · HRV trend",
        source: "Brenner knowledge base · Vitamin D protocol",
      },
    };
  }
  if (text.includes("hrt")) {
    return {
      id: `sys-${Date.now()}`,
      type: "system",
      content:
        "Logged HRT start to your Intervention Graph. I'll watch skin redness, sleep depth, and HRV over the next 6 weeks — that's the typical adjustment window. Flag anything unusual and I'll cross-reference.",
      meta: { label: "✓ LOGGED TO INTERVENTION GRAPH" },
    };
  }
  return {
    id: `sys-${Date.now()}`,
    type: "explain",
    content:
      "I can pull up your trends, explain a score, or log something you've started. Try \"I started magnesium today\", \"Why is my Vitamin D low?\", or \"Explain my collagen score\".",
  };
}

function MessageBubble({ msg }: { msg: CoachMessage }) {
  if (msg.type === "user") {
    return (
      <div className="self-end max-w-[78%] bg-dr-white border border-dr-border px-3.5 py-2.5 rounded-[12px_2px_12px_12px]">
        <div className="text-[12px] text-dr-ink leading-[1.55]">{msg.content}</div>
        {msg.timestamp && (
          <div className="text-[9px] text-dr-mid mt-1">{msg.timestamp}</div>
        )}
      </div>
    );
  }

  if (msg.type === "insight") {
    return (
      <div className="self-start max-w-[88%] bg-dr-red px-3.5 py-3 rounded-[2px_12px_12px_12px]">
        {msg.meta?.label && (
          <div className="text-[8px] font-bold tracking-[0.12em] uppercase text-white/60 mb-1.5">
            {msg.meta.label}
          </div>
        )}
        <div
          className="text-[12px] text-white leading-[1.7]"
          // Allow <strong> in mock content for emphasis
          dangerouslySetInnerHTML={{ __html: msg.content }}
        />
        {msg.meta?.source && (
          <div className="text-[9px] text-white/55 mt-2 leading-[1.6]">
            {msg.meta.source}
          </div>
        )}
        {msg.meta?.actions && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {msg.meta.actions.map((a) => (
              <span
                key={a.label}
                className="text-[9px] bg-white/15 text-white px-2.5 py-1 rounded-[20px] font-semibold cursor-pointer hover:bg-white/25 transition-colors"
              >
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // system | explain
  const isSystem = msg.type === "system";
  return (
    <div
      className={`self-start max-w-[85%] bg-dr-white px-3.5 py-2.5 rounded-[2px_12px_12px_12px] ${
        isSystem ? "border border-dr-success" : "border border-dr-border"
      }`}
    >
      {isSystem && msg.meta?.label && (
        <div className="text-[8px] font-bold tracking-[0.1em] uppercase text-dr-success mb-1.5">
          {msg.meta.label}
        </div>
      )}
      {!isSystem && msg.meta?.label && (
        <div className="text-[9px] text-dr-mid mb-1.5">{msg.meta.label}</div>
      )}
      <div
        className="text-[12px] text-dr-ink leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: msg.content }}
      />
      {msg.meta?.source && (
        <div className="text-[9px] text-dr-mid mt-2 leading-[1.6]">
          {msg.meta.source}
        </div>
      )}
    </div>
  );
}

export default function CoachChat() {
  const [messages, setMessages] = useState<CoachMessage[]>(COACH_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: CoachMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      content: trimmed,
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Simulate Insight Engine round-trip
    setTimeout(() => {
      setMessages((prev) => [...prev, buildSystemReply(trimmed)]);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }, 600);
  }

  return (
    <div className="flex flex-col h-[640px] bg-dr-white border border-dr-border max-w-[760px]">
      {/* Header (§11.2) */}
      <div className="bg-dr-ink px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-dr-red">
            DrRuby AI
          </div>
          <div className="text-[9px] text-white/50 mt-0.5">
            Powered by your data · Not a chatbot
          </div>
        </div>
        <div className="text-[9px] bg-[rgba(31,158,90,0.2)] text-dr-success px-2.5 py-1 rounded-[20px] font-semibold">
          ● Live
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#FAFAFA]"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-dr-border p-3.5 bg-dr-white flex-shrink-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COACH_QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              className="text-[9px] bg-dr-off text-dr-ink px-2.5 py-1 rounded-[20px] border border-dr-border cursor-pointer hover:border-dr-mid transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 items-center"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or log something (supplement, symptom, lab…)"
            className="flex-1 border border-dr-border rounded-[6px] px-3 py-2 text-[11px] outline-none focus:border-dr-mid"
          />
          <button
            type="submit"
            className="bg-dr-red text-white px-3.5 py-2 rounded-[6px] text-[10px] font-bold tracking-[0.1em] uppercase cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </form>
        <div className="text-[8px] text-dr-mid mt-1.5 text-center">
          DrRuby provides health information, not medical advice · Always consult your doctor
        </div>
      </div>
    </div>
  );
}
