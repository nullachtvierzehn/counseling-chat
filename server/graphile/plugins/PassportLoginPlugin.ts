/* eslint-disable @typescript-eslint/no-explicit-any */
import { access } from "grafast"
import { camelCase } from "postgraphile/graphile-build"

import type { Plans, Resolvers } from "graphile-utils"
import { gql, makeExtendSchemaPlugin } from "graphile-utils"
import type { ExecutableStep } from "postgraphile/grafast"

const isDev = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"

const ERROR_PROPERTIES_TO_EXPOSE
  = isDev || isTest
    ? [
        "code",
        "severity",
        "detail",
        "hint",
        "positon",
        "internalPosition",
        "internalQuery",
        "where",
        "schema",
        "table",
        "column",
        "dataType",
        "constraint",
      ]
    : ["code"]

function conflictFieldsFromError(err: any) {
  const { table, constraint } = err
  // TODO: extract a list of constraints from the DB
  if (constraint && table) {
    const PREFIX = `${table}_`
    const SUFFIX_LIST = [`_key`, `_fkey`]
    if (constraint.startsWith(PREFIX)) {
      const matchingSuffix = SUFFIX_LIST.find(SUFFIX =>
        constraint.endsWith(SUFFIX)
      )
      if (matchingSuffix) {
        const maybeColumnNames = constraint.substr(
          PREFIX.length,
          constraint.length - PREFIX.length - matchingSuffix.length
        )
        return [camelCase(maybeColumnNames)]
      }
    }
  }
  return undefined
}

// This would be better as a macro...
const pluck = (err: any): { [key: string]: any } => {
  return ERROR_PROPERTIES_TO_EXPOSE.reduce(
    (memo, key) => {
      const value = key === "code"
        ? err.code || err.errcode // err.errcode is equivalent to err.code; replace it
        : err[key]
      if (value != null) {
        memo[key] = value
      }
      return memo
    },
    Object.create(null) as Record<string, any>
  )
}

/**
 * This map allows you to override the error object output to users from
 * database errors.
 *
 * See `docs/error_codes.md` for a list of error codes we use internally.
 *
 * See https://www.postgresql.org/docs/current/errcodes-appendix.html for a
 * list of error codes that PostgreSQL produces.
 */
export const ERROR_MESSAGE_OVERRIDES: { [code: string]: typeof pluck } = {
  42501: err => ({
    ...pluck(err),
    message: "Permission denied (by RLS)",
  }),
  23505: err => ({
    ...pluck(err),
    message: "Conflict occurred",
    fields: conflictFieldsFromError(err),
    code: "NUNIQ",
  }),
  23503: err => ({
    ...pluck(err),
    message: "Invalid reference",
    fields: conflictFieldsFromError(err),
    code: "BADFK",
  }),
}

const PassportLoginPlugin = makeExtendSchemaPlugin((build) => {
  const typeDefs = gql`input RegisterInput {
      username: String!
      email: String!
      password: String!
      name: String
      avatarUrl: String
    }

    type RegisterPayload {
      user: User!
    }

    input LoginInput {
      username: String!
      password: String!
    }

    type LoginPayload {
      user: User!
    }

    type LogoutPayload {
      success: Boolean
    }

    """
    All input for the \`resetPassword\` mutation.
    """
    input ResetPasswordInput {
      """
      An arbitrary string value with no semantic meaning. Will be included in the
      payload verbatim. May be used to track mutations by the client.
      """
      clientMutationId: String

      userId: UUID!
      resetToken: String!
      newPassword: String!
    }

    """
    The output of our \`resetPassword\` mutation.
    """
    type ResetPasswordPayload {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      """
      Our root query field type. Allows us to run any query from our mutation payload.
      """
      query: Query

      success: Boolean
    }

    extend type Mutation {
      """
      Use this mutation to create an account on our system. This may only be used if you are logged out.
      """
      register(input: RegisterInput!): RegisterPayload

      """
      Use this mutation to log in to your account; this login uses sessions so you do not need to take further action.
      """
      login(input: LoginInput!): LoginPayload

      """
      Use this mutation to logout from your account. Don't forget to clear the client state!
      """
      logout: LogoutPayload

      """
      After triggering forgotPassword, you'll be sent a reset token. Combine this with your user ID and a new password to reset your password.
      """
      resetPassword(input: ResetPasswordInput!): ResetPasswordPayload
  }
`
  const userResource = build.input.pgRegistry.pgResources.users
  const currentUserIdResource
    = build.input.pgRegistry.pgResources.current_user_id
  if (!userResource || !currentUserIdResource) {
    throw new Error(
      "Couldn't find either the 'users' or 'current_user_id' source"
    )
  }
  const plans: Plans = {
    RegisterPayload: {
      user($obj) {
        const $userId = access($obj, "userId") as unknown as ExecutableStep<any>
        return userResource.get({ id: $userId })
      },
    },
    LoginPayload: {
      user() {
        const $userId = currentUserIdResource.execute() as ExecutableStep<any>
        return userResource.get({ id: $userId })
      },
    },
  }

  const resolvers: Resolvers = {
    Mutation: {
      async register(_mutation, args, context: Grafast.Context) {
        const { username, password, email, name, avatarUrl } = args.input
        const { ownerPool, pgSettings, session } = context
        try {
          // Create a user and create a session for it in the proccess
          const {
            rows: [details],
          } = await ownerPool.query<{ user_id: number, session_id: string }>(
            `
            with new_user as (
              select users.* from app_private.really_create_user(
                username => $1,
                email => $2,
                email_is_verified => false,
                name => $3,
                avatar_url => $4,
                password => $5
              ) users where not (users is null)
            ), new_session as (
              insert into app_private.sessions (user_id)
              select id from new_user
              returning *
            )
            select new_user.id as user_id, new_session.uuid as session_id
            from new_user, new_session`,
            [username, email, name, avatarUrl, password]
          )

          if (!details || !details.user_id) {
            throw Object.assign(new Error("Registration failed"), {
              code: "FFFFF",
            })
          }

          if (details.session_id && session) {
            // Update pgSettings so future queries will use the new session
            pgSettings!["jwt.claims.session_id"] = details.session_id

            // Tell Passport.js we're logged in
            /*
            request.session.regenerate((error) => {
              console.error('failed to regenerate session')
              console.log(error)
            })
            */
            await session.update({ graphileSessionId: details.session_id })
          }

          return {
            userId: details.user_id,
          }
        }
        catch (e: any) {
          const { code } = e
          const safeErrorCodes = [
            "WEAKP",
            "LOCKD",
            "EMTKN",
            ...Object.keys(ERROR_MESSAGE_OVERRIDES),
          ]
          if (safeErrorCodes.includes(code)) {
            // TODO: make SafeError
            throw e
          }
          else {
            console.error(
              "Unrecognised error in PassportLoginPlugin; replacing with sanitized version"
            )
            console.error(e)
            throw Object.assign(new Error("Registration failed"), {
              code,
            })
          }
        }
      },
      async login(_mutation, args, context: Grafast.Context) {
        const { username, password } = args.input
        const { ownerPool, pgSettings, session: h3Session } = context
        try {
          // Call our login function to find out if the username/password combination exists
          const {
            rows: [session],
          } = await ownerPool.query(
            `select sessions.* from app_private.login($1, $2) sessions where not (sessions is null)`,
            [username, password]
          )

          if (!session) {
            throw Object.assign(new Error("Incorrect username/password"), {
              code: "CREDS",
            })
          }

          if (session.uuid && h3Session) {
            // Set the graphile session id, then regenerate the session.
            // See here: https://github.com/fastify/session/blob/a8b1aaa1c04809e13b8fff260a3e67a1ef6e3288/test/session.test.js#L218
            // fastifySession.delete();
            // clearSessionData(fastifySession.data())
            /*
            request.session.regenerate((error) => {
              console.error('failed to regenerate session')
              console.log(error)
            })
            */
            await h3Session.update({ graphileSessionId: session.uuid })
          }

          // Update pgSettings so future queries will use the new session
          pgSettings!["jwt.claims.session_id"] = session.uuid

          return {}
        }
        catch (e: any) {
          const code = e.extensions?.code ?? e.code
          const safeErrorCodes = ["LOCKD", "CREDS"]
          if (safeErrorCodes.includes(code)) {
            // TODO: throw SafeError
            throw e
          }
          else {
            console.error(e)
            throw Object.assign(new Error("Login failed"), {
              code,
            })
          }
        }
      },

      async logout(_mutation, _args, context: Grafast.Context) {
        const { pgSettings, withPgClient, session } = context
        await withPgClient(pgSettings, pgClient =>
          pgClient.query({ text: "select app_public.logout();" })
        )
        await session?.clear()
        /*
        session?.destroy((error) => {
          console.error("failed to destroy session")
          console.log(error)
        })
          */
        return {
          success: true,
        }
      },

      async resetPassword(_mutation, args, context: Grafast.Context) {
        const { ownerPool } = context
        const { userId, resetToken, newPassword, clientMutationId } = args.input

        // Since the `reset_password` function needs to keep track of attempts
        // for security, we cannot risk the transaction being rolled back by a
        // later error. As such, we don't allow users to call this function
        // through normal means, instead calling it through our root pool
        // without a transaction.
        const {
          rows: [row],
        } = await ownerPool.query(
          `select app_private.reset_password($1::uuid, $2::text, $3::text) as success`,
          [userId, resetToken, newPassword]
        )

        return {
          clientMutationId,
          success: row?.success,
        }
      },
    },
  }
  return {
    typeDefs,
    plans,
    resolvers,
  }
})

export default PassportLoginPlugin
