import { InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

const magicLinkSchema = z.object({
  learnerId: z.string().min(1),
  email: z.string().email(),
  courseId: z.string().min(1),
  deadline: z.string().datetime(),
});

export type MagicLinkRequest = {
  learnerId: string;
  email: string;
  courseId: string;
  deadline: string;
};

export type MagicLinkResult = { sessionId: string; messageId: string; deadline: string };

export function validateMagicLinkRequest(input: unknown): MagicLinkRequest {
  return magicLinkSchema.parse(input);
}

export async function issueMagicLink(input: MagicLinkRequest, client: InfraiClient, now = new Date()): Promise<MagicLinkResult> {
  const deadline = new Date(input.deadline);
  if (deadline <= now) throw new Error("course deadline has passed");
  const requestKey = `${input.learnerId}:${input.courseId}:${input.deadline}`;
  const session = await client.createSession(input.learnerId, requestKey);
  const email = await client.sendEmail(input.email, `Sign in to ${input.courseId}`, `Sign in before ${input.deadline}: ${session.login_url}`, requestKey);
  return { sessionId: session.session_id, messageId: email.message_id, deadline: input.deadline };
}
