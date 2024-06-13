export type RequestOptions = Parameters<typeof fetch>[1];

export interface RateLimitData {
  reset: number
  time: number
}
