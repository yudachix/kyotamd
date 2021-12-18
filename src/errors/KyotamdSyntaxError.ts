class KyotamdSyntaxError extends Error {
  constructor(message?: string) {
    super(message)

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, KyotamdSyntaxError)
    }
  }
}

export { KyotamdSyntaxError }