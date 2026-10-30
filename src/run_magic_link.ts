import { InfraiClient } from "./infrai_client.ts";
import { issueMagicLink, validateMagicLinkRequest } from "./magic_link_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const input = validateMagicLinkRequest({
  learnerId: process.env.LEARNER_ID ?? "learner-42",
  email: process.env.LEARNER_EMAIL ?? "learner@example.edu",
  courseId: process.env.COURSE_ID ?? "intro-to-networks",
  deadline: process.env.COURSE_DEADLINE ?? new Date(Date.now() + 86400000).toISOString(),
});
const result = await issueMagicLink(input, new InfraiClient(key));
console.log(JSON.stringify(result, null, 2));
