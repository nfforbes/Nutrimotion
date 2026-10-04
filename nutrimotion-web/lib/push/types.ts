export interface PushMessage {
  title: string;
  body: string;
}

export interface PushResult {
  ok: boolean;
  /** The token is dead and should be removed. */
  invalidToken: boolean;
  error?: string;
}
