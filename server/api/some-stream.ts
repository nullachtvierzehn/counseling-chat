function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default eventHandler({
  handler(event) {
    setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8")

    const text = "Hier kommt etwas Text mit ein paar Wörtern."

    const stream = new ReadableStream({
      async start(controller) {
        for (const token of text.split(" ")) {
          controller.enqueue(token)
          await waitFor(200)
        }
        controller.close()
      }
    })

    // test with `curl -N -v http://localhost:3000/api/some-stream`
    return stream
  }
})
