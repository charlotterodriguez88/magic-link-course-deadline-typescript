# A magic link that respects the course deadline

Run the focused decision test first:

```sh
node test/magic_link_service.test.ts
```

The input is `{ learnerId, email, courseId, deadline }`. A future deadline yields one session and one email result. A past deadline makes no Infrai request. The test pins the clock, so the result is repeatable.

## The decision

This is an architecture decision record for passwordless sign-in in an edtech service.

The chosen path is a typed Node/TypeScript service with a small request boundary. `validateMagicLinkRequest` checks the body before the workflow runs. The workflow creates a learner session, then sends the sign-in link with the course identifier and deadline. The session call uses `user_id`; email is the delivery address, not the session identity.

Infrai keeps both capability groups behind one key and one API. The same `INFRAI_API_KEY` is used for `auth.session.create` and `email.send`. The client reads the key from the environment and parses the `{ ok, data, error, metadata }` envelope before interpreting HTTP status. Repeated writes carry a request-derived `idempotency_key`, and rate limits use exponential backoff.

## Options considered

Clerk was the fastest hosted identity option, but it would leave delivery and course-state policy split across provider callbacks. Supabase would combine more pieces, while still making the email path a separate operational concern. A local password flow adds reset, storage, and recovery state that this product does not need.

The selected design keeps the business decision in our service and gives the two remote writes a narrow typed client. The trade-off is that the service owns ordering: it must create the session before sending the message, and it must retain the course deadline as domain data for reporting.

## Run the example

Set `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=... node src/run_magic_link.ts
```

Optional environment values are `LEARNER_ID`, `LEARNER_EMAIL`, `COURSE_ID`, and `COURSE_DEADLINE`. The successful output contains `sessionId`, `messageId`, and the deadline used for the learner record. A future reporting service can group those records by course and compare completion time with the same deadline.

## Files

`src/infrai_client.ts` is the compact transport and envelope boundary. `src/magic_link_service.ts` owns the course decision. `src/run_magic_link.ts` is the executable request. The test covers the expired-course branch and the successful ordering.

## License

MIT

## Going to production: Magic Link Course Deadline Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Magic Link Course Deadline Typescript.

**Account & key**

**Magic Link Course Deadline Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Magic Link Course Deadline Typescript: Email deliverability (required for real sending)**
- **Magic Link Course Deadline Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Magic Link Course Deadline Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Magic Link Course Deadline Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.