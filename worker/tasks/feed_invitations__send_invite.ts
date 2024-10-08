import type { Task } from "graphile-worker"
import type { SendEmailPayload } from "./send_email.js"

interface FeedInvitationSendInvitePayload {
  /**
   * invitation id
   */
  id: string
}

function assertPayload(payload: unknown): asserts payload is FeedInvitationSendInvitePayload {
  if (typeof payload !== "object" || !payload)
    throw new Error("payload must be an object")
  if (!("id" in payload) || typeof payload.id !== "string")
    throw new Error("payload must satisfy { \"id\": \"string\" }")
}

export const task: Task = async (payload, { addJob, withPgClient, logger }) => {
  assertPayload(payload)
  const { id: invitationId } = payload
  const {
    rows: [invitation],
  } = await withPgClient(pgClient =>
    pgClient.query(
      `
        select *
        from app_public.feed_invitations
        where id = $1
      `,
      [invitationId]
    )
  )
  if (!invitation) {
    logger.error("Invitation not found; aborting")
    return
  }

  let email = invitation.email
  if (!email) {
    const {
      rows: [primaryEmail],
    } = await withPgClient(pgClient =>
      pgClient.query(
        `select * from app_public.user_emails where user_id = $1 and is_primary = true`,
        [invitation.user_id]
      )
    )
    if (!primaryEmail) {
      logger.error(
        `No primary email found for user ${invitation.user_id}; aborting`
      )
      return
    }
    email = primaryEmail.email
  }

  const {
    rows: [feed],
  } = await withPgClient(pgClient =>
    pgClient.query(`select * from app_public.feeds where id = $1`, [
      invitation.feed_id,
    ])
  )

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: `You have been invited to ${feed.name}`,
    },
    template: "feed_invite.mjml",
    variables: {
      feedName: feed.name,
      link:
        `${
          process.env.ROOT_URL
        }/feed-invitations/accept?id=${encodeURIComponent(invitation.id)}`
        + (invitation.code ? `&code=${encodeURIComponent(invitation.code)}` : ""),
    },
  }
  await addJob("send_email", sendEmailPayload)
}

export default task
