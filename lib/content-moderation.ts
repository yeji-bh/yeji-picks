const SPAM_PATTERNS = [
  /(?:https?:\/\/|www\.)/i,
  /(?:點擊|点击|加微信|加vx|telegram|t\.me|賭博|赌博|色情|约炮|約炮)/i,
  /(?:viagra|casino|porn|xxx|nude|naked)/i,
];

const BLOCKED_ACCOUNT_PATTERNS = [
  /^admin$/i,
  /^root$/i,
  /^test\d*$/i,
  /^user\d{3,}$/i,
  /(.)\1{5,}/,
];

const MAX_TEXT_LENGTH = 2000;
const MAX_ACCOUNT_LENGTH = 32;

export type ModerationField =
  | "eventName"
  | "brand"
  | "productName"
  | "notes"
  | "nickname"
  | "reviewContent"
  | "feedback"
  | "report"
  | "dupeBrand"
  | "dupeLink"
  | "content";

export type ModerationCode = "empty" | "tooLong" | "blocked" | "invalid";

export type ModerationFailure = {
  ok: false;
  code: ModerationCode;
  field: ModerationField;
};

export function moderateText(
  text: string,
  field: ModerationField
): { ok: true } | ModerationFailure {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, code: "empty", field };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { ok: false, code: "tooLong", field };
  }
  if (SPAM_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, code: "blocked", field };
  }
  if (/(.)\1{12,}/.test(trimmed)) {
    return { ok: false, code: "invalid", field };
  }
  return { ok: true };
}

export type AccountModerationCode = "length" | "blocked" | "allDigits";

export function moderateAccount(
  account: string
): { ok: true } | { ok: false; code: AccountModerationCode } {
  const trimmed = account.trim();
  if (trimmed.length < 2 || trimmed.length > MAX_ACCOUNT_LENGTH) {
    return { ok: false, code: "length" };
  }
  if (BLOCKED_ACCOUNT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, code: "blocked" };
  }
  if (/^\d+$/.test(trimmed)) {
    return { ok: false, code: "allDigits" };
  }
  return { ok: true };
}

export function moderateOptionalText(
  text: string | null | undefined,
  field: ModerationField
): { ok: true } | ModerationFailure {
  if (!text?.trim()) return { ok: true };
  return moderateText(text, field);
}
