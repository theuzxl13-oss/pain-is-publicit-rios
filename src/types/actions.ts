export type FieldErrors = Partial<Record<string, string>>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };
