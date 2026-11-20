import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { clearChat } from "@/lib/learn.functions";
import { chatHistoryQuery } from "@/lib/queries";

export interface TutorContext {
  curriculumKey: string;
  lessonId?: string;
  lessonTitle?: string;
  questionIndex?: number;
  answered?: boolean;
}

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Status = "ready" | "submitted" | "streaming" | "error";

const SUGGESTIONS = ["Bu qaydanı sadə dillə izah et", "Mənə oxşar bir misal ver", "Növbəti addım nədir?"];

export function TutorChat({ context }: { context: TutorContext }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press-3d fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-xl"
        aria-label="AI müəllimi aç"
      >
        <GraduationCap className="size-5" />
        <span className="hidden sm:inline">AI müəllim</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`flex flex-col gap-0 border-border bg-surface p-0 [&>button]:hidden ${isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md"}`}
        >
          {open && <ChatPanel context={context} onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ChatPanel({ context, onClose }: { context: TutorContext; onClose: () => void }) {
  const queryClient = useQueryClient();
  const history = useQuery(chatHistoryQuery());
  const clear = useServerFn(clearChat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [text, setText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (history.data && !loaded.current) {
      loaded.current = true;
      setMessages(history.data);
    }
  }, [history.data]);

  async function send(message: string) {
    const content = message.trim();
    if (!content || status === "submitted" || status === "streaming") return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content };
    const botId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg]);
    setText("");
    setStatus("submitted");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({
          message: content,
          context: {
            curriculumKey: context.curriculumKey,
            ...(context.lessonId ? { lessonId: context.lessonId } : {}),
            ...(context.questionIndex !== undefined ? { questionIndex: context.questionIndex } : {}),
            ...(context.answered !== undefined ? { answered: context.answered } : {}),
          },
        }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 401 ? "Yenidən daxil ol" : "Müəllim cavab vermədi");
      setMessages((m) => [...m, { id: botId, role: "assistant", content: "" }]);
      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + chunk } : x)));
      }
      setStatus("ready");
    } catch (e) {
      if (controller.signal.aborted) {
        setStatus("ready");
      } else {
        setStatus("error");
        toast.error(e instanceof Error ? e.message : "Xəta baş verdi");
      }
    } finally {
      queryClient.removeQueries({ queryKey: chatHistoryQuery().queryKey });
    }
  }

  async function reset() {
    abortRef.current?.abort();
    await clear();
    setMessages([]);
    setStatus("ready");
    queryClient.removeQueries({ queryKey: chatHistoryQuery().queryKey });
  }

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-4 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <SheetTitle className="font-display text-base">Müəllim Ada</SheetTitle>
          <SheetDescription className="truncate text-xs">
            {context.lessonTitle
              ? `${context.lessonTitle}${context.questionIndex !== undefined ? ` · Sual ${context.questionIndex + 1}` : ""}`
              : "PDF qaydaları əsasında köməkçi"}
          </SheetDescription>
        </div>
        <button onClick={reset} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground" aria-label="Yeni söhbət" title="Yeni söhbət">
          <RotateCcw className="size-4" />
        </button>
        <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground" aria-label="Bağla">
          <X className="size-4" />
        </button>
      </SheetHeader>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
          {messages.length === 0 && status === "ready" ? (
            <ConversationEmptyState
              icon={<GraduationCap className="size-10 text-primary" />}
              title="Salam! Mən sənin AI müəllimin Adayam."
              description="Qaydanı başa düşmədinsə və ya ipucu lazımdırsa, soruş. Cavabı birbaşa yox, addım-addım göstərəcəyəm."
            >
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  {m.role === "assistant" ? <MessageResponse>{m.content}</MessageResponse> : m.content}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-sm">Düşünürəm...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg: PromptInputMessage) => send(msg.text)}>
          <PromptInputBody>
            <PromptInputTextarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Sualını yaz..."
              maxLength={2000}
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!text.trim() && status === "ready"} onStop={() => abortRef.current?.abort()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
