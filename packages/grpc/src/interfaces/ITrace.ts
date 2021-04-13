export interface IClientTrace {
  getTraceContext: () => string
  getTraceContextName: () => string
}

export interface IServiceTrace {
  getTraceContextName: () => string
  start: (traceId?: string) => void
}
