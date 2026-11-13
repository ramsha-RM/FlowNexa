import nodemailer from "nodemailer";
import { escapeHtml } from "../utils/html.js";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE?.toLowerCase() === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else if (process.env.NODE_ENV === "development") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    throw new Error("SMTP_HOST is required outside development");
  }

  return transporter;
};

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

const layout = (heading, paragraphs, action) => `
<div style="font-family:Arial,sans-serif;background:#f5f8f5;padding:32px">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;color:#051F20">
    <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(heading)}</h1>
    ${paragraphs.map((text) => `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${escapeHtml(text)}</p>`).join("")}
    ${
      action
        ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#0B2B26;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;font-size:14px">${escapeHtml(action.label)}</a></p>
    <p style="font-size:12px;color:#60766b;word-break:break-all">${escapeHtml(action.url)}</p>`
        : ""
    }
  </div>
</div>`;

const send = async ({ to, subject, paragraphs, heading, action }) => {
  const text = [...paragraphs, action ? `${action.label}: ${action.url}` : ""]
    .filter(Boolean)
    .join("\n\n");

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "FlowNexa <no-reply@flownexa.local>",
    to,
    subject,
    text,
    html: layout(heading, paragraphs, action),
  });

  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    console.log(`[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
  }
};

export const sendVerificationEmail = (user, token) =>
  send({
    to: user.email,
    subject: "Verify your FlowNexa email",
    heading: "Verify your email",
    paragraphs: [
      `Hi ${user.name}, welcome to FlowNexa.`,
      "Confirm your email address to secure your account. The link expires in 24 hours.",
    ],
    action: { label: "Verify email", url: `${clientUrl()}/verify-email?token=${token}` },
  });

export const sendPasswordResetEmail = (user, token) =>
  send({
    to: user.email,
    subject: "Reset your FlowNexa password",
    heading: "Reset your password",
    paragraphs: [
      `Hi ${user.name}, we received a request to reset your password.`,
      "This link expires in 30 minutes. If you did not request it, you can ignore this email.",
    ],
    action: { label: "Choose a new password", url: `${clientUrl()}/reset-password?token=${token}` },
  });

export const sendApplicationStatusEmail = (user, job, status) =>
  send({
    to: user.email,
    subject: `Your application for ${job.title} was ${status.toLowerCase()}`,
    heading: `Application ${status.toLowerCase()}`,
    paragraphs: [
      `Hi ${user.name}, the status of your application for ${job.title} at ${job.company} is now ${status}.`,
    ],
    action: { label: "View my applications", url: `${clientUrl()}/my-applications` },
  });

export const sendNewApplicationEmail = (employer, job, candidate) =>
  send({
    to: employer.email,
    subject: `New application for ${job.title}`,
    heading: "New application received",
    paragraphs: [`${candidate.name} applied for ${job.title}. Review the application in FlowNexa.`],
    action: { label: "Review applicants", url: `${clientUrl()}/employer/jobs/${job._id}/applicants` },
  });

