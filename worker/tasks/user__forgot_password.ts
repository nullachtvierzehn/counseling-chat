import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email.js"

interface UserForgotPasswordPayload {
  /**
   * user id
   */
  id: string

  /**
   * email address
   */
  email: string

  /**
   * secret token
   */
  token: string
}

function assertPayload(payload: unknown): asserts payload is UserForgotPasswordPayload {
  if (typeof payload !== "object" || !payload)
    throw new Error("payload must be an object")
  if (!("id" in payload) || typeof payload.id !== "string")
    throw new Error("payload.id must be a string")
  if (!("email" in payload) || typeof payload.email !== "string")
    throw new Error("payload.email must be a string")
  if (!("token" in payload) || typeof payload.token !== "string")
    throw new Error("payload.token must be a string")
}

export const task: Task = async (payload, { addJob, withPgClient, logger }) => {
  assertPayload(payload)
  const { id: userId, email, token } = payload
  const {
    rows: [user],
  } = await withPgClient(pgClient =>
    pgClient.query(
      `
        select users.*
        from app_public.users
        where id = $1
      `,
      [userId]
    )
  )
  if (!user) {
    logger.error("User not found; aborting")
    return
  }
  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: "Passwort zurücksetzen",
    },
    template: "password_reset.mjml",
    variables: {
      token,
      verifyLink: `${
        process.env.ROOT_URL
      }/reset-password?user_id=${encodeURIComponent(
        user.id
      )}&token=${encodeURIComponent(token)}`,
    },
  }
  await addJob("send_email", sendEmailPayload)
}

export default task
