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

export function moderateText(
  text: string,
  field = "內容"
): { ok: true } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: `${field}不可為空` };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: `${field}過長` };
  }
  if (SPAM_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, error: `${field}含有不允許的內容` };
  }
  if (/(.)\1{12,}/.test(trimmed)) {
    return { ok: false, error: `${field}格式異常` };
  }
  return { ok: true };
}

export function moderateAccount(
  account: string
): { ok: true } | { ok: false; error: string } {
  const trimmed = account.trim();
  if (trimmed.length < 2 || trimmed.length > MAX_ACCOUNT_LENGTH) {
    return { ok: false, error: "帳號長度不符合規範" };
  }
  if (BLOCKED_ACCOUNT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, error: "此帳號名稱不可使用" };
  }
  if (/^\d+$/.test(trimmed)) {
    return { ok: false, error: "帳號不可全為數字" };
  }
  return { ok: true };
}

export function moderateOptionalText(
  text: string | null | undefined,
  field: string
): { ok: true } | { ok: false; error: string } {
  if (!text?.trim()) return { ok: true };
  return moderateText(text, field);
}
