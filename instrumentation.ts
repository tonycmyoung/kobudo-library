export async function register() {
  // Install source map support so stack traces in server-side trace logs
  // show original TypeScript source paths instead of compiled bundle paths
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { install } = await import("source-map-support")
    install()
  }
}
