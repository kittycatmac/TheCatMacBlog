// src/pages/api/contact.ts
import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let name, email, subject, message, honeypot;

  try {
    const body = await request.json();
    name     = body.name?.toString().trim()     ?? "";
    email    = body.email?.toString().trim()    ?? "";
    subject  = body.subject?.toString().trim()  ?? "";
    message  = body.message?.toString().trim()  ?? "";
    honeypot = body._honeypot?.toString()       ?? "";
  } catch (err) {
    console.error("[contact] parse error:", err);
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Bot check
  if (honeypot) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  // Validation
  if (!name || !email || !subject || !message) {
    return new Response(JSON.stringify({ error: "All fields are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Send via Gmail SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: import.meta.env.GMAIL_USER,
        pass: import.meta.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${import.meta.env.GMAIL_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to: import.meta.env.GMAIL_USER,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2 style="margin-bottom: 4px;">${subject}</h2>
          <p style="color: #666; margin-top: 0;">
            From <strong>${name}</strong> &lt;${email}&gt;
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[contact] Failed to send email:", err);
    return new Response(JSON.stringify({ error: "Failed to send message. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};