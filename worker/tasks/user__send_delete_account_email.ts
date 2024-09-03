import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email.js"

interface UserSendAccountDeletionEmailPayload {
  /**
   * email address
   */
  email: string

  /**
   * secret token
   */
  token: string
}

function assertPayload(payload: unknown): asserts payload is UserSendAccountDeletionEmailPayload {
  if (typeof payload !== "object" || payload === null)
    throw new Error("payload must be an object")
  if (!("email" in payload) || typeof payload.email !== "string")
    throw new Error("payload.email must be a string")
  if (!("token" in payload) || typeof payload.token !== "string")
    throw new Error("payload.token must be a string")
}

export const task: Task = async (payload, { addJob }) => {
  assertPayload(payload)
  const { email, token } = payload
  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: "Confirmation required: really delete account?",
    },
    template: "delete_account.mjml",
    variables: {
      token,
      deleteAccountLink: `${
        process.env.ROOT_URL
      }/settings/delete?token=${encodeURIComponent(token)}`,
    },
  }
  await addJob("send_email", sendEmailPayload)
}

export default task
