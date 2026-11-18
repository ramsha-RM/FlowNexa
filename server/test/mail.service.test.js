import assert from "node:assert/strict";
import test from "node:test";
import { sendPasswordResetEmail } from "../src/services/mail.service.js";

test("production email sends require SMTP and do not log reset links", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSmtpHost = process.env.SMTP_HOST;
  const previousLog = console.log;
  const logs = [];

  process.env.NODE_ENV = "production";
  delete process.env.SMTP_HOST;
  console.log = (...values) => logs.push(values.join(" "));

  try {
    await assert.rejects(
      sendPasswordResetEmail({ email: "person@example.com", name: "Person" }, "sensitive-token"),
      /SMTP_HOST is required outside development/,
    );
    assert.deepEqual(logs, []);
  } finally {
    console.log = previousLog;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSmtpHost === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = previousSmtpHost;
  }
});