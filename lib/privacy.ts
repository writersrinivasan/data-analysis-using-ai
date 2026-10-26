import type { Row } from "./types";

export interface PiiPattern {
  id: string;
  label: string;
  regex: RegExp;
  severity: "high" | "medium";
  mask: (m: string) => string;
}

export const PII_PATTERNS: PiiPattern[] = [
  { id: "email", label: "Email address", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, severity: "high", mask: (m) => m[0] + "***@" + m.split("@")[1] },
  { id: "phone", label: "Phone number", regex: /(?:\+91[\s-]?)?[6-9]\d{9}\b/g, severity: "high", mask: (m) => m.slice(0, -6).replace(/\d/g, "X") + "XX" + m.slice(-4) },
  { id: "pan", label: "PAN (India)", regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g, severity: "high", mask: () => "XXXXX0000X" },
  { id: "aadhaar", label: "Aadhaar-like 12-digit ID", regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, severity: "high", mask: (m) => "XXXX XXXX " + m.replace(/\s/g, "").slice(-4) },
  { id: "card", label: "Payment card number", regex: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, severity: "high", mask: (m) => "**** **** **** " + m.replace(/\D/g, "").slice(-4) },
  { id: "ifsc", label: "IFSC code", regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g, severity: "medium", mask: () => "XXXX0XXXXXX" },
  { id: "account", label: "Bank account number", regex: /\b(?:a\/c|acct|account)[\s:#no.]*\d{9,18}\b/gi, severity: "high", mask: (m) => m.replace(/\d(?=\d{4})/g, "X") },
  { id: "ssn", label: "US SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g, severity: "high", mask: () => "XXX-XX-XXXX" },
  { id: "salary", label: "Salary / compensation mention", regex: /\b(?:salary|ctc|compensation|pay)\b[^.\n]{0,25}?(?:₹|rs\.?|inr|\$)?\s?\d[\d,.]*\s?(?:lpa|lakh|cr|k)?/gi, severity: "medium", mask: (m) => m.replace(/\d[\d,.]*/g, "[REDACTED]") },
];

const COLUMN_RULES: { re: RegExp; label: string }[] = [
  { re: /(^|\s)(name|full name|employee name|candidate name)$/i, label: "Personal name" },
  { re: /e-?mail/i, label: "Email" },
  { re: /phone|mobile|contact no/i, label: "Phone" },
  { re: /salary|ctc|compensation|pay\b/i, label: "Salary (confidential)" },
  { re: /dob|date of birth|birth/i, label: "Date of birth" },
  { re: /address|pincode|zip/i, label: "Address" },
  { re: /\b(pan|aadhaar|ssn|passport)\b|national id/i, label: "Government ID" },
  { re: /\b(account no|account number|iban|ifsc|bank account)\b/i, label: "Bank details" },
  { re: /gender|religion|caste|ethnicity|disability/i, label: "Sensitive attribute" },
];

export function piiRiskForColumn(name: string, sample: string[]): string | undefined {
  for (const r of COLUMN_RULES) if (r.re.test(name)) return r.label;
  for (const p of PII_PATTERNS.filter((x) => x.severity === "high")) {
    const hits = sample.filter((s) => new RegExp(p.regex.source, p.regex.flags.replace("g", "")).test(s)).length;
    if (sample.length && hits / sample.length > 0.5) return p.label;
  }
  return undefined;
}

export interface PiiFinding {
  id: string;
  label: string;
  severity: "high" | "medium";
  match: string;
  index: number;
}

export function scanText(text: string): PiiFinding[] {
  const out: PiiFinding[] = [];
  for (const p of PII_PATTERNS) {
    for (const m of text.matchAll(p.regex)) {
      out.push({ id: p.id, label: p.label, severity: p.severity, match: m[0], index: m.index ?? 0 });
    }
  }
  // Aadhaar regex also matches card numbers partially; drop findings fully inside a longer one
  return out
    .sort((a, b) => a.index - b.index || b.match.length - a.match.length)
    .filter((f, i, arr) => !arr.some((g, j) => j !== i && g.index <= f.index && g.index + g.match.length >= f.index + f.match.length && g.match.length > f.match.length));
}

export function maskText(text: string) {
  let out = text;
  for (const p of PII_PATTERNS) out = out.replace(p.regex, (m) => p.mask(m));
  return out;
}

/** Masks PII columns in a table. Names become stable pseudonyms so grouping still works. */
export function maskRows(rows: Row[], columns: string[]) {
  const risky = columns.filter((c) => piiRiskForColumn(c, rows.slice(0, 50).map((r) => String(r[c] ?? ""))));
  const pseudo = new Map<string, string>();
  const masked = rows.map((r) => {
    const o: Row = { ...r };
    for (const c of risky) {
      const v = r[c];
      if (v === null || v === undefined) continue;
      if (/salary|ctc|compensation|pay/i.test(c)) {
        const n = Number(v);
        o[c] = Number.isFinite(n) ? `Band ${n < 800000 ? "A (<8L)" : n < 1500000 ? "B (8–15L)" : n < 2500000 ? "C (15–25L)" : "D (25L+)"}` : "[REDACTED]";
      } else if (/name/i.test(c)) {
        const key = String(v);
        if (!pseudo.has(key)) pseudo.set(key, `Person-${String(pseudo.size + 1).padStart(4, "0")}`);
        o[c] = pseudo.get(key)!;
      } else if (/gender/i.test(c)) {
        o[c] = v;
      } else {
        o[c] = maskText(String(v));
      }
    }
    return o;
  });
  return { rows: masked, maskedColumns: risky.filter((c) => !/gender/i.test(c)) };
}
