import assert from "node:assert/strict";
import { issueMagicLink } from "../src/magic_link_service.ts";

const calls: string[] = [];
const client = {
  async createSession() { calls.push("session"); return { session_id: "s-1", login_url: "https://login.example/s-1" }; },
  async sendEmail() { calls.push("email"); return { message_id: "m-1" }; },
};

const input = { learnerId: "l-1", email: "learner@example.edu", courseId: "course-1", deadline: "2026-10-26T12:00:00.000Z" };
const result = await issueMagicLink(input, client as never, new Date("2026-10-25T12:00:00.000Z"));
assert.deepEqual(result, { sessionId: "s-1", messageId: "m-1", deadline: input.deadline });
assert.deepEqual(calls, ["session", "email"]);
await assert.rejects(() => issueMagicLink(input, client as never, new Date("2026-10-27T12:00:00.000Z")), /deadline has passed/);
assert.deepEqual(calls, ["session", "email"]);
console.log("magic-link decision test passed");
