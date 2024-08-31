import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email"

interface UserForgotPasswordUnregisteredEmailPayload {
  email: string
}

export const task: Task = async (inPayload, { addJob }) => {
  const payload: UserForgotPasswordUnregisteredEmailPayload = inPayload as any
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
