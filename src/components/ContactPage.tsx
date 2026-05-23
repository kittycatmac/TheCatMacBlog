import { useState, useRef } from "react";

type FormState = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const [state, setState] = useState<FormState>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setState("success");
        formRef.current?.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ maxWidth: "560px" }}>

      {/* Honeypot — must stay hidden */}
      <input type="text" name="_honeypot" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

      {state === "success" && (
        <p style={{ marginBottom: "1rem", color: "green" }}>
          Message sent! I'll get back to you soon.
        </p>
      )}

      {state === "error" && (
        <p style={{ marginBottom: "1rem", color: "red" }}>
          Something went wrong. Please try again.
        </p>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="name" style={{ display: "block", marginBottom: "0.25rem" }}>Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="subject" style={{ display: "block", marginBottom: "0.25rem" }}>Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="message" style={{ display: "block", marginBottom: "0.25rem" }}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box", resize: "vertical" }}
        />
      </div>

      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>

    </form>
  );
}