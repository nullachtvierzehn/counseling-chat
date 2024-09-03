import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email.js"

interface UserForgotPasswordUnregisteredEmailPayload {
  email: string
}

function assertPayload(payload: unknown): asserts payload is UserForgotPasswordUnregisteredEmailPayload {
  if (typeof payload !== "object" || !payload)
    throw new Error("payload must be an object")

  if (!("email" in payload) || typeof payload.email !== "string")
    throw new Error("payload must have an 'email' property of type string")
}

export const task: Task = async (payload, { addJob }) => {
  assertPayload(payload)
  const { email } = payload

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: `Passwort zurücksetzen fehlgeschlagen`,
    },
    template: "password_reset_unregistered.mjml",
    variables: {
      url: process.env.ROOT_URL,
    },
  }
  await addJob("send_email", sendEmailPayload)
}

export default task
