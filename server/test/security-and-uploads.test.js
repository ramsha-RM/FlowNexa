import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import express from "express";
import Application from "../src/models/application.model.js";
import Job from "../src/models/job.model.js";
import User from "../src/models/auth.model.js";
import { getJobApplicants, applyJob } from "../src/controllers/application.controller.js";
import { resetPassword } from "../src/controllers/auth.controller.js";
import { authorize } from "../src/middleware/role.middleware.js";
import { protect } from "../src/middleware/auth.middleware.js";
import { applicationApplyValidator, validate } from "../src/middleware/validation.middleware.js";
import { uploadResume } from "../src/middleware/upload.middleware.js";
import { removeFile, RESUME_DIR } from "../src/utils/files.js";
import { COOKIE_NAME, cookieOptions, hashToken, signToken } from "../src/utils/token.js";

const makeResponse = () => ({
  statusCode: null,
  body: null,
  clearedCookies: [],
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  clearCookie(name, options) {
    this.clearedCookies.push({ name, options });
    return this;
  },
});

const startUploadServer = async (handler) => {
  const app = express();
  app.post("/apply/:jobId", uploadResume, handler);
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    return res.status(error.status || 500).json({ message: error.message });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/apply/test`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
};

const pdfForm = () => {
  const form = new FormData();
  form.append("resume", new Blob(["%PDF-1.7\nresume"], { type: "application/pdf" }), "resume.pdf");
  return form;
};

test("production cookies stay secure even when COOKIE_SECURE is false", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousSecure = process.env.COOKIE_SECURE;

  try {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_SECURE = "false";
    assert.equal(cookieOptions().secure, true);

    process.env.NODE_ENV = "development";
    assert.equal(cookieOptions().secure, false);
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousSecure === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = previousSecure;
  }
});

test("authentication accepts a valid session cookie and resolves its user", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
  const user = { _id: "user-id", passwordChangedAt: null };
  t.mock.method(User, "findById", () => ({ select: async () => user }));
  const req = { cookies: { [COOKIE_NAME]: signToken(user._id) } };
  const errors = [];
  let nextCalled = false;

  try {
    await protect(req, makeResponse(), (error) => {
      nextCalled = true;
      if (error) errors.push(error);
    });
    assert.equal(req.user, user);
    assert.equal(nextCalled, true);
    assert.deepEqual(errors, []);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("authorization rejects a role that is not permitted", () => {
  const errors = [];
  authorize("admin")({ user: { role: "candidate" } }, makeResponse(), (error) => errors.push(error));
  assert.equal(errors[0].status, 403);
});

test("password reset hashes and consumes a valid one-time token", async (t) => {
  const user = {
    password: "",
    save: async () => {},
  };
  let filter;
  t.mock.method(User, "findOne", (query) => {
    filter = query;
    return { select: async () => user };
  });

  const response = makeResponse();
  const errors = [];
  await resetPassword(
    { body: { token: "a".repeat(64), password: "newPass123" } },
    response,
    (error) => errors.push(error),
  );

  assert.deepEqual(errors, []);
  assert.equal(filter.passwordResetToken, hashToken("a".repeat(64)));
  assert.equal(user.password, "newPass123");
  assert.equal(user.passwordResetToken, undefined);
  assert.deepEqual(response.clearedCookies.map(({ name }) => name), [COOKIE_NAME]);
  assert.equal(response.statusCode, 200);
});

test("job applicant access is limited to the job owner", async (t) => {
  const job = { createdBy: "job-owner" };
  t.mock.method(Job, "findById", () => ({ select: async () => job }));
  t.mock.method(Application, "find", () => {
    throw new Error("Applicants should not be queried for a non-owner");
  });
  const errors = [];

  await getJobApplicants(
    { params: { jobId: "job-id" }, query: {}, user: { _id: "other-employer", role: "employer" } },
    makeResponse(),
    (error) => errors.push(error),
  );

  assert.equal(errors[0].status, 403);
});

test("invalid application request validation removes the uploaded resume", async () => {
  const before = new Set(await fs.readdir(RESUME_DIR));
  const server = await startUploadServer((req, res, next) => {
    Promise.all(applicationApplyValidator.map((validator) => validator.run(req)))
      .then(() => validate(req, res, next))
      .catch(next);
  });

  try {
    const form = pdfForm();
    form.append("coverLetter", "x".repeat(5001));
    const response = await fetch(server.url, { method: "POST", body: form });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /5000 characters/);
    assert.deepEqual((await fs.readdir(RESUME_DIR)).sort(), [...before].sort());
  } finally {
    await server.close();
  }
});

test("resume upload accepts a PDF and stores it outside public paths", async () => {
  let uploaded;
  const server = await startUploadServer((req, res) => {
    uploaded = req.file.filename;
    res.status(201).json({ filename: uploaded });
  });

  try {
    const response = await fetch(server.url, { method: "POST", body: pdfForm() });
    assert.equal(response.status, 201);
    const { filename } = await response.json();
    assert.match(filename, /^[a-f0-9]{32}\.pdf$/);
    assert.equal((await fs.readFile(path.join(RESUME_DIR, filename))).toString("latin1", 0, 5), "%PDF-");
  } finally {
    await server.close();
    if (uploaded) await removeFile(uploaded);
  }
});

test("failed application submission removes its uploaded resume", async (t) => {
  const filename = `${crypto.randomBytes(16).toString("hex")}.pdf`;
  await fs.writeFile(path.join(RESUME_DIR, filename), "%PDF-1.7\nresume");
  t.mock.method(Job, "findById", async () => null);
  const errors = [];

  await applyJob(
    {
      params: { jobId: "missing-job" },
      user: { _id: "candidate-id" },
      body: {},
      file: { filename, originalname: "resume.pdf" },
    },
    makeResponse(),
    (error) => errors.push(error),
  );

  assert.equal(errors[0].status, 404);
  await assert.rejects(fs.access(path.join(RESUME_DIR, filename)), { code: "ENOENT" });
});
