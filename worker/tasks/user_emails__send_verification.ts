import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email.js"

// At least 3 minutes between resending email verifications
const MIN_INTERVAL = 1000 * 60 * 3

interface UserEmailsSendVerificationPayload {
  id: string
}

function assertUserEmailsSendVerificationPayload(payload: unknown): asserts payload is UserEmailsSendVerificationPayload {
  if (typeof payload !== "object" || !payload)
    throw new Error("payload must be an object")
  if (!("id" in payload) || typeof payload.id !== "string")
    throw new Error("payload must have an 'id' property of type string")
}

export const task: Task = async (payload, { addJob, withPgClient, logger }) => {
  assertUserEmailsSendVerificationPayload(payload)
  const { id: userEmailId } = payload
  const {
    rows: [userEmail],
  } = await withPgClient(pgClient =>
    pgClient.query(
      `
        select user_emails.id, email, verification_token, username, name, extract(epoch from now()) - extract(epoch from verification_email_sent_at) as seconds_since_verification_sent
        from app_public.user_emails
        inner join app_private.user_email_secrets
        on user_email_secrets.user_email_id = user_emails.id
        inner join app_public.users
        on users.id = user_emails.user_id
        where user_emails.id = $1
        and user_emails.is_verified is false
      `,
      [userEmailId]
    )
  )
  if (!userEmail) {
    logger.warn(
      `user_emails__send_verification task for non-existent userEmail ignored (userEmailId = ${userEmailId})`
    )
    // No longer relevant
    return
  }
  const {
    email,
    verification_token,
    username,
    name,
    seconds_since_verification_sent,
  } = userEmail
  if (
    seconds_since_verification_sent != null
    && seconds_since_verification_sent < MIN_INTERVAL / 1000
  ) {
    logger.info("Email sent too recently")
    return
  }
  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: "E-Mail-Adresse bestätigen",
    },
    template: "verify_email.mjml",
    variables: {
      token: verification_token,
      verifyLink: `${process.env.ROOT_URL}/verify?id=${encodeURIComponent(
        String(userEmailId)
      )}&token=${encodeURIComponent(verification_token)}`,
      username,
      name,
    },
  }
  await addJob("send_email", sendEmailPayload)
  await withPgClient(pgClient =>
    pgClient.query(
      "update app_private.user_email_secrets set verification_email_sent_at = now() where user_email_id = $1",
      [userEmailId]
    )
  )
}

export default task
