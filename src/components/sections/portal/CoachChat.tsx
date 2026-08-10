"use client";

import { useRef, useState } from "react";
import { COACH_QUICK_CHIPS } from "@/config/user-portal-mock";
import { useMutation } from "@/hooks/useMutation";
import { ApiError, apiClient } from "@/lib/api";
import { toApiMessages, toErrorMessage } from "./coach-helpers";

// §11 AI Coach — 接入 /api/ask 护栏 LLM 代理：
//   客户端只发 user/assistant 历史，服务端强制注入 SYSTEM_PROMPT + 历史摘要。
//   typing / error 气泡为本地 UX 态，不参与历史映射。

type ChatItem =
  | { id: string; type: "user"; content: string; timestamp?: string }
  | { id: string; type: "explain"; content: string }
  | { id: string; type: "typing"; content: string }
  | { id: string; type: "error"; content: string; userText: string };

type AskResponse = {
  choices: { message: { role: "assistant"; content: string } }[];
};

type AskInput = { messages: { role: "user" | "assistant"; content: string }[] };

function nowId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function timestamp(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const TYPING_TEXT = "DrRuby 正在思考…";

function MessageBubble({
  item,
  onRetry,
}: {
  item: ChatItem;
  onRetry: (item: Extract<ChatItem, { type: "error" }>) => void;
}) {
  if (item.type === "user") {
    return (
      <div className="self-end max-w-[78%] bg-dr-white border border-dr-border px-3.5 py-2.5 rounded-[12px_2px_12px_12px]">
        <div className="text-[12px] text-dr-ink leading-[1.55]">
          {item.content}
        </div>
        {item.timestamp && (
          <div className="text-[9px] text-dr-mid mt-1">{item.timestamp}</div>
        )}
      </div>
    );
  }

  if (item.type === "typing") {
    return (
      <div className="self-start max-w-[85%] bg-dr-white border border-dr-border px-3.5 py-2.5 rounded-[2px_12px_12px_12px]">
        <div className="text-[12px] text-dr-mid leading-[1.7]">
          {item.content}
        </div>
      </div>
    );
  }

  if (item.type === "error") {
    return (
      <div className="self-start max-w-[85%] bg-dr-white border border-dr-alert px-3.5 py-2.5 rounded-[2px_12px_12px_12px]">
        <div className="text-[12px] text-dr-alert leading-[1.7]">
          {item.content}
        </div>
        <button
          type="button"
          onClick={() => onRetry(item)}
          className="mt-2 text-[10px] font-bold tracking-[0.1em] uppercase text-dr-alert border border-dr-alert px-2.5 py-1 rounded-[4px] cursor-pointer hover:bg-dr-alert/10 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // explain (LLM 回复)
  return (
    <div className="self-start max-w-[85%] bg-dr-white border border-dr-border px-3.5 py-2.5 rounded-[2px_12px_12px_12px]">
      <div className="text-[12px] text-dr-ink leading-[1.7]">
        {item.content}
      </div>
    </div>
  );
}

export default function CoachChat() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // useMutation 仅作 loading 状态容器 + 401 自动 notifyUnauthorized。
  // 不用 onSuccess（不接收 input）；错误经 lastErrorRef 同步捕获，避免闭包陈旧。
  const lastErrorRef = useRef<ApiError | null>(null);

  const ask = useMutation<AskInput, AskResponse>(async (payload) => {
    try {
      lastErrorRef.current = null;
      return await apiClient.post<AskResponse>("/api/ask", payload);
    } catch (e) {
      lastErrorRef.current =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      throw e; // re-throw 让 useMutation 处理 401 → notifyUnauthorized
    }
  });

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      // jsdom 无 scrollTo；运行时也可能为 null
      if (el && typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    });
  }

  function replaceTyping(replacement: ChatItem | null) {
    setItems((prev) => {
      const withoutTyping = prev.filter((p) => p.type !== "typing");
      return replacement ? [...withoutTyping, replacement] : withoutTyping;
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || ask.loading) return;

    // 在调用 mutate 前快照历史（fn 内部不读 items，避免闭包陈旧）
    const history = toApiMessages(items);
    history.push({ role: "user", content: trimmed });

    setInput("");

    const userItem: ChatItem = {
      id: nowId("u-"),
      type: "user",
      content: trimmed,
      timestamp: timestamp(),
    };
    const typingItem: ChatItem = {
      id: nowId("t-"),
      type: "typing",
      content: TYPING_TEXT,
    };
    setItems((prev) => [...prev, userItem, typingItem]);
    scrollToBottom();

    const out = await ask.mutate({ messages: history });
    if (out) {
      replaceTyping({
        id: nowId("a-"),
        type: "explain",
        content: out.choices[0].message.content,
      });
    } else {
      const err = lastErrorRef.current;
      if (err && err.status !== 401) {
        replaceTyping({
          id: nowId("e-"),
          type: "error",
          content: toErrorMessage(err),
          userText: trimmed,
        });
      } else {
        // 401：useMutation 已调 notifyUnauthorized 跳登录；移除 typing
        replaceTyping(null);
      }
    }
    scrollToBottom();
  }

  async function retry(item: Extract<ChatItem, { type: "error" }>) {
    if (ask.loading) return;

    // 重建历史：把 error 气泡之前的内容作为历史 + 原始 userText
    const history = toApiMessages(items.filter((i) => i.id !== item.id));
    history.push({ role: "user", content: item.userText });

    // error 气泡 → typing 气泡
    setItems((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? { id: nowId("t-"), type: "typing", content: TYPING_TEXT }
          : p,
      ),
    );
    scrollToBottom();

    const out = await ask.mutate({ messages: history });
    if (out) {
      replaceTyping({
        id: nowId("a-"),
        type: "explain",
        content: out.choices[0].message.content,
      });
    } else {
      const err = lastErrorRef.current;
      if (err && err.status !== 401) {
        replaceTyping({
          id: nowId("e-"),
          type: "error",
          content: toErrorMessage(err),
          userText: item.userText,
        });
      } else {
        replaceTyping(null);
      }
    }
    scrollToBottom();
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
        {items.map((m) => (
          <MessageBubble key={m.id} item={m} onRetry={retry} />
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
              disabled={ask.loading}
              className="text-[9px] bg-dr-off text-dr-ink px-2.5 py-1 rounded-[20px] border border-dr-border cursor-pointer hover:border-dr-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={ask.loading}
            className="bg-dr-red text-white px-3.5 py-2 rounded-[6px] text-[10px] font-bold tracking-[0.1em] uppercase cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        <div className="text-[8px] text-dr-mid mt-1.5 text-center">
          DrRuby provides health information, not medical advice · Always
          consult your doctor
        </div>
      </div>
    </div>
  );
}
