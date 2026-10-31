import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../lib/api";
import { formatPrice } from "../lib/format";

const WELCOME = {
  role: "assistant",
  content: "Hi! Tell me your city, budget and what you need, and I'll find rentals for you.",
};
const SUGGESTIONS = ["2BHK in Pune under 30k", "PG in Bengaluru", "Pet friendly homes in Delhi"];
const HISTORY_LIMIT = 11;

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, open]);

  const send = async (content) => {
    const question = content.trim();
    if (!question || sending) return;
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setText("");
    setSending(true);
    try {
      const history = next
        .filter((message) => message !== WELCOME)
        .slice(-HISTORY_LIMIT)
        .map(({ role, content: body }) => ({ role, content: body.slice(0, 1000) }));
      const { reply, listings } = await post("/chat", { messages: history });
      setMessages([...next, { role: "assistant", content: reply, listings }]);
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error.message }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open rental assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-brand text-on-brand shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
      >
        <Bot size={24} aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      aria-label="Rental assistant"
      className="fixed z-50 inset-x-3 bottom-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 h-[70vh] max-h-[620px] card shadow-2xl flex flex-col overflow-hidden"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <h2 className="font-semibold flex items-center gap-2">
          <Bot size={19} className="text-brand" aria-hidden="true" /> Rental assistant
        </h2>
        <button type="button" aria-label="Close rental assistant" className="h-9 w-9 flex items-center justify-center cursor-pointer" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </header>
      <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%]"}>
            <p className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${message.role === "user" ? "bg-brand text-on-brand" : "bg-raised"}`}>
              {message.content}
            </p>
            {message.listings?.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {message.listings.map((listing) => (
                  <Link key={listing._id} to={`/listing/${listing._id}`} className="block border border-line rounded-xl px-3 py-2 hover:border-brand transition-colors">
                    <span className="block text-sm font-medium truncate">{listing.name}</span>
                    <span className="block text-sm text-muted">{formatPrice(listing.effectivePrice)} a month</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" className="text-sm rounded-full border border-line px-3 py-1.5 cursor-pointer hover:bg-raised" onClick={() => send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {sending && <p className="text-sm text-muted">Thinking</p>}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 p-3 border-t border-line"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <input aria-label="Message the assistant" className="input" maxLength={1000} placeholder="Ask about rentals" value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" aria-label="Send message" className="btn-primary w-11 px-0 shrink-0" disabled={sending || !text.trim()}>
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

export default ChatWidget;
