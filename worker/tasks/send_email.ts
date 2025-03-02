/* import {
  emailLegalText as legalText,
  fromEmail,
  projectName,
} from "@app/config"; */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import type { Task } from "graphile-worker"
import { htmlToText } from "html-to-text"
import { template as lodashTemplate } from "lodash-es"
import mjml2html from "mjml"
import * as nodemailer from "nodemailer"

import type { SentMessageInfo } from "nodemailer"
import getTransport from "../transport.js"

export const TEST_EMAILS: SentMessageInfo[] = []

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename) // get the name of the directory

const fromEmail = process.env.SMTP_USER
const projectName = "test"
const legalText = "sdfjksdfl"

const isTest = process.env.NODE_ENV === "test"
const isDev = process.env.NODE_ENV !== "production"

export interface SendEmailPayload {
  options: {
    from?: string
    to: string | string[]
    subject: string
  }
  template: string
  variables?: Record<string, unknown>
}

function assertPayload(payload: unknown): asserts payload is SendEmailPayload {
  if (!payload || typeof payload !== "object")
    throw new Error("payload must be an object")

  if (!("options" in payload) || !payload.options || typeof payload.options !== "object")
    throw new Error("payload.options must be an object")

  if ("from" in payload.options && typeof payload.options.from !== "string")
    throw new Error("payload.options.from must be a string, if provided")

  if (
    !("to" in payload.options)
    || (
      typeof payload.options.to !== "string"
      && !(Array.isArray(payload.options.to) && payload.options.to.every(e => typeof e === "string"))
    )
  )
    throw new Error("payload.options.to must be a string or an array of strings, if given.")

  if (!("subject" in payload.options) || typeof payload.options.subject !== "string")
    throw new Error("payload.options.subject must be a string")

  if (!("template" in payload) || typeof payload.template !== "string")
    throw new Error("payload.template must be a string")

  if (("variables" in payload) && (typeof payload.variables !== "object" || !payload.variables))
    throw new Error("payload.variables must be an object, if provided")
}

const task: Task = async (payload, { logger }) => {
  assertPayload(payload)
  const transport = await getTransport()
  const { options: inOptions, template, variables } = payload
  const options = {
    from: fromEmail,
    ...inOptions,
  }
  if (template) {
    const html = loadTemplate(template, variables)
    const html2textableHtml = html.replace(/(<\/?)div/g, "$1p")
    const text = htmlToText(html2textableHtml, {
      wordwrap: 120,
    }).replace(/\n\s+\n/g, "\n\n")
    Object.assign(options, { html, text })
  }
  const info = await transport.sendMail(options)
  if (isTest) {
    TEST_EMAILS.push(info)
  }
  else if (isDev) {
    const url = nodemailer.getTestMessageUrl(info)
    if (url) {
      // Hex codes here equivalent to chalk.blue.underline
      logger.info(
        `Development email preview: \x1B[34m\x1B[4m${url}\x1B[24m\x1B[39m`
      )
    }
  }
  else {
    logger.info(`Mail sent: ${JSON.stringify(info)}`)
  }
}

export default task

function loadTemplate(template: string, variables?: Record<string, unknown>) {
  // const templateString = templates[template.replace('.mjml', '')]
  const templateString = fs.readFileSync(
    path.resolve(__dirname, `../assets/templates/${template}`),
    { encoding: "utf-8" }
  )

  const templateFn = lodashTemplate(templateString, {
    escape: /\[\[([\s\S]+?)\]\]/g,
  })
  const mjml = templateFn({
    projectName,
    legalText,
    ...variables,
  })
  const { html, errors } = mjml2html(mjml)
  if (errors && errors.length)
    throw new Error("Failed to parse MJML")
  return html
}
