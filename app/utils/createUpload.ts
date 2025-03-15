import { Upload as TusUpload, type UploadOptions, type DetailedError } from "tus-js-client"

export interface Upload {
  bytesTotal: Readonly<Ref<number | null>>
  bytesUploaded: Readonly<Ref<number | null>>
  onComplete: (callback: () => void) => void
  onError: (callback: (error: Error | DetailedError) => void) => void
  /*
  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (() => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2>
  */
  progress: Readonly<Ref<number | null | undefined>>
  start: () => void
  abort: (shouldTerminate?: boolean) => void
  tusUpload: TusUpload
}

export function createUpload(file: File, options?: Partial<UploadOptions>): ActsAsPromiseLike<Upload> {
  const bytesTotal = ref<number | null>(null)
  const bytesUploaded = ref<number | null>(null)
  const onComplete = createEventHook()
  const onError = createEventHook<Error | DetailedError>()

  const upload = new TusUpload(file, {
    // Endpoint is the upload creation URL from your tus server
    endpoint: new URL(
      "/api/upload",
      import.meta.client ? window.location.href : process.env.ROOT_URL,
    ).toString(),
    // Retry delays will enable tus-js-client to automatically retry on errors
    retryDelays: [0, 3000, 5000, 10000, 20000],
    // Attach additional meta-data about the file for the server
    metadata: {
      filename: file.name,
      filetype: file.type,
      filesize: file.size.toString(),
    },
    // Callback for errors which cannot be fixed using retries
    onError: function (e) {
      onError.trigger(e)
    },
    // Callback for reporting upload progress
    onProgress: function (uploaded, total) {
      bytesUploaded.value = uploaded
      bytesTotal.value = total
    },
    // Callback for once the upload is completed
    onSuccess: function () {
      onComplete.trigger()
    },
    ...options
  })

  const progress = computed(() => {
    const total = toValue(bytesTotal)
    const uploaded = toValue(bytesUploaded)
    if (total === null || uploaded === null) return null
    if (total <= 0) return undefined
    return uploaded / total
  })

  const out: Upload = {
    bytesTotal: readonly(bytesTotal),
    bytesUploaded: readonly(bytesUploaded),
    onComplete: onComplete.on,
    onError: onError.on,
    progress,
    start: () => upload.start(),
    abort: (shouldTerminate?: boolean) => upload.abort(shouldTerminate),
    tusUpload: upload,
  }

  const promise = new Promise<Upload>((resolve, reject) => {
    onComplete.on(() => resolve(out))
    onError.on(reject)
  })

  return { ...out, then: promise.then.bind(promise) }
}
